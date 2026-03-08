"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

interface DiningVisualProps {
  className?: string
}

export function DiningVisual({ className }: DiningVisualProps) {
  const { theme } = useTheme()
  const isLight = theme === "light"
  const cGreen = isLight ? "#00aa55" : "#00ff88"
  const cBlue = isLight ? "#0066cc" : "#00aaff"
  const cWhite = isLight ? "#000000" : "#ffffff"
  const bgGreen = isLight ? "rgba(0,170,85,0.1)" : "rgba(0,255,136,0.05)"
  const bgBlue = isLight ? "rgba(0,102,204,0.1)" : "rgba(0,170,255,0.1)"
  const plateFill = isLight ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)"
  const gridLines = isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"

  return (
    <div
      className={cn(
        "relative w-full max-w-sm aspect-[16/9] rounded-2xl border border-tool-call-border/70 overflow-hidden shadow-sm",
        isLight ? "bg-white before:bg-[radial-gradient(circle_at_top,_rgba(0,170,85,0.12),_transparent_60%)]" : "bg-black before:bg-[radial-gradient(circle_at_top,_rgba(0,255,136,0.12),_transparent_60%)]",
        "before:pointer-events-none before:absolute before:inset-0",
        className,
      )}
    >
      <svg
        viewBox="0 0 320 180"
        className="h-full w-full"
      >
        {/* Background Grid - scrolling bottom-right */}
        <motion.g
          animate={{ x: [0, 20], y: [0, 20] }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        >
          <g stroke={cWhite} strokeWidth={1} strokeOpacity={isLight ? 0.2 : 0.1}>
            {Array.from({ length: 25 }).map((_, i) => (
              <line key={`h-${i}`} x1={-50} y1={i * 20 - 50} x2={400} y2={i * 20 - 50} />
            ))}
            {Array.from({ length: 25 }).map((_, i) => (
              <line key={`v-${i}`} x1={i * 20 - 50} y1={-50} x2={i * 20 - 50} y2={300} />
            ))}
          </g>
        </motion.g>

        {/* Blue dashed background grid for radar effect */}
        {/* Intentionally removed to keep background cleaner */}

        {/* Center alignment group */}
        <g transform="translate(160, 90)">
          {/* Tray Sequence */}
          <motion.g
            animate={{
              y: [200, 0, 0, 0, 0, 0, 0, 200],
              x: [0, 0, 0, 0, 0, -320, -320, 0],
              rotate: [0, 0, 0, 0, -90, -90, -90, 0],
              opacity: [1, 1, 1, 1, 1, 1, 0, 0]
            }}
            transition={{
              duration: 5,
              times: [0, 0.15, 0.3, 0.55, 0.7, 0.8, 0.81, 1],
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "loop"
            }}
          >
            {/* Tray */}
            <g>
              <rect x={-70} y={-90} width={140} height={180} rx={12} fill={bgGreen} stroke={cGreen} strokeWidth={2} />
              <rect x={-62} y={-82} width={124} height={164} rx={8} fill="none" stroke={cGreen} strokeWidth={1} strokeOpacity={0.5} />
              <rect x={-20} y={-86} width={40} height={4} rx={2} fill="none" stroke={cGreen} strokeWidth={1} />
              <rect x={-20} y={82} width={40} height={4} rx={2} fill="none" stroke={cGreen} strokeWidth={1} />
            </g>

            {/* Food dropping in */}
            <motion.g
              animate={{
                scale: [1.5, 1.5, 1, 1, 1, 1, 1, 1],
                opacity: [0, 0, 1, 1, 1, 1, 0, 0]
              }}
              transition={{
                duration: 5,
                times: [0, 0.15, 0.25, 0.55, 0.7, 0.8, 0.81, 1],
                ease: "easeOut",
                repeat: Infinity,
                repeatType: "loop"
              }}
            >
              {/* Plate */}
              <circle cx={0} cy={10} r={54} fill={plateFill} stroke={cWhite} strokeWidth={2} />
              <circle cx={0} cy={10} r={44} fill="none" stroke={cWhite} strokeWidth={1} strokeOpacity={0.5} />
              
              {/* Drink (cylinder) */}
              <g stroke={cWhite} fill={isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)"}>
                <circle cx={45} cy={-50} r={12} strokeWidth={1} />
                <circle cx={50} cy={-65} r={12} strokeWidth={1.5} />
                <line x1={33} y1={-50} x2={38} y2={-65} strokeWidth={1} />
                <line x1={57} y1={-50} x2={62} y2={-65} strokeWidth={1} />
                <line x1={50} y1={-65} x2={55} y2={-82} stroke={cGreen} strokeWidth={2} strokeLinecap="round" />
              </g>

              {/* Burger/Dome (offset cylinder) */}
              <g stroke={cBlue} fill={bgBlue}>
                <circle cx={-15} cy={15} r={22} strokeWidth={1} />
                <circle cx={-10} cy={5} r={16} strokeWidth={1.5} />
                <line x1={-37} y1={15} x2={-26} y2={5} strokeWidth={1} />
                <line x1={7} y1={15} x2={6} y2={5} strokeWidth={1} />
                <line x1={-15} y1={37} x2={-10} y2={21} strokeWidth={1} />
                <line x1={-15} y1={-7} x2={-10} y2={-11} strokeWidth={1} />
              </g>

              {/* Fries / Cubes */}
              <g stroke={cGreen} fill={bgGreen}>
                <polygon points="15,0 35,0 35,20 15,20" strokeWidth={1} />
                <polygon points="20,-10 40,-10 40,10 20,10" strokeWidth={1.5} />
                <line x1={15} y1={0} x2={20} y2={-10} strokeWidth={1} />
                <line x1={35} y1={0} x2={40} y2={-10} strokeWidth={1} />
                <line x1={35} y1={20} x2={40} y2={10} strokeWidth={1} />
                <line x1={15} y1={20} x2={20} y2={10} strokeWidth={1} />
                
                {/* Fries sticking out */}
                <line x1={25} y1={-10} x2={23} y2={-26} stroke={cWhite} strokeWidth={2} strokeLinecap="round" />
                <line x1={30} y1={-10} x2={32} y2={-29} stroke={cWhite} strokeWidth={2} strokeLinecap="round" />
                <line x1={35} y1={-10} x2={37} y2={-23} stroke={cWhite} strokeWidth={2} strokeLinecap="round" />
                <line x1={22} y1={-5} x2={18} y2={-21} stroke={cWhite} strokeWidth={2} strokeLinecap="round" />
              </g>
            </motion.g>
          </motion.g>
        </g>
      </svg>
      
      {/* Screen Effects / Hologram Overlays */}
      <div
        className="absolute inset-0 pointer-events-none z-20 mix-blend-screen opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 255, 136, 0.5) 1px, transparent 1px)",
          backgroundSize: "100% 4px",
        }}
      />
      <div className="absolute inset-0 pointer-events-none z-30 shadow-[inset_0_0_60px_rgba(0,0,0,0.9)]" />
    </div>
  )
}
