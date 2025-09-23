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
  EyeOff
} from 'lucide-react'
import Swal from 'sweetalert2'

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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ลำดับ</TableHead>
                    <TableHead>ชื่ออาการ/โรค</TableHead>
                    <TableHead>รายละเอียด</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead className="text-center">คำถาม</TableHead>
                    <TableHead className="text-center">เทมเพลต</TableHead>
                    <TableHead className="text-center">การใช้งาน</TableHead>
                    <TableHead className="text-center">การจัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {symptoms.map((symptom) => (
                    <TableRow key={symptom.id}>
                      <TableCell className="font-medium">{symptom.order}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{symptom.name}</div>
                          <div className="text-xs text-gray-500">
                            อัปเดต: {new Date(symptom.updatedAt).toLocaleDateString('th-TH')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {symptom.description || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={symptom.isActive ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => toggleActive(symptom)}
                        >
                          {symptom.isActive ? (
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
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {symptom._count.questions}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {symptom._count.textTemplates}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {symptom._count.userSubmissions}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDialog(symptom)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/admin/symptoms/${symptom.id}/questions`)}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/admin/symptoms/${symptom.id}/templates`)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(symptom)}
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