import { NextResponse } from 'next/server'
import { desc, inArray } from 'drizzle-orm'
import { getAdminUser } from '@/lib/auth/admin'
import { db } from '@/lib/db'
import { marketplaceProducts, workshopRequestAttachments, workshopRequests } from '@/lib/db/schema'

export const runtime = 'nodejs'

export async function GET() {
  const admin = await getAdminUser()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const requests = await db.select().from(workshopRequests).orderBy(desc(workshopRequests.submittedAt))
  if (!requests.length) return NextResponse.json([])

  const ids = requests.map((request) => request.id)
  const [products, attachments] = await Promise.all([
    db.select().from(marketplaceProducts).where(inArray(marketplaceProducts.requestId, ids)),
    db.select().from(workshopRequestAttachments).where(inArray(workshopRequestAttachments.requestId, ids)),
  ])

  return NextResponse.json(requests.map((request) => ({
    ...request,
    products: products.filter((product) => product.requestId === request.id),
    attachments: attachments.filter((attachment) => attachment.requestId === request.id),
  })))
}
