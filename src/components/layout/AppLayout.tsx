import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { BackgroundEffects } from './BackgroundEffects'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="bg-background-dark text-slate-100 min-h-screen">
      <BackgroundEffects />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      <div
        className={`relative z-10 min-h-screen transition-[margin] duration-500 ease-in-out ${
          collapsed ? 'ml-[72px]' : 'ml-72'
        }`}
      >
        {children}
      </div>
    </div>
  )
}
