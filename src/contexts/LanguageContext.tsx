import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface LanguageContextType {
  lang: string
  setLang: (lang: string) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const initial = localStorage.getItem('lang') || 'en'
  const [lang, setLangState] = useState(initial)
  const [translations, setTranslations] = useState<Record<string, string>>({})

  const setLang = (newLang: string) => {
    setLangState(newLang)
    localStorage.setItem('lang', newLang)
  }

  useEffect(() => {
    let mounted = true
    import(`../locales/${lang}.json`)
      .then((mod) => {
        if (mounted) setTranslations(mod.default || mod)
      })
      .catch(() => {
        if (mounted) setTranslations({})
      })
    return () => { mounted = false }
  }, [lang])

  const t = (key: string) => translations[key] || key

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
