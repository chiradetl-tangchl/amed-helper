import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const symptomId = parseInt(id)

    // Get the original symptom with all related data
    const originalSymptom = await prisma.symptom.findUnique({
      where: { id: symptomId },
      include: {
        questions: {
          include: {
            options: true
          },
          orderBy: { order: 'asc' }
        },
        textTemplates: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!originalSymptom) {
      return NextResponse.json({ error: 'Symptom not found' }, { status: 404 })
    }

    // Create new symptom (copy)
    const newSymptom = await prisma.symptom.create({
      data: {
        name: `${originalSymptom.name} (สำเนา)`,
        description: originalSymptom.description,
        isActive: false, // Start as inactive
        order: (await prisma.symptom.count()) + 1, // Put at the end
        questions: {
          create: originalSymptom.questions.map(question => ({
            title: question.title,
            description: question.description,
            type: question.type,
            isRequired: question.isRequired,
            isGeneral: question.isGeneral,
            isCC: question.isCC,
            hasTimeUnit: question.hasTimeUnit,
            parentQuestionId: null, // Will be updated later for conditional questions
            conditionalValues: question.conditionalValues,
            order: question.order,
            options: {
              create: question.options.map(option => ({
                label: option.label,
                value: option.value,
                hasInput: option.hasInput,
                order: option.order,
                isActive: option.isActive
              }))
            }
          }))
        },
        textTemplates: {
          create: originalSymptom.textTemplates.map(template => ({
            questionId: null, // Will be updated later
            triggerValue: template.triggerValue,
            template: template.template,
            order: template.order
          }))
        }
      },
      include: {
        questions: {
          include: {
            options: true
          }
        },
        textTemplates: true
      }
    })

    // Now update parent question relationships and template question references
    const questionIdMapping: { [oldId: number]: number } = {}
    
    // Create mapping of old question IDs to new question IDs
    originalSymptom.questions.forEach((originalQuestion, index) => {
      questionIdMapping[originalQuestion.id] = newSymptom.questions[index].id
    })

    // Update parent question relationships for conditional questions
    for (let i = 0; i < originalSymptom.questions.length; i++) {
      const originalQuestion = originalSymptom.questions[i]
      const newQuestion = newSymptom.questions[i]
      
      if (originalQuestion.parentQuestionId && questionIdMapping[originalQuestion.parentQuestionId]) {
        await prisma.question.update({
          where: { id: newQuestion.id },
          data: {
            parentQuestionId: questionIdMapping[originalQuestion.parentQuestionId]
          }
        })
      }
    }

    // Update text template question references
    for (let i = 0; i < originalSymptom.textTemplates.length; i++) {
      const originalTemplate = originalSymptom.textTemplates[i]
      const newTemplate = newSymptom.textTemplates[i]
      
      if (originalTemplate.questionId && questionIdMapping[originalTemplate.questionId]) {
        await prisma.textTemplate.update({
          where: { id: newTemplate.id },
          data: {
            questionId: questionIdMapping[originalTemplate.questionId]
          }
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      symptom: newSymptom,
      message: 'Symptom copied successfully' 
    })

  } catch (error) {
    console.error('Copy symptom error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}