import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'

// GET - List questions for a symptom
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAdmin(req)
    
    const symptomId = parseInt((await params).id)
    
    // Get symptom details
    const symptom = await prisma.symptom.findUnique({
      where: { id: symptomId }
    })
    
    if (!symptom) {
      return NextResponse.json(
        { error: 'Symptom not found' },
        { status: 404 }
      )
    }
    
    // Get questions with their options
    const questions = await prisma.question.findMany({
      where: { symptomId },
      include: {
        options: {
          orderBy: [{ order: 'asc' }, { id: 'asc' }]
        },
        parentQuestion: {
          select: { id: true, title: true }
        },
        childQuestions: {
          select: { id: true, title: true }
        }
      },
      orderBy: [{ order: 'asc' }, { id: 'asc' }]
    })

    return NextResponse.json({ symptom, questions })
  } catch (error) {
    console.error('Get questions error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new question
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('POST /api/admin/symptoms/[id]/questions called')
    requireAdmin(req)
    
    const symptomId = parseInt((await params).id)
    console.log('Symptom ID:', symptomId)
    
    const requestData = await req.json()
    console.log('Request data:', JSON.stringify(requestData, null, 2))
    
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
      options 
    } = requestData

    if (!title || !type) {
      console.log('Missing title or type')
      return NextResponse.json(
        { error: 'Title and type are required' },
        { status: 400 }
      )
    }

    // Create question
    console.log('Creating question with data:', {
      symptomId,
      title,
      description,
      type,
      isRequired: isRequired || false,
      isGeneral: isGeneral || false,
      isCC: isCC || false,
      hasTimeUnit: hasTimeUnit || false,
      order: order || 0,
      parentQuestionId: parentQuestionId || null,
      conditionalValues: conditionalValues ? JSON.stringify(conditionalValues) : null
    })
    
    const question = await prisma.question.create({
      data: {
        symptomId,
        title,
        description,
        type,
        isRequired: isRequired || false,
        isGeneral: isGeneral || false,
        isCC: isCC || false,
        hasTimeUnit: hasTimeUnit || false,
        order: order || 0,
        parentQuestionId: parentQuestionId || null,
        conditionalValues: conditionalValues ? JSON.stringify(conditionalValues) : null
      }
    })
    
    console.log('Question created:', question)

    // Create options if provided
    if (options && Array.isArray(options) && options.length > 0) {
      console.log('Creating options:', options)
      const optionsData = options.map((option: any, index: number) => ({
        questionId: question.id,
        label: option.label,
        value: option.value,
        order: option.order || index,
        hasInput: option.hasInput || false
      }))
      console.log('Options data:', optionsData)
      
      await prisma.questionOption.createMany({
        data: optionsData
      })
      console.log('Options created successfully')
    }

    // Return created question with options
    const createdQuestion = await prisma.question.findUnique({
      where: { id: question.id },
      include: {
        options: {
          orderBy: [{ order: 'asc' }, { id: 'asc' }]
        }
      }
    })

    return NextResponse.json({ question: createdQuestion }, { status: 201 })
  } catch (error) {
    console.error('Create question error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}