import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'

// GET - List all symptoms
export async function GET(req: NextRequest) {
  try {
    requireAdmin(req)
    
    const symptoms = await prisma.symptom.findMany({
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
      include: {
        _count: {
          select: {
            questions: true,
            textTemplates: true,
            userSubmissions: true
          }
        }
      }
    })

    return NextResponse.json({ symptoms })
  } catch (error) {
    console.error('Get symptoms error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new symptom
export async function POST(req: NextRequest) {
  try {
    requireAdmin(req)
    
    const { name, description, order = 0 } = await req.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const symptom = await prisma.symptom.create({
      data: {
        name,
        description,
        order
      }
    })

    return NextResponse.json({ symptom }, { status: 201 })
  } catch (error) {
    console.error('Create symptom error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}