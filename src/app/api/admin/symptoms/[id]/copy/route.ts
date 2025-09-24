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
      // Create new question data without id and relations (let Prisma auto-generate)
      const { id, createdAt, updatedAt, symptomId, parentQuestionId, options, ...questionData } = originalQuestion
      
      const newQuestion = await prisma.question.create({
        data: {
          ...questionData,
          symptomId: newSymptom.id,
          parentQuestionId: null, // Will be updated later
        }
      })
      
      questionIdMapping[originalQuestion.id] = newQuestion.id
      
      // Step 3: Create options for each question
      for (const originalOption of originalQuestion.options) {
        // Create new option data without id field (let Prisma auto-generate)
        const { id, questionId, ...optionData } = originalOption
        
        await prisma.questionOption.create({
          data: {
            ...optionData,
            questionId: newQuestion.id,
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