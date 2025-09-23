'use client'

import { useState, useEffect } from 'react'
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
  Settings,
  Eye,
  EyeOff,
  Link,
  CheckCircle2
} from 'lucide-react'
import Swal from 'sweetalert2'

interface Symptom {
  id: number
  name: string
  description: string | null
}

interface QuestionOption {
  id: number
  label: string
  value: string
  order: number
  isActive: boolean
}

interface Question {
  id: number
  title: string
  description: string | null
  type: string
  isRequired: boolean
  isGeneral: boolean
  order: number
  parentQuestionId: number | null
  conditionalValues: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  options: QuestionOption[]
  parentQuestion?: {
    id: number
    title: string
  } | null
  childQuestions: {
    id: number
    title: string
  }[]
}

const QUESTION_TYPES = [
  { value: 'radio', label: 'เลือกตัวเลือกเดียว (Radio)' },
  { value: 'checkbox', label: 'เลือกได้หลายตัวเลือก (Checkbox)' },
  { value: 'select', label: 'รายการดรอปดาวน์ (Select)' },
  { value: 'text', label: 'ข้อความ (Text)' },
  { value: 'number', label: 'ตัวเลข (Number)' }
]

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
    order: 0,
    parentQuestionId: null as number | null,
    conditionalValues: [] as string[],
    options: [] as { label: string, value: string, order: number }[]
  })
  const router = useRouter()
  const [symptomId, setSymptomId] = useState<number | null>(null)

  useEffect(() => {
    params.then((resolvedParams) => {
      setSymptomId(parseInt(resolvedParams.id))
    })
  }, [params])

  useEffect(() => {
    if (symptomId) {
      fetchQuestionsData()
    }
  }, [symptomId])

  const fetchQuestionsData = async () => {
    if (!symptomId) return
    
    try {
      const response = await fetch(`/api/admin/symptoms/${symptomId}/questions`)
      if (response.ok) {
        const data = await response.json()
        setSymptom(data.symptom)
        setQuestions(data.questions)
      } else if (response.status === 401) {
        router.push('/admin/login')
      } else if (response.status === 404) {
        Swal.fire('ไม่พบข้อมูล', 'ไม่พบอาการที่ระบุ', 'error')
        router.push('/admin/symptoms')
      }
    } catch (error) {
      console.error('Fetch questions error:', error)
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลได้', 'error')
    } finally {
      setIsLoading(false)
    }
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
        order: question.order,
        parentQuestionId: question.parentQuestionId,
        conditionalValues: question.conditionalValues ? JSON.parse(question.conditionalValues) : [],
        options: question.options.map(o => ({ label: o.label, value: o.value, order: o.order }))
      })
    } else {
      setEditingQuestion(null)
      setFormData({
        title: '',
        description: '',
        type: '',
        isRequired: false,
        isGeneral: false,
        order: Math.max(...questions.map(q => q.order), 0) + 1,
        parentQuestionId: null,
        conditionalValues: [],
        options: []
      })
    }
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingQuestion(null)
    setFormData({
      title: '',
      description: '',
      type: '',
      isRequired: false,
      isGeneral: false,
      order: 0,
      parentQuestionId: null,
      conditionalValues: [],
      options: []
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.type) {
      Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อคำถามและเลือกประเภท', 'warning')
      return
    }

    try {
      const url = editingQuestion 
        ? `/api/admin/symptoms/${symptomId}/questions/${editingQuestion.id}`
        : `/api/admin/symptoms/${symptomId}/questions`
      
      const method = editingQuestion ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchQuestionsData()
        closeDialog()
        Swal.fire({
          title: 'สำเร็จ!',
          text: editingQuestion ? 'แก้ไขคำถามเรียบร้อย' : 'เพิ่มคำถามใหม่เรียบร้อย',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        })
      } else {
        const data = await response.json()
        Swal.fire('เกิดข้อผิดพลาด', data.error || 'ไม่สามารถบันทึกข้อมูลได้', 'error')
      }
    } catch (error) {
      console.error('Save question error:', error)
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้', 'error')
    }
  }

  const handleDelete = async (question: Question) => {
    const result = await Swal.fire({
      title: 'ลบคำถามนี้?',
      text: `คุณแน่ใจหรือไม่ที่จะลบ "${question.title}"`,
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
          Swal.fire('ลบเรียบร้อย!', 'คำถามถูกลบออกจากระบบแล้ว', 'success')
        } else {
          const data = await response.json()
          Swal.fire('เกิดข้อผิดพลาด', data.error || 'ไม่สามารถลบข้อมูลได้', 'error')
        }
      } catch (error) {
        console.error('Delete question error:', error)
        Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถลบข้อมูลได้', 'error')
      }
    }
  }

  const addOption = () => {
    setFormData({
      ...formData,
      options: [
        ...formData.options,
        { label: '', value: '', order: formData.options.length }
      ]
    })
  }

  const updateOption = (index: number, field: string, value: string) => {
    const newOptions = [...formData.options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    setFormData({ ...formData, options: newOptions })
  }

  const removeOption = (index: number) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index)
    })
  }

  const needsOptions = ['radio', 'checkbox', 'select'].includes(formData.type)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (!symptom) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">ไม่พบข้อมูล</h1>
          <Button onClick={() => router.push('/admin/symptoms')}>
            กลับไปหน้าจัดการอาการ
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin/symptoms')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับ
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">จัดการคำถาม</h1>
            <p className="text-gray-600">อาการ: {symptom.name}</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              เพิ่มคำถามใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? 'แก้ไขคำถาม' : 'เพิ่มคำถามใหม่'}
              </DialogTitle>
              <DialogDescription>
                ออกแบบคำถามสำหรับอาการ &quot;{symptom?.name}&quot;
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">ข้อมูลพื้นฐาน</TabsTrigger>
                  <TabsTrigger value="options">ตัวเลือก</TabsTrigger>
                  <TabsTrigger value="logic">Logic</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">ชื่อคำถาม *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="เช่น มีประวัติแพ้ยาหรือไม่"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">รายละเอียด</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="คำอธิบายเพิ่มเติม (ไม่บังคับ)"
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">ประเภทคำถาม *</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกประเภทคำถาม" />
                      </SelectTrigger>
                      <SelectContent>
                        {QUESTION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="order">ลำดับ</Label>
                      <Input
                        id="order"
                        type="number"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                        min="0"
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isRequired"
                          checked={formData.isRequired}
                          onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked as boolean })}
                        />
                        <Label htmlFor="isRequired">บังคับกรอก</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isGeneral"
                          checked={formData.isGeneral}
                          onCheckedChange={(checked) => setFormData({ ...formData, isGeneral: checked as boolean })}
                        />
                        <Label htmlFor="isGeneral">คำถามทั่วไป</Label>
                      </div>
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
                        <div key={index} className="flex gap-2 items-end">
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
                      ))}
                      
                      {formData.options.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>ยังไม่มีตัวเลือก กดเพิ่มตัวเลือกเพื่อเริ่มต้น</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>ประเภทคำถามนี้ไม่ต้องการตัวเลือก</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="logic" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>คำถามหลัก (Parent Question)</Label>
                      <Select 
                        value={formData.parentQuestionId?.toString() || ''} 
                        onValueChange={(value) => setFormData({ 
                          ...formData, 
                          parentQuestionId: value ? parseInt(value) : null 
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
                        <Label>เงื่อนไขการแสดง</Label>
                        <Textarea
                          value={formData.conditionalValues.join(', ')}
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{questions.length}</div>
            <div className="text-sm text-gray-600">คำถามทั้งหมด</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {questions.filter(q => q.isActive).length}
            </div>
            <div className="text-sm text-gray-600">เปิดใช้งาน</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {questions.filter(q => q.isRequired).length}
            </div>
            <div className="text-sm text-gray-600">บังคับกรอก</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {questions.filter(q => q.parentQuestionId).length}
            </div>
            <div className="text-sm text-gray-600">คำถามย่อย</div>
          </CardContent>
        </Card>
      </div>

      {/* Questions Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการคำถาม</CardTitle>
          <CardDescription>
            จัดการคำถามสำหรับอาการ &quot;{symptom?.name}&quot;
          </CardDescription>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <MessageSquare className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">ยังไม่มีคำถาม</h3>
              <p className="text-gray-600 mb-4">เริ่มต้นด้วยการเพิ่มคำถามแรกสำหรับอาการนี้</p>
              <Button onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มคำถามใหม่
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ลำดับ</TableHead>
                    <TableHead>คำถาม</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead>คำถามหลัก</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead className="text-center">การจัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell className="font-medium">{question.order}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{question.title}</div>
                          {question.description && (
                            <div className="text-xs text-gray-500 max-w-xs truncate">
                              {question.description}
                            </div>
                          )}
                          <div className="flex gap-1 mt-1">
                            {question.isRequired && (
                              <Badge variant="destructive" className="text-xs">บังคับ</Badge>
                            )}
                            {question.isGeneral && (
                              <Badge variant="secondary" className="text-xs">ทั่วไป</Badge>
                            )}
                            {question.childQuestions.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <Link className="h-3 w-3 mr-1" />
                                {question.childQuestions.length} คำถามย่อย
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {QUESTION_TYPES.find(t => t.value === question.type)?.label || question.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {question.parentQuestion ? (
                          <div className="text-sm">
                            <div className="font-medium">{question.parentQuestion.title}</div>
                            {question.conditionalValues && (
                              <div className="text-xs text-gray-500">
                                เงื่อนไข: {JSON.parse(question.conditionalValues).join(', ')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={question.isActive ? "default" : "secondary"}>
                          {question.isActive ? (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              เปิดใช้งาน
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              ปิดใช้งาน
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDialog(question)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(question)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}