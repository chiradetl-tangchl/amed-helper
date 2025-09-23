import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Update the question to be isGeneral = true so it shows up
    const question = await prisma.question.updateMany({
      where: { 
        title: 'เป็นมานานเท่าไหร่?',
        hasTimeUnit: true
      },
      data: {
        isGeneral: true // Make it general so it shows
      }
    })

    console.log('Updated question to be general:', question.count)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()