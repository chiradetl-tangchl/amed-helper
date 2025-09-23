import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - List active symptoms for public use
export async function GET() {
  try {
    const symptoms = await prisma.symptom.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        order: true
      }
    })

    return NextResponse.json({ symptoms })
  } catch (error) {
    console.error('Get public symptoms error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}