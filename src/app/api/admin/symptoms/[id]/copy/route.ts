import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
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

    // Ensure sequences for questions and options are synced with max IDs to avoid duplication errors
    await prisma.$executeRaw(
      Prisma.sql`SELECT setval(pg_get_serial_sequence('"Question"', 'id'), COALESCE((SELECT MAX(id) FROM "Question"), 0))`
    )
    await prisma.$executeRaw(
      Prisma.sql`SELECT setval(pg_get_serial_sequence('"QuestionOption"', 'id'), COALESCE((SELECT MAX(id) FROM "QuestionOption"), 0))`
    )

    // Step 1: Create new symptom (without nested relations)
    const newSymptom = await prisma.symptom.create({
      data: {
        name: `${originalSymptom.name} (สำเนา)`,
        description: originalSymptom.description,
        isActive: false, // Start as inactive
        order: (await prisma.symptom.count()) + 1, // Put at the end
      }
    })

    // Step 2: Create questions (without parent relationships yet)
    const questionIdMapping: { [oldId: number]: number } = {}
    
    for (const originalQuestion of originalSymptom.questions) {
      const newQuestion = await prisma.question.create({
        data: {
          symptomId: newSymptom.id,
          title: originalQuestion.title,
          description: originalQuestion.description,
          type: originalQuestion.type,
          isRequired: originalQuestion.isRequired,
          isGeneral: originalQuestion.isGeneral,
          isCC: originalQuestion.isCC,
          hasTimeUnit: originalQuestion.hasTimeUnit,
          order: originalQuestion.order,
          parentQuestionId: null, // Will be updated later
          conditionalValues: originalQuestion.conditionalValues,
          isActive: originalQuestion.isActive
        }
      })
      
      questionIdMapping[originalQuestion.id] = newQuestion.id
      
      // Step 3: Create options for each question
      for (const originalOption of originalQuestion.options) {
        await prisma.questionOption.create({
          data: {
            questionId: newQuestion.id,
            label: originalOption.label,
            value: originalOption.value,
            hasInput: originalOption.hasInput,
            order: originalOption.order,
            isActive: originalOption.isActive
          }
        })
      }
    }

    // Step 4: Update parent question relationships
    for (const originalQuestion of originalSymptom.questions) {
      if (originalQuestion.parentQuestionId && questionIdMapping[originalQuestion.parentQuestionId]) {
        const newQuestionId = questionIdMapping[originalQuestion.id]
        const newParentQuestionId = questionIdMapping[originalQuestion.parentQuestionId]
        
        await prisma.question.update({
          where: { id: newQuestionId },
          data: {
            parentQuestionId: newParentQuestionId
          }
        })
      }
    }

    // Step 5: Create text templates
    for (const originalTemplate of originalSymptom.textTemplates) {
      const questionId = originalTemplate.questionId && questionIdMapping[originalTemplate.questionId] 
        ? questionIdMapping[originalTemplate.questionId] 
        : null

      await prisma.textTemplate.create({
        data: {
          symptomId: newSymptom.id,
          questionId: questionId,
          triggerValue: originalTemplate.triggerValue,
          template: originalTemplate.template,
          order: originalTemplate.order
        }
      })
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