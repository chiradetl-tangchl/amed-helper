'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import { 
  Stethoscope, 
  Search,
  ArrowRight,
  ChevronRight,
  FileText,
  Settings,
  Clock,
  Users
} from 'lucide-react'

interface Symptom {
  id: number
  name: string
  description: string | null
  order: number
}

export default function FormPage() {
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [filteredSymptoms, setFilteredSymptoms] = useState<Symptom[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchSymptoms()
  }, [])

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = symptoms.filter(symptom =>
        symptom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (symptom.description && symptom.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredSymptoms(filtered)
    } else {
      setFilteredSymptoms(symptoms)
    }
  }, [searchTerm, symptoms])

  const fetchSymptoms = async () => {
    try {
      const response = await fetch('/api/symptoms')
      if (response.ok) {
        const data = await response.json()
        setSymptoms(data.symptoms)
        setFilteredSymptoms(data.symptoms)
      } else {
        console.error('Failed to fetch symptoms')
      }
    } catch (error) {
      console.error('Fetch symptoms error:', error)
    } finally {
      setIsLoading(false)
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
                <Button variant="outline" size="sm" asChild className="border-2 border-slate-600 text-slate-700 hover:bg-slate-100 bg-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl px-4 py-2 font-semibold">
                  <Link href="/admin/login">
                    <Settings className="h-4 w-4 mr-2" />
                    Admin
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
            <h2 className="text-2xl font-bold text-slate-800 mb-3">กำลังโหลดข้อมูล</h2>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-blue-200 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
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
            
            {/* Navigation items */}
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild className="border-2 border-slate-600 text-slate-700 hover:bg-slate-100 bg-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl px-4 py-2 font-semibold">
                <Link href="/admin/login">
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
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

      <div className="relative z-10 container mx-auto px-6 py-12 max-w-7xl">
        {/* Enhanced Header */}
        <div className="text-center mb-12">
          <div className="bg-white/90 backdrop-blur-sm shadow-2xl border border-blue-200 rounded-2xl p-8 hover:shadow-3xl transition-all duration-300 mb-8">
            <h1 className="text-4xl md:text-4xl font-black mb-4 tracking-tight bg-gradient-to-r from-blue-700 via-purple-700 to-indigo-700 bg-clip-text text-transparent leading-tight">
              เลือกอาการที่ต้องการ
            </h1>
            <p className="text-xl text-slate-600 mb-6 max-w-3xl mx-auto leading-relaxed font-medium">
              เลือกอาการหรือโรคที่คุณต้องการกรอกข้อมูล ระบบจะนำคุณไปยังแบบฟอร์มที่เหมาะสม
            </p>
            
            {/* Enhanced Search */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 h-6 w-6" />
                <Input
                  type="text"
                  placeholder="ค้นหาอาการ เช่น ไข้ ไอ ปวดหัว..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 text-lg border-2 border-blue-200 bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Symptoms Grid */}
        {filteredSymptoms.length === 0 ? (
          <div className="text-center py-16">
            <Card className="max-w-lg mx-auto border border-blue-200 bg-white/90 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden">
              <CardContent className="p-12">
                {searchTerm ? (
                  <div>
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Search className="h-10 w-10 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-3">
                      ไม่พบอาการที่ค้นหา
                    </h3>
                    <p className="text-slate-600 mb-6 text-lg leading-relaxed">
                      ลองใช้คำค้นหาอื่น หรือเลือกจากรายการทั้งหมด
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => setSearchTerm('')}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6 py-3 text-base font-semibold hover:scale-105"
                    >
                      แสดงทั้งหมด
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileText className="h-10 w-10 text-red-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-3">
                      ยังไม่มีอาการในระบบ
                    </h3>
                    <p className="text-slate-600 mb-6 text-lg leading-relaxed">
                      กรุณาติดต่อผู้ดูแลระบบเพื่อเพิ่มอาการ
                    </p>
                    <Button variant="outline" asChild className="bg-gradient-to-r from-slate-600 to-gray-600 hover:from-slate-700 hover:to-gray-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6 py-3 text-base font-semibold hover:scale-105">
                      <Link href="/admin/login">
                        เข้าสู่ระบบ Admin
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
            {filteredSymptoms.map((symptom) => (
              <Card 
                key={symptom.id} 
                className="group border border-blue-200/50 bg-white/90 backdrop-blur-sm hover:bg-white hover:shadow-2xl hover:border-blue-300 transition-all duration-500 rounded-2xl overflow-hidden hover:scale-[1.02] hover:-translate-y-2 cursor-pointer"
                onClick={() => router.push(`/form/${symptom.id}`)}
              >
                <CardHeader className="border-b border-blue-100 pb-2 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 pt-2 pl-2">
                      <CardTitle className="text-xl font-bold text-slate-800 leading-tight mb-2 group-hover:text-blue-800 transition-colors">
                        {symptom.name}
                      </CardTitle>
                      {symptom.description && (
                        <CardDescription className="text-base text-slate-600 leading-relaxed font-medium">
                          {symptom.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200 rounded-xl p-1 group-hover:scale-110 transition-transform duration-300">
                      <ArrowRight className="h-6 w-6 text-blue-600 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 pb-4">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-sm px-3 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200 font-semibold rounded-full">
                      ลำดับ {symptom.order}
                    </Badge>
                    <Button 
                      size="sm" 
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl px-4 py-2 font-semibold hover:scale-105"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/form/${symptom.id}`)
                      }}
                    >
                      เริ่มกรอก
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Enhanced Info Section */}
  

        {/* Enhanced Stats */}
        
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