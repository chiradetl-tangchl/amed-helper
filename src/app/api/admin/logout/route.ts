import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ message: 'Logout successful' })
  
  // Clear the admin token cookie
  response.cookies.delete('admin-token')
  
  return response
}