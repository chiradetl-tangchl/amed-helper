'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft, 
  Save, 
  X,
  MessageSquare,
  GripVertical
} from 'lucide-react'
import Swal from 'sweetalert2'
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Symptom {
  id: number
  name: string
  description: string
}

interface QuestionOption {
  id?: number
  label: string
  value: string
  order: number
  hasInput?: boolean
}

interface Question {
  id: number
  title: string
  description: string
  type: string
  isRequired: boolean
  isGeneral: boolean
  isCC: boolean
  hasTimeUnit: boolean
  order: number
  parentQuestionId: number | null
  conditionalValues: string | null
  options: QuestionOption[]
}

// SortableRow component for drag and drop
function SortableQuestionRow({ 
  question, 
  onEdit, 
  onDelete 
}: {
  question: Question
  onEdit: (question: Question) => void
  onDelete: (question: Question) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'radio': return 'ตัวเลือกเดียว'
      case 'checkbox': return 'หลายตัวเลือก'
      case 'select': return 'รายการ'
      case 'text': return 'ข้อความ'
      case 'number': return 'ตัวเลข'
      default: return type
    }
  }

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? 'z-50' : ''}>
      <TableCell>
        <div 
          className="flex items-center cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
      </TableCell>
      <TableCell className="font-medium">{question.title}</TableCell>
      <TableCell>{question.description || '-'}</TableCell>
      <TableCell>
        <Badge variant="outline">{getTypeLabel(question.type)}</Badge>
      </TableCell>
      <TableCell className="text-center">{question.order}</TableCell>
      <TableCell className="text-center">{question.options.length}</TableCell>
      <TableCell>
        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(question)}
            title="แก้ไข"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(question)}
            className="text-red-600"
            title="ลบ"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export default function QuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  const [symptom, setSymptom] = useState<Symptom | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    isRequired: false,
    isGeneral: false,
    isCC: false,
    hasTimeUnit: false,
    order: 0,
    parentQuestionId: null as number | null,
    conditionalValues: [] as string[],
    options: [] as { label: string, value: string, order: number, hasInput?: boolean }[]
  })
  const router = useRouter()
  const [symptomId, setSymptomId] = useState<number | null>(null)

  useEffect(() => {
    params.then((resolvedParams) => {
      setSymptomId(parseInt(resolvedParams.id))
    })
  }, [params])

  const fetchQuestionsData = useCallback(async () => {
    if (!symptomId) return
    
    try {
      const response = await fetch(`/api/admin/symptoms/${symptomId}/questions`)
      if (response.ok) {
        const data = await response.json()
        setSymptom(data.symptom)
        setQuestions(data.questions || [])
      } else {
        console.error('Failed to fetch questions')
      }
    } catch (error) {
      console.error('Get questions error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [symptomId])

  useEffect(() => {
    if (symptomId) {
      fetchQuestionsData()
    }
  }, [symptomId, fetchQuestionsData])

  // Drag and drop functionality
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = questions.findIndex((item) => item.id === active.id)
      const newIndex = questions.findIndex((item) => item.id === over?.id)

      const newQuestions = arrayMove(questions, oldIndex, newIndex)
      
      // Update order in the array
      const updatedQuestions = newQuestions.map((question, index) => ({
        ...question,
        order: index + 1
      }))
      
      setQuestions(updatedQuestions)

      // Update order in database
      try {
        const updatePromises = updatedQuestions.map((question) =>
          fetch(`/api/admin/symptoms/${symptomId}/questions/${question.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...question, order: question.order }),
          })
        )

        await Promise.all(updatePromises)
        
        Swal.fire({
          title: 'จัดเรียงเรียบร้อย!',
          text: 'อัปเดตลำดับคำถามแล้ว',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        })
      } catch (error) {
        console.error('Update order error:', error)
        // Revert changes on error
        await fetchQuestionsData()
        Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถอัปเดตลำดับได้', 'error')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: '',
      isRequired: false,
      isGeneral: false,
      isCC: false,
      hasTimeUnit: false,
      order: 0,
      parentQuestionId: null,
      conditionalValues: [],
      options: []
    })
    setEditingQuestion(null)
  }

  const openDialog = (question?: Question) => {
    if (question) {
      setEditingQuestion(question)
      setFormData({
        title: question.title,
        description: question.description || '',
        type: question.type,
        isRequired: question.isRequired,
        isGeneral: question.isGeneral,
        isCC: question.isCC,
        hasTimeUnit: question.hasTimeUnit || false,
        order: question.order,
        parentQuestionId: question.parentQuestionId,
        conditionalValues: (() => {
          if (!question.conditionalValues) return []
          try {
            // Handle double-encoded JSON
            const value = question.conditionalValues
            let parsed = JSON.parse(value)
            
            // If result is still a string, try parsing again (double-encoded)
            if (typeof parsed === 'string') {
              parsed = JSON.parse(parsed)
            }
            
            return Array.isArray(parsed) ? parsed : []
          } catch (error) {
            // If parsing fails, treat as comma-separated string
            return question.conditionalValues.split(',').map(v => v.trim()).filter(v => v)
          }
        })(),
        options: question.options.map(opt => ({
          label: opt.label,
          value: opt.value,
          order: opt.order,
          hasInput: opt.hasInput || false
        }))
      })
    } else {
      resetForm()
      setFormData(prev => ({ ...prev, order: questions.length + 1 }))
    }
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingQuestion 
        ? `/api/admin/symptoms/${symptomId}/questions/${editingQuestion.id}`
        : `/api/admin/symptoms/${symptomId}/questions`
      
      const method = editingQuestion ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          conditionalValues: formData.conditionalValues.length > 0 ? JSON.stringify(formData.conditionalValues) : null,
          parentQuestionId: formData.parentQuestionId
        })
      })

      if (response.ok) {
        await fetchQuestionsData()
        closeDialog()
        Swal.fire({
          title: 'สำเร็จ!',
          text: `${editingQuestion ? 'แก้ไข' : 'เพิ่ม'}คำถามเรียบร้อยแล้ว`,
          icon: 'success'
        })
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API Error:', errorData)
        throw new Error(`Failed to save question: ${errorData.error || response.statusText}`)
      }
    } catch (error) {
      console.error('Save question error:', error)
      Swal.fire({
        title: 'เกิดข้อผิดพลาด!',
        text: 'ไม่สามารถบันทึกคำถามได้',
        icon: 'error'
      })
    }
  }

  const handleDelete = async (question: Question) => {
    const result = await Swal.fire({
      title: 'คุณแน่ใจหรือไม่?',
      text: `จะลบคำถาม "${question.title}" ออกจากระบบ`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก'
    })

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/admin/symptoms/${symptomId}/questions/${question.id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          await fetchQuestionsData()
          Swal.fire({
            title: 'ลบแล้ว!',
            text: 'คำถามถูกลบออกจากระบบเรียบร้อยแล้ว',
            icon: 'success'
          })
        } else {
          throw new Error('Failed to delete question')
        }
      } catch (error) {
        console.error('Delete question error:', error)
        Swal.fire({
          title: 'เกิดข้อผิดพลาด!',
          text: 'ไม่สามารถลบคำถามได้',
          icon: 'error'
        })
      }
    }
  }

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { label: '', value: '', order: prev.options.length + 1, hasInput: false }]
    }))
  }

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }))
  }

  const updateOption = (index: number, field: 'label' | 'value' | 'hasInput', value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => 
        i === index ? { ...opt, [field]: value } : opt
      )
    }))
  }

  const needsOptions = ['radio', 'checkbox', 'select'].includes(formData.type)

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">กำลังโหลด...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.push('/admin/symptoms')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับ
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการคำถาม</h1>
          <p className="text-gray-600">{symptom?.name}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center mb-6">
        <Badge variant="outline" className="text-sm">
          <MessageSquare className="h-3 w-3 mr-1" />
          {questions.length} คำถาม
        </Badge>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มคำถาม
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? 'แก้ไขคำถาม' : 'เพิ่มคำถามใหม่'}
              </DialogTitle>
              <DialogDescription>
                กำหนดรายละเอียดของคำถามสำหรับการประเมินอาการ
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList>
                  <TabsTrigger value="basic">ข้อมูลพื้นฐาน</TabsTrigger>
                  <TabsTrigger value="options">ตัวเลือก</TabsTrigger>
                  <TabsTrigger value="conditional">เงื่อนไข</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">ชื่อคำถาม *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="เช่น มีไข้หรือไม่"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">คำอธิบาย</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="คำอธิบายเพิ่มเติมสำหรับคำถาม"
                        rows={2}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">ประเภทคำถาม *</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value) => setFormData({ ...formData, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกประเภท" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="radio">ตัวเลือกเดียว (Radio)</SelectItem>
                            <SelectItem value="checkbox">หลายตัวเลือก (Checkbox)</SelectItem>
                            <SelectItem value="select">รายการเลือก (Select)</SelectItem>
                            <SelectItem value="text">ข้อความ (Text)</SelectItem>
                            <SelectItem value="number">ตัวเลข (Number)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="order">ลำดับ</Label>
                        <Input
                          id="order"
                          type="number"
                          value={formData.order}
                          onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                          min="1"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-4 flex-wrap">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="isRequired"
                          checked={formData.isRequired}
                          onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked as boolean })}
                        />
                        <Label htmlFor="isRequired">บังคับตอบ</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="isGeneral"
                          checked={formData.isGeneral}
                          onCheckedChange={(checked) => setFormData({ ...formData, isGeneral: checked as boolean })}
                        />
                        <Label htmlFor="isGeneral">คำถามทั่วไป</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="isCC"
                          checked={formData.isCC}
                          onCheckedChange={(checked) => setFormData({ ...formData, isCC: checked as boolean })}
                        />
                        <Label htmlFor="isCC">Chief Complaint (CC)</Label>
                      </div>
                      {formData.type === 'number' && (
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="hasTimeUnit"
                            checked={formData.hasTimeUnit}
                            onCheckedChange={(checked) => setFormData({ ...formData, hasTimeUnit: checked as boolean })}
                          />
                          <Label htmlFor="hasTimeUnit">มีหน่วยเวลา</Label>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="options" className="space-y-4">
                  {needsOptions ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label>ตัวเลือก</Label>
                        <Button type="button" onClick={addOption} size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          เพิ่มตัวเลือก
                        </Button>
                      </div>
                      
                      {formData.options.map((option, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-3">
                          <div className="flex gap-2 items-end">
                            <div className="flex-1 space-y-2">
                              <Label>ข้อความแสดง</Label>
                              <Input
                                value={option.label}
                                onChange={(e) => updateOption(index, 'label', e.target.value)}
                                placeholder="เช่น มีประวัติแพ้ยา"
                              />
                            </div>
                            <div className="flex-1 space-y-2">
                              <Label>ค่า</Label>
                              <Input
                                value={option.value}
                                onChange={(e) => updateOption(index, 'value', e.target.value)}
                                placeholder="เช่น has_allergy"
                              />
                            </div>
                            <Button 
                              type="button" 
                              onClick={() => removeOption(index)} 
                              variant="destructive" 
                              size="sm"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {/* HasInput checkbox for each option */}
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={`hasInput-${index}`}
                              checked={option.hasInput || false}
                              onCheckedChange={(checked) => updateOption(index, 'hasInput', checked as boolean)}
                            />
                            <Label htmlFor={`hasInput-${index}`}>
                              มีช่องกรอกข้อมูลเพิ่มเติม (เช่น ระบุชื่อยาที่แพ้)
                            </Label>
                          </div>
                        </div>
                      ))}
                      
                      {formData.options.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          ยังไม่มีตัวเลือก คลิก &quot;เพิ่มตัวเลือก&quot; เพื่อเริ่มต้น
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      ประเภทคำถามนี้ไม่ต้องการตัวเลือก
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="conditional" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="parentQuestion">คำถามหลัก (ไม่บังคับ)</Label>
                      <Select
                        value={formData.parentQuestionId?.toString() || 'none'}
                        onValueChange={(value) => setFormData({ 
                          ...formData, 
                          parentQuestionId: value === 'none' ? null : parseInt(value) 
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกคำถามหลัก (ไม่บังคับ)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">ไม่มีคำถามหลัก</SelectItem>
                          {questions
                            .filter(q => q.id !== editingQuestion?.id)
                            .map((question) => (
                            <SelectItem key={question.id} value={question.id.toString()}>
                              {question.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {formData.parentQuestionId && (
                      <div className="space-y-2">
                        <Label htmlFor="conditionalValues">ค่าที่จะทำให้คำถามนี้แสดง</Label>
                        <Textarea
                          id="conditionalValues"
                          value={Array.isArray(formData.conditionalValues) ? formData.conditionalValues.join(', ') : ''}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            conditionalValues: e.target.value.split(',').map(v => v.trim()).filter(v => v) 
                          })}
                          placeholder="ค่าที่จะทำให้คำถามนี้แสดง (คั่นด้วยคอมมา) เช่น has_allergy, yes"
                          rows={2}
                        />
                        <p className="text-xs text-gray-500">
                          คำถามนี้จะแสดงเมื่อคำถามหลักมีค่าตรงกับที่ระบุ
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  <X className="h-4 w-4 mr-2" />
                  ยกเลิก
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  บันทึก
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Questions Table */}
      <Card>
        <CardHeader>
          <CardTitle>คำถามทั้งหมด</CardTitle>
          <CardDescription>
            จัดการคำถามสำหรับการประเมินอาการ {symptom?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {questions.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">จัดเรียง</TableHead>
                    <TableHead>คำถาม</TableHead>
                    <TableHead>รายละเอียด</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead className="text-center">ลำดับ</TableHead>
                    <TableHead className="text-center">ตัวเลือก</TableHead>
                    <TableHead className="text-right">การจัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <SortableContext 
                  items={questions.map(q => q.id)} 
                  strategy={verticalListSortingStrategy}
                >
                  <TableBody>
                    {questions
                      .sort((a, b) => a.order - b.order)
                      .map((question) => (
                      <SortableQuestionRow
                        key={question.id}
                        question={question}
                        onEdit={openDialog}
                        onDelete={handleDelete}
                      />
                    ))}
                  </TableBody>
                </SortableContext>
              </Table>
            </DndContext>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">ยังไม่มีคำถาม</h3>
              <p className="text-sm">เริ่มต้นสร้างคำถามแรกของคุณ</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}