'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ExternalLink, LogOut, Package, RefreshCw } from 'lucide-react'
import { authClient } from '@/lib/auth/client'

type ProductRow = {
  id: string
  name: string
  maker: string
  category: string
  quantity: number
  price: string | null
  description: string | null
}

type RequestRow = {
  id: string
  companyName: string
  workshopSize: string
  governorate: string
  city: string
  address: string
  status: string
  submittedAt: string
  products: ProductRow[]
  attachments: { id: string; filename: string; sizeBytes: number }[]
}

export function AdminReviewDashboard({ adminEmail, requests: initialRequests }: { adminEmail: string; requests: RequestRow[] }) {
  const router = useRouter()
  const [requests, setRequests] = useState(initialRequests)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const approveRequest = async (id: string) => {
    setPendingId(id)
    setMessage('')
    setError('')
    try {
      const response = await fetch(`/api/admin/requests/${id}/approve`, { method: 'POST' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Approval failed.')
      setRequests((current) => current.map((request) => request.id === id ? { ...request, status: 'approved' } : request))
      setMessage('Request approved. Its products are now available in the public catalogue.')
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Approval failed. Please try again.')
    } finally {
      setPendingId(null)
    }
  }

  const signOut = async () => {
    await authClient.signOut()
    router.replace('/admin/sign-in')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-[#f8f7f3] px-5 py-10 text-[#1f3b36] sm:py-14">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-6 border-b border-[#dfdfd6] pb-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <a href="/" className="text-sm font-semibold text-[#777970] hover:text-[#1f3b36]">Jozzor Damietta Marketable plus</a>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#b4823e]">Workshop administration</p>
            <h1 className="mt-2 font-serif text-4xl tracking-tight">Request review</h1>
            <p className="mt-2 text-sm text-[#777970]">Signed in as {adminEmail}</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => router.refresh()} className="inline-flex items-center gap-2 rounded-full border border-[#d8d8ce] bg-white px-4 py-2.5 text-sm font-semibold hover:bg-[#f1f0ea]"><RefreshCw size={16} aria-hidden="true" /> Refresh</button>
            <button type="button" onClick={signOut} className="inline-flex items-center gap-2 rounded-full bg-[#1f3b36] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2d5049]"><LogOut size={16} aria-hidden="true" /> Sign out</button>
          </div>
        </header>

        {message && <p role="status" className="mt-5 rounded-xl bg-[#e9f1ec] px-4 py-3 text-sm font-medium text-[#1f3b36]">{message}</p>}
        {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</p>}

        <section aria-label="Workshop requests" className="mt-8 space-y-5">
          {requests.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#d8d8ce] bg-white px-6 py-16 text-center">
              <Package className="mx-auto text-[#b4823e]" aria-hidden="true" />
              <h2 className="mt-4 font-serif text-2xl">No workshop requests yet</h2>
              <p className="mt-2 text-sm text-[#777970]">New submissions will appear here for review.</p>
            </div>
          ) : requests.map((request) => (
            <article key={request.id} className="rounded-3xl border border-[#dfdfd6] bg-white p-5 sm:p-7">
              <div className="flex flex-col gap-4 border-b border-[#ebeae4] pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-serif text-2xl">{request.companyName}</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${request.status === 'approved' ? 'bg-[#e9f1ec] text-[#1f3b36]' : request.status === 'rejected' ? 'bg-red-50 text-red-800' : 'bg-[#f7efd9] text-[#8b682e]'}`}>{request.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-[#777970]">{request.workshopSize} · {request.city}, {request.governorate} · {new Date(request.submittedAt).toLocaleString()}</p>
                  <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-[#4e5149]">{request.address}</p>
                </div>
                {request.status === 'pending' && <button type="button" disabled={pendingId === request.id} aria-busy={pendingId === request.id} onClick={() => approveRequest(request.id)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#1f3b36] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2d5049] disabled:cursor-wait disabled:opacity-60"><Check size={17} aria-hidden="true" />{pendingId === request.id ? 'Approving…' : 'Approve request'}</button>}
              </div>

              <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div>
                  <h3 className="text-sm font-bold">Products submitted ({request.products.length})</h3>
                  {request.products.length ? <ul className="mt-3 divide-y divide-[#ebeae4]">
                    {request.products.map((product) => <li key={product.id} className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-start sm:justify-between">
                      <div><p className="font-semibold">{product.name}</p><p className="mt-1 text-xs text-[#777970]">{product.maker} · {product.category}{product.description ? ` · ${product.description}` : ''}</p></div>
                      <p className="shrink-0 text-[#65675f]">{product.quantity} in stock{product.price ? ` · ${product.price}` : ''}</p>
                    </li>)}
                  </ul> : <p className="mt-2 text-sm text-[#777970]">No products were parsed from this catalogue.</p>}
                </div>
                <div>
                  <h3 className="text-sm font-bold">Private attachments ({request.attachments.length})</h3>
                  {request.attachments.length ? <ul className="mt-3 space-y-2">
                    {request.attachments.map((attachment) => <li key={attachment.id}>
                      <a href={`/api/admin/files?id=${encodeURIComponent(attachment.id)}`} className="inline-flex max-w-full items-center gap-2 break-all text-sm font-medium text-[#1f3b36] underline decoration-[#d8d8ce] underline-offset-4 hover:decoration-[#1f3b36]"><ExternalLink size={14} className="shrink-0" aria-hidden="true" />{attachment.filename}<span className="text-xs text-[#777970]">({(attachment.sizeBytes / 1024).toFixed(0)} KB)</span></a>
                    </li>)}
                  </ul> : <p className="mt-2 text-sm text-[#777970]">No additional attachments.</p>}
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
