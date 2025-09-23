import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Find the time unit question
    const question = await prisma.question.findFirst({
      where: { 
        title: 'เป็นมานานเท่าไหร่?',
        hasTimeUnit: true
      }
    })

    if (!question) {
      console.log('Question not found')
      return
    }

    console.log('Found question:', question.title)

    // Delete old template
    await prisma.textTemplate.deleteMany({
      where: {
        questionId: question.id
      }
    })

    // Create new template that triggers on any value (no specific trigger)
    const template = await prisma.textTemplate.create({
      data: {
        symptomId: question.symptomId,
        questionId: question.id,
        triggerValue: '', // Empty string means any value
        template: 'เป็นมา {value}',
        order: 10,
        isActive: true
      }
    })

    console.log('Created new template:', template.template)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()