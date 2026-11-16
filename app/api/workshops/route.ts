import { del, put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { hasSameOrigin } from '@/lib/auth/origin'
import { db } from '@/lib/db'
import { marketplaceProducts, workshopRequestAttachments, workshopRequests } from '@/lib/db/schema'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 4 * 1024 * 1024
const MAX_FILES = 8
const contentTypeByExtension: Record<string, string> = {
  csv: 'text/csv; charset=utf-8',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}
const productCategories = ['Living room', 'Dining', 'Bedroom', 'Office'] as const

type ParsedProduct = {
  name: string
  maker: string
  category: (typeof productCategories)[number]
  price: string | null
  quantity: number
  imageUrl: string | null
  description: string | null
}

function textValue(value: FormDataEntryValue | null, maxLength = 300) {
  return typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, maxLength) : ''
}

function normalizeCategory(value: unknown): (typeof productCategories)[number] {
  const raw = String(value ?? '').trim().toLowerCase()
  const exact = productCategories.find((category) => category.toLowerCase() === raw)
  if (exact) return exact
  if (/dining|kitchen|dining room/.test(raw)) return 'Dining'
  if (/bedroom|bed|wardrobe/.test(raw)) return 'Bedroom'
  if (/office|desk|study/.test(raw)) return 'Office'
  return 'Living room'
}

async function parseSpreadsheet(file: File, workshopName: string): Promise<ParsedProduct[]> {
  const workbook = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet) throw new Error('The product spreadsheet does not contain a worksheet.')

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false })
  const products: ParsedProduct[] = []

  for (const [index, row] of rows.entries()) {
    const values = Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' '), value]),
    )
    const read = (...keys: string[]) => keys.map((key) => values[key]).find((value) => String(value ?? '').trim() !== '')
    const name = String(read('name', 'product name', 'display name') ?? '').trim().slice(0, 200)
    if (!name) {
      if (Object.values(values).every((value) => String(value ?? '').trim() === '')) continue
      throw new Error(`Row ${index + 2} needs a product name in the Name or Product Name column.`)
    }

    const quantityRaw = read('quantity', 'on hand quantity', 'qty on hand', 'available quantity', 'stock', 'qty available', 'available stock', 'quantity on hand')
    const quantityText = String(quantityRaw ?? '0').replace(/,/g, '').trim()
    const quantity = Number(quantityText)
    if (!Number.isSafeInteger(quantity) || quantity < 0) {
      throw new Error(`Row ${index + 2} needs a non-negative whole number in the Quantity or On Hand Quantity column.`)
    }

    const imageValue = String(read('image url', 'image', 'product image', 'image link') ?? '').trim()
    let imageUrl: string | null = null
    if (imageValue) {
      try {
        const url = new URL(imageValue)
        if (url.protocol !== 'https:') throw new Error()
        imageUrl = url.href
      } catch {
        throw new Error(`Row ${index + 2} has an image that must be a valid HTTPS URL.`)
      }
    }

    const priceRaw = String(read('price', 'sales price', 'list price', 'retail price') ?? '').trim()
    const price = priceRaw
      ? /^[\d,.]+$/.test(priceRaw) ? `EGP ${Number(priceRaw.replace(/,/g, '')).toLocaleString('en-US')}` : priceRaw.slice(0, 80)
      : null

    products.push({
      name,
      maker: String(read('manufacturer', 'maker', 'vendor', 'vendor name', 'seller', 'supplier') ?? workshopName).trim().slice(0, 160) || workshopName,
      category: normalizeCategory(read('category', 'product category', 'product category name', 'category name', 'product category/complete name')),
      price,
      quantity,
      imageUrl,
      description: String(read('description', 'sales description', 'product description') ?? '').trim().slice(0, 1000) || null,
    })
  }

  if (!products.length) throw new Error('No product rows were found in the first worksheet.')
  if (products.length > 2000) throw new Error('The spreadsheet can contain up to 2,000 products per request.')
  return products
}

function safeFilename(value: string) {
  const cleaned = value.replace(/[\\/\r\n\u0000-\u001f]/g, '-').replace(/[^\w.() -]/g, '_').trim().slice(0, 120)
  return cleaned || 'workshop-file'
}

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 })

  const uploadedPathnames: string[] = []

  try {
    const form = await request.formData()
    const companyName = textValue(form.get('companyName'), 160)
    const workshopSize = textValue(form.get('workshopSize'), 80)
    const governorate = textValue(form.get('governorate'), 100)
    const city = textValue(form.get('city'), 100)
    const address = textValue(form.get('address'), 800)

    if (!companyName || !workshopSize || !governorate || !city || !address) {
      return NextResponse.json({ error: 'Please complete all workshop details.' }, { status: 400 })
    }

    const files = form.getAll('productFiles').filter((entry): entry is File => entry instanceof File && entry.size > 0)
    if (files.length === 0 || files.length > MAX_FILES) {
      return NextResponse.json({ error: 'Attach one product spreadsheet and up to seven supporting files.' }, { status: 400 })
    }
    if (files.some((file) => file.size > MAX_FILE_SIZE)) {
      return NextResponse.json({ error: 'Each file must be 4 MB or smaller.' }, { status: 400 })
    }
    if (files.reduce((total, file) => total + file.size, 0) > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'The combined upload must be 4 MB or smaller.' }, { status: 400 })
    }

    const spreadsheetFiles = files.filter((file) => ['csv', 'xlsx', 'xls'].includes(file.name.split('.').pop()?.toLowerCase() ?? ''))
    if (spreadsheetFiles.length !== 1) {
      return NextResponse.json({ error: 'Attach exactly one CSV or Excel product spreadsheet.' }, { status: 400 })
    }
    for (const file of files) {
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (!extension || !contentTypeByExtension[extension]) {
        return NextResponse.json({ error: `The file “${safeFilename(file.name)}” has an unsupported type.` }, { status: 400 })
      }
    }

    const products = await parseSpreadsheet(spreadsheetFiles[0], companyName)
    const requestId = crypto.randomUUID()
    const attachments: Array<{ pathname: string; filename: string; contentType: string; sizeBytes: number }> = []

    for (const file of files) {
      const filename = safeFilename(file.name)
      const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
      const contentType = contentTypeByExtension[extension]
      const blob = await put(`workshop-submissions/${requestId}/${filename}`, file, {
        access: 'private',
        addRandomSuffix: true,
        contentType,
      })
      uploadedPathnames.push(blob.pathname)
      attachments.push({
        pathname: blob.pathname,
        filename,
        contentType,
        sizeBytes: file.size,
      })
    }

    await db.transaction(async (tx) => {
      await tx.insert(workshopRequests).values({
        id: requestId,
        companyName,
        workshopSize,
        governorate,
        city,
        address,
      })
      await tx.insert(marketplaceProducts).values(products.map((product) => ({ ...product, requestId })))
      await tx.insert(workshopRequestAttachments).values(attachments.map((attachment) => ({ ...attachment, requestId })))
    })

    return NextResponse.json({ id: requestId, productCount: products.length }, { status: 201 })
  } catch (error) {
    if (uploadedPathnames.length) {
      await del(uploadedPathnames).catch((cleanupError) => console.error('Could not clean up workshop uploads:', cleanupError))
    }
    if (error instanceof Error && /Row |spreadsheet|product rows|workbook|worksheet|products per request/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Workshop request submission failed:', error)
    return NextResponse.json({ error: 'We could not submit your request. Please try again.' }, { status: 500 })
  }
}
