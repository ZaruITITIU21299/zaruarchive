export interface NavItem {
  icon: string
  iconImage?: string
  shineColor?: string
  label: string
  path: string
  tKey: string
}

export interface GameTheme {
  primary: string
  primaryDark: string
  secondary: string
  accentPurple: string
  backgroundDark: string
  surfaceDark: string
  surfaceMid: string
  surfaceLight: string
  glassBorder: string
  glassBg: string
  borderDark: string
  glowPrimary: string
  glowSecondary: string
  neonGlow: string
  timelineColor: string
}

export interface GameConfig {
  id: string
  name: string
  icon: string
  description: string
  navItems: NavItem[]
  theme: GameTheme
  routes: string[]
  sidebarBackgrounds?: string[]
  contentBackgrounds?: string[]
}

const sharedNavItems: NavItem[] = [
  { icon: 'home', label: 'Welcome', path: '/', tKey: 'nav.welcome' },
  { icon: 'group', label: 'Characters', path: '/characters', tKey: 'nav.characters' },
  { icon: 'history', label: 'Timeline', path: '/timeline', tKey: 'nav.timeline' },
  { icon: 'menu_book', label: 'Terminology', path: '/terminology', tKey: 'nav.terminology' },
  { icon: 'lightbulb', label: 'Theory', path: '/theory', tKey: 'nav.theory' },
  { icon: 'auto_stories', label: 'Lore', path: '/lore', tKey: 'nav.lore' },
  { icon: 'newspaper', label: 'Articles', path: '/articles', tKey: 'nav.articles' },
]

const wuwaNavItems: NavItem[] = [
  { icon: 'home', iconImage: '/img/wuwa/Physical.webp', shineColor: '#ffffff', label: 'Welcome', path: '/', tKey: 'nav.welcome' },
  { icon: 'group', iconImage: '/img/wuwa/Spectro_Icon.png', shineColor: '#facc15', label: 'Characters', path: '/characters', tKey: 'nav.characters' },
  { icon: 'history', iconImage: '/img/wuwa/Electro_Icon.png', shineColor: '#a632b1', label: 'Timeline', path: '/timeline', tKey: 'nav.timeline' },
  { icon: 'menu_book', iconImage: '/img/wuwa/Glacio_Icon.png', shineColor: '#3b82f6', label: 'Terminology', path: '/terminology', tKey: 'nav.terminology' },
  { icon: 'lightbulb', iconImage: '/img/wuwa/Fusion_Icon.png', shineColor: '#ef4444', label: 'Theory', path: '/theory', tKey: 'nav.theory' },
  { icon: 'auto_stories', iconImage: '/img/wuwa/Havoc_Icon.png', shineColor: '#971553', label: 'Lore', path: '/lore', tKey: 'nav.lore' },
  { icon: 'newspaper', iconImage: '/img/wuwa/Aero_Icon.png', shineColor: '#22c55e', label: 'Articles', path: '/articles', tKey: 'nav.articles' },
]

const sharedRoutes = [
  '/', '/characters', '/characters/:id',
  '/timeline', '/timeline/detail', '/timeline/:id',
  '/terminology',
  '/theory', '/theory/:id',
  '/lore', '/lore/:id',
  '/articles', '/articles/:id',
]

export const GAMES: Record<string, GameConfig> = {
  wuwa: {
    id: 'wuwa',
    name: 'Wuthering Waves',
    icon: 'waves',
    description: 'Explore the world of Solaris-3 and uncover its mysteries.',
    navItems: wuwaNavItems,
    theme: {
      primary: '#0db9f2',
      primaryDark: '#0a9acb',
      secondary: '#8b5cf6',
      accentPurple: '#a855f7',
      backgroundDark: '#0a1216',
      surfaceDark: '#101e23',
      surfaceMid: '#162a30',
      surfaceLight: '#1a2c33',
      glassBorder: 'rgba(255, 255, 255, 0.08)',
      glassBg: 'rgba(16, 30, 35, 0.7)',
      borderDark: '#223f49',
      glowPrimary: 'rgba(13, 185, 242, 0.4)',
      glowSecondary: 'rgba(139, 92, 246, 0.3)',
      neonGlow: 'rgba(13, 185, 242, 0.4)',
      timelineColor: '#a855f7',
    },
    routes: [...sharedRoutes],
    sidebarBackgrounds: ['/img/wuwa/side-1.jpg', '/img/wuwa/side-2.jpg'],
    contentBackgrounds: ['/img/wuwa/background-1.jpg', '/img/wuwa/background-2.jpg'],
  },

  endfield: {
    id: 'endfield',
    name: 'Arknights: Endfield',
    icon: 'shield',
    description: 'Explore the Talos-II frontier and its Originium-powered civilization.',
    navItems: [...sharedNavItems],
    theme: {
      primary: '#f97316',
      primaryDark: '#ea580c',
      secondary: '#eab308',
      accentPurple: '#f59e0b',
      backgroundDark: '#0a0a0a',
      surfaceDark: '#141414',
      surfaceMid: '#1c1c1c',
      surfaceLight: '#242424',
      glassBorder: 'rgba(255, 255, 255, 0.06)',
      glassBg: 'rgba(20, 20, 20, 0.7)',
      borderDark: '#2a2a2a',
      glowPrimary: 'rgba(249, 115, 22, 0.4)',
      glowSecondary: 'rgba(234, 179, 8, 0.3)',
      neonGlow: 'rgba(249, 115, 22, 0.4)',
      timelineColor: '#f59e0b',
    },
    routes: [...sharedRoutes],
  },
}

export const GAME_IDS = Object.keys(GAMES)
export const DEFAULT_GAME_ID = 'wuwa'

export function getGameConfig(gameId: string): GameConfig {
  return GAMES[gameId] || GAMES[DEFAULT_GAME_ID]
}

export function hasRoute(gameId: string, path: string): boolean {
  const config = getGameConfig(gameId)
  return config.routes.some((route) => {
    const pattern = route.replace(/:[^/]+/g, '[^/]+')
    return new RegExp(`^${pattern}$`).test(path)
  })
}
