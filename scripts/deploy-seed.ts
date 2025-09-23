import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'ผู้ดูแลระบบ'
    }
  })

  console.log('✅ Admin user created:', admin.username)

  // You can add sample symptoms here if needed
  const sampleSymptom = await prisma.symptom.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'ไข้',
      description: 'อาการไข้และอาการที่เกี่ยวข้อง',
      order: 1,
      isActive: true
    }
  })

  console.log('✅ Sample symptom created:', sampleSymptom.name)
  console.log('🎉 Database seeding completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })