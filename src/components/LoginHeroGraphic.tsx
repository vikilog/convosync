import { Bot, Mail, Phone, Workflow } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { ChannelIcon } from '@/components/channel-icon'
import type { ChannelKind } from '@/components/channel-icon'

type HeroNode = {
  id: string
  top: number
  left: number
  size: number
  chipClassName: string
  glowClassName: string
  iconClassName: string
  duration: string
  delay: string
  channel?: ChannelKind
  icon?: LucideIcon
}

const CENTER = { top: 40, left: 44 }

// Eight nodes evenly spaced (45° apart) on an ellipse around the center hub —
// ry < rx compensates for the panel being taller than it is wide, so the
// ring reads as a true circle rather than a squashed oval.
const HERO_NODES: HeroNode[] = [
  {
    id: 'whatsapp',
    channel: 'whatsapp',
    top: 20,
    left: 44,
    size: 54,
    chipClassName: 'bg-channel-green',
    glowClassName: 'shadow-[0_0_36px_7px_rgba(37,211,102,0.55)]',
    iconClassName: 'text-white',
    duration: '7.5s',
    delay: '0s',
  },
  {
    id: 'ai',
    icon: Bot,
    top: 25.9,
    left: 64.5,
    size: 54,
    chipClassName: 'bg-gradient-to-br from-[#8b5cf6] to-[#3b82f6]',
    glowClassName: 'shadow-[0_0_36px_7px_rgba(139,92,246,0.55)]',
    iconClassName: 'text-white',
    duration: '8.8s',
    delay: '1.7s',
  },
  {
    id: 'telegram',
    channel: 'telegram',
    top: 40,
    left: 73,
    size: 54,
    chipClassName: 'bg-channel-sky',
    glowClassName: 'shadow-[0_0_32px_6px_rgba(34,158,217,0.5)]',
    iconClassName: 'text-white',
    duration: '8.2s',
    delay: '1.1s',
  },
  {
    id: 'instagram',
    channel: 'instagram',
    top: 54.1,
    left: 64.5,
    size: 54,
    chipClassName: 'bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#FD8D32]',
    glowClassName: 'shadow-[0_0_36px_7px_rgba(225,48,108,0.5)]',
    iconClassName: 'text-white',
    duration: '9s',
    delay: '2.3s',
  },
  {
    id: 'automation',
    icon: Workflow,
    top: 60,
    left: 44,
    size: 54,
    chipClassName: 'bg-amber-500',
    glowClassName: 'shadow-[0_0_32px_6px_rgba(245,158,11,0.5)]',
    iconClassName: 'text-white',
    duration: '7.8s',
    delay: '2.9s',
  },
  {
    id: 'messenger',
    channel: 'messenger',
    top: 54.1,
    left: 23.5,
    size: 54,
    chipClassName: 'bg-[#1877F2]',
    glowClassName: 'shadow-[0_0_32px_6px_rgba(24,119,242,0.5)]',
    iconClassName: 'text-white',
    duration: '7s',
    delay: '0.6s',
  },
  {
    id: 'calling',
    icon: Phone,
    top: 40,
    left: 15,
    size: 54,
    chipClassName: 'bg-teal-500',
    glowClassName: 'shadow-[0_0_32px_6px_rgba(20,184,166,0.5)]',
    iconClassName: 'text-white',
    duration: '8.4s',
    delay: '0.9s',
  },
  {
    id: 'email',
    icon: Mail,
    top: 25.9,
    left: 23.5,
    size: 54,
    chipClassName: 'bg-white/90',
    glowClassName: 'shadow-[0_0_26px_5px_rgba(255,255,255,0.35)]',
    iconClassName: 'text-neutral-700',
    duration: '8.6s',
    delay: '1.9s',
  },
]

// Ambient dust drawn along each spoke, derived from the node layout so it
// always sits at the same relative point on the line regardless of edits.
const PARTICLES = HERO_NODES.map((n, i) => ({
  cx: CENTER.left + 0.55 * (n.left - CENTER.left),
  cy: CENTER.top + 0.55 * (n.top - CENTER.top),
  r: 0.6,
  delay: `${(i * 0.35).toFixed(2)}s`,
}))

const TRAVELING_LINES = [
  { id: 'whatsapp', dur: '4s', begin: '0s' },
  { id: 'instagram', dur: '5.5s', begin: '1.2s' },
  { id: 'calling', dur: '6.5s', begin: '2.4s' },
]

const BUBBLES: Array<{
  top: number
  left: number
  width: number
  height: number
  rotate: number
  opacity: number
  duration: string
  delay: string
  dot?: boolean
}> = [{ top: 78, left: 2, width: 84, height: 48, rotate: 2, opacity: 0.4, duration: '8.4s', delay: '1s' }]

/**
 * Illustrated login-hero: eight nodes (real channel logos plus AI,
 * automation and calling) placed symmetrically around a central ConvoSync
 * hub, joined by straight glowing spokes. Percentage layout + a 0–100
 * non-uniform viewBox keep the SVG spokes and the HTML nodes in the same
 * coordinate space at any size.
 */
export function LoginHeroGraphic() {
  return (
    <div className="animate-hero-drift absolute inset-0 will-change-transform">
      {/* ambient color wash */}
      <div className="absolute -bottom-24 -left-24 size-[420px] rounded-full bg-channel-green/20 blur-[100px]" />
      <div className="absolute top-1/3 left-1/2 size-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-channel-green/15 blur-[110px]" />

      {/* connecting spokes + particles */}
      <svg
        className="absolute inset-0 size-full [filter:drop-shadow(0_0_5px_rgba(80,240,160,0.55))]"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <g fill="none" stroke="#6ee7a8" strokeOpacity="0.55" strokeWidth="0.35" strokeLinecap="round">
          {HERO_NODES.map((n) => (
            <path key={n.id} id={`line-${n.id}`} d={`M${CENTER.left},${CENTER.top} L${n.left},${n.top}`} />
          ))}
        </g>

        {PARTICLES.map((p, i) => (
          <circle
            key={i}
            cx={p.cx}
            cy={p.cy}
            r={p.r}
            fill="#a7f3d0"
            className="animate-hero-twinkle"
            style={{ animationDelay: p.delay }}
          />
        ))}

        {TRAVELING_LINES.map((t) => (
          <circle key={t.id} r="0.85" fill="#eafff3">
            <animateMotion dur={t.dur} repeatCount="indefinite" begin={t.begin}>
              <mpath href={`#line-${t.id}`} />
            </animateMotion>
          </circle>
        ))}
      </svg>

      {/* decorative message-bubble card (kept clear of the symmetric ring) */}
      {BUBBLES.map((b, i) => (
        <div
          key={i}
          className="animate-hero-float absolute rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-sm"
          style={{
            top: `${b.top}%`,
            left: `${b.left}%`,
            width: b.width,
            height: b.height,
            opacity: b.opacity,
            transform: `rotate(${b.rotate}deg)`,
            animationDuration: b.duration,
            animationDelay: b.delay,
          }}
        >
          <div className="flex h-full flex-col justify-center gap-1.5 px-3">
            <div className="h-1.5 w-[70%] rounded-full bg-white/30" />
            <div className="h-1.5 w-[45%] rounded-full bg-white/20" />
          </div>
          {b.dot ? (
            <span className="absolute -right-1 -bottom-1 size-2.5 rounded-full bg-channel-green ring-2 ring-black/40" />
          ) : null}
        </div>
      ))}

      {/* nodes — symmetric ring */}
      {HERO_NODES.map((n) => {
        const Icon = n.icon
        return (
          <div
            key={n.id}
            className="animate-hero-float absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              top: `${n.top}%`,
              left: `${n.left}%`,
              animationDuration: n.duration,
              animationDelay: n.delay,
            }}
          >
            <div
              className={`flex items-center justify-center rounded-full ring-1 ring-white/20 ${n.chipClassName} ${n.glowClassName}`}
              style={{ width: n.size, height: n.size }}
            >
              {n.channel ? (
                <ChannelIcon channel={n.channel} className={`size-[45%] ${n.iconClassName}`} />
              ) : Icon ? (
                <Icon className={`size-[45%] ${n.iconClassName}`} />
              ) : null}
            </div>
          </div>
        )
      })}

      {/* central hub — the ConvoSync mark, the one stable anchor */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ top: `${CENTER.top}%`, left: `${CENTER.left}%` }}
      >
        <div className="animate-hero-glow absolute inset-0 -z-10 scale-150 rounded-full bg-channel-green blur-2xl" />
        <div className="relative flex size-28 items-center justify-center rounded-full bg-white shadow-[0_0_34px_8px_rgba(255,255,255,0.3)] ring-1 ring-white/50">
          <img src="/convosync-logo.png" alt="" className="size-14 object-contain" />
        </div>
      </div>
    </div>
  )
}
