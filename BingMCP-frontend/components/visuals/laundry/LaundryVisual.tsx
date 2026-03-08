"use client"

import React from "react"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface LaundryVisualProps {
  className?: string
  taken?: number
  free?: number
}

interface FaceProps {
  w: number | string
  h: number | string
  transform: string
  color: string
  bg?: string
  shadow?: string
  children?: React.ReactNode
}

const Face = ({ w, h, transform, color, bg = "rgba(0,0,0,0.8)", shadow, children }: FaceProps) => (
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
      boxShadow: shadow !== undefined ? shadow : `0 0 10px ${color}40, inset 0 0 10px ${color}40`,
      backfaceVisibility: "visible",
    }}
  >
    {children}
  </div>
)

const Washer3D = ({ x, y, rotationZ = 0, isOn, isLight }: { x: number; y: number; rotationZ?: number; isOn: boolean; isLight: boolean }) => {
  const w = 24
  const l = 24
  const h = 32
  
  const cGreen = isLight ? "#059669" : "#00ff88"
  const cWhite = isLight ? "#475569" : "#ffffff"
  const cBlue = isLight ? "#2563eb" : "#00aaff"

  // Glowing green when OFF, white/dark when ON
  const color = isOn ? cWhite : cGreen
  const bg = isOn 
    ? (isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.1)") 
    : (isLight ? "rgba(5,150,105,0.05)" : "rgba(0,255,136,0.05)")
  const shadow = isOn 
    ? `0 0 10px ${cWhite}40, inset 0 0 10px ${cWhite}40` 
    : `0 0 10px ${cGreen}40, inset 0 0 10px ${cGreen}40`

  const [shakeDuration] = React.useState(() => 0.1 + Math.random() * 0.1)
  const [spinDuration] = React.useState(() => 0.6 + Math.random() * 0.4)

  return (
    <motion.div
      className="absolute w-0 h-0 flex items-center justify-center"
      style={{
        transformStyle: "preserve-3d",
        left: "50%",
        top: "50%",
      }}
      initial={{ x, y, rotateZ: rotationZ, rotateX: 0, rotateY: 0, z: 0 }}
      animate={
        isOn
          ? {
            rotateZ: [rotationZ - 1, rotationZ + 1, rotationZ - 1],
            rotateX: [-1, 1, -1],
            rotateY: [-1, 1, -1],
            z: [0, 1, 0]
          }
          : { rotateZ: rotationZ, rotateX: 0, rotateY: 0, z: 0 }
      }
      transition={
        isOn
          ? {
            repeat: Infinity,
            duration: shakeDuration,
            ease: "linear"
          }
          : { duration: 0 }
      }
    >
      {/* Base container lifted by h/2 so it sits on the floor */}
      <div className="absolute w-0 h-0" style={{ transformStyle: "preserve-3d", transform: `translateZ(${h / 2}px)` }}>
        {/* Top Face */}
        <Face w={w} h={l} transform={`translateZ(${h / 2}px)`} color={color} bg={bg} shadow={shadow}>
          <div className="absolute top-1 left-1 w-2 h-2 rounded-full border border-current opacity-70" style={{ color }} />
          <div className="absolute top-1 right-2 w-6 h-2 border border-current opacity-70" style={{ color }} />
        </Face>

        {/* Bottom Face */}
        <Face w={w} h={l} transform={`translateZ(${-h / 2}px)`} color={color} bg={bg} shadow={shadow} />

        {/* Front Face (-Y direction) */}
        <Face w={w} h={h} transform={`translateY(${-l / 2}px) rotateX(90deg)`} color={color} bg={bg} shadow={shadow}>
          <div
            className="absolute left-1/2 top-1/2 rounded-full border-[2px]"
            style={{
              width: 16,
              height: 16,
              marginLeft: -8,
              marginTop: -2,
              borderColor: color,
              boxShadow: isOn ? `0 0 5px ${color}, inset 0 0 5px ${color}` : 'none'
            }}
          >
            {isOn && (
              <div className="absolute inset-0 rounded-full overflow-hidden opacity-80 flex items-center justify-center">
                <motion.div
                  className="w-[12px] h-[12px] border-[3px] border-dashed"
                  style={{ borderColor: cBlue, borderRadius: "50%" }}
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: spinDuration, ease: "linear" }}
                />
              </div>
            )}
          </div>
          <div className="absolute bottom-2 left-1/2 w-10 h-1.5 border border-current opacity-50" style={{ color, marginLeft: -20 }} />
        </Face>

        {/* Back Face (+Y direction) */}
        <Face w={w} h={h} transform={`translateY(${l / 2}px) rotateX(-90deg)`} color={color} bg={bg} shadow={shadow} />

        {/* Left Face (-X direction) */}
        <Face w={l} h={h} transform={`translateX(${-w / 2}px) rotateY(-90deg)`} color={color} bg={bg} shadow={shadow} />

        {/* Right Face (+X direction) */}
        <Face w={l} h={h} transform={`translateX(${w / 2}px) rotateY(90deg)`} color={color} bg={bg} shadow={shadow} />
      </div>
    </motion.div>
  )
}

export function LaundryVisual({ className, taken = 3, free = 3 }: LaundryVisualProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isLight = mounted && theme === "light"
  const total = taken + free;
  const spacing = 32;
  const startX = -((total - 1) * spacing) / 2;

  const machines = [];

  for (let i = 0; i < total; i++) {
    // Washers in the front row (y = -40, facing forward)
    machines.push({
      id: `w-${i}`,
      x: startX + i * spacing,
      y: -40,
      rotationZ: 0,
      isOn: i < taken,
    });

    // Dryers in the back row (y = 40, facing backwards)
    machines.push({
      id: `d-${i}`,
      x: startX + i * spacing,
      y: 40,
      rotationZ: 180,
      isOn: (total - 1 - i) < taken,
    });
  }

  return (
    <div
      className={cn(
        "relative w-full max-w-sm aspect-[16/9] rounded-2xl border overflow-hidden shadow-sm transition-colors duration-300",
        isLight ? "bg-slate-50 border-slate-200" : "bg-black border-tool-call-border/70",
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
            transform: "rotateX(60deg) rotateZ(35deg)",
          }}
        >
          {/* Floor */}
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              width: 1000,
              height: 1000,
              marginLeft: -500,
              marginTop: -500,
              transform: "translateZ(0px)",
              maskImage:
                "radial-gradient(circle at center, white 10%, transparent 50%)",
              WebkitMaskImage:
                "radial-gradient(circle at center, white 10%, transparent 50%)",
            }}
          >
            <div
              className="absolute inset-0 transition-opacity duration-300"
              style={{
                backgroundImage: isLight 
                  ? `linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px)`
                  : `linear-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.15) 1px, transparent 1px)`,
                backgroundSize: "40px 40px",
              }}
            />
          </div>

          {machines.map((m) => (
            <Washer3D key={m.id} x={m.x} y={m.y} rotationZ={m.rotationZ} isOn={m.isOn} isLight={isLight} />
          ))}

        </div>
      </div>

      {/* Screen Effects / Hologram Overlays */}
      <div
        className="absolute inset-0 pointer-events-none z-20 mix-blend-screen opacity-20 transition-opacity duration-300"
        style={{
          backgroundImage: isLight
            ? "linear-gradient(rgba(0, 0, 0, 0.2) 1px, transparent 1px)"
            : "linear-gradient(rgba(0, 255, 136, 0.5) 1px, transparent 1px)",
          backgroundSize: "100% 4px",
          mixBlendMode: isLight ? "normal" : "screen",
        }}
      />
      <div 
        className={cn(
          "absolute inset-0 pointer-events-none z-30 transition-shadow duration-300",
          isLight ? "shadow-[inset_0_0_60px_rgba(255,255,255,0.8)]" : "shadow-[inset_0_0_60px_rgba(0,0,0,0.9)]"
        )} 
      />
    </div>
  )
}