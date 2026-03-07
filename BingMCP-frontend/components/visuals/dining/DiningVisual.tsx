"use client"

import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

interface DiningVisualProps {
  className?: string
}

const GRID_ROWS = Array.from({ length: 12 }, (_, i) => i)
const GRID_COLS = Array.from({ length: 10 }, (_, i) => i)
const SCANLINES = Array.from({ length: 30 }, (_, i) => i)
const TRAILS = Array.from({ length: 9 }, (_, i) => i)

/**
 * Dining finder visual in a strict neon holographic style:
 * - Green/blue/white wireframe palette
 * - Scanlines + perspective grid-map
 * - Particle trails and glow accents
 */
export function DiningVisual({ className }: DiningVisualProps) {
  return (
    <div
      className={cn(
        "relative w-full max-w-xs aspect-[16/9] overflow-hidden rounded-2xl border border-cyan-400/40 bg-black shadow-sm",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_72%_18%,_rgba(0,255,136,0.14),_transparent_52%)]",
        className,
      )}
    >
      <motion.svg viewBox="0 0 160 90" className="h-full w-full" initial={false}>
        <defs>
          <linearGradient id="dining-grid-glow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00aaff" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#00ff88" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="tray-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00aaff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#00ff88" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Perspective grid map */}
        <motion.g
          stroke="#00aaff"
          strokeOpacity="0.34"
          strokeWidth="0.45"
          animate={{ y: [0, 7] }}
          transition={{ duration: 2.3, repeat: Infinity, ease: "linear" }}
        >
          {GRID_ROWS.map((row) => {
            const y = 38 + row * 4.8
            return <line key={`row-${row}`} x1={8} y1={y} x2={152} y2={y} />
          })}
          {GRID_COLS.map((col) => {
            const t = col / (GRID_COLS.length - 1)
            const xTop = 20 + t * 120
            const xBottom = 2 + t * 156
            return <line key={`col-${col}`} x1={xTop} y1={34} x2={xBottom} y2={89} />
          })}
        </motion.g>

        {/* Particle streak trails */}
        <motion.g
          stroke="#00aaff"
          strokeWidth="0.95"
          strokeLinecap="round"
          initial={false}
          animate={{ opacity: [0.22, 0.95, 0.22] }}
          transition={{ duration: 1.25, repeat: Infinity, ease: "easeInOut" }}
        >
          {TRAILS.map((i) => {
            const x = 16 + i * 16
            const y = 16 + (i % 4) * 9
            const len = 5 + (i % 3) * 3
            return (
              <motion.line
                key={`trail-${i}`}
                x1={x}
                y1={y}
                x2={x + len}
                y2={y + len * 0.72}
                animate={{ x1: [x - 8, x + 14], x2: [x + len - 8, x + len + 14] }}
                transition={{ duration: 1.45 + (i % 3) * 0.22, repeat: Infinity, ease: "linear", delay: i * 0.08 }}
              />
            )
          })}
        </motion.g>

        {/* Main tray shell */}
        <g>
          <rect x="30" y="20" width="100" height="52" rx="7" fill="none" stroke="url(#tray-stroke)" strokeWidth="1.15" />
          <rect x="34" y="24" width="92" height="44" rx="5" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="0.65" />
          <path d="M30 30 L130 30" stroke="#00ff88" strokeOpacity="0.22" strokeWidth="0.7" />
          <path d="M30 58 L130 58" stroke="#00ff88" strokeOpacity="0.22" strokeWidth="0.7" />
        </g>

        {/* Plate + food (overhead) */}
        <g>
          <circle cx="80" cy="45.5" r="14.8" fill="none" stroke="#ffffff" strokeOpacity="0.92" strokeWidth="1" />
          <circle cx="80" cy="45.5" r="11" fill="none" stroke="#00aaff" strokeOpacity="0.52" strokeWidth="0.8" />
          <path
            d="M73 45 C 74 39, 86 39, 88.5 44.2 C 90.6 48.8, 85.5 52.6, 79.8 52.3 C 74.5 52, 71.8 48.8, 73 45 Z"
            fill="#00ff88"
            fillOpacity="0.27"
            stroke="#00ff88"
            strokeOpacity="0.92"
            strokeWidth="0.9"
          />
          <path d="M75 43.8 C 78 42.1, 82.2 42.2, 84.4 44.3" fill="none" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="0.75" />
        </g>

        {/* Top-right glass */}
        <g>
          <ellipse cx="112" cy="31" rx="7" ry="2.9" fill="none" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="0.88" />
          <rect x="105" y="31" width="14" height="12" rx="2" fill="none" stroke="#00aaff" strokeOpacity="0.82" strokeWidth="0.9" />
          <ellipse cx="112" cy="43" rx="7" ry="2.9" fill="none" stroke="#00ff88" strokeOpacity="0.7" strokeWidth="0.78" />
          <path d="M108 34 L108 40" stroke="#ffffff" strokeOpacity="0.36" strokeWidth="0.75" />
        </g>

        {/* Holographic line accents */}
        <path d="M35 24 L42 24 L42 18" fill="none" stroke="#00ff88" strokeOpacity="0.92" strokeWidth="0.95" strokeLinecap="round" />
        <path d="M125 68 L118 68 L118 74" fill="none" stroke="#00ff88" strokeOpacity="0.92" strokeWidth="0.95" strokeLinecap="round" />

        {/* Glowing route-like line through tray */}
        <motion.path
          d="M24 64 C 44 55, 65 49, 94 41 C 111 36, 122 33, 139 25"
          fill="none"
          stroke="#00ff88"
          strokeWidth="1.45"
          strokeOpacity="0.9"
          strokeDasharray="5 6"
          animate={{ strokeDashoffset: [-22, 0] }}
          transition={{ duration: 1.9, repeat: Infinity, ease: "linear" }}
        />

        {/* Moving scanline sweep */}
        <motion.rect
          x="0"
          y="-16"
          width="160"
          height="12"
          fill="url(#dining-grid-glow)"
          fillOpacity="0.14"
          animate={{ y: [-16, 96] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        />
      </motion.svg>

      {/* Static scanline texture */}
      <svg viewBox="0 0 160 90" className="pointer-events-none absolute inset-0 h-full w-full opacity-55">
        {SCANLINES.map((i) => {
          const y = 2 + i * 3
          return <line key={`scan-${i}`} x1="0" y1={y} x2="160" y2={y} stroke="#00ff88" strokeOpacity="0.13" strokeWidth="0.35" />
        })}
      </svg>

      {/* Fork animation */}
      <motion.svg viewBox="0 0 160 90" className="pointer-events-none absolute inset-0 h-full w-full" initial={false}>
        <motion.g
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          animate={{ rotate: [-6, -2, -6], y: [0, -0.9, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <rect x="44" y="30" width="2.2" height="29" rx="1" fill="#ffffff" />
          <rect x="42.2" y="25" width="1" height="7" rx="0.4" fill="#00aaff" />
          <rect x="43.8" y="25" width="1" height="7" rx="0.4" fill="#00aaff" />
          <rect x="45.4" y="25" width="1" height="7" rx="0.4" fill="#00aaff" />
          <rect x="47" y="25" width="1" height="7" rx="0.4" fill="#00aaff" />
        </motion.g>
      </motion.svg>

      {/* Knife animation */}
      <motion.svg viewBox="0 0 160 90" className="pointer-events-none absolute inset-0 h-full w-full" initial={false}>
        <motion.g
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          animate={{ rotate: [5, 1.5, 5], y: [0, 0.9, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
        >
          <rect x="114" y="31" width="2.35" height="28" rx="1" fill="#ffffff" />
          <path d="M116.35 24.2 L120.6 32 L116.35 32 Z" fill="#ffffff" />
          <path d="M116.35 24.2 L118.3 31.4 L116.35 31.4 Z" fill="#00ff88" fillOpacity="0.85" />
        </motion.g>
      </motion.svg>
    </div>
  )
}
