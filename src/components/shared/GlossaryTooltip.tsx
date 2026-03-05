import { useState } from 'react'
import { GLOSSARY_TERMS } from '@/lib/glossary'
import { useLanguage } from '@/contexts/LanguageContext'

interface GlossaryTooltipProps {
  term: string
  children: React.ReactNode
}

export function GlossaryTooltip({ term, children }: GlossaryTooltipProps) {
  const [show, setShow] = useState(false)
  const { lang } = useLanguage()
  const entry = GLOSSARY_TERMS[term]

  if (!entry) {
    return <span className="glossary-term">{children}</span>
  }

  const definition = lang === 'vi' ? entry.vi : entry.en

  return (
    <span
      className="glossary-term relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-4 bg-[#15262d]/95 backdrop-blur-xl border border-primary/40 rounded-lg shadow-[0_0_30px_rgba(13,185,242,0.15)] z-50">
          <span className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Glossary</span>
            <span className="material-symbols-outlined text-[16px] text-slate-500">info</span>
          </span>
          <span className="block text-sm text-white font-medium mb-1">{term}</span>
          <span className="block text-sm text-slate-300 leading-snug">{definition}</span>
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#15262d]/95" />
        </span>
      )}
    </span>
  )
}
