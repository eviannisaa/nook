import { NextResponse } from 'next/server'
import { db } from '../../../db'
import { messages } from '../../../db/schema'
import { asc } from 'drizzle-orm'

export async function GET() {
  try {
    const data = await db.select().from(messages).orderBy(asc(messages.id))
    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { role, text } = body

    if (!role || !text) {
      return NextResponse.json({ error: 'Role and text are required' }, { status: 400 })
    }

    const inserted = await db
      .insert(messages)
      .values({ role, text })
      .returning()

    return NextResponse.json({ data: inserted[0] })
  } catch (error: any) {
    console.error('Error saving message:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
