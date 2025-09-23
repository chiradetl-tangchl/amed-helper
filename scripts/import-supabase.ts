// Import data to Supabase from Railway export
import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function importData() {
  try {
    console.log('📥 Importing data to Supabase Singapore...')
    
    // Read exported data
    const exportData = JSON.parse(fs.readFileSync('railway-export.json', 'utf8'))
    
    console.log(`📊 Found data:`)
    console.log(`   - ${exportData.admins?.length || 0} admins`)
    console.log(`   - ${exportData.symptoms?.length || 0} symptoms`)
    console.log(`   - ${exportData.submissions?.length || 0} submissions`)
    
    // Import admins
    if (exportData.admins?.length > 0) {
      for (const admin of exportData.admins) {
        await prisma.admin.upsert({
          where: { username: admin.username },
          update: {
            password: admin.password,
            name: admin.name
          },
          create: {
            username: admin.username,
            password: admin.password,
            name: admin.name
          }
        })
      }
      console.log('✅ Admins imported')
    }
    
    // Import symptoms with questions and options
    if (exportData.symptoms?.length > 0) {
      for (const symptom of exportData.symptoms) {
        const createdSymptom = await prisma.symptom.upsert({
          where: { id: symptom.id },
          update: {
            name: symptom.name,
            description: symptom.description,
            isActive: symptom.isActive,
            order: symptom.order
          },
          create: {
            id: symptom.id,
            name: symptom.name,
            description: symptom.description,
            isActive: symptom.isActive,
            order: symptom.order
          }
        })
        
        // Import questions (parent questions first)
        if (symptom.questions?.length > 0) {
          // Sort questions: parent questions first, then child questions
          const sortedQuestions = [...symptom.questions].sort((a, b) => {
            if (!a.parentQuestionId && b.parentQuestionId) return -1
            if (a.parentQuestionId && !b.parentQuestionId) return 1
            return a.order - b.order
          })
          
          for (const question of sortedQuestions) {
            const createdQuestion = await prisma.question.upsert({
              where: { id: question.id },
              update: {
                title: question.title,
                description: question.description,
                type: question.type,
                isRequired: question.isRequired,
                isGeneral: question.isGeneral,
                isCC: question.isCC,
                hasTimeUnit: question.hasTimeUnit,
                parentQuestionId: question.parentQuestionId,
                conditionalValues: question.conditionalValues,
                order: question.order
              },
              create: {
                id: question.id,
                symptomId: createdSymptom.id,
                title: question.title,
                description: question.description,
                type: question.type,
                isRequired: question.isRequired,
                isGeneral: question.isGeneral,
                isCC: question.isCC,
                hasTimeUnit: question.hasTimeUnit,
                parentQuestionId: question.parentQuestionId,
                conditionalValues: question.conditionalValues,
                order: question.order
              }
            })
            
            // Import options
            if (question.options?.length > 0) {
              for (const option of question.options) {
                await prisma.questionOption.upsert({
                  where: { id: option.id },
                  update: {
                    label: option.label,
                    value: option.value,
                    hasInput: option.hasInput,
                    order: option.order,
                    isActive: option.isActive
                  },
                  create: {
                    id: option.id,
                    questionId: createdQuestion.id,
                    label: option.label,
                    value: option.value,
                    hasInput: option.hasInput,
                    order: option.order,
                    isActive: option.isActive
                  }
                })
              }
            }
          }
        }
        
        // Import text templates
        if (symptom.textTemplates?.length > 0) {
          for (const template of symptom.textTemplates) {
            await prisma.textTemplate.upsert({
              where: { id: template.id },
              update: {
                questionId: template.questionId,
                triggerValue: template.triggerValue,
                template: template.template,
                order: template.order
              },
              create: {
                id: template.id,
                symptomId: createdSymptom.id,
                questionId: template.questionId,
                triggerValue: template.triggerValue,
                template: template.template,
                order: template.order
              }
            })
          }
        }
      }
      console.log('✅ Symptoms, questions, options, and templates imported')
    }
    
    // Import submissions (if any)
    if (exportData.submissions?.length > 0) {
      for (const submission of exportData.submissions) {
        const createdSubmission = await prisma.userSubmission.upsert({
          where: { id: submission.id },
          update: {
            summaryText: submission.summaryText,
            timeUnits: submission.timeUnits
          },
          create: {
            id: submission.id,
            symptomId: submission.symptomId,
            summaryText: submission.summaryText,
            timeUnits: submission.timeUnits
          }
        })
        
        // Import answers
        if (submission.userAnswers?.length > 0) {
          for (const answer of submission.userAnswers) {
            await prisma.userAnswer.upsert({
              where: { 
                userSubmissionId_questionId_optionId: {
                  userSubmissionId: createdSubmission.id,
                  questionId: answer.questionId,
                  optionId: answer.optionId
                }
              },
              update: {
                textValue: answer.textValue,
                otherText: answer.otherText,
                optionInput: answer.optionInput
              },
              create: {
                userSubmissionId: createdSubmission.id,
                questionId: answer.questionId,
                optionId: answer.optionId,
                textValue: answer.textValue,
                otherText: answer.otherText,
                optionInput: answer.optionInput
              }
            })
          }
        }
      }
      console.log('✅ Submissions and answers imported')
    }
    
    console.log('🎉 Migration completed successfully!')
    console.log('🇸🇬 Data is now in Supabase Singapore!')
    
  } catch (error) {
    console.error('❌ Import failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

importData()