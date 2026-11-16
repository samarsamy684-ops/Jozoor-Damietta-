import { desc, inArray } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { AdminReviewDashboard } from '@/components/admin-review-dashboard'
import { getAdminUser } from '@/lib/auth/admin'
import { db } from '@/lib/db'
import { marketplaceProducts, workshopRequestAttachments, workshopRequests } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  if (!process.env.WORKSHOP_ADMIN_EMAIL) {
    return (
      <main className="min-h-screen bg-[#f8f7f3] px-5 py-16 text-[#1f3b36]">
        <section className="mx-auto max-w-xl rounded-3xl border border-[#dfdfd6] bg-white p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b4823e]">Admin setup needed</p>
          <h1 className="mt-3 font-serif text-3xl">Set the admin email</h1>
          <p className="mt-3 leading-7 text-[#65675f]">Add the single approved address as the <code className="rounded bg-[#f1f0ea] px-1.5 py-0.5">WORKSHOP_ADMIN_EMAIL</code> environment variable to enable request review.</p>
        </section>
      </main>
    )
  }

  const admin = await getAdminUser()
  if (!admin) redirect('/admin/sign-in')

  const requests = await db.select().from(workshopRequests).orderBy(desc(workshopRequests.submittedAt))
  const ids = requests.map((request) => request.id)
  const [products, attachments] = ids.length
    ? await Promise.all([
        db.select().from(marketplaceProducts).where(inArray(marketplaceProducts.requestId, ids)),
        db.select().from(workshopRequestAttachments).where(inArray(workshopRequestAttachments.requestId, ids)),
      ])
    : [[], []]

  return (
    <AdminReviewDashboard
      adminEmail={admin.email}
      requests={requests.map((request) => ({
        ...request,
        submittedAt: request.submittedAt.toISOString(),
        reviewedAt: request.reviewedAt?.toISOString() ?? null,
        products: products.filter((product) => product.requestId === request.id),
        attachments: attachments.filter((attachment) => attachment.requestId === request.id).map(({ id, filename, sizeBytes }) => ({ id, filename, sizeBytes })),
      }))}
    />
  )
}
