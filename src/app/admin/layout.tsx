/* eslint-disable */
// @ts-nocheck
import { ReactNode } from 'react'

export default function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="compact min-h-screen bg-gray-50">
      {children}
    </div>
  )
}