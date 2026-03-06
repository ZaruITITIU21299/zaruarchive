import { BrowserRouter } from 'react-router-dom'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { GameProvider } from '@/contexts/GameContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { AdminProvider } from '@/contexts/AdminContext'
import { GlossaryProvider } from '@/contexts/GlossaryContext'
import { AppRoutes } from '@/AppRoutes'

export default function App() {
  return (
    <BrowserRouter>
      <GameProvider>
        <LanguageProvider>
          <AuthProvider>
            <AdminProvider>
              <GlossaryProvider>
                <AppRoutes />
              </GlossaryProvider>
            </AdminProvider>
          </AuthProvider>
        </LanguageProvider>
      </GameProvider>
    </BrowserRouter>
  )
}
