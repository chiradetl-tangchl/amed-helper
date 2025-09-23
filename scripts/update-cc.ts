import { prisma } from '@/lib/prisma'

async function main() {
  console.log('Updating questions to add CC flag...')

  // Update question "ลักษณะการไอ" to be CC
  await prisma.question.updateMany({
    where: { 
      title: 'ลักษณะการไอ'
    },
    data: { 
      isCC: true 
    }
  })

  // Update question "มีไข้หรือไม่" to be CC
  await prisma.question.updateMany({
    where: { 
      title: 'มีไข้หรือไม่'
    },
    data: { 
      isCC: true 
    }
  })

  console.log('Updated questions with CC flag successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })