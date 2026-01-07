
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        // Call Supabase REST API directly to get OpenAPI schema
        const response = await fetch('https://tansqtlmfhsgkhsiqbyf.supabase.co/rest/v1/', {
            headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                'Accept': 'application/openapi+json'
            }
        })

        const schema = await response.json()

        // Extract products_cache definition
        const productsCache = schema.definitions?.products_cache

        return NextResponse.json({
            productsCache,
            allDefinitions: Object.keys(schema.definitions || {})
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
