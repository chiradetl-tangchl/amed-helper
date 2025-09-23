'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Settings, 
  FileText, 
  Users, 
  BarChart3, 
  LogOut,
  Stethoscope,
  MessageSquare,
  Plus
} from 'lucide-react'
import Swal from 'sweetalert2'

interface AdminUser {
  id: number
  username: string
  name: string
}

export default function AdminDashboard() {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/me')
      if (response.ok) {
        const data = await response.json()
        setAdmin(data.admin)
      } else {
        router.push('/admin/login')
      }
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/admin/login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'ออกจากระบบ?',
      text: 'คุณแน่ใจหรือไม่ที่จะออกจากระบบ',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ออกจากระบบ',
      cancelButtonText: 'ยกเลิก'
    })

    if (result.isConfirmed) {
      try {
        await fetch('/api/admin/logout', { method: 'POST' })
        router.push('/admin/login')
      } catch (error) {
        console.error('Logout error:', error)
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

  const menuItems = [
    {
      title: 'จัดการอาการ/โรค',
      description: 'เพิ่ม แก้ไข ลบ อาการและโรคต่างๆ',
      icon: Stethoscope,
      href: '/admin/symptoms',
      color: 'bg-blue-500'
    },
    {
      title: 'สร้างฟอร์มคำถาม',
      description: 'ออกแบบฟอร์มและคำถามแบบไดนามิก',
      icon: MessageSquare,
      href: '/admin/questions',
      color: 'bg-green-500'
    },
    {
      title: 'จัดการเทมเพลต',
      description: 'กำหนดรูปแบบข้อความสรุป',
      icon: FileText,
      href: '/admin/templates',
      color: 'bg-purple-500'
    },
    {
      title: 'รายงานการใช้งาน',
      description: 'ดูสถิติและรายงานการใช้งาน',
      icon: BarChart3,
      href: '/admin/reports',
      color: 'bg-orange-500'
    }
  ]

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Amed Helper Admin</h1>
          <p className="text-gray-600 mt-1">ระบบจัดการฟอร์มช่วยกรอก Amed</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">ยินดีต้อนรับ</p>
            <p className="font-semibold text-gray-900">{admin?.name}</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            ออกจากระบบ
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">อาการ/โรค</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
              <Stethoscope className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">คำถาม</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
              <MessageSquare className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">เทมเพลต</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">การใช้งาน</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {menuItems.map((item) => (
          <Card key={item.title} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.color}`}>
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                onClick={() => router.push(item.href)}
                className="w-full"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                เข้าจัดการ
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>การดำเนินการด่วน</CardTitle>
          <CardDescription>เริ่มต้นใช้งานระบบ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => router.push('/admin/symptoms')}>
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มอาการใหม่
            </Button>
            <Button variant="outline" onClick={() => router.push('/')}>
              <FileText className="h-4 w-4 mr-2" />
              ดูหน้าผู้ใช้
            </Button>
            <Button variant="outline" onClick={() => router.push('/admin/templates')}>
              <FileText className="h-4 w-4 mr-2" />
              สร้างเทมเพลต
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}