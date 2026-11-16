import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getAdminUser } from '@/lib/auth/admin'
import { hasSameOrigin } from '@/lib/auth/origin'
import { db } from '@/lib/db'
import { marketplaceProducts, workshopRequests } from '@/lib/db/schema'

export const runtime = 'nodejs'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 })

  const admin = await getAdminUser()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'Invalid request ID.' }, { status: 400 })
  }

  const approved = await db.transaction(async (tx) => {
    const updated = await tx
      .update(workshopRequests)
      .set({ status: 'approved', reviewedAt: new Date(), reviewedBy: admin.email })
      .where(and(eq(workshopRequests.id, id), eq(workshopRequests.status, 'pending')))
      .returning({ id: workshopRequests.id })

    if (!updated.length) return false
    await tx.update(marketplaceProducts).set({ published: true }).where(eq(marketplaceProducts.requestId, id))
    return true
  })

  if (!approved) return NextResponse.json({ error: 'This request is no longer pending.' }, { status: 409 })

  revalidatePath('/')
  revalidatePath('/admin')
  return NextResponse.json({ approved: true })
}
