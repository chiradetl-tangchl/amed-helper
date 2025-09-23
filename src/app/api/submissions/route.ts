import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Submit user responses
export async function POST(req: NextRequest) {
  try {
    const { symptomId, answers, summaryText, timeUnits, otherTexts, optionInputs } = await req.json()

    if (!symptomId || !answers || !summaryText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create user submission
    const userSubmission = await prisma.userSubmission.create({
      data: {
        symptomId: parseInt(symptomId),
        summaryText,
        timeUnits: timeUnits ? JSON.stringify(timeUnits) : null
      }
    })

    // Create user answers
    const answerPromises = answers.map((answer: any) => {
      const optionInputKey = `${answer.questionId}-${answer.optionId}`
      return prisma.userAnswer.create({
        data: {
          userSubmissionId: userSubmission.id,
          questionId: answer.questionId,
          optionId: answer.optionId || null,
          textValue: answer.textValue || null,
          otherText: otherTexts && otherTexts[answer.questionId] ? otherTexts[answer.questionId] : null,
          optionInput: optionInputs && optionInputs[optionInputKey] ? optionInputs[optionInputKey] : null
        }
      })
    })

    await Promise.all(answerPromises)

    return NextResponse.json({ 
      submissionId: userSubmission.id,
      message: 'Submission saved successfully' 
    }, { status: 201 })
  } catch (error) {
    console.error('Submit answers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}