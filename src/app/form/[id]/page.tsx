/* eslint-disable */
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, 
  Save, 
  Copy, 
  FileText,
  AlertCircle,
  CheckCircle,
  Eye,
  Stethoscope,
  MessageSquare,
  Clock
} from 'lucide-react'
import Swal from 'sweetalert2'

interface QuestionOption {
  id: number
  label: string
  value: string
  order: number
  hasInput?: boolean
}

interface Question {
  id: number
  title: string
  description: string | null
  type: string
  isRequired: boolean
  isGeneral: boolean
  isCC: boolean
  hasTimeUnit: boolean
  order: number
  parentQuestionId: number | null
  conditionalValues: string | null
  options: QuestionOption[]
  parentQuestion?: {
    id: number
    title: string
  } | null
}

interface TextTemplate {
  id: number
  questionId: number | null
  triggerValue: string | null
  template: string
  order: number
  question?: {
    id: number
    title: string
  } | null
}

interface Symptom {
  id: number
  name: string
  description: string | null
  questions: Question[]
  textTemplates: TextTemplate[]
}

interface UserAnswer {
  questionId: number
  optionId?: number
  textValue?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any
}

export default function DynamicFormPage({ params }: { params: Promise<{ id: string }> }) {
  const [symptom, setSymptom] = useState<Symptom | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [answers, setAnswers] = useState<Record<number, UserAnswer>>({})
  const [otherTexts, setOtherTexts] = useState<Record<number, string>>({}) // For "other" option additional text
  const [optionInputs, setOptionInputs] = useState<Record<string, string>>({}) // For option-specific inputs (questionId-optionId)
  const [timeUnits, setTimeUnits] = useState<Record<number, string>>({})
  const [visibleQuestions, setVisibleQuestions] = useState<Set<number>>(new Set())
  const [summaryText, setSummaryText] = useState('')
  const router = useRouter()
  const [symptomId, setSymptomId] = useState<number | null>(null)

  useEffect(() => {
    params.then((resolvedParams) => {
      setSymptomId(parseInt(resolvedParams.id))
    })
  }, [params])

  useEffect(() => {
    if (symptomId) {
      fetchSymptomData()
    }
  }, [symptomId])

  useEffect(() => {
    updateVisibleQuestions()
  }, [answers, symptom])

  useEffect(() => {
    generateSummary()
  }, [answers, symptom, timeUnits, otherTexts, optionInputs])

  const fetchSymptomData = async () => {
    if (!symptomId) return
    
    try {
      const response = await fetch(`/api/symptoms/${symptomId}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched symptom data:', data.symptom)
        console.log('Questions:', data.symptom.questions.map((q: Question) => ({ 
          id: q.id, 
          title: q.title, 
          type: q.type, 
          hasTimeUnit: q.hasTimeUnit,
          isGeneral: q.isGeneral,
          parentQuestionId: q.parentQuestionId
        })))
        setSymptom(data.symptom)
        
        // Initialize visible questions (show root questions and general questions)
        const rootQuestions = data.symptom.questions.filter((q: Question) => 
          !q.parentQuestionId || q.isGeneral
        )
        setVisibleQuestions(new Set(rootQuestions.map((q: Question) => q.id)))
      } else if (response.status === 404) {
        Swal.fire('ไม่พบข้อมูล', 'ไม่พบอาการที่ระบุ', 'error')
        router.push('/form')
      }
    } catch (error) {
      console.error('Fetch symptom error:', error)
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลได้', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const updateVisibleQuestions = useCallback(() => {
    if (!symptom) return

    const newVisibleQuestions = new Set<number>()
    
    // Always show root questions and general questions
    symptom.questions.forEach(question => {
      if (!question.parentQuestionId || question.isGeneral) {
        newVisibleQuestions.add(question.id)
      }
    })

    // Check conditional questions
    symptom.questions.forEach(question => {
      if (question.parentQuestionId && question.conditionalValues) {
        const parentAnswer = answers[question.parentQuestionId]
        if (parentAnswer) {
          const conditionalValues = JSON.parse(question.conditionalValues)
          let shouldShow = false
          
          // Handle different question types
          if (Array.isArray(parentAnswer.value)) {
            // For checkbox (multiple values) - need to convert option IDs to values
            const parentQuestion = symptom.questions.find(q => q.id === question.parentQuestionId)
            if (parentQuestion) {
              shouldShow = parentAnswer.value.some(optionId => {
                const selectedOption = parentQuestion.options?.find(opt => opt.id === optionId)
                if (selectedOption) {
                  // Compare option.value only (like radio does)
                  return conditionalValues.includes(selectedOption.value)
                }
                return false
              })
            }
          } else {
            // For radio, select, text (single value) - works as before
            shouldShow = conditionalValues.includes(parentAnswer.value)
          }
          
          if (shouldShow) {
            newVisibleQuestions.add(question.id)
          }
        }
      }
    })

    // Clean up answers for hidden questions
    setAnswers(prevAnswers => {
      const cleanedAnswers = { ...prevAnswers }
      
      Object.keys(cleanedAnswers).forEach(questionIdStr => {
        const questionId = parseInt(questionIdStr)
        if (!newVisibleQuestions.has(questionId)) {
          // Remove answer for hidden question
          delete cleanedAnswers[questionId]
          
          // Also clean up related UI state
          setOtherTexts(prev => {
            const newOtherTexts = { ...prev }
            delete newOtherTexts[questionId]
            return newOtherTexts
          })
          
          setTimeUnits(prev => {
            const newTimeUnits = { ...prev }
            delete newTimeUnits[questionId]
            return newTimeUnits
          })
          
          // Clean up option inputs for this question
          setOptionInputs(prev => {
            const newOptionInputs = { ...prev }
            Object.keys(newOptionInputs).forEach(key => {
              if (key.startsWith(`${questionId}-`)) {
                delete newOptionInputs[key]
              }
            })
            return newOptionInputs
          })
        }
      })
      
      return cleanedAnswers
    })

    setVisibleQuestions(newVisibleQuestions)
  }, [answers, symptom])

  const generateSummary = useCallback(() => {
    if (!symptom || !symptom.textTemplates) {
      setSummaryText('')
      return
    }

    const ccParts: string[] = []
    const otherParts: string[] = []

    // Process templates in order
    symptom.textTemplates
      .sort((a, b) => a.order - b.order)
      .forEach(template => {
        let shouldInclude = false
        let templateText = template.template

        if (template.questionId && template.triggerValue) {
          // Template is triggered by specific question value
          const answer = answers[template.questionId]
          if (answer && answer.value === template.triggerValue) {
            shouldInclude = true
            
            // Replace placeholders with actual values
            templateText = templateText.replace(/\{([^}]+)\}/g, (match, placeholder) => {
              if (placeholder === 'value') {
                const relatedQuestion = symptom.questions?.find(q => q.id === template.questionId)
                let valueText = answer.textValue || answer.value || ''
                
                // Add time unit if question has time unit and it's selected
                if (relatedQuestion?.hasTimeUnit && relatedQuestion.type === 'number' && timeUnits[template.questionId]) {
                  const timeUnitMap: Record<string, string> = {
                    'minutes': 'นาที',
                    'hours': 'ชั่วโมง', 
                    'days': 'วัน',
                    'weeks': 'สัปดาห์',
                    'months': 'เดือน'
                  }
                  const unitText = timeUnitMap[timeUnits[template.questionId]] || timeUnits[template.questionId]
                  valueText += ` ${unitText}`
                }
                
                return valueText
              } else if (placeholder === 'label') {
                // For radio/select questions, find the option label
                const relatedQuestion = symptom.questions?.find(q => q.id === template.questionId)
                if (relatedQuestion) {
                  // Handle checkbox (multiple selections)
                  if (relatedQuestion.type === 'checkbox' && Array.isArray(answer.value)) {
                    const selectedOptions = relatedQuestion.options?.filter(opt => 
                      answer.value.includes(opt.id)
                    ) || []
                    
                    if (selectedOptions.length === 0) return '__SKIP_TEMPLATE__'
                    
                    // Process each selected option
                    const labels = selectedOptions.map(option => {
                      let labelText = option.label
                      
                      // If option is "other" and there's otherText, use otherText instead
                      if ((labelText.toLowerCase().includes('อื่น') || labelText.toLowerCase().includes('other')) 
                          && otherTexts[template.questionId] && otherTexts[template.questionId].trim()) {
                        labelText = otherTexts[template.questionId].trim()
                      }
                      
                      return labelText
                    }).filter(label => {
                      // Filter out skip words
                      const skipWords = ['ไม่ระบุ', 'ไม่มี', 'unknown', 'none', 'n/a', 'ไม่ทราบ', 'ไม่เกี่ยวข้อง']
                      return !skipWords.some(word => 
                        label.toLowerCase().includes(word.toLowerCase())
                      )
                    })
                    
                    if (labels.length === 0) return '__SKIP_TEMPLATE__'
                    
                    // Join multiple labels - you can customize the separator here
                    return labels.join(', ') // Using comma + space as default
                  }
                  // Handle radio/select (single selection)
                  else if (answer.optionId) {
                    const selectedOption = relatedQuestion.options?.find(opt => opt.id === answer.optionId)
                    let labelText = selectedOption?.label || answer.value || ''
                    
                    // If option is "other" and there's otherText, use otherText instead
                    if ((labelText.toLowerCase().includes('อื่น') || labelText.toLowerCase().includes('other')) 
                        && otherTexts[template.questionId] && otherTexts[template.questionId].trim()) {
                      labelText = otherTexts[template.questionId].trim()
                    }
                    
                    // Skip template if label contains words indicating "not specified"
                    const skipWords = ['ไม่ระบุ', 'ไม่มี', 'unknown', 'none', 'n/a', 'ไม่ทราบ', 'ไม่เกี่ยวข้อง']
                    const shouldSkip = skipWords.some(word => 
                      labelText.toLowerCase().includes(word.toLowerCase())
                    )
                    
                    if (shouldSkip) {
                      return '__SKIP_TEMPLATE__' // Special marker to skip this template
                    }
                    
                    return labelText
                  }
                }
                return answer.textValue || answer.value || ''
              } else if (placeholder === 'input') {
                // For options with hasInput=true, get the input text
                const relatedQuestion = symptom.questions?.find(q => q.id === template.questionId)
                if (relatedQuestion) {
                  // Handle checkbox (multiple selections)
                  if (relatedQuestion.type === 'checkbox' && Array.isArray(answer.value)) {
                    const selectedOptions = relatedQuestion.options?.filter(opt => 
                      answer.value.includes(opt.id) && opt.hasInput
                    ) || []
                    
                    const inputs = selectedOptions.map(option => {
                      const inputKey = `${template.questionId}-${option.id}`
                      return optionInputs[inputKey]
                    }).filter(input => input && input.trim())
                    
                    // Join multiple inputs - you can customize the separator here
                    return inputs.join(', ') // Using comma + space as default
                  }
                  // Handle radio/select (single selection)
                  else if (answer.optionId) {
                    const inputKey = `${template.questionId}-${answer.optionId}`
                    return optionInputs[inputKey] || ''
                  }
                }
                return ''
              }
              // Add more placeholder replacements as needed
              return match
            })
            
            // Skip this template if it contains the skip marker
            if (templateText.includes('__SKIP_TEMPLATE__')) {
              shouldInclude = false
            }
          }
        } else if (template.questionId && (template.triggerValue === '' || template.triggerValue === null)) {
          // Template for any value (especially for number/text inputs)
          const answer = answers[template.questionId]
          if (answer && (answer.textValue || answer.value)) {
            shouldInclude = true
            
            // Replace placeholders with actual values
            templateText = templateText.replace(/\{([^}]+)\}/g, (match, placeholder) => {
              if (placeholder === 'value') {
                const relatedQuestion = symptom.questions?.find(q => q.id === template.questionId)
                let valueText = answer.textValue || answer.value || ''
                
                // Add time unit if question has time unit and it's selected
                if (relatedQuestion?.hasTimeUnit && relatedQuestion.type === 'number' && timeUnits[template.questionId]) {
                  const timeUnitMap: Record<string, string> = {
                    'minutes': 'นาที',
                    'hours': 'ชั่วโมง', 
                    'days': 'วัน',
                    'weeks': 'สัปดาห์',
                    'months': 'เดือน'
                  }
                  const unitText = timeUnitMap[timeUnits[template.questionId]] || timeUnits[template.questionId]
                  valueText += ` ${unitText}`
                }
                
                return valueText
              } else if (placeholder === 'label') {
                // For radio/select questions, find the option label
                const relatedQuestion = symptom.questions?.find(q => q.id === template.questionId)
                if (relatedQuestion) {
                  // Handle checkbox (multiple selections)
                  if (relatedQuestion.type === 'checkbox' && Array.isArray(answer.value)) {
                    const selectedOptions = relatedQuestion.options?.filter(opt => 
                      answer.value.includes(opt.id)
                    ) || []
                    
                    if (selectedOptions.length === 0) return '__SKIP_TEMPLATE__'
                    
                    // Process each selected option
                    const labels = selectedOptions.map(option => {
                      let labelText = option.label
                      
                      // If option is "other" and there's otherText, use otherText instead
                      if ((labelText.toLowerCase().includes('อื่น') || labelText.toLowerCase().includes('other')) 
                          && otherTexts[template.questionId] && otherTexts[template.questionId].trim()) {
                        labelText = otherTexts[template.questionId].trim()
                      }
                      
                      return labelText
                    }).filter(label => {
                      // Filter out skip words
                      const skipWords = ['ไม่ระบุ', 'ไม่มี', 'unknown', 'none', 'n/a', 'ไม่ทราบ', 'ไม่เกี่ยวข้อง']
                      return !skipWords.some(word => 
                        label.toLowerCase().includes(word.toLowerCase())
                      )
                    })
                    
                    if (labels.length === 0) return '__SKIP_TEMPLATE__'
                    
                    // Join multiple labels - you can customize the separator here
                    return labels.join(', ') // Using comma + space as default
                  }
                  // Handle radio/select (single selection)
                  else if (answer.optionId) {
                    const selectedOption = relatedQuestion.options?.find(opt => opt.id === answer.optionId)
                    let labelText = selectedOption?.label || answer.value || ''
                    
                    // If option is "other" and there's otherText, use otherText instead
                    if ((labelText.toLowerCase().includes('อื่น') || labelText.toLowerCase().includes('other')) 
                        && otherTexts[template.questionId] && otherTexts[template.questionId].trim()) {
                      labelText = otherTexts[template.questionId].trim()
                    }
                    
                    // Check if the label contains skip words
                    const skipWords = ['ไม่ระบุ', 'ไม่มี', 'unknown', 'none', 'n/a', 'ไม่ทราบ', 'ไม่เกี่ยวข้อง']
                    if (skipWords.some(skipWord => labelText.toLowerCase().includes(skipWord.toLowerCase()))) {
                      return '__SKIP_TEMPLATE__'
                    }
                    
                    return labelText
                  }
                }
                return answer.textValue || answer.value || ''
              } else if (placeholder === 'input') {
                // For options with hasInput=true, get the input text
                const relatedQuestion = symptom.questions?.find(q => q.id === template.questionId)
                if (relatedQuestion) {
                  // Handle checkbox (multiple selections)
                  if (relatedQuestion.type === 'checkbox' && Array.isArray(answer.value)) {
                    const selectedOptions = relatedQuestion.options?.filter(opt => 
                      answer.value.includes(opt.id) && opt.hasInput
                    ) || []
                    
                    const inputs = selectedOptions.map(option => {
                      const inputKey = `${template.questionId}-${option.id}`
                      return optionInputs[inputKey]
                    }).filter(input => input && input.trim())
                    
                    // Join multiple inputs - you can customize the separator here
                    return inputs.join(', ') // Using comma + space as default
                  }
                  // Handle radio/select (single selection)
                  else if (answer.optionId) {
                    const inputKey = `${template.questionId}-${answer.optionId}`
                    return optionInputs[inputKey] || ''
                  }
                }
                return ''
              }
              // Add more placeholder replacements as needed
              return match
            })
            
            // Skip this template if it contains the skip marker
            if (templateText.includes('__SKIP_TEMPLATE__')) {
              shouldInclude = false
            }
          }
        } else if (!template.questionId && !template.triggerValue) {
          // General template, always include
          shouldInclude = true
        }

        if (shouldInclude && templateText.trim()) {
          // Check if this template is from a CC question
          const relatedQuestion = symptom.questions?.find(q => q.id === template.questionId)
          if (relatedQuestion?.isCC) {
            ccParts.push(templateText.trim())
          } else {
            otherParts.push(templateText.trim())
          }
        }
      })

    // Generate final summary
    let finalSummary = ''
    
    // Add CC parts with prefix if any exist
    if (ccParts.length > 0) {
      finalSummary += `ผู้ป่วยมาด้วยอาการ ${ccParts.join(' ')}`
    }
    
    // Add other parts
    if (otherParts.length > 0) {
      if (finalSummary) {
        finalSummary += ` ${otherParts.join(' ')}`
      } else {
        finalSummary = otherParts.join(' ')
      }
    }

    setSummaryText(finalSummary)
  }, [answers, symptom, timeUnits, otherTexts, optionInputs])

  const handleAnswerChange = (questionId: number, value: any, optionId?: number, textValue?: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        questionId,
        value,
        optionId,
        textValue
      }
    }))
  }

  const handleCheckboxChange = (questionId: number, optionId: number, checked: boolean) => {
    setAnswers(prev => {
      const currentAnswer = prev[questionId] || { questionId, value: [] }
      let newValue = Array.isArray(currentAnswer.value) ? [...currentAnswer.value] : []
      
      if (checked) {
        if (!newValue.includes(optionId)) {
          newValue.push(optionId)
        }
      } else {
        newValue = newValue.filter(id => id !== optionId)
      }

      return {
        ...prev,
        [questionId]: {
          questionId,
          value: newValue,
          optionId: newValue.length > 0 ? newValue[0] : undefined
        }
      }
    })
  }

  const handleSubmit = async () => {
    if (!symptom) return

    // Validate required fields
    const requiredQuestions = symptom.questions.filter(q => 
      visibleQuestions.has(q.id) && q.isRequired
    )
    
    const missingRequired = requiredQuestions.filter(q => {
      const answer = answers[q.id]
      return !answer || (!answer.textValue && !answer.optionId)
    })

    if (missingRequired.length > 0) {
      Swal.fire({
        title: 'ข้อมูลไม่ครบถ้วน',
        text: `กรุณากรอกข้อมูลที่จำเป็น (${missingRequired.length} คำถาม)`,
        icon: 'warning'
      })
      return
    }

    if (!summaryText.trim()) {
      Swal.fire({
        title: 'ไม่มีข้อมูลสรุป',
        text: 'กรุณากรอกข้อมูลให้ครบถ้วนเพื่อให้ระบบสร้างข้อความสรุป',
        icon: 'warning'
      })
      return
    }

    // setIsSubmitting(true)

    try {
      // Prepare answers for submission
      const answersArray = Object.values(answers).map(answer => ({
        questionId: answer.questionId,
        optionId: answer.optionId || null,
        textValue: answer.textValue || null
      }))

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptomId,
          answers: answersArray,
          summaryText,
          timeUnits,
          otherTexts,
          optionInputs
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        Swal.fire({
          title: 'บันทึกเรียบร้อย!',
          text: 'ข้อมูลถูกบันทึกแล้ว คุณสามารถคัดลอกข้อความสรุปได้',
          icon: 'success',
          showCancelButton: true,
          confirmButtonText: 'คัดลอกข้อความ',
          cancelButtonText: 'เสร็จสิ้น'
        }).then((result) => {
          if (result.isConfirmed) {
            handleCopySummary()
          }
        })
      } else {
        const data = await response.json()
        Swal.fire('เกิดข้อผิดพลาด', data.error || 'ไม่สามารถบันทึกข้อมูลได้', 'error')
      }
    } catch (error) {
      console.error('Submit error:', error)
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้', 'error')
    } finally {
      // setIsSubmitting(false)
    }
  }

  const handleCopySummary = async () => {
    if (!summaryText.trim()) {
      Swal.fire('ไม่มีข้อความ', 'ยังไม่มีข้อความสรุปให้คัดลอก', 'warning')
      return
    }

    try {
      await navigator.clipboard.writeText(summaryText)
      Swal.fire({
        title: 'คัดลอกเรียบร้อย!',
        text: 'ข้อความสรุปถูกคัดลอกไปยังคลิปบอร์ดแล้ว',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      })
    } catch (error) {
      console.error('Copy error:', error)
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถคัดลอกข้อความได้ กรุณาคัดลอกเอง', 'error')
    }
  }

  const renderQuestion = (question: Question) => {
    const answer = answers[question.id]
    const isRequired = question.isRequired

    switch (question.type) {
      case 'radio':
        return (
          <div className="space-y-4">
            <RadioGroup
              value={answer?.value?.toString() || ''}
              onValueChange={(value) => {
                const option = question.options.find(o => o.value === value)
                handleAnswerChange(question.id, value, option?.id)
              }}
              className="space-y-4"
            >
              {question.options.map((option) => (
                <div key={option.id} className="space-y-3">
                  <div className="flex items-center space-x-4 p-4 rounded-xl border-2 border-blue-100 hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-300 group cursor-pointer">
                    <RadioGroupItem value={option.value} id={`${question.id}-${option.id}`} className="h-5 w-5 border-2 border-blue-400 text-blue-600 group-hover:border-blue-500" />
                    <Label htmlFor={`${question.id}-${option.id}`} className="text-base font-medium leading-relaxed cursor-pointer flex-1 text-gray-800 group-hover:text-blue-800">
                      {option.label}
                    </Label>
                  </div>
                  
                  {/* Show text input for "other" option */}
                  {(option.label.toLowerCase().includes('อื่น') || option.label.toLowerCase().includes('other')) && 
                   answer?.value?.toString() === option.value && (
                    <div className="ml-10">
                      <Input
                        type="text"
                        value={otherTexts[question.id] || ''}
                        onChange={(e) => setOtherTexts(prev => ({ ...prev, [question.id]: e.target.value }))}
                        placeholder="ระบุเพิ่มเติม..."
                        className="w-full h-12 text-base border-2 border-blue-200 bg-blue-50/30 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                      />
                    </div>
                  )}
                  
                  {/* Show text input for option with hasInput = true */}
                  {option.hasInput && answer?.value?.toString() === option.value && (
                    <div className="ml-10">
                      <Input
                        type="text"
                        value={optionInputs[`${question.id}-${option.id}`] || ''}
                        onChange={(e) => setOptionInputs(prev => ({ 
                          ...prev, 
                          [`${question.id}-${option.id}`]: e.target.value 
                        }))}
                        placeholder="ระบุข้อมูลเพิ่มเติม..."
                        className="w-full h-12 text-base border-2 border-blue-200 bg-blue-50/30 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                      />
                    </div>
                  )}
                </div>
              ))}
            </RadioGroup>
          </div>
        )

      case 'checkbox':
        return (
          <div className="space-y-4">
            {question.options.map((option) => (
              <div key={option.id} className="space-y-3">
                <div className="flex items-center space-x-4 p-4 rounded-xl border-2 border-blue-100 hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-300 group cursor-pointer">
                  <Checkbox
                    id={`${question.id}-${option.id}`}
                    checked={Array.isArray(answer?.value) && answer.value.includes(option.id)}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange(question.id, option.id, checked as boolean)
                    }
                    className="h-5 w-5 border-2 border-blue-400 text-blue-600 group-hover:border-blue-500"
                  />
                  <Label htmlFor={`${question.id}-${option.id}`} className="text-base font-medium leading-relaxed cursor-pointer flex-1 text-gray-800 group-hover:text-blue-800">
                    {option.label}
                  </Label>
                </div>
                
                {/* Show text input for "other" option */}
                {(option.label.toLowerCase().includes('อื่น') || option.label.toLowerCase().includes('other')) && 
                 Array.isArray(answer?.value) && answer.value.includes(option.id) && (
                  <div className="ml-10">
                    <Input
                      type="text"
                      value={otherTexts[question.id] || ''}
                      onChange={(e) => setOtherTexts(prev => ({ ...prev, [question.id]: e.target.value }))}
                      placeholder="ระบุเพิ่มเติม..."
                      className="w-full h-12 text-base border-2 border-blue-200 bg-blue-50/30 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                    />
                  </div>
                )}
                
                {/* Show text input for option with hasInput = true */}
                {option.hasInput && Array.isArray(answer?.value) && answer.value.includes(option.id) && (
                  <div className="ml-10">
                    <Input
                      type="text"
                      value={optionInputs[`${question.id}-${option.id}`] || ''}
                      onChange={(e) => setOptionInputs(prev => ({ 
                        ...prev, 
                        [`${question.id}-${option.id}`]: e.target.value 
                      }))}
                      placeholder="ระบุข้อมูลเพิ่มเติม..."
                      className="w-full h-12 text-base border-2 border-blue-200 bg-blue-50/30 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )

      case 'select':
        const selectedOption = question.options.find(o => o.value === answer?.value?.toString())
        const isOtherSelected = selectedOption && (selectedOption.label.toLowerCase().includes('อื่น') || selectedOption.label.toLowerCase().includes('other'))
        const hasInputSelected = selectedOption && selectedOption.hasInput
        
        return (
          <div className="space-y-4">
            <Select
              value={answer?.value?.toString() || ''}
              onValueChange={(value) => {
                const option = question.options.find(o => o.value === value)
                handleAnswerChange(question.id, value, option?.id)
              }}
            >
              <SelectTrigger className="h-12 text-base border-2 border-blue-200 bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl">
                <SelectValue placeholder="เลือกตัวเลือก..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2 border-blue-100">
                {question.options.map((option) => (
                  <SelectItem key={option.id} value={option.value} className="text-base py-3 hover:bg-blue-50 focus:bg-blue-100 rounded-lg mx-1">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Show text input for "other" option */}
            {isOtherSelected && (
              <div>
                <Input
                  type="text"
                  value={otherTexts[question.id] || ''}
                  onChange={(e) => setOtherTexts(prev => ({ ...prev, [question.id]: e.target.value }))}
                  placeholder="ระบุเพิ่มเติม..."
                  className="w-full h-12 text-base border-2 border-blue-200 bg-blue-50/30 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                />
              </div>
            )}
            
            {/* Show text input for option with hasInput = true */}
            {hasInputSelected && selectedOption && (
              <div>
                <Input
                  type="text"
                  value={optionInputs[`${question.id}-${selectedOption.id}`] || ''}
                  onChange={(e) => setOptionInputs(prev => ({ 
                    ...prev, 
                    [`${question.id}-${selectedOption.id}`]: e.target.value 
                  }))}
                  placeholder="ระบุข้อมูลเพิ่มเติม..."
                  className="w-full h-12 text-base border-2 border-blue-200 bg-blue-50/30 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                />
              </div>
            )}
          </div>
        )

      case 'text':
        return (
          <Input
            type="text"
            value={answer?.textValue || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value, undefined, e.target.value)}
            placeholder="กรอกคำตอบ..."
            className="h-12 text-base border-2 border-blue-200 bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
          />
        )

      case 'textarea':
        return (
          <Textarea
            value={answer?.textValue || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value, undefined, e.target.value)}
            placeholder="กรอกคำตอบ..."
            className="min-h-[120px] text-base border-2 border-blue-200 bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none rounded-xl"
            rows={4}
          />
        )

      case 'number':
        console.log('Rendering number question:', question.title, 'hasTimeUnit:', question.hasTimeUnit)
        return (
          <div className="space-y-4">
            <div className={`flex gap-4 ${question.hasTimeUnit ? 'items-end' : ''}`}>
              <div className={question.hasTimeUnit ? 'flex-1' : 'w-full'}>
                <Input
                  type="number"
                  value={answer?.textValue || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value, undefined, e.target.value)}
                  placeholder="กรอกตัวเลข..."
                  className="h-12 text-base border-2 border-blue-200 bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                />
              </div>
              {question.hasTimeUnit && (
                <div className="w-44">
                  <Select
                    value={timeUnits[question.id] || ''}
                    onValueChange={(value) => setTimeUnits(prev => ({ ...prev, [question.id]: value }))}
                  >
                    <SelectTrigger className="h-12 text-base border-2 border-blue-200 bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl">
                      <SelectValue placeholder="หน่วย" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2 border-blue-100">
                      <SelectItem value="minutes" className="text-base py-3 hover:bg-blue-50 focus:bg-blue-100 rounded-lg mx-1">นาที</SelectItem>
                      <SelectItem value="hours" className="text-base py-3 hover:bg-blue-50 focus:bg-blue-100 rounded-lg mx-1">ชั่วโมง</SelectItem>
                      <SelectItem value="days" className="text-base py-3 hover:bg-blue-50 focus:bg-blue-100 rounded-lg mx-1">วัน</SelectItem>
                      <SelectItem value="weeks" className="text-base py-3 hover:bg-blue-50 focus:bg-blue-100 rounded-lg mx-1">สัปดาห์</SelectItem>
                      <SelectItem value="months" className="text-base py-3 hover:bg-blue-50 focus:bg-blue-100 rounded-lg mx-1">เดือน</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return <div className="text-gray-500">ประเภทคำถามไม่รองรับ</div>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
        {/* Sticky Navbar */}
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-blue-200 shadow-lg">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
            <Image
    src="/logo.png"
    alt="UniPharm"
    width={906}            // ขนาดจริงของไฟล์
    height={260}           // ขนาดจริงของไฟล์
    className="h-10 w-auto md:h-12"  // แสดงผลจริง: สูง 40–48px บนจอ
    priority
    sizes="(max-width: 768px) 160px, 220px"
  />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent">
                    ร้านยามหาวิทยาลัย
                  </h1>
                  <p className="text-sm text-slate-600 font-medium">คณะเภสัชศาสตร์ มหาวิทยาลัยมหาสารคาม</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  asChild 
                  className="border-2 border-blue-600 text-blue-700 hover:bg-blue-100 bg-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl px-4 py-2 font-semibold"
                >
                  <Link href="/form">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    กลับหน้าหลัก
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-20 top-20">
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
            <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
          </div>
          
          <div className="relative z-10 text-center p-12">
            <div className="w-20 h-20 mx-auto mb-8 relative">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200"></div>
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">กำลังโหลดแบบฟอร์ม</h2>
            <p className="text-slate-600 text-lg font-medium">กรุณารอสักครู่...</p>
            <div className="flex justify-center gap-1 mt-6">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!symptom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
        {/* Sticky Navbar */}
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-blue-200 shadow-lg">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
               <Image
    src="/logo.png"
    alt="UniPharm"
    width={906}            // ขนาดจริงของไฟล์
    height={260}           // ขนาดจริงของไฟล์
    className="h-10 w-auto md:h-12"  // แสดงผลจริง: สูง 40–48px บนจอ
    priority
    sizes="(max-width: 768px) 160px, 220px"
  />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent">
                    ร้านยามหาวิทยาลัย
                  </h1>
                  <p className="text-sm text-slate-600 font-medium">คณะเภสัชศาสตร์ มหาวิทยาลัยมหาสารคาม</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  asChild 
                  className="border-2 border-blue-600 text-blue-700 hover:bg-blue-100 bg-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl px-4 py-2 font-semibold"
                >
                  <Link href="/form">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    กลับหน้าหลัก
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-20 top-20">
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
            <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
          </div>
          
          <Card className="relative z-10 max-w-lg mx-auto shadow-2xl border border-red-200 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardContent className="text-center p-12">
              <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <AlertCircle className="h-10 w-10 text-red-500" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">ไม่พบข้อมูล</h2>
              <p className="text-slate-600 mb-8 text-lg leading-relaxed">ไม่พบอาการที่ระบุ กรุณาตรวจสอบและลองใหม่อีกครั้ง</p>
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-8 py-3 text-base font-semibold hover:scale-105">
                <Link href="/form">
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  กลับไปเลือกอาการ
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const visibleQuestionsList = symptom.questions
    .filter(q => visibleQuestions.has(q.id))
    .sort((a, b) => a.order - b.order)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-blue-200 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo Space and Title */}
            <div className="flex items-center gap-4">
              {/* Logo placeholder - you can replace this with an actual logo */}
              <Image
    src="/logo.png"
    alt="UniPharm"
    width={906}            // ขนาดจริงของไฟล์
    height={260}           // ขนาดจริงของไฟล์
    className="h-10 w-auto md:h-12"  // แสดงผลจริง: สูง 40–48px บนจอ
    priority
    sizes="(max-width: 768px) 160px, 220px"
  />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent">
                  ร้านยามหาวิทยาลัย
                </h1>
                <p className="text-sm text-slate-600 font-medium">คณะเภสัชศาสตร์ มหาวิทยาลัยมหาสารคาม</p>
              </div>
            </div>
            
            {/* Navigation items */}
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                asChild 
                className="border-2 border-blue-600 text-blue-700 hover:bg-blue-100 bg-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl px-4 py-2 font-semibold"
              >
                <Link href="/form">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  กลับหน้าหลัก
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced background pattern */}
      <div className="absolute inset-0 opacity-20 top-20">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5 top-20">
        <div className="w-full h-full" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-6 py-8 max-w-7xl">
        {/* Enhanced Header */}
        <div className="mb-12">
          <div className="bg-white/90 backdrop-blur-sm shadow-2xl border border-blue-200 rounded-2xl p-8 hover:shadow-3xl transition-all duration-300">
            <div className="flex items-center gap-8">
              <div className="flex-1">
                <h1 className="text-4xl font-black mb-3 tracking-tight bg-gradient-to-r from-blue-700 via-purple-700 to-indigo-700 bg-clip-text text-transparent leading-tight">
                  อาการ : {symptom.name}
                </h1>
                {symptom.description && (
                  <p className="text-slate-600 text-xl leading-relaxed font-medium max-w-3xl">{symptom.description}</p>
                )}
              </div>
            </div>
            
          
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Questions Section - More spacious layout */}
          <div className="lg:col-span-3 space-y-6">
            {visibleQuestionsList.length === 0 ? (
              <Card className="border border-blue-200 bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden ">
                <CardContent className="text-center p-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MessageSquare className="h-10 w-10 text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-3">
                    ยังไม่มีคำถาม
                  </h3>
                  <p className="text-slate-500 text-lg leading-relaxed">
                    อาการนี้ยังไม่มีคำถามในระบบ
                  </p>
                </CardContent>
              </Card>
            ) : (
              visibleQuestionsList.map((question, index) => (
                <Card key={question.id} className="group border border-blue-200/50 bg-white/90 backdrop-blur-sm hover:bg-white hover:shadow-2xl hover:border-blue-300 transition-all duration-500 rounded-2xl overflow-hidden hover:scale-[1.02] hover:-translate-y-1">
                  <CardHeader className="border-b border-blue-100  bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <CardTitle className="text-xl font-bold text-slate-800 leading-tight flex-1">
                            {question.title}
                          </CardTitle>
                        </div>
                        {/* <div className="flex flex-wrap gap-2 mb-3">
                          {question.isRequired && (
                            <Badge className="text-xs px-3 py-1.5 bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200 font-semibold rounded-full">
                              • จำเป็น
                            </Badge>
                          )}
                          {question.isGeneral && (
                            <Badge className="text-xs px-3 py-1.5 bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200 font-semibold rounded-full">
                              • ทั่วไป
                            </Badge>
                          )}
                          {question.isCC && (
                            <Badge className="text-xs px-3 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200 font-semibold rounded-full">
                              <Stethoscope className="h-3 w-3 mr-1" />
                              CC
                            </Badge>
                          )}
                        </div> */}
                        {question.description && (
                          <CardDescription className="text-base text-slate-600 leading-relaxed font-medium">
                            {question.description}
                          </CardDescription>
                        )}
                      </div>
                      {answers[question.id] && (
                        <div className="bg-gradient-to-br from-green-100 to-emerald-100 border border-green-200 rounded-xl p-1 group-hover:scale-110 transition-transform duration-300">
                          <CheckCircle className=" text-green-600 flex-shrink-0" />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 pb-6">
                    <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-xl p-6 border border-blue-100/50">
                      {renderQuestion(question)}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Enhanced Summary Panel */}
          <div className="lg:col-span-2">
            <div className="sticky top-8">
              <Card className="border border-blue-200/50 bg-white/90 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden hover:shadow-3xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6">
                  <CardTitle className="flex items-center gap-4 text-xl font-bold text-white">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <div>ข้อความสรุป</div>
                      <CardDescription className="text-white/90 text-sm mt-1 font-medium">
                        ข้อความที่สร้างจากแบบฟอร์ม
                      </CardDescription>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="min-h-[240px] p-6 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl border border-blue-100 relative overflow-hidden">
                    {/* Decorative pattern */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/30 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-100/30 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
                    
                    <div className="relative z-10">
                      {summaryText ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-green-700 font-semibold text-sm">สำเร็จ</span>
                          </div>
                          <p className="text-slate-800 whitespace-pre-wrap text-base leading-relaxed font-medium">{summaryText}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
                            <Clock className="h-8 w-8 text-blue-500" />
                          </div>
                          <p className="text-slate-500 text-base text-center leading-relaxed font-medium">
                            กรอกข้อมูลเพื่อดูข้อความสรุป...
                          </p>
                          <div className="flex gap-1 mt-4">
                            <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-purple-300 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Button
                      onClick={handleCopySummary}
                      disabled={!summaryText.trim()}
                      className="w-full h-12 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-lg text-base font-semibold transition-all duration-300 rounded-xl hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg"
                    >
                      <Copy className="h-5 w-5 mr-3" />
                      คัดลอกข้อความ
                    </Button>
                    
                  
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="mt-16 text-center">
          <div className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-200 rounded-2xl p-6 max-w-lg mx-auto">
            <p className="text-slate-600 text-base font-medium">
              ระบบ Amed Helper <br /> ร้านยามหาวิทยาลัย คณะเภสัชศาสตร์ มหาวิทยาลัยมหาสารคาม <br/> พัฒนาระบบโดย อ.ภก.จิรเดช ลำลอง
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}