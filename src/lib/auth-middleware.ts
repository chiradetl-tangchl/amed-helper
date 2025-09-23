import { NextRequest } from 'next/server'
import { verifyToken, AdminPayload } from '@/lib/auth'

export function getAdminFromRequest(req: NextRequest): AdminPayload | null {
  const token = req.cookies.get('admin-token')?.value
  
  if (!token) return null
  
  return verifyToken(token)
}

export function requireAdmin(req: NextRequest): AdminPayload {
  const admin = getAdminFromRequest(req)
  
  if (!admin) {
    throw new Error('Unauthorized')
  }
  
  return admin
}