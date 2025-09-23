import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'

// GET - List templates for a symptom
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAdmin(req)
    
    const symptomId = parseInt((await params).id)
    
    // Get symptom details
    const symptom = await prisma.symptom.findUnique({
      where: { id: symptomId },
      include: {
        questions: {
          select: { id: true, title: true, type: true },
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
    
    // Get templates
    const templates = await prisma.textTemplate.findMany({
      where: { symptomId },
      include: {
        question: {
          select: { id: true, title: true, type: true }
        }
      },
      orderBy: [{ order: 'asc' }, { id: 'asc' }]
    })

    return NextResponse.json({ symptom, templates })
  } catch (error) {
    console.error('Get templates error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new template
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAdmin(req)
    
    const symptomId = parseInt((await params).id)
    const { 
      questionId, 
      triggerValue, 
      template,
      order 
    } = await req.json()

    if (!template) {
      return NextResponse.json(
        { error: 'Template is required' },
        { status: 400 }
      )
    }

    const textTemplate = await prisma.textTemplate.create({
      data: {
        symptomId,
        questionId: questionId || null,
        triggerValue,
        template,
        order: order || 0
      }
    })

    // Return created template with question details
    const createdTemplate = await prisma.textTemplate.findUnique({
      where: { id: textTemplate.id },
      include: {
        question: {
          select: { id: true, title: true, type: true }
        }
      }
    })

    return NextResponse.json({ template: createdTemplate }, { status: 201 })
  } catch (error) {
    console.error('Create template error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}