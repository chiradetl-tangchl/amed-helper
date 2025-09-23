import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'

// PUT - Update question
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, questionId: string }> }
) {
  try {
    requireAdmin(req)
    
    const questionId = parseInt((await params).questionId)
    const { 
      title, 
      description, 
      type, 
      isRequired, 
      isGeneral, 
      isCC,
      hasTimeUnit,
      order, 
      parentQuestionId, 
      conditionalValues,
      isActive,
      options 
    } = await req.json()

    // Update question
    const question = await prisma.question.update({
      where: { id: questionId },
      data: {
        title,
        description,
        type,
        isRequired,
        isGeneral,
        isCC,
        hasTimeUnit,
        order,
        parentQuestionId: parentQuestionId || null,
        conditionalValues: conditionalValues ? JSON.stringify(conditionalValues) : null,
        isActive
      }
    })

    // Update options if provided
    if (options && Array.isArray(options)) {
      // Delete existing options
      await prisma.questionOption.deleteMany({
        where: { questionId }
      })
      
      // Create new options
      if (options.length > 0) {
        await prisma.questionOption.createMany({
          data: options.map((option: { label: string; value: string; order?: number; hasInput?: boolean }, index: number) => ({
            questionId,
            label: option.label,
            value: option.value,
            order: option.order || index,
            hasInput: option.hasInput || false
          }))
        })
      }
    }

    // Return updated question with options
    const updatedQuestion = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        options: {
          orderBy: [{ order: 'asc' }, { id: 'asc' }]
        }
      }
    })

    return NextResponse.json({ question: updatedQuestion })
  } catch (error) {
    console.error('Update question error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete question
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, questionId: string }> }
) {
  try {
    requireAdmin(req)
    
    const questionId = parseInt((await params).questionId)

    await prisma.question.delete({
      where: { id: questionId }
    })

    return NextResponse.json({ message: 'Question deleted successfully' })
  } catch (error) {
    console.error('Delete question error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}