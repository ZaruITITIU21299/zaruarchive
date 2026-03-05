import { BaseService } from './BaseService'
import type { Timeline, TimelineEvent } from '@/types'

export class TimelineService extends BaseService {
  async fetchAll(): Promise<Timeline[]> {
    const { data, error } = await this.db
      .from('timelines')
      .select(`
        id, game_id, cover_path, display_order, parent_timeline_id,
        timeline_translations!inner ( title, description ),
        events!events_timeline_id_fkey (
          id, image_path, position, child_timeline_id, status, deleted_at,
          event_translations!inner ( title, description, time_label )
        )
      `)
      .eq('game_id', this.gameId)
      .eq('timeline_translations.lang', this.lang)
      .eq('events.event_translations.lang', this.lang)
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('display_order', { ascending: true })

    if (error) throw new Error(`Failed to fetch timelines: ${error.message}`)

    return (data ?? []).map((row: Record<string, unknown>) => this.mapTimeline(row))
  }

  async fetchById(id: string): Promise<Timeline | null> {
    const { data, error } = await this.db
      .from('timelines')
      .select(`
        id, game_id, cover_path, display_order, parent_timeline_id,
        timeline_translations!inner ( title, description ),
        events!events_timeline_id_fkey (
          id, image_path, position, child_timeline_id, status, deleted_at,
          event_translations!inner ( title, description, time_label )
        )
      `)
      .eq('id', id)
      .eq('timeline_translations.lang', this.lang)
      .eq('events.event_translations.lang', this.lang)
      .is('deleted_at', null)
      .maybeSingle()

    if (error) throw new Error(`Failed to fetch timeline: ${error.message}`)
    if (!data) return null

    return this.mapTimeline(data as Record<string, unknown>)
  }

  private mapTimeline(row: Record<string, unknown>): Timeline {
    const trans = (row.timeline_translations as Array<Record<string, string>>)?.[0] ?? {}
    const rawEvents = (row.events as Array<Record<string, unknown>>) ?? []

    const events: TimelineEvent[] = rawEvents
      .filter((e) => e.status === 'published' && !e.deleted_at)
      .sort((a, b) => ((a.position as number) ?? 0) - ((b.position as number) ?? 0))
      .map((e) => {
        const eTrans = (e.event_translations as Array<Record<string, string>>)?.[0] ?? {}
        return {
          id: String(e.id),
          title: eTrans.title ?? '',
          description: eTrans.description ?? '',
          timeLabel: eTrans.time_label ?? '',
          imagePath: (e.image_path as string) ?? null,
          position: (e.position as number) ?? 0,
          childTimelineId: e.child_timeline_id ? String(e.child_timeline_id) : null,
        }
      })

    return {
      id: String(row.id),
      gameId: row.game_id as string,
      coverPath: (row.cover_path as string) ?? null,
      displayOrder: (row.display_order as number) ?? 0,
      parentTimelineId: row.parent_timeline_id ? String(row.parent_timeline_id) : null,
      title: trans.title ?? 'Untitled',
      description: trans.description ?? '',
      events,
    }
  }

  getEventById(timeline: Timeline, eventId: string): TimelineEvent | undefined {
    return timeline.events.find((e) => e.id === eventId)
  }
}
