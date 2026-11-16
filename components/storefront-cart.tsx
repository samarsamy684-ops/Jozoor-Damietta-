'use client'

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, Check, CreditCard, Minus, Plus, ShoppingBag, Truck, X } from 'lucide-react'

type CartProduct = {
  id?: string
  name: string
  maker: string
  price?: string
  image: string
  quantity?: number
}

export type CartLine = { productId: string; quantity: number }
type Locale = 'en' | 'ar'

const copy = {
  en: {
    cart: 'Shopping cart', items: 'items', empty: 'Your cart is waiting for its first handcrafted piece.',
    continue: 'Continue shopping', subtotal: 'Subtotal', shipping: 'Shipping calculated after confirmation',
    checkout: 'Proceed to checkout', yourDetails: 'Delivery details', back: 'Back to cart',
    name: 'Full name', email: 'Email address', phone: 'Phone number', address: 'Delivery address',
    payment: 'Payment method', cod: 'Cash on delivery', codHint: 'Pay when your furniture arrives',
    card: 'Card payment', cardHint: 'Visa or Mastercard · secure checkout by Stripe', place: 'Confirm order',
    processing: 'Processing…', thanks: 'Order received', order: 'Order reference', done: 'Your order is confirmed. We will contact you to arrange delivery.',
    emptyError: 'This item is no longer available.', error: 'We could not place your order. Please try again.',
    decrement: 'Decrease quantity', increment: 'Increase quantity', remove: 'Remove item',
  },
  ar: {
    cart: 'سلة التسوق', items: 'منتجات', empty: 'سلتك بانتظار أول قطعة مصنوعة يدويًا.',
    continue: 'متابعة التسوق', subtotal: 'المجموع الفرعي', shipping: 'يتم تأكيد تكلفة الشحن لاحقًا',
    checkout: 'إتمام الشراء', yourDetails: 'بيانات التوصيل', back: 'العودة إلى السلة',
    name: 'الاسم الكامل', email: 'البريد الإلكتروني', phone: 'رقم الهاتف', address: 'عنوان التوصيل',
    payment: 'طريقة الدفع', cod: 'الدفع عند الاستلام', codHint: 'ادفع عند وصول الأثاث',
    card: 'الدفع بالبطاقة', cardHint: 'Visa أو Mastercard · دفع آمن عبر Stripe', place: 'تأكيد الطلب',
    processing: 'جارٍ المعالجة…', thanks: 'تم استلام طلبك', order: 'رقم الطلب', done: 'تم تأكيد طلبك. سنتواصل معك لترتيب التوصيل.',
    emptyError: 'هذا المنتج لم يعد متاحًا.', error: 'تعذر إتمام طلبك. حاول مرة أخرى.',
    decrement: 'تقليل الكمية', increment: 'زيادة الكمية', remove: 'إزالة المنتج',
  },
}

const getPrice = (value?: string) => {
  if (!value) return null
  const amount = Number(value.replace(/,/g, '').replace(/[^\d.]/g, ''))
  return Number.isFinite(amount) && amount > 0 ? amount : null
}

export function StorefrontCart({
  products,
  cart,
  onCartChange,
  locale,
}: {
  products: CartProduct[]
  cart: CartLine[]
  onCartChange: (items: CartLine[]) => void
  locale: Locale
}) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'cart' | 'checkout' | 'confirmation'>('cart')
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('cod')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [orderId, setOrderId] = useState('')
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', address: '' })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const isArabic = locale === 'ar'
  const text = copy[locale]
  const productById = useMemo(() => new Map(products.filter((product): product is CartProduct & { id: string } => Boolean(product.id)).map((product) => [product.id, product])), [products])
  const cartItems = cart.flatMap((line) => {
    const product = productById.get(line.productId)
    const unitPrice = getPrice(product?.price)
    return product && unitPrice !== null ? [{ ...line, product, unitPrice }] : []
  })
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const money = new Intl.NumberFormat(isArabic ? 'ar-EG' : 'en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 2 })

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : triggerRef.current
    const getFocusable = () => Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [])
    getFocusable()[0]?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
      if (event.key !== 'Tab') return
      const focusable = getFocusable()
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [open])

  const changeQuantity = (productId: string, delta: number) => {
    const product = productById.get(productId)
    onCartChange(cart.flatMap((line) => {
      if (line.productId !== productId) return [line]
      const quantity = line.quantity + delta
      if (quantity < 1) return []
      if (product?.quantity !== undefined && quantity > product.quantity) return [line]
      return [{ ...line, quantity }]
    }))
  }

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, customer, paymentMethod, locale }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || text.error)
      if (paymentMethod === 'card') {
        if (typeof result.url !== 'string') throw new Error(text.error)
        window.location.assign(result.url)
        return
      }
      setOrderId(result.orderId)
      onCartChange([])
      setStep('confirmation')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : text.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { setOpen(true); setStep('cart') }}
        aria-label={`${text.cart} (${itemCount})`}
        className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[#dfdfd6] bg-white text-[#1f3b36] transition hover:bg-[#f1f0ea]"
      >
        <ShoppingBag aria-hidden="true" />
        {itemCount > 0 && <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[#b4823e] px-1 text-[10px] font-bold leading-5 text-white">{itemCount}</span>}
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex h-screen bg-[#14231f]/40" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
          <section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            dir={isArabic ? 'rtl' : 'ltr'}
            className={`flex h-full w-full max-w-lg flex-col bg-[#f8f7f3] shadow-2xl ${isArabic ? 'mr-auto' : 'ml-auto'}`}
          >
            <header className="flex items-center justify-between border-b border-[#dfdfd6] px-5 py-5 sm:px-7">
              <div className="flex items-center gap-3">
                {step === 'checkout' && <button type="button" onClick={() => { setStep('cart'); setError('') }} className="inline-flex size-9 items-center justify-center rounded-full border border-[#dfdfd6]" aria-label={text.back}><ArrowLeft aria-hidden="true" /></button>}
                <h2 id="cart-title" className="font-serif text-2xl text-[#1f3b36]">{step === 'confirmation' ? text.thanks : step === 'checkout' ? text.yourDetails : text.cart}</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="inline-flex size-10 items-center justify-center rounded-full border border-[#dfdfd6]" aria-label={isArabic ? 'إغلاق' : 'Close cart'}><X aria-hidden="true" /></button>
            </header>

            {step === 'cart' && (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
                  {cartItems.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center text-[#686a61]"><ShoppingBag className="mb-4 text-[#b4823e]" aria-hidden="true" /><p>{cart.length ? text.emptyError : text.empty}</p>{cart.length > 0 ? <button type="button" onClick={() => onCartChange([])} className="mt-5 font-semibold text-[#1f3b36] underline underline-offset-4">{isArabic ? 'إزالة المنتجات غير المتاحة' : 'Remove unavailable items'}</button> : <button type="button" onClick={() => setOpen(false)} className="mt-5 font-semibold text-[#1f3b36] underline underline-offset-4">{text.continue}</button>}</div>
                  ) : (
                    <ul className="flex flex-col gap-5">
                      {cartItems.map(({ product, productId, quantity, unitPrice }) => (
                        <li key={productId} className="flex gap-4 border-b border-[#dfdfd6] pb-5">
                          <img src={product.image} alt={product.name} className="size-24 shrink-0 rounded-xl bg-[#e8dfd3] object-cover" />
                          <div className="min-w-0 flex-1">
                            <h3 className="font-serif text-lg text-[#1f3b36]">{product.name}</h3>
                            <p className="mt-1 text-xs text-[#777970]">{product.maker}</p>
                            <p className="mt-2 text-sm font-semibold text-[#b4823e]">{money.format(unitPrice)}</p>
                            <div className="mt-3 flex items-center gap-2">
                              <button type="button" onClick={() => changeQuantity(productId, -1)} className="inline-flex size-8 items-center justify-center rounded-full border border-[#dfdfd6]" aria-label={text.decrement}><Minus aria-hidden="true" /></button>
                              <span className="min-w-6 text-center text-sm" aria-live="polite">{quantity}</span>
                              <button type="button" onClick={() => changeQuantity(productId, 1)} disabled={product.quantity !== undefined && quantity >= product.quantity} className="inline-flex size-8 items-center justify-center rounded-full border border-[#dfdfd6] disabled:opacity-40" aria-label={text.increment}><Plus aria-hidden="true" /></button>
                              <button type="button" onClick={() => onCartChange(cart.filter((line) => line.productId !== productId))} className="ms-auto text-xs font-medium text-[#777970] underline underline-offset-4">{text.remove}</button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {cartItems.length > 0 && <footer className="border-t border-[#dfdfd6] bg-white px-5 py-5 sm:px-7">
                  <div className="flex items-center justify-between text-sm"><span>{text.subtotal}</span><strong className="text-lg text-[#1f3b36]">{money.format(subtotal)}</strong></div>
                  <p className="mt-1 text-xs text-[#777970]">{text.shipping}</p>
                  <button type="button" onClick={() => { setStep('checkout'); setError('') }} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1f3b36] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#2d5049]">{text.checkout}<ArrowLeft className="rtl:rotate-180" aria-hidden="true" /></button>
                </footer>}
              </>
            )}

            {step === 'checkout' && <form onSubmit={submitOrder} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
                <div className="flex flex-col gap-4">
                  {(['name', 'email', 'phone', 'address'] as const).map((field) => <label key={field} className="flex flex-col gap-2 text-sm font-semibold text-[#1f3b36]">{text[field]}{field === 'address' ? <textarea required minLength={8} maxLength={500} autoComplete="street-address" rows={3} value={customer.address} onChange={(event) => setCustomer({ ...customer, address: event.target.value })} className="resize-y rounded-xl border border-[#d8d8ce] bg-white px-4 py-3 font-normal outline-none focus:border-[#1f3b36]" /> : <input required minLength={field === 'name' ? 2 : undefined} maxLength={field === 'name' ? 120 : field === 'email' ? 254 : 30} type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'} autoComplete={field === 'name' ? 'name' : field === 'email' ? 'email' : 'tel'} value={customer[field]} onChange={(event) => setCustomer({ ...customer, [field]: event.target.value })} className="rounded-xl border border-[#d8d8ce] bg-white px-4 py-3 font-normal outline-none focus:border-[#1f3b36]" />}</label>)}
                </div>
                <fieldset className="mt-6">
                  <legend className="mb-3 text-sm font-semibold text-[#1f3b36]">{text.payment}</legend>
                  <div className="flex flex-col gap-3">
                    <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${paymentMethod === 'cod' ? 'border-[#1f3b36] bg-[#e9eee9]' : 'border-[#dfdfd6] bg-white'}`}>
                      <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="mt-1 accent-[#1f3b36]" />
                      <Truck aria-hidden="true" className="text-[#1f3b36]" /><span><strong className="block text-sm text-[#1f3b36]">{text.cod}</strong><span className="mt-1 block text-xs text-[#777970]">{text.codHint}</span></span>
                    </label>
                    <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${paymentMethod === 'card' ? 'border-[#1f3b36] bg-[#e9eee9]' : 'border-[#dfdfd6] bg-white'}`}>
                      <input type="radio" name="paymentMethod" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="mt-1 accent-[#1f3b36]" />
                      <CreditCard aria-hidden="true" className="text-[#1f3b36]" /><span><strong className="block text-sm text-[#1f3b36]">{text.card}</strong><span className="mt-1 block text-xs text-[#777970]">{text.cardHint}</span></span>
                    </label>
                  </div>
                </fieldset>
                {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
              </div>
              <footer className="border-t border-[#dfdfd6] bg-white px-5 py-5 sm:px-7">
                <div className="mb-4 flex items-center justify-between text-sm"><span>{text.subtotal}</span><strong className="text-lg text-[#1f3b36]">{money.format(subtotal)}</strong></div>
                <button type="submit" disabled={isSubmitting || cartItems.length === 0} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1f3b36] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#2d5049] disabled:cursor-wait disabled:opacity-60">{isSubmitting ? text.processing : text.place}<Check aria-hidden="true" /></button>
              </footer>
            </form>}

            {step === 'confirmation' && <div className="flex flex-1 flex-col items-center justify-center px-7 text-center">
              <span className="inline-flex size-16 items-center justify-center rounded-full bg-[#e6efe6] text-[#1f3b36]"><Check aria-hidden="true" /></span>
              <p className="mt-5 max-w-sm text-sm leading-7 text-[#686a61]">{text.done}</p>
              {orderId && <p className="mt-5 rounded-xl bg-white px-4 py-3 text-xs text-[#777970]">{text.order}: <span className="font-mono text-[#1f3b36]">{orderId.slice(0, 8).toUpperCase()}</span></p>}
              <button type="button" onClick={() => { setOpen(false); setStep('cart') }} className="mt-7 rounded-full bg-[#1f3b36] px-6 py-3 text-sm font-semibold text-white">{text.continue}</button>
            </div>}
          </section>
        </div>,
        document.body,
      )}
    </>
  )
}
