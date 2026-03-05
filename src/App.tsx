import { BrowserRouter } from 'react-router-dom'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { GameProvider } from '@/contexts/GameContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { AdminProvider } from '@/contexts/AdminContext'
import { AppRoutes } from '@/AppRoutes'

export default function App() {
  return (
    <BrowserRouter>
      <GameProvider>
        <LanguageProvider>
          <AuthProvider>
            <AdminProvider>
              <AppRoutes />
            </AdminProvider>
          </AuthProvider>
        </LanguageProvider>
      </GameProvider>
    </BrowserRouter>
  )
}
