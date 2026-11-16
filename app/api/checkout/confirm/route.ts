import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { marketplaceOrders } from '@/lib/db/schema'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get('session_id')
  if (!sessionId || !sessionId.startsWith('cs_')) {
    return NextResponse.json({ error: 'A valid payment session is required.' }, { status: 400 })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const orderId = session.metadata?.orderId
    if (!orderId || session.mode !== 'payment') {
      return NextResponse.json({ error: 'This payment session is not linked to an order.' }, { status: 404 })
    }

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ status: 'pending' })
    }

    await db.update(marketplaceOrders)
      .set({ status: 'paid' })
      .where(and(
        eq(marketplaceOrders.id, orderId),
        eq(marketplaceOrders.stripeSessionId, sessionId),
        eq(marketplaceOrders.status, 'pending'),
      ))

    return NextResponse.json({ status: 'paid' })
  } catch (error) {
    console.error('Payment confirmation failed:', error)
    return NextResponse.json({ error: 'We could not verify your payment yet.' }, { status: 503 })
  }
}
