import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'

// GET - Get single symptom
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAdmin(req)
    
    const resolvedParams = await params
    const symptom = await prisma.symptom.findUnique({
      where: { id: parseInt(resolvedParams.id) },
      include: {
        questions: {
          orderBy: [{ order: 'asc' }, { id: 'asc' }]
        },
        textTemplates: {
          orderBy: [{ order: 'asc' }, { id: 'asc' }]
        }
      }
    })

    if (!symptom) {
      return NextResponse.json(
        { error: 'Symptom not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ symptom })
  } catch (error) {
    console.error('Get symptom error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update symptom
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAdmin(req)
    
    const { name, description, order, isActive } = await req.json()
    const resolvedParams = await params

    const symptom = await prisma.symptom.update({
      where: { id: parseInt(resolvedParams.id) },
      data: {
        name,
        description,
        order,
        isActive
      }
    })

    return NextResponse.json({ symptom })
  } catch (error) {
    console.error('Update symptom error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete symptom
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAdmin(req)
    
    const resolvedParams = await params
    await prisma.symptom.delete({
      where: { id: parseInt(resolvedParams.id) }
    })

    return NextResponse.json({ message: 'Symptom deleted successfully' })
  } catch (error) {
    console.error('Delete symptom error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}