import { useGame } from '@/contexts/GameContext'
import { useImageCrossfade } from '@/hooks/useImageCrossfade'

export function BackgroundEffects() {
  const { game } = useGame()
  const bgImages = game.contentBackgrounds
  const activeIndex = useImageCrossfade(bgImages)

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {bgImages && bgImages.length > 0 ? (
        <>
          {bgImages.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms] ease-in-out"
              style={{ opacity: i === activeIndex ? 1 : 0 }}
            />
          ))}
          <div className="absolute inset-0 bg-black/70" />
        </>
      ) : (
        <div
          style={{
            background: `
              radial-gradient(ellipse 60% 50% at 10% 10%, rgba(13, 185, 242, 0.08) 0%, transparent 70%),
              radial-gradient(ellipse 60% 50% at 90% 90%, rgba(139, 92, 246, 0.08) 0%, transparent 70%)
            `,
          }}
          className="absolute inset-0"
        />
      )}
      {!(bgImages && bgImages.length > 0) && (
        <div className="absolute inset-0 bg-grid" />
      )}
    </div>
  )
}
