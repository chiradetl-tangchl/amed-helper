// Firebase Data Structure Example
// collections/symptoms/{symptomId}
{
  id: "symptom1",
  name: "ปวดหัว",
  description: "อาการปวดหัว",
  isActive: true,
  order: 1,
  createdAt: timestamp,
  questions: [
    {
      id: "q1",
      title: "มีไข้หรือไม่",
      type: "radio",
      isRequired: true,
      options: [
        { label: "มีไข้", value: "fever" },
        { label: "ไม่มีไข้", value: "no_fever" }
      ]
    }
  ]
}

// collections/submissions/{submissionId}
{
  id: "sub1",
  symptomId: "symptom1",
  answers: [
    {
      questionId: "q1",
      value: "fever",
      textValue: null
    }
  ],
  summaryText: "ผู้ป่วยมีไข้",
  createdAt: timestamp
}