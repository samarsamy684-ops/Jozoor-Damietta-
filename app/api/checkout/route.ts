import { NextResponse } from 'next/server'
import { and, eq, gte, inArray, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { marketplaceOrders, marketplaceProducts } from '@/lib/db/schema'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'

const parseMinorUnits = (price: string | null) => {
  if (!price) return null
  const normalized = price.replace(/,/g, '').replace(/[^\d.]/g, '')
  const amount = Number(normalized)
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) return null
  return Math.round(amount * 100)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const customer = body?.customer
    const paymentMethod = body?.paymentMethod

    if (!customer || !['cod', 'card'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Choose a payment method and enter your contact details.' }, { status: 400 })
    }

    const name = typeof customer.name === 'string' ? customer.name.trim() : ''
    const email = typeof customer.email === 'string' ? customer.email.trim().toLowerCase() : ''
    const phone = typeof customer.phone === 'string' ? customer.phone.trim() : ''
    const address = typeof customer.address === 'string' ? customer.address.trim() : ''
    if (name.length < 2 || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || phone.length < 7 || phone.length > 30 || address.length < 8 || address.length > 500) {
      return NextResponse.json({ error: 'Check your name, email, phone number, and delivery address.' }, { status: 400 })
    }

    if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 20) {
      return NextResponse.json({ error: 'Your cart is empty or contains too many different products.' }, { status: 400 })
    }

    const quantities = new Map<string, number>()
    for (const line of body.items) {
      if (!line || typeof line.productId !== 'string' || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(line.productId) || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 20) {
        return NextResponse.json({ error: 'One or more cart quantities are invalid.' }, { status: 400 })
      }
      quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.quantity)
    }
    if ([...quantities.values()].some((quantity) => quantity > 20)) {
      return NextResponse.json({ error: 'A product quantity cannot exceed 20.' }, { status: 400 })
    }

    const productIds = [...quantities.keys()]
    const products = await db.select().from(marketplaceProducts).where(
      and(inArray(marketplaceProducts.id, productIds), eq(marketplaceProducts.published, true)),
    )
    if (products.length !== productIds.length) {
      return NextResponse.json({ error: 'A product in your cart is no longer available.' }, { status: 409 })
    }

    const unpricedProduct = products.find((product) => parseMinorUnits(product.price) === null)
    if (unpricedProduct) {
      return NextResponse.json({ error: `${unpricedProduct.name} does not have a valid listed price.` }, { status: 409 })
    }
    const unavailableProduct = products.find((product) => product.quantity < quantities.get(product.id)!)
    if (unavailableProduct) {
      return NextResponse.json({ error: `${unavailableProduct.name} does not have enough stock for this quantity.` }, { status: 409 })
    }
    const orderItems = products.map((product) => ({
      productId: product.id,
      name: product.name,
      maker: product.maker,
      quantity: quantities.get(product.id)!,
      unitAmount: parseMinorUnits(product.price)!,
    }))
    const subtotalMinor = orderItems.reduce((sum, item) => sum + item.unitAmount * item.quantity, 0)
    if (!Number.isSafeInteger(subtotalMinor) || subtotalMinor < 1 || subtotalMinor > 100_000_000) {
      return NextResponse.json({ error: 'The order total is outside the accepted range.' }, { status: 400 })
    }

    if (paymentMethod === 'cod') {
      const order = await db.transaction(async (tx) => {
        for (const item of orderItems) {
          const [updated] = await tx.update(marketplaceProducts)
            .set({ quantity: sql`${marketplaceProducts.quantity} - ${item.quantity}` })
            .where(and(
              eq(marketplaceProducts.id, item.productId),
              eq(marketplaceProducts.published, true),
              gte(marketplaceProducts.quantity, item.quantity),
            ))
            .returning({ id: marketplaceProducts.id })
          if (!updated) throw new Error('Stock changed while your order was being placed. Please review your cart.')
        }
        const [created] = await tx.insert(marketplaceOrders).values({
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          shippingAddress: address,
          paymentMethod: 'cod',
          status: 'confirmed',
          currency: 'egp',
          subtotalMinor,
          items: orderItems,
        }).returning({ id: marketplaceOrders.id })
        return created
      })
      return NextResponse.json({ orderId: order.id, status: 'confirmed' })
    }

    const [order] = await db.insert(marketplaceOrders).values({
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      shippingAddress: address,
      paymentMethod: 'card',
      currency: 'egp',
      subtotalMinor,
      items: orderItems,
    }).returning({ id: marketplaceOrders.id })

    try {
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: email,
        line_items: orderItems.map((item) => ({
          quantity: item.quantity,
          price_data: {
            currency: 'egp',
            unit_amount: item.unitAmount,
            product_data: { name: item.name, description: `Handcrafted by ${item.maker}` },
          },
        })),
        metadata: { orderId: order.id },
        success_url: `${new URL(request.url).origin}/checkout/complete?lang=${body.locale === 'ar' ? 'ar' : 'en'}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${new URL(request.url).origin}/?payment=cancelled`,
      }, { idempotencyKey: `marketplace-order-${order.id}` })

      await db.update(marketplaceOrders)
        .set({ stripeSessionId: checkoutSession.id })
        .where(eq(marketplaceOrders.id, order.id))

      return NextResponse.json({ url: checkoutSession.url })
    } catch (error) {
      await db.update(marketplaceOrders)
        .set({ status: 'failed' })
        .where(eq(marketplaceOrders.id, order.id))
      throw error
    }
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Stock changed') || error.message.includes('does not have enough stock'))) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    console.error('Checkout request failed:', error)
    return NextResponse.json({ error: 'We could not create your order. Please try again.' }, { status: 500 })
  }
}
