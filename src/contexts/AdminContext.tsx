import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface AdminContextType {
  editMode: boolean
  toggleEditMode: () => void
  isAdmin: boolean
}

const AdminContext = createContext<AdminContextType | null>(null)

export function AdminProvider({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth()
  const [editMode, setEditMode] = useState(() => {
    return sessionStorage.getItem('editMode') === 'true'
  })

  const toggleEditMode = useCallback(() => {
    setEditMode((prev) => {
      const next = !prev
      sessionStorage.setItem('editMode', String(next))
      return next
    })
  }, [])

  const effectiveEditMode = isAdmin && editMode

  return (
    <AdminContext.Provider value={{ editMode: effectiveEditMode, toggleEditMode, isAdmin }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
  return ctx
}
