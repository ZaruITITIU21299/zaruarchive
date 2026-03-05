import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAdmin } from '@/contexts/AdminContext'
import { useGame } from '@/contexts/GameContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { AdminService } from '@/services/AdminService'
import { EventForm, type EventFormData } from '@/components/admin/forms/EventForm'
import { TimelineForm, type TimelineFormData } from '@/components/admin/forms/TimelineForm'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'

const filters = ['All Events', 'War & Conflict', 'Technology', 'Discovery'] as const

interface TimelineEventData {
  year: string
  title: string
  description: string
  tags: string[]
  side: 'left' | 'right'
  color: 'accent-purple' | 'primary'
  image: string
}

const timelineEvents: TimelineEventData[] = [
  {
    year: 'Year 1024',
    title: 'The Great Collapse',
    description:
      'A cataclysmic event shattered the foundations of Solaris-3, plunging the entire sector into darkness. Energy grids failed, communications went silent, and millions were displaced as the planet\'s core destabilized beyond recovery.',
    tags: ['#Cataclysm', '#Solaris-3'],
    side: 'right',
    color: 'accent-purple',
    image: 'https://picsum.photos/seed/collapse/640/360',
  },
  {
    year: 'Year 1050',
    title: 'Rise of the Remnant',
    description:
      'From the ashes of the Collapse, a new military coalition emerged. The Remnant unified scattered factions under a single banner, establishing order through strength and forging alliances that would shape the next century.',
    tags: ['#Factions', '#Military'],
    side: 'left',
    color: 'primary',
    image: 'https://picsum.photos/seed/remnant/640/360',
  },
  {
    year: 'Year 1102',
    title: 'The First Spark',
    description:
      'Researchers at the Void Observatory discovered a previously unknown energy signature emanating from the planet\'s fractured core. This "Spark" would become the foundation of a new era of technological advancement.',
    tags: ['#Science', '#Energy'],
    side: 'right',
    color: 'accent-purple',
    image: 'https://picsum.photos/seed/spark/640/360',
  },
  {
    year: 'Year 1130',
    title: 'Rebuilding Solaris-3',
    description:
      'With Spark technology harnessed, reconstruction efforts began in earnest. Political factions clashed over resource allocation while engineers raced to rebuild critical infrastructure across the devastated surface.',
    tags: ['#Solaris-3', '#Politics'],
    side: 'left',
    color: 'primary',
    image: 'https://picsum.photos/seed/rebuild/640/360',
  },
]

export function TimelinePage() {
  const [activeFilter, setActiveFilter] = useState<string>('All Events')
  const navigate = useNavigate()
  const { editMode } = useAdmin()
  const { gameId } = useGame()
  const { lang } = useLanguage()

  const [eventFormOpen, setEventFormOpen] = useState(false)
  const [timelineFormOpen, setTimelineFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'event' | 'timeline'; id: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleSaveEvent = async (data: EventFormData) => {
    const svc = new AdminService(gameId, lang)
    if (editingEvent !== null) {
      await svc.updateEvent(String(editingEvent), {
        title: { en: data.title_en, vi: data.title_vi },
        description: { en: data.description_en, vi: data.description_vi },
        time_label: { en: data.time_label_en, vi: data.time_label_vi },
        image_path: data.image_path,
        position: data.position,
        child_timeline_id: data.child_timeline_id ? Number(data.child_timeline_id) : null,
      })
    } else {
      await svc.createEvent({
        timeline_id: 1,
        title: { en: data.title_en, vi: data.title_vi },
        description: { en: data.description_en, vi: data.description_vi },
        time_label: { en: data.time_label_en, vi: data.time_label_vi },
        image_path: data.image_path,
        position: data.position,
        child_timeline_id: data.child_timeline_id ? Number(data.child_timeline_id) : null,
      })
    }
    setEventFormOpen(false)
    setEditingEvent(null)
  }

  const handleSaveTimeline = async (data: TimelineFormData) => {
    const svc = new AdminService(gameId, lang)
    await svc.createTimeline({
      title: { en: data.title_en, vi: data.title_vi },
      description: { en: data.description_en, vi: data.description_vi },
      cover_path: data.cover_path,
      display_order: data.display_order,
      parent_timeline_id: data.parent_timeline_id ? Number(data.parent_timeline_id) : null,
    })
    setTimelineFormOpen(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const svc = new AdminService(gameId, lang)
    if (deleteTarget.type === 'event') {
      await svc.deleteEvent(deleteTarget.id)
    } else {
      await svc.deleteTimeline(deleteTarget.id)
    }
    setDeleteTarget(null)
    setDeleting(false)
  }

  return (
    <div className="min-h-screen text-slate-200">
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
          <Link to="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-slate-200">Main Timeline</span>
        </nav>

        {/* Page header */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-purple/10 border border-accent-purple/30 text-accent-purple text-xs font-semibold tracking-wider uppercase mb-6">
            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
            Historical Archive
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-[--font-display] mb-4 bg-gradient-to-r from-primary via-accent-purple to-primary bg-clip-text text-transparent">
            Chronicles of Solaris
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Trace the defining moments that shaped our world — from the Great Collapse
            to the dawn of a new civilization built upon the remnants of the old.
          </p>

          {/* Admin buttons */}
          {editMode && (
            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={() => setTimelineFormOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 transition-colors text-sm font-medium"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add Timeline
              </button>
              <button
                onClick={() => { setEditingEvent(null); setEventFormOpen(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-purple/20 border border-accent-purple/30 text-accent-purple hover:bg-accent-purple/30 transition-colors text-sm font-medium"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add Event
              </button>
            </div>
          )}

          {/* Filter buttons */}
          <div className="flex flex-wrap justify-center gap-3 mt-10">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  activeFilter === filter
                    ? 'bg-primary text-white shadow-[0_0_20px_rgba(13,185,242,0.3)]'
                    : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-slate-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </header>

        {/* Timeline */}
        <div className="relative">
          {/* Spine */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 timeline-line" />

          <div className="space-y-12 md:space-y-16">
            {timelineEvents.map((event, index) => {
              const isRight = event.side === 'right'

              return (
                <div
                  key={index}
                  className="relative flex items-start md:items-center"
                >
                  {/* Dot */}
                  <div
                    className={`absolute left-0 md:left-1/2 md:-translate-x-1/2 z-10 w-8 h-8 rounded-full bg-background-dark border-2 border-accent-purple timeline-dot flex items-center justify-center`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-accent-purple" />
                  </div>

                  {/* Card wrapper for alternating layout */}
                  <div
                    className={`ml-14 md:ml-0 md:w-[calc(50%-2.5rem)] ${
                      isRight ? 'md:ml-auto md:pl-0' : 'md:mr-auto md:pr-0'
                    }`}
                  >
                    <div
                      onClick={() => navigate(`/timeline?event=${index}`)}
                      className="glass-panel rounded-2xl p-5 cursor-pointer group hover:border-primary/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(13,185,242,0.08)] relative"
                    >
                      {editMode && (
                        <div className="absolute top-3 right-3 z-20 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingEvent(index); setEventFormOpen(true); }}
                            className="px-2 py-1 rounded bg-amber-600/80 hover:bg-amber-600 text-white text-xs font-medium transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'event', id: String(index) }); }}
                            className="px-2 py-1 rounded bg-red-600/80 hover:bg-red-600 text-white text-xs font-medium transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                      {/* Year badge */}
                      <div className="flex items-center gap-3 mb-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${
                            event.color === 'accent-purple'
                              ? 'bg-accent-purple/15 text-accent-purple border border-accent-purple/30'
                              : 'bg-primary/15 text-primary border border-primary/30'
                          }`}
                        >
                          {event.year}
                        </span>
                        <div className="h-px flex-1 bg-white/5" />
                        <span className="material-symbols-outlined text-[18px] text-slate-500 group-hover:text-primary transition-colors">
                          open_in_new
                        </span>
                      </div>

                      {/* Image */}
                      <div className="relative aspect-video rounded-xl overflow-hidden mb-4">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold font-[--font-display] text-white mb-2 group-hover:text-primary transition-colors">
                        {event.title}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-slate-400 leading-relaxed mb-4 line-clamp-3">
                        {event.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {event.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-1 rounded bg-white/5 text-xs text-slate-400 border border-white/5 hover:border-primary/30 hover:text-primary transition-all"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Load more */}
        <div className="text-center mt-16">
          <button className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all text-sm font-medium">
            <span className="material-symbols-outlined text-[20px]">expand_more</span>
            Load Later Events
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12 text-center text-sm text-slate-500">
        <div className="max-w-6xl mx-auto px-4">
          <p className="font-[--font-display] text-slate-400 mb-2">Zaru Archive</p>
          <p>Chronicling the events of Solaris since Year 0</p>
        </div>
      </footer>

      {eventFormOpen && (
        <EventForm
          event={editingEvent !== null ? {
            id: String(editingEvent),
            title: timelineEvents[editingEvent]?.title ?? '',
            description: timelineEvents[editingEvent]?.description ?? '',
            timeLabel: timelineEvents[editingEvent]?.year ?? '',
            imagePath: null,
            position: editingEvent,
            childTimelineId: null,
          } : null}
          timelineId="1"
          onSave={handleSaveEvent}
          onCancel={() => { setEventFormOpen(false); setEditingEvent(null); }}
        />
      )}

      {timelineFormOpen && (
        <TimelineForm
          onSave={handleSaveTimeline}
          onCancel={() => setTimelineFormOpen(false)}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title={deleteTarget?.type === 'timeline' ? 'Delete Timeline' : 'Delete Event'}
        message="This will be soft-deleted and hidden from visitors."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
