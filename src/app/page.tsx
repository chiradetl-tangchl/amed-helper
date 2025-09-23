'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to form page immediately
    router.replace('/form')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-8 relative">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
        </div>
        <p className="text-slate-600 text-lg font-medium">กำลังโหลด...</p>
      </div>
    </div>
  )
}
