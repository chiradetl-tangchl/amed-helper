import { createDefaultAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function main() {
  console.log('Creating default admin...')
  await createDefaultAdmin()
  console.log('Default admin created successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })