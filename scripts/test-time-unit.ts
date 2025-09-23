import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Find existing symptom (ID = 3 from previous data)
    const symptom = await prisma.symptom.findFirst({
      where: { id: 3 }
    })

    if (!symptom) {
      console.log('Symptom not found')
      return
    }

    console.log('Found symptom:', symptom.name)

    // Create a number question with time unit
    const question = await prisma.question.create({
      data: {
        symptomId: symptom.id,
        title: 'เป็นมานานเท่าไหร่?',
        description: 'ระบุระยะเวลาที่มีอาการ',
        type: 'number',
        isRequired: true,
        isGeneral: false,
        isCC: true, // This is CC question
        hasTimeUnit: true, // Enable time unit
        order: 100
      }
    })

    console.log('Created question with time unit:', question.title)

    // Create template for this question
    const template = await prisma.textTemplate.create({
      data: {
        symptomId: symptom.id,
        questionId: question.id,
        triggerValue: null, // No specific trigger, show for any value
        template: 'เป็นมา {value}',
        order: 10,
        isActive: true
      }
    })

    console.log('Created template:', template.template)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()