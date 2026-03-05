import { Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { usePageTransition } from '@/components/layout/PageTransition'
import HomePage from '@/pages/HomePage'
import CharacterGridPage from '@/pages/CharacterGridPage'
import CharacterDetailPage from '@/pages/CharacterDetailPage'
import { TimelinePage } from '@/pages/TimelinePage'
import { TimelineDetailPanel } from '@/pages/TimelineDetailPanel'
import TerminologyPage from '@/pages/TerminologyPage'
import TheoryPage from '@/pages/TheoryPage'
import LorePage from '@/pages/LorePage'
import ArticlesPage from '@/pages/ArticlesPage'
import ArticleDetailPage from '@/pages/ArticleDetailPage'

function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] text-white text-2xl font-bold font-[--font-display]">
      Page not found
    </div>
  )
}

export function AppRoutes() {
  const { displayLocation, animClass, transitioning } = usePageTransition()

  return (
    <AppLayout>
      <div
        className={animClass}
        style={transitioning ? { pointerEvents: 'none' } : undefined}
      >
        <Routes location={displayLocation}>
          <Route path="/" element={<HomePage />} />
          <Route path="/characters" element={<CharacterGridPage />} />
          <Route path="/characters/:id" element={<CharacterDetailPage />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/timeline/detail" element={<TimelineDetailPanel />} />
          <Route path="/timeline/:id" element={<TimelinePage />} />
          <Route path="/terminology" element={<TerminologyPage />} />
          <Route path="/theory" element={<TheoryPage />} />
          <Route path="/theory/:id" element={<ArticleDetailPage />} />
          <Route path="/lore" element={<LorePage />} />
          <Route path="/lore/:id" element={<ArticleDetailPage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/articles/:id" element={<ArticleDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </AppLayout>
  )
}
