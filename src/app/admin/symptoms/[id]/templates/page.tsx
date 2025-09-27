'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft, 
  Save, 
  X,
  FileText as TemplateIcon,
  Code,
  GripVertical,
  Eye,
  EyeOff
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
  description: string | null
  questions: {
    id: number
    title: string
    type: string
  }[]
}

interface TextTemplate {
  id: number
  questionId: number | null
  triggerValue: string | null
  template: string
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// SortableRow component for drag and drop
function SortableTemplateRow({ 
  template, 
  symptom,
  onEdit, 
  onDelete,
  onToggleActive
}: {
  template: TextTemplate
  symptom: Symptom | null
  onEdit: (template: TextTemplate) => void
  onDelete: (template: TextTemplate) => void
  onToggleActive: (template: TextTemplate) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: template.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getQuestionTitle = () => {
    if (!template.questionId || !symptom?.questions) return 'ทั่วไป'
    const question = symptom.questions.find(q => q.id === template.questionId)
    return question ? question.title : 'ไม่พบคำถาม'
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
      <TableCell className="font-medium max-w-xs">
        <div className="truncate" title={template.template}>
          {template.template}
        </div>
      </TableCell>
      <TableCell className="max-w-xs">
        <div className="truncate" title={getQuestionTitle()}>
          {getQuestionTitle()}
        </div>
      </TableCell>
      <TableCell>
        {template.triggerValue || '-'}
      </TableCell>
      <TableCell>
        <Badge 
          variant={template.isActive ? "default" : "secondary"}
          className="cursor-pointer"
          onClick={() => onToggleActive(template)}
        >
          {template.isActive ? (
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
      <TableCell className="text-center">{template.order}</TableCell>
      <TableCell>
        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(template)}
            title="แก้ไข"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(template)}
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

export default function TemplatesPage({ params }: { params: Promise<{ id: string }> }) {
  const [symptom, setSymptom] = useState<Symptom | null>(null)
  const [templates, setTemplates] = useState<TextTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TextTemplate | null>(null)
  const [formData, setFormData] = useState({
    questionId: null as number | null,
    triggerValue: '',
    template: '',
    order: 0
  })
  const [previewText, setPreviewText] = useState('')
  const router = useRouter()
  const [symptomId, setSymptomId] = useState<number | null>(null)

  useEffect(() => {
    params.then((resolvedParams) => {
      setSymptomId(parseInt(resolvedParams.id))
    })
  }, [params])

  const fetchTemplatesData = useCallback(async () => {
    if (!symptomId) return
    
    try {
      const response = await fetch(`/api/admin/symptoms/${symptomId}/templates`)
      if (response.ok) {
        const data = await response.json()
        setSymptom(data.symptom)
        setTemplates(data.templates)
      } else if (response.status === 401) {
        router.push('/admin/login')
      } else if (response.status === 404) {
        Swal.fire('ไม่พบข้อมูล', 'ไม่พบอาการที่ระบุ', 'error')
        router.push('/admin/symptoms')
      }
    } catch (error) {
      console.error('Fetch templates error:', error)
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลได้', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [symptomId, router])

  useEffect(() => {
    if (symptomId) {
      fetchTemplatesData()
    }
  }, [symptomId, fetchTemplatesData])

  useEffect(() => {
    // Generate preview text when template changes
    if (formData.template) {
      const preview = generatePreview(formData.template)
      setPreviewText(preview)
    } else {
      setPreviewText('')
    }
  }, [formData.template])

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
      const oldIndex = templates.findIndex((item) => item.id === active.id)
      const newIndex = templates.findIndex((item) => item.id === over?.id)

      const newTemplates = arrayMove(templates, oldIndex, newIndex)
      
      // Update order in the array
      const updatedTemplates = newTemplates.map((template, index) => ({
        ...template,
        order: index + 1
      }))
      
      setTemplates(updatedTemplates)

      // Update order in database
      try {
        const updatePromises = updatedTemplates.map((template) =>
          fetch(`/api/admin/symptoms/${symptomId}/templates/${template.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...template, order: template.order }),
          })
        )

        await Promise.all(updatePromises)
        
        Swal.fire({
          title: 'จัดเรียงเรียบร้อย!',
          text: 'อัปเดตลำดับเทมเพลตแล้ว',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        })
      } catch (error) {
        console.error('Update order error:', error)
        // Revert changes on error
        await fetchTemplatesData()
        Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถอัปเดตลำดับได้', 'error')
      }
    }
  }

  const generatePreview = (template: string): string => {
    // Replace placeholders with sample data
    let preview = template
    preview = preview.replace(/\{([^}]+)\}/g, (match, placeholder) => {
      const sampleData: { [key: string]: string } = {
        'allergyName': 'Paracetamol',
        'duration': '3 วัน',
        'fever': 'มีไข้',
        'coughType': 'ไอแห้ง',
        'symptomSeverity': 'ปานกลาง',
        'patientAge': '35 ปี',
        'value': 'ตัวอย่าง'
      }
      return sampleData[placeholder] || `{${placeholder}}`
    })
    return preview
  }

  const openDialog = (template?: TextTemplate) => {
    if (template) {
      setEditingTemplate(template)
      setFormData({
        questionId: template.questionId,
        triggerValue: template.triggerValue || '',
        template: template.template,
        order: template.order
      })
    } else {
      setEditingTemplate(null)
      setFormData({
        questionId: null,
        triggerValue: '',
        template: '',
        order: Math.max(...templates.map(t => t.order), 0) + 1
      })
    }
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingTemplate(null)
    setFormData({
      questionId: null,
      triggerValue: '',
      template: '',
      order: 0
    })
    setPreviewText('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.template.trim()) {
      Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกเทมเพลตข้อความ', 'warning')
      return
    }

    try {
      const url = editingTemplate 
        ? `/api/admin/symptoms/${symptomId}/templates/${editingTemplate.id}`
        : `/api/admin/symptoms/${symptomId}/templates`
      
      const method = editingTemplate ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchTemplatesData()
        closeDialog()
        Swal.fire({
          title: 'สำเร็จ!',
          text: editingTemplate ? 'แก้ไขเทมเพลตเรียบร้อย' : 'เพิ่มเทมเพลตใหม่เรียบร้อย',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        })
      } else {
        const data = await response.json()
        Swal.fire('เกิดข้อผิดพลาด', data.error || 'ไม่สามารถบันทึกข้อมูลได้', 'error')
      }
    } catch (error) {
      console.error('Save template error:', error)
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้', 'error')
    }
  }

  const handleDelete = async (template: TextTemplate) => {
    const result = await Swal.fire({
      title: 'ลบเทมเพลตนี้?',
      text: `คุณแน่ใจหรือไม่ที่จะลบเทมเพลตนี้`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก'
    })

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/admin/symptoms/${symptomId}/templates/${template.id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          await fetchTemplatesData()
          Swal.fire('ลบเรียบร้อย!', 'เทมเพลตถูกลบออกจากระบบแล้ว', 'success')
        } else {
          const data = await response.json()
          Swal.fire('เกิดข้อผิดพลาด', data.error || 'ไม่สามารถลบข้อมูลได้', 'error')
        }
      } catch (error) {
        console.error('Delete template error:', error)
        Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถลบข้อมูลได้', 'error')
      }
    }
  }

  const toggleActive = async (template: TextTemplate) => {
    try {
      const response = await fetch(`/api/admin/symptoms/${symptomId}/templates/${template.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...template,
          isActive: !template.isActive
        }),
      })

      if (response.ok) {
        await fetchTemplatesData()
        Swal.fire({
          title: 'อัปเดตเรียบร้อย!',
          text: template.isActive ? 'ปิดใช้งานเทมเพลตแล้ว' : 'เปิดใช้งานเทมเพลตแล้ว',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        })
      }
    } catch (error) {
      console.error('Toggle active error:', error)
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถอัปเดตสถานะได้', 'error')
    }
  }

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
            <h1 className="text-2xl font-bold text-gray-900">จัดการเทมเพลต</h1>
            <p className="text-gray-600">อาการ: {symptom.name}</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              เพิ่มเทมเพลตใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'แก้ไขเทมเพลต' : 'เพิ่มเทมเพลตใหม่'}
              </DialogTitle>
              <DialogDescription>
                กำหนดรูปแบบข้อความสรุปสำหรับอาการ &quot;{symptom.name}&quot;
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="questionId">คำถามที่เกี่ยวข้อง</Label>
                  <Select 
                    value={formData.questionId?.toString() || ''} 
                    onValueChange={(value) => setFormData({ 
                      ...formData, 
                      questionId: value ? parseInt(value) : null 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกคำถาม (ไม่บังคับ)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">ไม่เกี่ยวข้องกับคำถามใด</SelectItem>
                      {symptom.questions.map((question) => (
                        <SelectItem key={question.id} value={question.id.toString()}>
                          {question.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="triggerValue">ค่าที่จะทริกเกอร์</Label>
                  <Input
                    id="triggerValue"
                    value={formData.triggerValue}
                    onChange={(e) => setFormData({ ...formData, triggerValue: e.target.value })}
                    placeholder="เช่น has_allergy, yes, มี"
                  />
                  <p className="text-xs text-gray-500">
                    ระบุค่าที่เมื่อผู้ใช้เลือกแล้วจะแสดงข้อความนี้
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="order">ลำดับการแสดง</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="template">เทมเพลตข้อความ *</Label>
                <Textarea
                  id="template"
                  value={formData.template}
                  onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                  placeholder="เช่น มีประวัติแพ้ยา {allergyName} หรือ ไม่มีประวัติแพ้ยา"
                  rows={4}
                  required
                />
                <div className="text-xs text-gray-500 space-y-1">
                  <p><strong>ตัวแปรที่ใช้ได้:</strong></p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">{'{value}'}</Badge>
                    <Badge variant="outline" className="text-xs">{'{label}'}</Badge>
                    <Badge variant="outline" className="text-xs">{'{allergyName}'}</Badge>
                    <Badge variant="outline" className="text-xs">{'{duration}'}</Badge>
                    <Badge variant="outline" className="text-xs">{'{fever}'}</Badge>
                    <Badge variant="outline" className="text-xs">{'{coughType}'}</Badge>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    <p><strong>หมายเหตุ:</strong></p>
                    <p>• {'{value}'} = ค่าที่ผู้ใช้กรอก (เหมาะสำหรับ text/number)</p>
                    <p>• {'{label}'} = ข้อความตัวเลือก (เหมาะสำหรับ radio/select)</p>
                  </div>
                </div>
              </div>
              
              {previewText && (
                <div className="space-y-2">
                  <Label>ตัวอย่างผลลัพธ์</Label>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">ตัวอย่าง</span>
                    </div>
                    <p className="text-blue-900">{previewText}</p>
                  </div>
                </div>
              )}
              
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
            <div className="text-2xl font-bold text-blue-600">{templates.length}</div>
            <div className="text-sm text-gray-600">เทมเพลตทั้งหมด</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {templates.filter(t => t.isActive).length}
            </div>
            <div className="text-sm text-gray-600">เปิดใช้งาน</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {templates.filter(t => t.questionId).length}
            </div>
            <div className="text-sm text-gray-600">เกี่ยวข้องกับคำถาม</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {symptom.questions.length}
            </div>
            <div className="text-sm text-gray-600">คำถามที่มี</div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการเทมเพลต</CardTitle>
          <CardDescription>
            จัดการเทมเพลตข้อความสำหรับอาการ &quot;{symptom.name}&quot;
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <TemplateIcon className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">ยังไม่มีเทมเพลต</h3>
              <p className="text-gray-600 mb-4">เริ่มต้นด้วยการเพิ่มเทมเพลตแรกสำหรับอาการนี้</p>
              <Button onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มเทมเพลตใหม่
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">จัดเรียง</TableHead>
                      <TableHead>เทมเพลต</TableHead>
                      <TableHead>คำถามที่เกี่ยวข้อง</TableHead>
                      <TableHead>ค่าทริกเกอร์</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead className="text-center">ลำดับ</TableHead>
                      <TableHead className="text-center">การจัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <SortableContext 
                    items={templates.map(t => t.id)} 
                    strategy={verticalListSortingStrategy}
                  >
                    <TableBody>
                      {templates
                        .sort((a, b) => a.order - b.order)
                        .map((template) => (
                        <SortableTemplateRow
                          key={template.id}
                          template={template}
                          symptom={symptom}
                          onEdit={openDialog}
                          onDelete={handleDelete}
                          onToggleActive={toggleActive}
                        />
                      ))}
                    </TableBody>
                  </SortableContext>
                </Table>
              </DndContext>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Helper Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            คู่มือการใช้งานเทมเพลต
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">ตัวแปรที่สามารถใช้ได้:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <ul className="space-y-1 text-gray-700">
                  <li><code className="bg-gray-100 px-1 rounded">{'{value}'}</code> - ค่าที่ผู้ใช้เลือก</li>
                  <li><code className="bg-gray-100 px-1 rounded">{'{allergyName}'}</code> - ชื่อยาที่แพ้</li>
                  <li><code className="bg-gray-100 px-1 rounded">{'{duration}'}</code> - ระยะเวลาที่มีอาการ</li>
                </ul>
              </div>
              <div>
                <ul className="space-y-1 text-gray-700">
                  <li><code className="bg-gray-100 px-1 rounded">{'{fever}'}</code> - สถานะไข้</li>
                  <li><code className="bg-gray-100 px-1 rounded">{'{coughType}'}</code> - ประเภทการไอ</li>
                  <li><code className="bg-gray-100 px-1 rounded">{'{symptomSeverity}'}</code> - ความรุนแรง</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">ตัวอย่างการใช้งาน:</h4>
            <div className="bg-gray-50 p-3 rounded border text-sm">
              <p><strong>เทมเพลต:</strong> มีประวัติแพ้ยา {'{allergyName}'}</p>
              <p><strong>ผลลัพธ์:</strong> มีประวัติแพ้ยา Paracetamol</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}