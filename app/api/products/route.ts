import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { marketplaceProducts } from '@/lib/db/schema'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const products = await db
      .select()
      .from(marketplaceProducts)
      .where(eq(marketplaceProducts.published, true))
      .orderBy(desc(marketplaceProducts.createdAt))

    return NextResponse.json(
      products.map((product) => ({
        id: product.id,
        name: product.name,
        maker: product.maker,
        category: product.category,
        price: product.price ?? undefined,
        image: product.imageUrl ?? '',
        color: 'bg-[#e8dfd3]',
        quantity: product.quantity,
        description: product.description ?? undefined,
      })),
      { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' } },
    )
  } catch (error) {
    console.error('Public products query failed:', error)
    return NextResponse.json({ error: 'Products are temporarily unavailable.' }, { status: 503 })
  }
}
