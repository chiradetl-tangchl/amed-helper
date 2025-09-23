// Export data from Railway database
import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function exportData() {
  try {
    console.log('🚛 Exporting data from Railway...')
    
    // Export all data
    const admins = await prisma.admin.findMany()
    const symptoms = await prisma.symptom.findMany({
      include: {
        questions: {
          include: {
            options: true
          }
        },
        textTemplates: true
      }
    })
    const submissions = await prisma.userSubmission.findMany({
      include: {
        userAnswers: {
          include: {
            option: true,
            question: true
          }
        }
      }
    })

    const exportData = {
      admins,
      symptoms,
      submissions,
      exportDate: new Date().toISOString()
    }

    // Save to file
    fs.writeFileSync('railway-export.json', JSON.stringify(exportData, null, 2))
    
    console.log('✅ Data exported to railway-export.json')
    console.log(`📊 Exported:`)
    console.log(`   - ${admins.length} admins`)
    console.log(`   - ${symptoms.length} symptoms`)
    console.log(`   - ${submissions.length} submissions`)
    
  } catch (error) {
    console.error('❌ Export failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

exportData()