import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminFromRequest(req)
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json({ 
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name
      }
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}