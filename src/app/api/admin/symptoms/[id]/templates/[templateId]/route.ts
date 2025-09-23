import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'

// PUT - Update template
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, templateId: string }> }
) {
  try {
    requireAdmin(req)
    
    const resolvedParams = await params
    const templateId = parseInt(resolvedParams.templateId)
    const { 
      questionId, 
      triggerValue, 
      template,
      order,
      isActive
    } = await req.json()

    const updatedTemplate = await prisma.textTemplate.update({
      where: { id: templateId },
      data: {
        questionId: questionId || null,
        triggerValue,
        template,
        order,
        isActive
      }
    })

    // Return updated template with question details
    const templateWithQuestion = await prisma.textTemplate.findUnique({
      where: { id: templateId },
      include: {
        question: {
          select: { id: true, title: true, type: true }
        }
      }
    })

    return NextResponse.json({ template: templateWithQuestion })
  } catch (error) {
    console.error('Update template error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete template
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, templateId: string }> }
) {
  try {
    requireAdmin(req)
    
    const resolvedParams = await params
    const templateId = parseInt(resolvedParams.templateId)

    await prisma.textTemplate.delete({
      where: { id: templateId }
    })

    return NextResponse.json({ message: 'Template deleted successfully' })
  } catch (error) {
    console.error('Delete template error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}