import { prisma } from '@/lib/prisma'

async function main() {
  console.log('Creating sample data...')

  // Create sample symptoms
  const symptom1 = await prisma.symptom.create({
    data: {
      name: 'ไข้ ไอ เจ็บคอ',
      description: 'อาการหวัดและโรคทางเดินหายใจส่วนบน',
      order: 1
    }
  })

  const symptom2 = await prisma.symptom.create({
    data: {
      name: 'ปวดหัว',
      description: 'อาการปวดศีรษะและไมเกรน',
      order: 2
    }
  })

  console.log('Created symptoms:', symptom1.name, symptom2.name)

  // Create questions for "ไข้ ไอ เจ็บคอ"
  const q1 = await prisma.question.create({
    data: {
      symptomId: symptom1.id,
      title: 'มีไข้หรือไม่',
      description: 'ระบุว่ามีอาการไข้หรือไม่',
      type: 'radio',
      isRequired: true,
      order: 1
    }
  })

  await prisma.questionOption.createMany({
    data: [
      { questionId: q1.id, label: 'มีไข้', value: 'has_fever', order: 1 },
      { questionId: q1.id, label: 'ไม่มีไข้', value: 'no_fever', order: 2 }
    ]
  })

  const q2 = await prisma.question.create({
    data: {
      symptomId: symptom1.id,
      title: 'ระดับไข้',
      description: 'ระบุระดับความรุนแรงของไข้',
      type: 'radio',
      isRequired: true,
      order: 2,
      parentQuestionId: q1.id,
      conditionalValues: JSON.stringify(['has_fever'])
    }
  })

  await prisma.questionOption.createMany({
    data: [
      { questionId: q2.id, label: 'ไข้ต่ำ (< 38°C)', value: 'low_fever', order: 1 },
      { questionId: q2.id, label: 'ไข้สูง (≥ 38°C)', value: 'high_fever', order: 2 }
    ]
  })

  const q3 = await prisma.question.create({
    data: {
      symptomId: symptom1.id,
      title: 'ลักษณะการไอ',
      description: 'เลือกลักษณะการไอที่มี',
      type: 'radio',
      isRequired: false,
      order: 3
    }
  })

  await prisma.questionOption.createMany({
    data: [
      { questionId: q3.id, label: 'ไอแห้ง', value: 'dry_cough', order: 1 },
      { questionId: q3.id, label: 'ไอมีเสมหะ', value: 'wet_cough', order: 2 },
      { questionId: q3.id, label: 'ไม่ไอ', value: 'no_cough', order: 3 }
    ]
  })

  const q4 = await prisma.question.create({
    data: {
      symptomId: symptom1.id,
      title: 'ระยะเวลาที่มีอาการ',
      description: 'ระบุจำนวนวันที่มีอาการ',
      type: 'number',
      isRequired: true,
      order: 4
    }
  })

  // General question
  const q5 = await prisma.question.create({
    data: {
      symptomId: symptom1.id,
      title: 'ประวัติแพ้ยา',
      description: 'มีประวัติแพ้ยาหรือไม่',
      type: 'radio',
      isRequired: true,
      isGeneral: true,
      order: 5
    }
  })

  await prisma.questionOption.createMany({
    data: [
      { questionId: q5.id, label: 'มีประวัติแพ้ยา', value: 'has_allergy', order: 1 },
      { questionId: q5.id, label: 'ไม่มีประวัติแพ้ยา', value: 'no_allergy', order: 2 }
    ]
  })

  const q6 = await prisma.question.create({
    data: {
      symptomId: symptom1.id,
      title: 'ชื่อยาที่แพ้',
      description: 'ระบุชื่อยาที่แพ้',
      type: 'text',
      isRequired: true,
      isGeneral: true,
      order: 6,
      parentQuestionId: q5.id,
      conditionalValues: JSON.stringify(['has_allergy'])
    }
  })

  console.log('Created questions for symptom 1')

  // Create text templates
  await prisma.textTemplate.createMany({
    data: [
      {
        symptomId: symptom1.id,
        questionId: q1.id,
        triggerValue: 'has_fever',
        template: 'มีไข้',
        order: 1
      },
      {
        symptomId: symptom1.id,
        questionId: q1.id,
        triggerValue: 'no_fever',
        template: 'ไม่มีไข้',
        order: 2
      },
      {
        symptomId: symptom1.id,
        questionId: q2.id,
        triggerValue: 'high_fever',
        template: 'ไข้สูง',
        order: 3
      },
      {
        symptomId: symptom1.id,
        questionId: q3.id,
        triggerValue: 'dry_cough',
        template: 'ไอแห้ง',
        order: 4
      },
      {
        symptomId: symptom1.id,
        questionId: q3.id,
        triggerValue: 'wet_cough',
        template: 'ไอมีเสมหะ',
        order: 5
      },
      {
        symptomId: symptom1.id,
        questionId: q4.id,
        triggerValue: null,
        template: 'มีอาการมา {value} วัน',
        order: 6
      },
      {
        symptomId: symptom1.id,
        questionId: q5.id,
        triggerValue: 'has_allergy',
        template: 'มีประวัติแพ้ยา {value}',
        order: 7
      },
      {
        symptomId: symptom1.id,
        questionId: q5.id,
        triggerValue: 'no_allergy',
        template: 'ไม่มีประวัติแพ้ยา',
        order: 8
      }
    ]
  })

  console.log('Created text templates')

  // Create simple questions for symptom 2 (ปวดหัว)
  const q7 = await prisma.question.create({
    data: {
      symptomId: symptom2.id,
      title: 'ความรุนแรงของอาการปวดหัว',
      description: 'ระบุระดับความรุนแรง',
      type: 'radio',
      isRequired: true,
      order: 1
    }
  })

  await prisma.questionOption.createMany({
    data: [
      { questionId: q7.id, label: 'ปวดเล็กน้อย', value: 'mild', order: 1 },
      { questionId: q7.id, label: 'ปวดปานกลาง', value: 'moderate', order: 2 },
      { questionId: q7.id, label: 'ปวดรุนแรง', value: 'severe', order: 3 }
    ]
  })

  // Add general allergy question to symptom 2 as well
  const q8 = await prisma.question.create({
    data: {
      symptomId: symptom2.id,
      title: 'ประวัติแพ้ยา',
      description: 'มีประวัติแพ้ยาหรือไม่',
      type: 'radio',
      isRequired: true,
      isGeneral: true,
      order: 2
    }
  })

  await prisma.questionOption.createMany({
    data: [
      { questionId: q8.id, label: 'มีประวัติแพ้ยา', value: 'has_allergy', order: 1 },
      { questionId: q8.id, label: 'ไม่มีประวัติแพ้ยา', value: 'no_allergy', order: 2 }
    ]
  })

  // Create templates for symptom 2
  await prisma.textTemplate.createMany({
    data: [
      {
        symptomId: symptom2.id,
        questionId: q7.id,
        triggerValue: 'mild',
        template: 'ปวดหัวเล็กน้อย',
        order: 1
      },
      {
        symptomId: symptom2.id,
        questionId: q7.id,
        triggerValue: 'moderate',
        template: 'ปวดหัวปานกลาง',
        order: 2
      },
      {
        symptomId: symptom2.id,
        questionId: q7.id,
        triggerValue: 'severe',
        template: 'ปวดหัวรุนแรง',
        order: 3
      },
      {
        symptomId: symptom2.id,
        questionId: q8.id,
        triggerValue: 'has_allergy',
        template: 'มีประวัติแพ้ยา',
        order: 4
      },
      {
        symptomId: symptom2.id,
        questionId: q8.id,
        triggerValue: 'no_allergy',
        template: 'ไม่มีประวัติแพ้ยา',
        order: 5
      }
    ]
  })

  console.log('Sample data created successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })