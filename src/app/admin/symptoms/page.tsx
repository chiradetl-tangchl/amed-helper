'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  MessageSquare,
  FileText,
  Users,
  Eye,
  EyeOff,
  Copy,
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
  description: string | null
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
  _count: {
    questions: number
    textTemplates: number
    userSubmissions: number
  }
}

// SortableRow component for drag and drop
function SortableRow({ 
  symptom, 
  onEdit, 
  onDelete, 
  onCopy, 
  onToggleActive,
  router 
}: {
  symptom: Symptom
  onEdit: (symptom: Symptom) => void
  onDelete: (symptom: Symptom) => void
  onCopy: (symptom: Symptom) => void
  onToggleActive: (symptom: Symptom) => void
  router: any
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: symptom.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
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
      <TableCell className="font-medium">{symptom.name}</TableCell>
      <TableCell className="max-w-xs">
        <div className="truncate" title={symptom.description || ''}>
          {symptom.description || '-'}
        </div>
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleActive(symptom)}
          className={symptom.isActive ? 'text-green-600' : 'text-red-600'}
        >
          {symptom.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
      </TableCell>
      <TableCell className="text-center">{symptom.order}</TableCell>
      <TableCell className="text-center">{symptom._count.questions}</TableCell>
      <TableCell className="text-center">{symptom._count.textTemplates}</TableCell>
      <TableCell className="text-center">{symptom._count.userSubmissions}</TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/symptoms/${symptom.id}/questions`)}
            title="จัดการคำถาม"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/symptoms/${symptom.id}/templates`)}
            title="จัดการเทมเพลต"
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopy(symptom)}
            title="ทำสำเนา"
            className="text-blue-600"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(symptom)}
            title="แก้ไข"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(symptom)}
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

export default function SymptomsPage() {
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSymptom, setEditingSymptom] = useState<Symptom | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    order: 0
  })
  const router = useRouter()

  useEffect(() => {
    fetchSymptoms()
  }, [])

  const fetchSymptoms = async () => {
    try {
      const response = await fetch('/api/admin/symptoms')
      if (response.ok) {
        const data = await response.json()
        setSymptoms(data.symptoms)
      } else if (response.status === 401) {
        router.push('/admin/login')
      }
    } catch (error) {
      console.error('Fetch symptoms error:', error)
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลได้', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const openDialog = (symptom?: Symptom) => {
    if (symptom) {
      setEditingSymptom(symptom)
      setFormData({
        name: symptom.name,
        description: symptom.description || '',
        order: symptom.order
      })
    } else {
      setEditingSymptom(null)
      setFormData({
        name: '',
        description: '',
        order: Math.max(...symptoms.map(s => s.order), 0) + 1
      })
    }
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingSymptom(null)
    setFormData({ name: '', description: '', order: 0 })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกชื่ออาการ', 'warning')
      return
    }

    try {
      const url = editingSymptom 
        ? `/api/admin/symptoms/${editingSymptom.id}`
        : '/api/admin/symptoms'
      
      const method = editingSymptom ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchSymptoms()
        closeDialog()
        Swal.fire({
          title: 'สำเร็จ!',
          text: editingSymptom ? 'แก้ไขอาการเรียบร้อย' : 'เพิ่มอาการใหม่เรียบร้อย',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        })
      } else {
        const data = await response.json()
        Swal.fire('เกิดข้อผิดพลาด', data.error || 'ไม่สามารถบันทึกข้อมูลได้', 'error')
      }
    } catch (error) {
      console.error('Save symptom error:', error)
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้', 'error')
    }
  }

  const handleDelete = async (symptom: Symptom) => {
    const result = await Swal.fire({
      title: 'ลบอาการนี้?',
      text: `คุณแน่ใจหรือไม่ที่จะลบ "${symptom.name}" (รวมคำถามและเทมเพลตทั้งหมด)`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก'
    })

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/admin/symptoms/${symptom.id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          await fetchSymptoms()
          Swal.fire('ลบเรียบร้อย!', 'อาการถูกลบออกจากระบบแล้ว', 'success')
        } else {
          const data = await response.json()
          Swal.fire('เกิดข้อผิดพลาด', data.error || 'ไม่สามารถลบข้อมูลได้', 'error')
        }
      } catch (error) {
        console.error('Delete symptom error:', error)
        Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถลบข้อมูลได้', 'error')
      }
    }
  }

  const copySymptom = async (symptom: Symptom) => {
    const result = await Swal.fire({
      title: 'ทำสำเนาอาการ',
      text: `คุณต้องการทำสำเนาของ "${symptom.name}" หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'ทำสำเนา',
      cancelButtonText: 'ยกเลิก'
    })

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/admin/symptoms/${symptom.id}/copy`, {
          method: 'POST'
        })

        if (response.ok) {
          await fetchSymptoms()
          Swal.fire('ทำสำเนาเรียบร้อย!', 'สร้างสำเนาอาการใหม่แล้ว', 'success')
        } else {
          const data = await response.json()
          Swal.fire('เกิดข้อผิดพลาด', data.error || 'ไม่สามารถทำสำเนาได้', 'error')
        }
      } catch (error) {
        console.error('Copy symptom error:', error)
        Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถทำสำเนาได้', 'error')
      }
    }
  }

  const toggleActive = async (symptom: Symptom) => {
    try {
      const response = await fetch(`/api/admin/symptoms/${symptom.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...symptom,
          isActive: !symptom.isActive
        }),
      })

      if (response.ok) {
        await fetchSymptoms()
        Swal.fire({
          title: 'อัปเดตเรียบร้อย!',
          text: symptom.isActive ? 'ปิดใช้งานอาการแล้ว' : 'เปิดใช้งานอาการแล้ว',
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
      const oldIndex = symptoms.findIndex((item) => item.id === active.id)
      const newIndex = symptoms.findIndex((item) => item.id === over?.id)

      const newSymptoms = arrayMove(symptoms, oldIndex, newIndex)
      
      // Update order in the array
      const updatedSymptoms = newSymptoms.map((symptom, index) => ({
        ...symptom,
        order: index + 1
      }))
      
      setSymptoms(updatedSymptoms)

      // Update order in database
      try {
        const updatePromises = updatedSymptoms.map((symptom) =>
          fetch(`/api/admin/symptoms/${symptom.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...symptom, order: symptom.order }),
          })
        )

        await Promise.all(updatePromises)
        
        Swal.fire({
          title: 'จัดเรียงเรียบร้อย!',
          text: 'อัปเดตลำดับอาการแล้ว',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        })
      } catch (error) {
        console.error('Update order error:', error)
        // Revert changes on error
        await fetchSymptoms()
        Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถอัปเดตลำดับได้', 'error')
      }
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

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับ
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">จัดการอาการ/โรค</h1>
            <p className="text-gray-600">เพิ่ม แก้ไข ลบ อาการและโรคต่างๆ</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              เพิ่มอาการใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingSymptom ? 'แก้ไขอาการ' : 'เพิ่มอาการใหม่'}
              </DialogTitle>
              <DialogDescription>
                กรอกข้อมูลอาการ/โรคที่ต้องการเพิ่มในระบบ
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">ชื่ออาการ/โรค *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น ไข้ ไอ เจ็บคอ"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">รายละเอียด</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
                  rows={3}
                />
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{symptoms.length}</div>
            <div className="text-sm text-gray-600">อาการ/โรคทั้งหมด</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {symptoms.filter(s => s.isActive).length}
            </div>
            <div className="text-sm text-gray-600">เปิดใช้งาน</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {symptoms.reduce((sum, s) => sum + s._count.questions, 0)}
            </div>
            <div className="text-sm text-gray-600">คำถามทั้งหมด</div>
          </CardContent>
        </Card>
      </div>

      {/* Symptoms Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการอาการ/โรค</CardTitle>
          <CardDescription>
            จัดการอาการและโรคที่มีในระบบ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {symptoms.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <MessageSquare className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">ยังไม่มีอาการในระบบ</h3>
              <p className="text-gray-600 mb-4">เริ่มต้นด้วยการเพิ่มอาการหรือโรคแรกของคุณ</p>
              <Button onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มอาการใหม่
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
                      <TableHead>ชื่ออาการ/โรค</TableHead>
                      <TableHead>รายละเอียด</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead className="text-center">ลำดับ</TableHead>
                      <TableHead className="text-center">คำถาม</TableHead>
                      <TableHead className="text-center">เทมเพลต</TableHead>
                      <TableHead className="text-center">การใช้งาน</TableHead>
                      <TableHead className="text-center">การจัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <SortableContext 
                    items={symptoms.map(s => s.id)} 
                    strategy={verticalListSortingStrategy}
                  >
                    <TableBody>
                      {symptoms
                        .sort((a, b) => a.order - b.order)
                        .map((symptom) => (
                        <SortableRow
                          key={symptom.id}
                          symptom={symptom}
                          onEdit={openDialog}
                          onDelete={handleDelete}
                          onCopy={copySymptom}
                          onToggleActive={toggleActive}
                          router={router}
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
    </div>
  )
}