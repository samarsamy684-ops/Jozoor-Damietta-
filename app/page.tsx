'use client'

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { StorefrontCart, type CartLine } from '@/components/storefront-cart'
import useSWR from 'swr'
import {
  ArrowRight,
  ChevronDown,
  Globe2,
  Heart,
  Menu,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  Users,
  X,
} from 'lucide-react'

const categories = ['All furniture', 'Living room', 'Dining', 'Bedroom', 'Office']

type Product = {
  id?: string
  name: string
  maker: string
  category: string
  price?: string
  image: string
  color: string
  quantity?: number
  availability?: string
  description?: string
  imageIsFallback?: boolean
}

const fetcher = async (url: string): Promise<Product[]> => {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Could not load published products.')
  return response.json()
}

const fallbackImages: Record<string, string> = {
  'Living room': 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=900&q=85',
  Dining: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=900&q=85',
  Bedroom: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=85',
  Office: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=900&q=85',
}

const initialProducts: Product[] = [
  {
    name: 'Marsa Lounge Chair',
    maker: 'El Nasr Workshop',
    category: 'Living room',
    price: 'EGP 18,500',
    image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=900&q=85',
    color: 'bg-[#e8dfd3]',
    availability: 'In stock',
    quantity: 5,
  },
  {
    name: 'Nile Oak Dining Set',
    maker: 'Hassan Woodcraft',
    category: 'Dining',
    price: 'EGP 42,000',
    image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=900&q=85',
    color: 'bg-[#dce2dc]',
    availability: 'In stock · 8',
    quantity: 8,
  },
  {
    name: 'Sahara Side Table',
    maker: 'Maison Fouad',
    category: 'Living room',
    price: 'EGP 6,800',
    image: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=900&q=85',
    color: 'bg-[#e7e0d6]',
    availability: 'In stock · 12',
    quantity: 12,
  },
  {
    name: 'Cairo Cane Bed',
    maker: 'Dar El Tefl',
    category: 'Bedroom',
    price: 'EGP 31,500',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=85',
    color: 'bg-[#e2ded7]',
    availability: 'In stock · 3',
    quantity: 3,
  },
  {
    name: 'Workshop Writing Desk',
    maker: 'Said El Sherbiny',
    category: 'Office',
    price: 'EGP 22,000',
    image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=900&q=85',
    color: 'bg-[#e2ded7]',
    availability: 'In stock · 4',
    quantity: 4,
  },
]

const makers = [
  { name: 'El Nasr Workshop', location: 'Damietta, Egypt', initials: 'EN', image: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=160&q=80' },
  { name: 'Hassan Woodcraft', location: 'New Damietta, Egypt', initials: 'HW', image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=160&q=80' },
  { name: 'Maison Fouad', location: 'Damietta, Egypt', initials: 'MF', image: 'https://images.unsplash.com/photo-1549497538-303791108f95?auto=format&fit=crop&w=160&q=80' },
]

export default function Page() {
  const [activeCategory, setActiveCategory] = useState('All furniture')
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'customer' | 'vendor'>('customer')
  const [cart, setCart] = useState<CartLine[]>([])
  const [cartReady, setCartReady] = useState(false)
  const [locale, setLocale] = useState<'en' | 'ar'>('en')
  const isArabic = locale === 'ar'
  const t = (english: string, arabic: string) => isArabic ? arabic : english
  const [workshopMessage, setWorkshopMessage] = useState('')
  const [workshopError, setWorkshopError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attachmentNames, setAttachmentNames] = useState<string[]>([])
  const formRef = useRef<HTMLFormElement>(null)
  const { data: approvedProducts = [] } = useSWR<Product[]>('/api/products', fetcher, { fallbackData: [] })

  useEffect(() => {
    try {
      const savedCart = window.localStorage.getItem('jozzor-store-cart')
      if (savedCart) {
        const parsed = JSON.parse(savedCart)
        if (Array.isArray(parsed)) {
          setCart(parsed.filter((item): item is CartLine => item && typeof item.productId === 'string' && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 20))
        }
      }
      const savedLocale = window.localStorage.getItem('jozzor-store-locale')
      if (savedLocale === 'ar' || savedLocale === 'en') setLocale(savedLocale)
    } catch {
      setCart([])
    }
    setCartReady(true)
  }, [])

  useEffect(() => {
    if (!cartReady) return
    try {
      window.localStorage.setItem('jozzor-store-cart', JSON.stringify(cart))
    } catch {
      return
    }
  }, [cart, cartReady])

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr'
    try {
      window.localStorage.setItem('jozzor-store-locale', locale)
    } catch {
      return
    }
  }, [locale, isArabic])

  const products = useMemo(() => [
    ...initialProducts,
    ...approvedProducts.map((product) => ({
      ...product,
      image: product.image || fallbackImages[product.category] || fallbackImages['Living room'],
      imageIsFallback: product.imageIsFallback,
      color: product.color || 'bg-[#e8dfd3]',
      availability: product.quantity === undefined ? 'Available' : product.quantity > 0 ? `In stock · ${product.quantity}` : 'Out of stock',
    })),
  ], [approvedProducts])

  const handleWorkshopSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    setWorkshopMessage('')
    setWorkshopError('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/workshops', { method: 'POST', body: new FormData(form) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'We could not submit your request.')

      setWorkshopMessage(isArabic ? `تم استلام الطلب: تم حفظ ${result.productCount} منتجًا بشكل خاص، وستظهر بعد موافقة الإدارة.` : `Request received: ${result.productCount} product${result.productCount === 1 ? '' : 's'} are saved privately and will appear after admin approval.`)
      form.reset()
      setAttachmentNames([])
    } catch (error) {
      setWorkshopError(isArabic ? 'تعذر إرسال الطلب. يرجى المحاولة مرة أخرى.' : error instanceof Error ? error.message : 'We could not submit your request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredProducts = useMemo(() => products.filter((product) => {
    const matchesCategory = activeCategory === 'All furniture' || product.category === activeCategory
    const matchesQuery = `${product.name} ${product.maker}`.toLowerCase().includes(query.toLowerCase())
    return matchesCategory && matchesQuery
  }), [activeCategory, products, query])

  return (
    <div lang={locale} dir={isArabic ? 'rtl' : 'ltr'} className="min-h-screen bg-[#f8f7f3] text-[#24251f]">
      <header className="border-b border-[#dfdfd6] bg-[#f8f7f3]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-5 lg:px-8">
          <a href="#top" className="flex items-center gap-3" aria-label="Jozzor Damietta Marketable plus home">
            <div className="flex size-10 items-center justify-center rounded-full bg-[#1f3b36] text-[#e8c98b]">
              <span className="font-serif text-xl font-semibold">S</span>
            </div>
            <div>
              <p className="font-serif text-2xl leading-none tracking-tight">Jozzor Damietta Marketable plus</p>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#8a8b82]">{t('made in damietta', 'صُنع في دمياط')}</p>
            </div>
          </a>
          <nav className="hidden items-center gap-8 text-sm font-medium text-[#65675f] md:flex" aria-label={t('Primary navigation', 'التنقل الرئيسي')}>
            <a className="text-[#1f3b36]" href="#discover">{t('Discover', 'اكتشف')}</a>
            <a href="#makers" className="transition-colors hover:text-[#1f3b36]">{t('Our makers', 'حرفيونا')}</a>
            <a href="#story" className="transition-colors hover:text-[#1f3b36]">{t('Our story', 'قصتنا')}</a>
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-[#dfdfd6] bg-white p-1 sm:flex" aria-label={t('Platform view', 'طريقة العرض')}>
              <button onClick={() => setViewMode('customer')} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${viewMode === 'customer' ? 'bg-[#1f3b36] text-white' : 'text-[#65675f]'}`}>{t('Shop', 'المتجر')}</button>
              <button onClick={() => setViewMode('vendor')} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${viewMode === 'vendor' ? 'bg-[#1f3b36] text-white' : 'text-[#65675f]'}`}>{t('For makers', 'للحرفيين')}</button>
            </div>
            <button type="button" onClick={() => setLocale(isArabic ? 'en' : 'ar')} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[#65675f] transition hover:bg-white" aria-label={t('Switch language to Arabic', 'تغيير اللغة إلى الإنجليزية')}>
              <Globe2 aria-hidden="true" /> {isArabic ? 'عربي' : 'EN'} <ChevronDown aria-hidden="true" />
            </button>
            <StorefrontCart products={products} cart={cart} onCartChange={setCart} locale={locale} />
            <a href="#sell" className="hidden rounded-full bg-[#e8c98b] px-5 py-2.5 text-sm font-semibold text-[#1f3b36] transition hover:bg-[#dfbc76] sm:inline-flex">{t('List your workshop', 'سجّل ورشتك')}</a>
            <button className="inline-flex size-10 items-center justify-center rounded-full border border-[#dfdfd6] md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? t('Close menu', 'إغلاق القائمة') : t('Open menu', 'فتح القائمة')}>
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {menuOpen && <nav className="flex flex-col gap-4 border-t border-[#dfdfd6] px-5 py-5 text-sm font-medium md:hidden"><a href="#discover" onClick={() => setMenuOpen(false)}>{t('Discover', 'اكتشف')}</a><a href="#makers" onClick={() => setMenuOpen(false)}>{t('Our makers', 'حرفيونا')}</a><a href="#story" onClick={() => setMenuOpen(false)}>{t('Our story', 'قصتنا')}</a><a href="#sell" onClick={() => setMenuOpen(false)}>{t('List your workshop', 'سجّل ورشتك')}</a></nav>}
      </header>

      <main id="top">
        {viewMode === 'vendor' && <section className="border-b border-[#dfdfd6] bg-[#e8c98b]/30 py-8"><div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-5 sm:flex-row sm:items-center sm:justify-between lg:px-8"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8b682e]">{t('Maker workspace', 'مساحة الحرفيين')}</p><h2 className="mt-2 font-serif text-3xl text-[#1f3b36]">{t('Bring your next piece to the world.', 'عرّف العالم على قطعتك القادمة.')}</h2><p className="mt-1 text-sm text-[#686a61]">{t('Send your workshop details and product catalogue for review.', 'أرسل بيانات ورشتك وكتالوج المنتجات للمراجعة.')}</p><p className="mt-2 text-xs text-[#686a61]">{t('Your products stay private until they are approved.', 'تبقى منتجاتك خاصة حتى تتم الموافقة عليها.')}</p></div><a href="#sell" className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-[#1f3b36] px-5 py-3 text-sm font-semibold text-white">{t('Start a request', 'ابدأ طلبًا')} <ArrowRight data-icon="inline-end" /></a></div></section>}
        <section className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 pb-20 pt-16 lg:grid-cols-[0.94fr_1.06fr] lg:px-8 lg:pb-28 lg:pt-24">
          <div className="max-w-xl">
            <div className="mb-7 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-[#ba8c42]"><span className="h-px w-9 bg-[#ba8c42]" /> {t('The heart of Egyptian furniture', 'قلب صناعة الأثاث المصري')}</div>
            <h1 className="font-serif text-[clamp(3.5rem,7vw,6.25rem)] leading-[0.92] tracking-[-0.055em] text-[#1f3b36]">{isArabic ? <>أثاث يحمل <em className="font-normal text-[#b4823e]">حكاية</em></> : <>Furniture with a <em className="font-normal text-[#b4823e]">story</em> to tell.</>}</h1>
            <p className="mt-8 max-w-md text-lg leading-8 text-[#686a61]">{t('Discover beautiful, handcrafted furniture made by the skilled hands of Damietta’s independent workshops.', 'اكتشف أثاثًا مصنوعًا يدويًا بأيدي أمهر ورش دمياط المستقلة.')}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="#discover" className="inline-flex items-center justify-center gap-3 rounded-full bg-[#1f3b36] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#2d5049]">{t('Explore the collection', 'استكشف المجموعة')} <ArrowRight data-icon="inline-end" /></a>
              <a href="#story" className="inline-flex items-center justify-center rounded-full border border-[#cfcfc5] px-6 py-3.5 text-sm font-semibold text-[#1f3b36] transition hover:bg-white">{t('Why Damietta?', 'لماذا دمياط؟')}</a>
            </div>
            <div className="mt-12 flex items-center gap-8 border-t border-[#deded5] pt-6 text-sm text-[#777970]"><div><strong className="block font-serif text-2xl text-[#1f3b36]">240+</strong>{t('independent makers', 'حرفي مستقل')}</div><div><strong className="block font-serif text-2xl text-[#1f3b36]">12k+</strong>{t('pieces discovered', 'قطعة مميزة')}</div></div>
          </div>
          <div className="relative min-h-[470px] overflow-hidden rounded-[2rem] bg-[#d9d2c5] lg:min-h-[600px]">
            <img src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1300&q=90" alt={t('Warm modern living room with handcrafted wooden furniture', 'غرفة معيشة عصرية دافئة بأثاث خشبي مصنوع يدويًا')} className="absolute inset-0 size-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1f3b36]/45 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-white"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">{t('Featured collection', 'المجموعة المختارة')}</p><p className="mt-1 font-serif text-2xl">{t('The Mediterranean Edit', 'لمسة متوسطية')}</p></div><span className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium backdrop-blur-md">01 / 04</span></div>
            <div className={`absolute top-5 rounded-full bg-[#f5dfb3] px-4 py-2 text-xs font-bold text-[#1f3b36] ${isArabic ? 'left-5' : 'right-5'}`}>{t('New arrivals', 'وصل حديثًا')}</div>
          </div>
        </section>

        <section id="discover" className="border-y border-[#dfdfd6] bg-[#f1f0ea] py-16 lg:py-20">
          <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
            <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ba8c42]">{t('Curated for you', 'مختارة لك')}</p><h2 className="mt-3 font-serif text-4xl tracking-tight text-[#1f3b36] md:text-5xl">{isArabic ? <>اعثر على قطعتك <em className="font-normal text-[#b4823e]">المميزة.</em></> : <>Find your next <em className="font-normal text-[#b4823e]">heirloom.</em></>}</h2></div><div className="relative w-full md:w-64"><Search className={`absolute top-1/2 -translate-y-1/2 text-[#8b8c83] ${isArabic ? 'right-4' : 'left-4'}`} /><input value={query} onChange={(e) => setQuery(e.target.value)} aria-label={t('Search furniture', 'ابحث عن الأثاث')} placeholder={t('Search furniture...', 'ابحث عن الأثاث...')} suppressHydrationWarning className={`w-full rounded-full border border-[#d8d8ce] bg-[#f8f7f3] py-3 text-sm outline-none transition focus:border-[#1f3b36] ${isArabic ? 'pl-4 pr-11' : 'pl-11 pr-4'}`} /></div></div>
            <div className="mt-9 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label={t('Furniture categories', 'فئات الأثاث')}>{categories.map((category) => { const count = category === 'All furniture' ? products.length : products.filter((product) => product.category === category).length; return <button key={category} role="tab" aria-selected={activeCategory === category} onClick={() => setActiveCategory(category)} className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition ${activeCategory === category ? 'bg-[#1f3b36] text-white' : 'border border-[#d6d6cc] text-[#686a61] hover:bg-white'}`}>{isArabic ? ({ 'All furniture': 'كل الأثاث', 'Living room': 'غرفة المعيشة', Dining: 'غرفة الطعام', Bedroom: 'غرفة النوم', Office: 'المكتب' }[category] ?? category) : category}<span className={`rounded-full px-2 py-0.5 text-xs ${activeCategory === category ? 'bg-white/15 text-white' : 'bg-[#e9e8e1] text-[#686a61]'}`} aria-label={t(`${count} products`, `${count} منتجات`)}>{count}</span></button> })}</div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{filteredProducts.map((product) => <article key={product.id ?? product.name} className="group"><div className={`relative aspect-[0.92] overflow-hidden rounded-2xl ${product.color}`}><img src={product.image} alt={product.name} className="size-full object-cover transition duration-500 group-hover:scale-105" />{product.imageIsFallback && <span className={`absolute top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#686a61] ${isArabic ? 'right-3' : 'left-3'}`}>{t('Workshop photo pending', 'صورة الورشة قريبًا')}</span>}<button onClick={() => setFavorites((items) => items.includes(product.name) ? items.filter((item) => item !== product.name) : [...items, product.name])} className={`absolute top-3 flex size-9 items-center justify-center rounded-full bg-white/85 text-[#1f3b36] backdrop-blur-sm ${isArabic ? 'left-3' : 'right-3'}`} aria-label={t(`Save ${product.name}`, `أضف ${product.name} إلى المفضلة`)}>{<Heart fill={favorites.includes(product.name) ? 'currentColor' : 'none'} className={favorites.includes(product.name) ? 'text-[#b4823e]' : ''} />}</button><span className={`absolute bottom-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1f3b36] ${isArabic ? 'right-3' : 'left-3'}`}>{isArabic ? ({ 'Living room': 'غرفة المعيشة', Dining: 'غرفة الطعام', Bedroom: 'غرفة النوم', Office: 'المكتب' }[product.category] ?? product.category) : product.category}</span></div><div className="mt-4 flex items-start justify-between gap-3"><div><h3 className="font-serif text-xl text-[#1f3b36]">{product.name}</h3><p className="mt-1 text-sm text-[#777970]">{t('by', 'بواسطة')} {product.maker}</p></div><p className="whitespace-nowrap pt-1 text-sm font-semibold text-[#b4823e]">{product.price ?? t('Contact for price', 'تواصل لمعرفة السعر')}</p></div><div className="mt-4 flex items-center justify-between gap-2"><span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${product.quantity === 0 ? 'text-[#a34535]' : 'text-[#3b765d]'}`}><PackageCheck data-icon="inline-start" />{product.quantity === undefined ? t(product.availability ?? 'Made to order', 'يُصنع عند الطلب') : product.quantity > 0 ? t(`Available · ${product.quantity}`, `متاح · ${product.quantity}`) : t('Out of stock', 'نفد المخزون')}</span>{viewMode === 'customer' && <button disabled={product.quantity === 0 || !product.id || !product.price} onClick={() => { const productId = product.id; if (!productId) return; setCart((items) => { const existing = items.find((item) => item.productId === productId); if (existing) return items.map((item) => item.productId === productId ? { ...item, quantity: Math.min(20, item.quantity + 1) } : item); return [...items, { productId, quantity: 1 }] }) }} className="inline-flex items-center gap-1.5 rounded-full bg-[#1f3b36] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#2d5049] disabled:cursor-not-allowed disabled:bg-[#85867d]"><ShoppingBag data-icon="inline-start" />{product.quantity === 0 ? t('Unavailable', 'غير متوفر') : !product.id || !product.price ? t('Coming soon', 'قريبًا') : cart.some((item) => item.productId === product.id) ? t('Add another', 'أضف المزيد') : t('Add to cart', 'أضف إلى السلة')}</button>}</div></article>)}</div>
            {filteredProducts.length === 0 && <p className="py-14 text-center text-[#777970]">{t('No pieces found. Try a different search.', 'لم نعثر على قطع. جرّب كلمات بحث أخرى.')}</p>}
            <div className="mt-12 text-center"><button className="inline-flex items-center gap-2 text-sm font-semibold text-[#1f3b36] underline decoration-[#d2ad6f] underline-offset-8">{t('View all furniture', 'عرض كل الأثاث')} <ArrowRight /></button></div>
          </div>
        </section>

        <section id="makers" className="mx-auto grid max-w-[1240px] gap-12 px-5 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-28"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ba8c42]">{t('Meet the makers', 'تعرّف على الحرفيين')}</p><h2 className="mt-3 max-w-sm font-serif text-4xl leading-tight tracking-tight text-[#1f3b36] md:text-5xl">{isArabic ? <>الأيادي وراء <em className="font-normal text-[#b4823e]">الحرفة.</em></> : <>The hands behind the <em className="font-normal text-[#b4823e]">craft.</em></>}</h2><p className="mt-5 max-w-sm leading-7 text-[#777970]">{t('Every piece has a person, a place, and a tradition behind it. Get to know the workshops keeping Damietta’s craft alive.', 'لكل قطعة صانع ومكان وتراث. تعرّف على الورش التي تحافظ على حرفة دمياط.')}</p><a href="#sell" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#1f3b36]">{t('Meet all makers', 'تعرّف على جميع الحرفيين')} <ArrowRight /></a></div><div className="grid gap-4 sm:grid-cols-3">{makers.map((maker) => <div key={maker.name} className="rounded-2xl border border-[#dfdfd6] bg-[#f8f7f3] p-4 transition hover:-translate-y-1 hover:bg-white"><div className="aspect-square overflow-hidden rounded-xl bg-[#e9e7df]"><img src={maker.image} alt={`${maker.name} workshop`} className="size-full object-cover" /></div><h3 className="mt-4 font-serif text-lg text-[#1f3b36]">{maker.name}</h3><p className="mt-1 text-xs text-[#85867d]">{isArabic ? maker.location.replace('Damietta, Egypt', 'دمياط، مصر') : maker.location}</p><div className="mt-4 flex items-center gap-1 text-xs font-medium text-[#b4823e]"><Star fill="currentColor" /> 4.9</div></div>)}</div></section>

        <section id="story" className="bg-[#1f3b36] text-white"><div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:px-8 lg:py-24"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e8c98b]">{t('More than furniture', 'أكثر من مجرد أثاث')}</p><h2 className="mt-4 max-w-lg font-serif text-4xl leading-tight tracking-tight md:text-5xl">{t('A direct line from Damietta to your home.', 'من دمياط مباشرةً إلى منزلك.')}</h2><p className="mt-6 max-w-md leading-7 text-white/65">{t('Jozzor Damietta Marketable plus makes it easier to buy directly from independent makers. Fair prices for workshops. One-of-a-kind pieces for you. Delivered anywhere.', 'يجمع جوزور دمياط بينك وبين الحرفيين مباشرةً. أسعار عادلة للورش وقطع فريدة لمنزلك، مع التوصيل إلى وجهتك.')}</p><div className="mt-9 grid max-w-md grid-cols-3 gap-4 border-t border-white/15 pt-6 text-sm text-white/65"><div><ShieldCheck className="mb-3 text-[#e8c98b]" /><span>{t('Trusted makers', 'حرفيون موثوقون')}</span></div><div><Truck className="mb-3 text-[#e8c98b]" /><span>{t('Worldwide delivery', 'توصيل لجميع أنحاء العالم')}</span></div><div><Sparkles className="mb-3 text-[#e8c98b]" /><span>{t('Made to last', 'مصنوع ليدوم')}</span></div></div></div><div className="relative overflow-hidden rounded-[2rem] bg-[#d3b986] p-8 sm:p-12"><div className="absolute -right-12 -top-12 size-48 rounded-full border border-[#1f3b36]/15" /><div className="absolute -right-4 -top-4 size-32 rounded-full border border-[#1f3b36]/15" /><p className="relative max-w-sm font-serif text-3xl leading-tight text-[#1f3b36]">“The best furniture is not just seen. It&apos;s felt.”</p><p className="relative mt-8 text-sm font-semibold text-[#1f3b36]/65">— An old Damietta saying</p></div></div></section>

        <section id="sell" className="bg-[#f1f0ea] px-5 py-20 lg:py-24">
          <div className="mx-auto max-w-[960px]">
            <div className="mx-auto max-w-2xl text-center">
              <Users className="mx-auto text-[#b4823e]" />
              <h2 className="mx-auto mt-4 font-serif text-4xl tracking-tight text-[#1f3b36] md:text-5xl">{isArabic ? <>ورشتك تستحق أن <em className="font-normal text-[#b4823e]">يراها الجميع.</em></> : <>Your workshop deserves to be <em className="font-normal text-[#b4823e]">seen.</em></>}</h2>
              <p className="mx-auto mt-5 leading-7 text-[#777970]">{t('Tell us about your workshop and attach a product catalogue or product images to get started.', 'أخبرنا عن ورشتك وأرفق كتالوج المنتجات أو صورها للبدء.')}</p>
            </div>
            <form ref={formRef} onSubmit={handleWorkshopSubmit} className="mt-10 rounded-3xl border border-[#dfdfd6] bg-[#f8f7f3] p-6 sm:p-9">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-semibold text-[#1f3b36]">{t('Company / workshop name', 'اسم الشركة أو الورشة')}<input required name="companyName" autoComplete="organization" placeholder={t('e.g. El Nasr Furniture Workshop', 'مثال: ورشة النصر للأثاث')} className="rounded-xl border border-[#d8d8ce] bg-white px-4 py-3 font-normal outline-none focus:border-[#1f3b36]" /></label>
                <label className="flex flex-col gap-2 text-sm font-semibold text-[#1f3b36]">{t('Workshop size', 'حجم الورشة')}<select required name="workshopSize" defaultValue="" className="rounded-xl border border-[#d8d8ce] bg-white px-4 py-3 font-normal outline-none focus:border-[#1f3b36]"><option value="" disabled>{t('Select workshop size', 'اختر حجم الورشة')}</option><option>{t('1–5 employees', '1–5 موظفين')}</option><option>{t('6–20 employees', '6–20 موظفًا')}</option><option>{t('21–50 employees', '21–50 موظفًا')}</option><option>{t('More than 50 employees', 'أكثر من 50 موظفًا')}</option></select></label>
                <label className="flex flex-col gap-2 text-sm font-semibold text-[#1f3b36]">{t('Governorate', 'المحافظة')}<input required name="governorate" autoComplete="address-level1" placeholder={t('Damietta', 'دمياط')} className="rounded-xl border border-[#d8d8ce] bg-white px-4 py-3 font-normal outline-none focus:border-[#1f3b36]" /></label>
                <label className="flex flex-col gap-2 text-sm font-semibold text-[#1f3b36]">{t('City / area', 'المدينة أو المنطقة')}<input required name="city" autoComplete="address-level2" placeholder={t('Damietta, New Damietta, or nearby area', 'دمياط أو دمياط الجديدة أو المناطق المجاورة')} className="rounded-xl border border-[#d8d8ce] bg-white px-4 py-3 font-normal outline-none focus:border-[#1f3b36]" /></label>
                <label className="flex flex-col gap-2 text-sm font-semibold text-[#1f3b36] sm:col-span-2">{t('Detailed workshop address', 'العنوان التفصيلي للورشة')}<textarea required name="address" autoComplete="street-address" rows={3} placeholder={t('Street, building, district, and a helpful landmark', 'الشارع ورقم المبنى والحي وأقرب علامة مميزة')} className="resize-y rounded-xl border border-[#d8d8ce] bg-white px-4 py-3 font-normal outline-none focus:border-[#1f3b36]" /></label>
                <label className="flex flex-col gap-2 text-sm font-semibold text-[#1f3b36] sm:col-span-2">{t('Product catalogue', 'كتالوج المنتجات')} <span className="font-normal text-[#777970]">{t('Attach one CSV or Excel catalogue (required) and optional PDF or product images.', 'أرفق ملف كتالوج بصيغة CSV أو Excel (مطلوب)، ويمكنك إضافة ملفات PDF أو صور المنتجات.')}</span><input required name="productFiles" type="file" multiple accept=".xlsx,.xls,.csv,.pdf,.jpg,.jpeg,.png,.webp" onChange={(event) => { setAttachmentNames(Array.from(event.target.files ?? []).map((file) => file.name)); setWorkshopMessage(''); setWorkshopError('') }} className="rounded-xl border border-dashed border-[#c8c8bd] bg-white px-4 py-4 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-[#e8c98b] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#1f3b36]" aria-describedby="product-files-help" /></label>
              </div>
              <p id="product-files-help" className="mt-3 text-xs leading-5 text-[#777970]">{t('CSV and Excel files can contain up to 2,000 products. Use columns such as Name, Quantity or On Hand Quantity, Category, Sales Price, Vendor, Image URL, and Description. Each file is limited to 4 MB; total upload is limited to 4 MB.', 'يمكن أن يحتوي ملف CSV أو Excel على 2,000 منتج كحد أقصى. استخدم أعمدة مثل الاسم والكمية والفئة والسعر والمورّد ورابط الصورة والوصف. الحد الأقصى لكل ملف ولإجمالي الملفات 4 ميغابايت.')}</p>
              <p className="mt-2 break-words text-xs text-[#777970]">{t('Selected files:', 'الملفات المحددة:')} {attachmentNames.length ? attachmentNames.join(', ') : t('none yet', 'لا يوجد حتى الآن')}</p>
              <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1f3b36] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#2d5049] disabled:cursor-wait disabled:opacity-60">{isSubmitting ? t('Submitting request…', 'جارٍ إرسال الطلب…') : t('Submit workshop request', 'إرسال طلب الورشة')} <ArrowRight data-icon="inline-end" /></button>
              {workshopMessage && <p role="status" className="mt-4 text-sm font-medium text-[#1f3b36]">{workshopMessage}</p>}
              {workshopError && <p role="alert" className="mt-4 text-sm font-medium text-red-800">{workshopError}</p>}
            </form>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#dfdfd6]"><div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-5 py-8 text-sm text-[#777970] sm:flex-row sm:items-center sm:justify-between lg:px-8"><div className="flex items-center gap-2 font-serif text-xl text-[#1f3b36]">Jozzor Damietta Marketable plus <span className="font-sans text-xs text-[#999a91]">© 2026</span></div><div className="flex gap-6"><a href="#story" className="hover:text-[#1f3b36]">{t('About', 'من نحن')}</a><a href="#sell" className="hover:text-[#1f3b36]">{t('Contact', 'تواصل معنا')}</a><a href="/admin/sign-in" className="hover:text-[#1f3b36]">{t('Workshop review', 'مراجعة الورش')}</a><a href="#" className="hover:text-[#1f3b36]">Instagram</a></div></div></footer>
    </div>
  )
}
