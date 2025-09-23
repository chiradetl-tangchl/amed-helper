import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get symptom with questions for public use
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const symptomId = parseInt((await params).id)
    
    const symptom = await prisma.symptom.findUnique({
      where: { 
        id: symptomId,
        isActive: true 
      },
      include: {
        questions: {
          where: { isActive: true },
          include: {
            options: {
              where: { isActive: true },
              orderBy: [{ order: 'asc' }, { id: 'asc' }]
            },
            parentQuestion: {
              select: { id: true, title: true }
            }
          },
          orderBy: [{ order: 'asc' }, { id: 'asc' }]
        },
        textTemplates: {
          where: { isActive: true },
          include: {
            question: {
              select: { id: true, title: true }
            }
          },
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
    console.error('Get public symptom error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}