import { get } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getAdminUser } from '@/lib/auth/admin'
import { db } from '@/lib/db'
import { workshopRequestAttachments } from '@/lib/db/schema'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const admin = await getAdminUser()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'Invalid attachment ID.' }, { status: 400 })
  }

  const [attachment] = await db.select().from(workshopRequestAttachments).where(eq(workshopRequestAttachments.id, id)).limit(1)
  if (!attachment) return NextResponse.json({ error: 'Attachment not found.' }, { status: 404 })

  const result = await get(attachment.pathname, { access: 'private' })
  if (!result || result.statusCode !== 200) return NextResponse.json({ error: 'Attachment not found.' }, { status: 404 })

  const filename = attachment.filename.replace(/[\r\n"\\]/g, '_')
  return new NextResponse(result.stream, {
    headers: {
      'Content-Type': attachment.contentType,
      'Content-Length': String(attachment.sizeBytes),
      'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
