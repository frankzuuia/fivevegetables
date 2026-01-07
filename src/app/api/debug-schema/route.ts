
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    const supabase = await createClient()

    // Get one row to see all column names
    const { data, error } = await supabase
        .from('products_cache')
        .select('*')
        .limit(1)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const columns = data && data.length > 0 ? Object.keys(data[0]) : []

    return NextResponse.json({
        columns,
        sampleRow: data?.[0]
    })
}
