import Link from 'next/link'
import { and, eq, gte, sql } from 'drizzle-orm'
import { CheckCircle2, Clock3 } from 'lucide-react'
import { db } from '@/lib/db'
import { marketplaceOrders, marketplaceProducts } from '@/lib/db/schema'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'

export default async function CheckoutCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; lang?: string }>
}) {
  const { session_id: sessionId, lang } = await searchParams
  const isArabic = lang === 'ar'
  let confirmed = false
  let inventoryReviewRequired = false

  if (sessionId?.startsWith('cs_')) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      const orderId = session.metadata?.orderId
      if (orderId && session.status === 'complete' && session.payment_status === 'paid') {
        confirmed = await db.transaction(async (tx) => {
          const [order] = await tx.select({ id: marketplaceOrders.id, status: marketplaceOrders.status, items: marketplaceOrders.items })
            .from(marketplaceOrders)
            .where(and(
              eq(marketplaceOrders.id, orderId),
              eq(marketplaceOrders.stripeSessionId, session.id),
            ))
            .for('update')
          if (!order) return false
          if (order.status === 'paid') return true
          if (order.status !== 'pending' || !Array.isArray(order.items)) return false

          for (const item of order.items as { productId: string; quantity: number }[]) {
            const [updated] = await tx.update(marketplaceProducts)
              .set({ quantity: sql`${marketplaceProducts.quantity} - ${item.quantity}` })
              .where(and(
                eq(marketplaceProducts.id, item.productId),
                gte(marketplaceProducts.quantity, item.quantity),
              ))
              .returning({ id: marketplaceProducts.id })
            if (!updated) throw new Error('Paid order inventory is no longer available.')
          }

          await tx.update(marketplaceOrders)
            .set({ status: 'paid' })
            .where(and(eq(marketplaceOrders.id, orderId), eq(marketplaceOrders.status, 'pending')))
          return true
        })
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Paid order inventory is no longer available.')) {
        inventoryReviewRequired = true
        await db.update(marketplaceOrders)
          .set({ status: 'paid_needs_review' })
          .where(and(eq(marketplaceOrders.stripeSessionId, sessionId), eq(marketplaceOrders.status, 'pending')))
      }
      console.error('Could not reconcile completed checkout:', error)
    }
  }

  const heading = confirmed
    ? (isArabic ? 'تم تأكيد الدفع' : 'Payment confirmed')
    : inventoryReviewRequired
      ? (isArabic ? 'تم استلام الدفع' : 'Payment received')
      : (isArabic ? 'جارٍ التحقق من الدفع' : 'Payment is being verified')
  const detail = confirmed
    ? (isArabic ? 'شكرًا لطلبك. سنتواصل معك لترتيب التوصيل.' : 'Thank you for your order. We will contact you to arrange delivery.')
    : inventoryReviewRequired
      ? (isArabic ? 'تم استلام دفعتك، لكننا نحتاج إلى مراجعة توفر المنتجات. سيتواصل معك فريقنا قريبًا.' : 'Your payment was received, but product availability needs review. Our team will contact you shortly.')
      : (isArabic ? 'لم نتمكن من تأكيد الدفع بعد. إذا أكملت الدفع، يرجى الانتظار قليلًا ثم التواصل معنا.' : 'We could not confirm the payment yet. If you completed checkout, please wait a moment and contact us if this message remains.')

  return (
    <main dir={isArabic ? 'rtl' : 'ltr'} lang={isArabic ? 'ar' : 'en'} className="flex min-h-screen items-center justify-center bg-[#f8f7f3] px-5 py-12 text-[#24251f]">
      <section className="w-full max-w-lg rounded-3xl border border-[#dfdfd6] bg-white p-8 text-center shadow-sm sm:p-12">
        {confirmed ? <CheckCircle2 className="mx-auto size-12 text-[#1f3b36]" aria-hidden="true" /> : <Clock3 className="mx-auto size-12 text-[#b4823e]" aria-hidden="true" />}
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#b4823e]">Jozzor Damietta</p>
        <h1 className="mt-3 font-serif text-3xl text-[#1f3b36]">{heading}</h1>
        <p className="mt-4 leading-7 text-[#686a61]">{detail}</p>
        <Link href="/" className="mt-8 inline-flex rounded-full bg-[#1f3b36] px-6 py-3 text-sm font-semibold text-white">{isArabic ? 'العودة إلى المتجر' : 'Return to the store'}</Link>
      </section>
    </main>
  )
}
