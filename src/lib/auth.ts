import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key'

export interface AdminPayload {
  id: number
  username: string
  name: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function signToken(payload: AdminPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): AdminPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminPayload
  } catch {
    return null
  }
}

export async function createDefaultAdmin() {
  const existingAdmin = await prisma.admin.findFirst()
  
  if (!existingAdmin) {
    const hashedPassword = await hashPassword(process.env.ADMIN_PASSWORD || 'admin123')
    
    await prisma.admin.create({
      data: {
        username: process.env.ADMIN_USERNAME || 'admin',
        password: hashedPassword,
        name: 'Administrator'
      }
    })
    
    console.log('Default admin created')
  }
}

export async function authenticateAdmin(username: string, password: string): Promise<AdminPayload | null> {
  const admin = await prisma.admin.findUnique({
    where: { username }
  })
  
  if (!admin) return null
  
  const isValid = await verifyPassword(password, admin.password)
  if (!isValid) return null
  
  return {
    id: admin.id,
    username: admin.username,
    name: admin.name
  }
}