"use client"

import React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

interface FaceProps {
  w: number | string
  h: number | string
  transform: string
  color: string
  bg?: string
  children?: React.ReactNode
}

interface BusVisualProps {
  className?: string
}

const Face = ({ w, h, transform, color, bg = "rgba(0,0,0,0.8)", children }: FaceProps) => (
  <div
    className="absolute border overflow-hidden"
    style={{
      width: w,
      height: h,
      left: "50%",
      top: "50%",
      marginLeft: -w / 2,
      marginTop: -h / 2,
      transform,
      borderColor: color,
      backgroundColor: bg,
      boxShadow: `0 0 10px ${color}40, inset 0 0 10px ${color}40`,
      backfaceVisibility: "visible",
    }}
  >
    {children}
  </div>
)

const Bus3D = ({ isLight }: { isLight: boolean }) => {
  const w = 32 // width
  const l = 80 // length
  const h = 36 // height
  const cGreen = isLight ? "#00aa55" : "#00ff88"
  const cWhite = isLight ? "#000000" : "#ffffff"
  const cBg = isLight ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)"
  const bgGreen = isLight ? "rgba(0,170,85,0.1)" : "rgba(0,255,136,0.05)"
  const bgWhite = isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 w-0 h-0 flex items-center justify-center"
      style={{ transformStyle: "preserve-3d" }}
      animate={{ z: [0, 2, 0], rotateX: [0, -1, 0], rotateY: [0, 1, 0] }}
      transition={{ repeat: Infinity, duration: 0.4, ease: "easeInOut" }}
    >
      {/* Top Face */}
      <Face w={w} h={l} transform={`translateZ(${h / 2}px)`} color={cGreen} bg={bgGreen}>
        <div className="absolute top-[10%] left-[20%] w-[60%] h-[20%] border" style={{ borderColor: cWhite, backgroundColor: bgWhite }} />
        <div className="absolute top-[40%] left-[20%] w-[60%] h-[40%] border" style={{ borderColor: cWhite, backgroundColor: bgWhite }} />
      </Face>

      {/* Bottom Face */}
      <Face w={w} h={l} transform={`translateZ(${-h / 2}px)`} color={cGreen} bg={cBg} />

      {/* Front Face (-Y) -> Floor is top, Roof is bottom */}
      <Face w={w} h={h} transform={`translateY(${-l / 2}px) rotateX(90deg)`} color={cGreen} bg={cBg}>
        {/* Windshield */}
        <div className="absolute bottom-2 w-[80%] h-[45%] left-[10%] border" style={{ borderColor: cWhite, backgroundColor: bgWhite }} />
        {/* Headlights near ground (top) */}
        <div className="absolute top-2 left-2 w-3 h-2 rounded-sm" style={{ backgroundColor: cWhite, boxShadow: `0 0 10px ${cWhite}` }} />
        <div className="absolute top-2 right-2 w-3 h-2 rounded-sm" style={{ backgroundColor: cWhite, boxShadow: `0 0 10px ${cWhite}` }} />
        <div className="absolute top-3 left-[30%] w-[40%] h-1 border" style={{ borderColor: cGreen }} />
      </Face>

      {/* Back Face (+Y) -> Floor is bottom, Roof is top */}
      <Face w={w} h={h} transform={`translateY(${l / 2}px) rotateX(-90deg)`} color={cGreen} bg={cBg}>
        <div className="absolute top-2 w-[80%] h-[35%] left-[10%] border" style={{ borderColor: cGreen, backgroundColor: bgGreen }} />
        <div className="absolute bottom-2 left-2 w-3 h-2 bg-red-500 shadow-[0_0_10px_red]" />
        <div className="absolute bottom-2 right-2 w-3 h-2 bg-red-500 shadow-[0_0_10px_red]" />
      </Face>

      {/* Left Face (-X) -> Roof is right, Floor is left */}
      <Face w={h} h={l} transform={`translateX(${-w / 2}px) rotateY(-90deg)`} color={cGreen} bg={cBg}>
        {/* Wheels */}
        <div className="absolute left-[-2px] top-[15%] w-6 h-6 border-[1px] rounded-full flex items-center justify-center translate-x-[-50%]" style={{ borderColor: cGreen, boxShadow: `0 0 4px ${cGreen}`, backgroundColor: cBg }}>
          <div className="w-2 h-2 border rounded-full" style={{ borderColor: cWhite }} />
        </div>
        <div className="absolute left-[-2px] bottom-[15%] w-6 h-6 border-[1px] rounded-full flex items-center justify-center translate-x-[-50%]" style={{ borderColor: cGreen, boxShadow: `0 0 4px ${cGreen}`, backgroundColor: cBg }}>
          <div className="w-2 h-2 border rounded-full" style={{ borderColor: cWhite }} />
        </div>
      </Face>

      {/* Right Face (+X) -> Roof is left, Floor is right */}
      <Face w={h} h={l} transform={`translateX(${w / 2}px) rotateY(90deg)`} color={cGreen} bg={cBg}>
        <div className="absolute left-2 w-[25%] h-[70%] top-[15%] flex flex-col gap-1.5">
          <div className="flex-1 border" style={{ borderColor: cWhite, backgroundColor: bgWhite }} />
          <div className="flex-1 border" style={{ borderColor: cWhite, backgroundColor: bgWhite }} />
          <div className="flex-1 border" style={{ borderColor: cWhite, backgroundColor: bgWhite }} />
          <div className="flex-1 border" style={{ borderColor: cWhite, backgroundColor: bgWhite }} />
        </div>
        {/* Wheels */}
        <div className="absolute right-[-2px] top-[15%] w-6 h-6 border-[1px] rounded-full flex items-center justify-center translate-x-[50%]" style={{ borderColor: cGreen, boxShadow: `0 0 4px ${cGreen}`, backgroundColor: cBg }}>
          <div className="w-2 h-2 border rounded-full" style={{ borderColor: cWhite }} />
        </div>
        <div className="absolute right-[-2px] bottom-[15%] w-6 h-6 border-[1px] rounded-full flex items-center justify-center translate-x-[50%]" style={{ borderColor: cGreen, boxShadow: `0 0 4px ${cGreen}`, backgroundColor: cBg }}>
          <div className="w-2 h-2 border rounded-full" style={{ borderColor: cWhite }} />
        </div>
      </Face>
    </motion.div>
  )
}

interface ParticleData {
  id: number
  startX: number
  delay: number
  duration: number
  zPos: number
}

const Particles = ({ isLight }: { isLight: boolean }) => {
  const [particles, setParticles] = React.useState<ParticleData[]>([])
  const cGreen = isLight ? "#00aa55" : "#00ff88"

  React.useEffect(() => {
    const generated = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      startX: (Math.random() - 0.5) * 80,
      delay: Math.random() * 0.8,
      duration: 0.5 + Math.random() * 0.5,
      zPos: Math.random() * 20 + 5,
    }))
    setParticles(generated)
  }, [])

  if (particles.length === 0) return null

  return (
    <>
      {particles.map(({ id, startX, delay, duration, zPos }) => {
        return (
          <motion.div
            key={id}
            className="absolute left-1/2 top-1/2"
            style={{
              width: 2,
              height: 20,
              marginLeft: -1,
              marginTop: -10,
              backgroundColor: cGreen,
              boxShadow: `0 0 10px ${cGreen}`,
              transformStyle: "preserve-3d",
            }}
            initial={{ x: startX, y: 40, z: zPos, opacity: 1 }}
            animate={{ y: 500, opacity: 0 }}
            transition={{
              duration,
              repeat: Infinity,
              delay,
              ease: "easeOut",
            }}
          />
        )
      })}
    </>
  )
}

/**
 * 3D Holographic Bus Visual
 * Real CSS 3D transforms with moving world underneath.
 */
export function BusVisual({ className }: BusVisualProps) {
  const { theme } = useTheme()
  const isLight = theme === "light"
  const gridLines = isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.15)"
  const roadLines = isLight ? "rgba(0, 0, 0, 0.3)" : "#ffffff"

  return (
    <div
      className={cn(
        "relative w-full max-w-sm aspect-[16/9] rounded-2xl border border-tool-call-border/70 overflow-hidden shadow-sm",
        isLight ? "bg-white" : "bg-black",
        className,
      )}
    >
      {/* 3D Scene Container */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ perspective: "800px" }}
      >
        {/* World Rotation */}
        <div
          className="relative w-0 h-0"
          style={{
            transformStyle: "preserve-3d",
            transform: "rotateX(60deg) rotateZ(-35deg)",
          }}
        >
          {/* Moving Grid Floor */}
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              width: 2000,
              height: 2000,
              marginLeft: -1000,
              marginTop: -1000,
              transform: "translateZ(0px)",
              maskImage:
                "radial-gradient(circle at center, white 10%, transparent 40%)",
              WebkitMaskImage:
                "radial-gradient(circle at center, white 10%, transparent 40%)",
            }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(${gridLines} 1px, transparent 1px),
                  linear-gradient(90deg, ${gridLines} 1px, transparent 1px)
                `,
                backgroundSize: "60px 60px",
              }}
              animate={{ backgroundPosition: ["0px 0px", "0px 60px"] }}
              transition={{ repeat: Infinity, duration: 0.6, ease: "linear" }}
            />

            {/* Glowing Route Lines */}
            <svg className="absolute inset-0" width="2000" height="2000">
              <g transform="translate(1000, 0)">
                {/* Moving side lanes */}
                <motion.line
                  x1={-35}
                  y1={0}
                  x2={-35}
                  y2={2000}
                  stroke={roadLines}
                  strokeWidth="2"
                  strokeDasharray="40 40"
                  strokeOpacity="0.5"
                  initial={{ strokeDashoffset: 0 }}
                  animate={{ strokeDashoffset: -80 }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.6,
                    ease: "linear",
                  }}
                />
                <motion.line
                  x1={35}
                  y1={0}
                  x2={35}
                  y2={2000}
                  stroke={roadLines}
                  strokeWidth="2"
                  strokeDasharray="40 40"
                  strokeOpacity="0.5"
                  initial={{ strokeDashoffset: 0 }}
                  animate={{ strokeDashoffset: -80 }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.6,
                    ease: "linear",
                  }}
                />
              </g>
            </svg>
          </div>

          <Particles isLight={isLight} />
          <Bus3D isLight={isLight} />
        </div>
      </div>

      {/* Screen Effects / Hologram Overlays */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none z-20 opacity-20",
          isLight ? "mix-blend-multiply" : "mix-blend-screen"
        )}
        style={{
          backgroundImage:
            `linear-gradient(${isLight ? "rgba(0, 136, 68, 0.2)" : "rgba(0, 255, 136, 0.5)"} 1px, transparent 1px)`,
          backgroundSize: "100% 4px",
        }}
      />
      <div className={cn(
        "absolute inset-0 pointer-events-none z-30",
        isLight ? "shadow-[inset_0_0_60px_rgba(255,255,255,1)]" : "shadow-[inset_0_0_60px_rgba(0,0,0,0.9)]"
      )} />
    </div>
  )
}

