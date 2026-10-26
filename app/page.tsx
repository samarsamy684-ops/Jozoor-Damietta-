'use client'

import { useMemo, useState } from 'react'
import {
  ArrowRight,
  ChevronDown,
  Globe2,
  Heart,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Users,
  X,
} from 'lucide-react'

const categories = ['All furniture', 'Living room', 'Dining', 'Bedroom', 'Office']

const products = [
  {
    name: 'Marsa Lounge Chair',
    maker: 'El Nasr Workshop',
    category: 'Living room',
    price: 'EGP 18,500',
    image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=900&q=85',
    color: 'bg-[#e8dfd3]',
  },
  {
    name: 'Nile Oak Dining Set',
    maker: 'Hassan Woodcraft',
    category: 'Dining',
    price: 'EGP 42,000',
    image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=900&q=85',
    color: 'bg-[#dce2dc]',
  },
  {
    name: 'Sahara Side Table',
    maker: 'Maison Fouad',
    category: 'Living room',
    price: 'EGP 6,800',
    image: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=900&q=85',
    color: 'bg-[#e7e0d6]',
  },
  {
    name: 'Cairo Cane Bed',
    maker: 'Dar El Tefl',
    category: 'Bedroom',
    price: 'EGP 31,500',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=85',
    color: 'bg-[#e2ded7]',
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

  const filteredProducts = useMemo(() => products.filter((product) => {
    const matchesCategory = activeCategory === 'All furniture' || product.category === activeCategory
    const matchesQuery = `${product.name} ${product.maker}`.toLowerCase().includes(query.toLowerCase())
    return matchesCategory && matchesQuery
  }), [activeCategory, query])

  return (
    <div className="min-h-screen bg-[#f8f7f3] text-[#24251f]">
      <header className="border-b border-[#dfdfd6] bg-[#f8f7f3]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-5 lg:px-8">
          <a href="#top" className="flex items-center gap-3" aria-label="Jozoor Damietta home">
            <div className="flex size-10 items-center justify-center rounded-full bg-[#1f3b36] text-[#e8c98b]">
              <span className="font-serif text-xl font-semibold">S</span>
            </div>
            <div>
              <p className="font-serif text-2xl leading-none tracking-tight">Jozoor Damietta</p>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#8a8b82]">made in damietta</p>
            </div>
          </a>
          <nav className="hidden items-center gap-8 text-sm font-medium text-[#65675f] md:flex" aria-label="Primary navigation">
            <a className="text-[#1f3b36]" href="#discover">Discover</a>
            <a href="#makers" className="transition-colors hover:text-[#1f3b36]">Our makers</a>
            <a href="#story" className="transition-colors hover:text-[#1f3b36]">Our story</a>
          </nav>
          <div className="flex items-center gap-3">
            <button className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[#65675f] transition hover:bg-white sm:flex" aria-label="Choose language">
              <Globe2 data-icon="inline-start" /> EN <ChevronDown data-icon="inline-end" />
            </button>
            <a href="#sell" className="hidden rounded-full bg-[#e8c98b] px-5 py-2.5 text-sm font-semibold text-[#1f3b36] transition hover:bg-[#dfbc76] sm:inline-flex">List your workshop</a>
            <button className="inline-flex size-10 items-center justify-center rounded-full border border-[#dfdfd6] md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {menuOpen && <nav className="flex flex-col gap-4 border-t border-[#dfdfd6] px-5 py-5 text-sm font-medium md:hidden"><a href="#discover" onClick={() => setMenuOpen(false)}>Discover</a><a href="#makers" onClick={() => setMenuOpen(false)}>Our makers</a><a href="#story" onClick={() => setMenuOpen(false)}>Our story</a><a href="#sell" onClick={() => setMenuOpen(false)}>List your workshop</a></nav>}
      </header>

      <main id="top">
        <section className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 pb-20 pt-16 lg:grid-cols-[0.94fr_1.06fr] lg:px-8 lg:pb-28 lg:pt-24">
          <div className="max-w-xl">
            <div className="mb-7 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-[#ba8c42]"><span className="h-px w-9 bg-[#ba8c42]" /> The heart of Egyptian furniture</div>
            <h1 className="font-serif text-[clamp(3.5rem,7vw,6.25rem)] leading-[0.92] tracking-[-0.055em] text-[#1f3b36]">Furniture with a <em className="font-normal text-[#b4823e]">story</em> to tell.</h1>
            <p className="mt-8 max-w-md text-lg leading-8 text-[#686a61]">Discover beautiful, handcrafted furniture made by the skilled hands of Damietta&apos;s independent workshops.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="#discover" className="inline-flex items-center justify-center gap-3 rounded-full bg-[#1f3b36] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#2d5049]">Explore the collection <ArrowRight data-icon="inline-end" /></a>
              <a href="#story" className="inline-flex items-center justify-center rounded-full border border-[#cfcfc5] px-6 py-3.5 text-sm font-semibold text-[#1f3b36] transition hover:bg-white">Why Damietta?</a>
            </div>
            <div className="mt-12 flex items-center gap-8 border-t border-[#deded5] pt-6 text-sm text-[#777970]"><div><strong className="block font-serif text-2xl text-[#1f3b36]">240+</strong>independent makers</div><div><strong className="block font-serif text-2xl text-[#1f3b36]">12k+</strong>pieces discovered</div></div>
          </div>
          <div className="relative min-h-[470px] overflow-hidden rounded-[2rem] bg-[#d9d2c5] lg:min-h-[600px]">
            <img src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1300&q=90" alt="Warm modern living room with handcrafted wooden furniture" className="absolute inset-0 size-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1f3b36]/45 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-white"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Featured collection</p><p className="mt-1 font-serif text-2xl">The Mediterranean Edit</p></div><span className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium backdrop-blur-md">01 / 04</span></div>
            <div className="absolute right-5 top-5 rounded-full bg-[#f5dfb3] px-4 py-2 text-xs font-bold text-[#1f3b36]">New arrivals</div>
          </div>
        </section>

        <section id="discover" className="border-y border-[#dfdfd6] bg-[#f1f0ea] py-16 lg:py-20">
          <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
            <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ba8c42]">Curated for you</p><h2 className="mt-3 font-serif text-4xl tracking-tight text-[#1f3b36] md:text-5xl">Find your next <em className="font-normal text-[#b4823e]">heirloom.</em></h2></div><div className="relative w-full md:w-64"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b8c83]" /><input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search furniture" placeholder="Search furniture..." suppressHydrationWarning className="w-full rounded-full border border-[#d8d8ce] bg-[#f8f7f3] py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#1f3b36]" /></div></div>
            <div className="mt-9 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Furniture categories">{categories.map((category) => <button key={category} role="tab" aria-selected={activeCategory === category} onClick={() => setActiveCategory(category)} className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition ${activeCategory === category ? 'bg-[#1f3b36] text-white' : 'border border-[#d6d6cc] text-[#686a61] hover:bg-white'}`}>{category}</button>)}</div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{filteredProducts.map((product) => <article key={product.name} className="group"><div className={`relative aspect-[0.92] overflow-hidden rounded-2xl ${product.color}`}><img src={product.image} alt={product.name} className="size-full object-cover transition duration-500 group-hover:scale-105" /><button onClick={() => setFavorites((items) => items.includes(product.name) ? items.filter((item) => item !== product.name) : [...items, product.name])} className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-white/85 text-[#1f3b36] backdrop-blur-sm" aria-label={`Save ${product.name}`}>{<Heart fill={favorites.includes(product.name) ? 'currentColor' : 'none'} className={favorites.includes(product.name) ? 'text-[#b4823e]' : ''} />}</button><span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1f3b36]">{product.category}</span></div><div className="mt-4 flex items-start justify-between gap-3"><div><h3 className="font-serif text-xl text-[#1f3b36]">{product.name}</h3><p className="mt-1 text-sm text-[#777970]">by {product.maker}</p></div><p className="whitespace-nowrap pt-1 text-sm font-semibold text-[#b4823e]">{product.price}</p></div></article>)}</div>
            {filteredProducts.length === 0 && <p className="py-14 text-center text-[#777970]">No pieces found. Try a different search.</p>}
            <div className="mt-12 text-center"><button className="inline-flex items-center gap-2 text-sm font-semibold text-[#1f3b36] underline decoration-[#d2ad6f] underline-offset-8">View all furniture <ArrowRight /></button></div>
          </div>
        </section>

        <section id="makers" className="mx-auto grid max-w-[1240px] gap-12 px-5 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-28"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ba8c42]">Meet the makers</p><h2 className="mt-3 max-w-sm font-serif text-4xl leading-tight tracking-tight text-[#1f3b36] md:text-5xl">The hands behind the <em className="font-normal text-[#b4823e]">craft.</em></h2><p className="mt-5 max-w-sm leading-7 text-[#777970]">Every piece has a person, a place, and a tradition behind it. Get to know the workshops keeping Damietta&apos;s craft alive.</p><a href="#sell" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#1f3b36]">Meet all makers <ArrowRight /></a></div><div className="grid gap-4 sm:grid-cols-3">{makers.map((maker) => <div key={maker.name} className="rounded-2xl border border-[#dfdfd6] bg-[#f8f7f3] p-4 transition hover:-translate-y-1 hover:bg-white"><div className="aspect-square overflow-hidden rounded-xl bg-[#e9e7df]"><img src={maker.image} alt={`${maker.name} workshop`} className="size-full object-cover" /></div><h3 className="mt-4 font-serif text-lg text-[#1f3b36]">{maker.name}</h3><p className="mt-1 text-xs text-[#85867d]">{maker.location}</p><div className="mt-4 flex items-center gap-1 text-xs font-medium text-[#b4823e]"><Star fill="currentColor" /> 4.9</div></div>)}</div></section>

        <section id="story" className="bg-[#1f3b36] text-white"><div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:px-8 lg:py-24"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e8c98b]">More than furniture</p><h2 className="mt-4 max-w-lg font-serif text-4xl leading-tight tracking-tight md:text-5xl">A direct line from Damietta to your home.</h2><p className="mt-6 max-w-md leading-7 text-white/65">Jozoor Damietta makes it easier to buy directly from independent makers. Fair prices for workshops. One-of-a-kind pieces for you. Delivered anywhere.</p><div className="mt-9 grid max-w-md grid-cols-3 gap-4 border-t border-white/15 pt-6 text-sm text-white/65"><div><ShieldCheck className="mb-3 text-[#e8c98b]" /><span>Trusted makers</span></div><div><Truck className="mb-3 text-[#e8c98b]" /><span>Worldwide delivery</span></div><div><Sparkles className="mb-3 text-[#e8c98b]" /><span>Made to last</span></div></div></div><div className="relative overflow-hidden rounded-[2rem] bg-[#d3b986] p-8 sm:p-12"><div className="absolute -right-12 -top-12 size-48 rounded-full border border-[#1f3b36]/15" /><div className="absolute -right-4 -top-4 size-32 rounded-full border border-[#1f3b36]/15" /><p className="relative max-w-sm font-serif text-3xl leading-tight text-[#1f3b36]">“The best furniture is not just seen. It&apos;s felt.”</p><p className="relative mt-8 text-sm font-semibold text-[#1f3b36]/65">— An old Damietta saying</p></div></div></section>

        <section id="sell" className="mx-auto max-w-[1240px] px-5 py-20 text-center lg:px-8 lg:py-24"><Users className="mx-auto text-[#b4823e]" /><h2 className="mx-auto mt-4 max-w-2xl font-serif text-4xl tracking-tight text-[#1f3b36] md:text-5xl">Your workshop deserves to be <em className="font-normal text-[#b4823e]">seen.</em></h2><p className="mx-auto mt-5 max-w-lg leading-7 text-[#777970]">Join a growing community of Damietta&apos;s furniture makers and reach customers across Egypt and the world.</p><a href="mailto:hello@Jozoor Damietta.co" className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#e8c98b] px-7 py-3.5 text-sm font-semibold text-[#1f3b36] transition hover:bg-[#dfbc76]">List your workshop <ArrowRight /></a></section>
      </main>

      <footer className="border-t border-[#dfdfd6]"><div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-5 py-8 text-sm text-[#777970] sm:flex-row sm:items-center sm:justify-between lg:px-8"><div className="flex items-center gap-2 font-serif text-xl text-[#1f3b36]">Jozoor Damietta <span className="font-sans text-xs text-[#999a91]">© 2026</span></div><div className="flex gap-6"><a href="#story" className="hover:text-[#1f3b36]">About</a><a href="mailto:hello@Jozoor Damietta.co" className="hover:text-[#1f3b36]">Contact</a><a href="#" className="hover:text-[#1f3b36]">Instagram</a></div></div></footer>
    </div>
  )
}
