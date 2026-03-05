export interface GlossaryEntry {
  en: string
  vi: string
}

export const GLOSSARY_TERMS: Record<string, GlossaryEntry> = {
  'Solaris-3': {
    en: 'The primary world explored in the Solaris Archive, filled with ruins, factions, and tacet anomalies.',
    vi: 'Thế giới chính trong Solaris Archive, đầy tàn tích, phe phái và dị thể tacet.',
  },
  'Tacet Discord': {
    en: 'Chaotic tacet anomalies that threaten the stability of Solaris-3.',
    vi: 'Những dị thể tacet hỗn loạn đe dọa sự ổn định của Solaris-3.',
  },
  Remnant: {
    en: 'Echoes and relics from past eras that still influence the present timeline.',
    vi: 'Dư âm và tàn tích từ các thời đại cũ vẫn còn ảnh hưởng đến hiện tại.',
  },
  Resonator: {
    en: 'Individuals attuned to tacet energy, capable of shaping the world around them.',
    vi: 'Những cá nhân cộng hưởng với năng lượng tacet, có thể tác động lên thế giới xung quanh.',
  },
  'Sentinel Jué': {
    en: 'Ancient guardians assigned to oversee human civilization and guide the development of specific regions.',
    vi: 'Những người bảo hộ cổ đại được giao nhiệm vụ giám sát nền văn minh nhân loại.',
  },
  Lament: {
    en: 'A cataclysmic event that fractured reality, bringing forth the Tacet Discords and changing the world.',
    vi: 'Một sự kiện thảm khốc phá vỡ thực tại, mang đến các Tacet Discord và thay đổi thế giới.',
  },
  'Retroact Rain': {
    en: 'A mysterious phenomenon causing temporal distortions in affected regions.',
    vi: 'Hiện tượng bí ẩn gây biến dạng thời gian ở các khu vực bị ảnh hưởng.',
  },
  'Resonance Liberation': {
    en: 'The ultimate ability of a Resonator, channeling their full tacet energy.',
    vi: 'Kỹ năng tối thượng của Resonator, tập trung toàn bộ năng lượng tacet.',
  },
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function extractGlossaryTags(text: string): string[] {
  if (!text) return []
  const lower = text.toLowerCase()
  return Object.keys(GLOSSARY_TERMS).filter((term) =>
    lower.includes(term.toLowerCase())
  )
}

export function buildGlossaryRegex(): RegExp | null {
  const terms = Object.keys(GLOSSARY_TERMS)
  if (!terms.length) return null
  const pattern = terms.map(escapeRegExp).join('|')
  return new RegExp(`(${pattern})`, 'gi')
}
