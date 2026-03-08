"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import Image from "next/image"
import bearcatsImg from "@/lib/images/bearcats.png"
import { useTheme } from "next-themes"
import React, { useEffect, useState } from "react"

interface GymVisualProps {
  className?: string
}

interface FaceProps {
  w: number | string
  h: number | string
  transform: string
  color: string
  bg?: string
  children?: React.ReactNode
}

// 3D Face Component to build wireframe shapes
const Face = ({ w, h, transform, color, bg, children }: FaceProps) => (
  <div
    className="absolute border overflow-hidden"
    style={{
      width: w,
      height: h,
      left: "50%",
      top: "50%",
      marginLeft: -Number(w) / 2,
      marginTop: -Number(h) / 2,
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

interface Treadmill3DProps {
  xOffset: number
  yOffset: number
  taken: boolean
  isLight: boolean
}

const Treadmill3D = ({ xOffset, yOffset, taken, isLight }: Treadmill3DProps) => {
  const tWidth = 30
  const tLength = 80
  const tHeight = 4
  const consoleHeight = 36
  
  // Adjust colors for light mode
  const cGreen = taken ? (isLight ? "#00aa55" : "#00ff88") : (isLight ? "#aaddbb" : "#004422")
  const cBlue = taken ? (isLight ? "#0066cc" : "#00aaff") : (isLight ? "#aaccee" : "#003355")
  
  const defaultFaceBg = isLight ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)"
  const beltBg = taken ? (isLight ? "rgba(0,170,85,0.15)" : "rgba(0,255,136,0.05)") : (isLight ? "rgba(170,221,187,0.15)" : "rgba(0,68,34,0.05)")
  const screenBg = taken ? (isLight ? "rgba(0,102,204,0.15)" : "rgba(0,170,255,0.1)") : (isLight ? "rgba(170,204,238,0.15)" : "rgba(0,51,85,0.1)")

  const stickmanStroke = isLight ? "black" : "white"
  const stickmanFill = isLight ? "white" : "black"
  const stickmanShadow = isLight ? "0 0 12px rgba(0,0,0,0.3)" : "0 0 12px white"
  const limbShadow = isLight ? "0 0 10px rgba(0,0,0,0.3)" : "0 0 10px white"

  return (
    <div
      className="absolute w-0 h-0 flex items-center justify-center"
      style={{ 
        transformStyle: "preserve-3d",
        left: "50%",
        top: "50%",
        transform: `translate3d(${xOffset}px, ${yOffset}px, 0px)`
      }}
    >
      {/* --- Treadmill Base --- */}
      {/* Top Face (The Belt) */}
      <Face w={tWidth} h={tLength} transform={`translateZ(${tHeight / 2}px)`} color={cGreen} bg={beltBg}>
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to bottom, transparent 4px, ${cGreen} 4px, ${cGreen} 6px, transparent 6px)`,
            backgroundSize: "100% 20px"
          }}
          animate={taken ? { backgroundPosition: ["0px 0px", "0px 20px"] } : {}}
          transition={{ repeat: Infinity, duration: 0.3, ease: "linear" }}
        />
      </Face>

      {/* Side Faces of the base */}
      <Face w={tHeight} h={tLength} transform={`translateX(${-tWidth / 2}px) rotateY(-90deg)`} color={cGreen} bg={defaultFaceBg} />
      <Face w={tHeight} h={tLength} transform={`translateX(${tWidth / 2}px) rotateY(90deg)`} color={cGreen} bg={defaultFaceBg} />
      <Face w={tWidth} h={tHeight} transform={`translateY(${-tLength / 2}px) rotateX(90deg)`} color={cGreen} bg={defaultFaceBg} />
      <Face w={tWidth} h={tHeight} transform={`translateY(${tLength / 2}px) rotateX(-90deg)`} color={cGreen} bg={defaultFaceBg} />

      {/* --- Front Console/Screen --- */}
      {/* Left Post */}
      <Face w={2} h={consoleHeight} transform={`translate3d(${-tWidth / 2 + 1}px, ${-tLength / 2 + 2}px, ${consoleHeight / 2}px) rotateX(90deg)`} color={cBlue} bg={defaultFaceBg} />
      {/* Right Post */}
      <Face w={2} h={consoleHeight} transform={`translate3d(${tWidth / 2 - 1}px, ${-tLength / 2 + 2}px, ${consoleHeight / 2}px) rotateX(90deg)`} color={cBlue} bg={defaultFaceBg} />
      
      {/* The Screen Panel */}
      <Face w={tWidth} h={16} transform={`translate3d(0px, ${-tLength / 2 + 2}px, ${consoleHeight}px) rotateX(45deg)`} color={cBlue} bg={screenBg}>
        {/* Animated UI bars on the screen */}
        {taken && (
          <div className="absolute inset-2 flex flex-col justify-between">
            <motion.div 
              className="h-1" 
              style={{ backgroundColor: cGreen }}
              animate={{ width: ["20%", "80%", "40%"] }} 
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }} 
            />
            <motion.div 
              className="h-1" 
              style={{ backgroundColor: cBlue }}
              animate={{ width: ["60%", "30%", "90%"] }} 
              transition={{ repeat: Infinity, duration: 2.1, ease: "easeInOut" }} 
            />
          </div>
        )}
      </Face>

      {/* --- The Floating Person --- */}
      {taken && (
        <motion.div
          className="absolute w-0 h-0 flex items-center justify-center"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ z: [30, 40, 30] }} // Float up and down (Z is height off the floor)
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        >
          <div style={{ transform: "rotateX(-90deg) rotateY(20deg)", position: "absolute" }}>
            {/* Original Head */}
            <div 
              className="absolute left-[-10px] top-[-60px] w-[20px] h-[20px] rounded-full border-2"
              style={{ borderColor: stickmanStroke, backgroundColor: stickmanFill, boxShadow: stickmanShadow }}
            />
            
            {/* Bearcat Face Overlay */}
            <div className="absolute left-[-20px] top-[-70px] w-[40px] h-[40px] flex items-center justify-center pointer-events-none z-10">
              <Image src={bearcatsImg} alt="Bearcat" className="w-full h-full object-contain" />
            </div>
            
            {/* Torso */}
            <div 
              className="absolute left-[-1.5px] top-[-40px] w-[3px] h-[35px]"
              style={{ backgroundColor: stickmanStroke, boxShadow: stickmanShadow }}
            />
            
            {/* Left Arm */}
            <div 
              className="absolute left-[-1.5px] top-[-35px] w-[3px] h-[18px]" 
              style={{ backgroundColor: stickmanStroke, boxShadow: limbShadow, transform: "rotate(25deg)", transformOrigin: "top center" }}
            >
              {/* Lower Arm */}
              <div 
                className="absolute left-0 top-[16px] w-[3px] h-[18px]" 
                style={{ backgroundColor: stickmanStroke, boxShadow: limbShadow, transform: "rotate(-50deg)", transformOrigin: "top center" }} 
              />
            </div>

            {/* Right Arm */}
            <div 
              className="absolute left-[-1.5px] top-[-35px] w-[3px] h-[18px]" 
              style={{ backgroundColor: stickmanStroke, boxShadow: limbShadow, transform: "rotate(-25deg)", transformOrigin: "top center" }}
            >
              {/* Lower Arm */}
              <div 
                className="absolute left-0 top-[16px] w-[3px] h-[18px]" 
                style={{ backgroundColor: stickmanStroke, boxShadow: limbShadow, transform: "rotate(50deg)", transformOrigin: "top center" }} 
              />
            </div>

            {/* Left Leg */}
            <div 
              className="absolute left-[-1.5px] top-[-6px] w-[3px] h-[22px]" 
              style={{ backgroundColor: stickmanStroke, boxShadow: limbShadow, transform: "rotate(20deg)", transformOrigin: "top center" }}
            >
              {/* Calf */}
              <div 
                className="absolute left-0 top-[20px] w-[3px] h-[22px]" 
                style={{ backgroundColor: stickmanStroke, boxShadow: limbShadow, transform: "rotate(-10deg)", transformOrigin: "top center" }} 
              />
            </div>

            {/* Right Leg */}
            <div 
              className="absolute left-[-1.5px] top-[-6px] w-[3px] h-[22px]" 
              style={{ backgroundColor: stickmanStroke, boxShadow: limbShadow, transform: "rotate(-20deg)", transformOrigin: "top center" }}
            >
              {/* Calf */}
              <div 
                className="absolute left-0 top-[20px] w-[3px] h-[22px]" 
                style={{ backgroundColor: stickmanStroke, boxShadow: limbShadow, transform: "rotate(10deg)", transformOrigin: "top center" }} 
              />
            </div>
          </div>
        </motion.div>
      )}

    </div>
  )
}

export function GymVisual({ className }: GymVisualProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const isLight = mounted && resolvedTheme === "light"
  
  const bgColor = isLight ? "bg-slate-100" : "bg-black"
  const gridLineColor = isLight ? "rgba(0, 0, 0, 0.15)" : "rgba(255, 255, 255, 0.15)"
  const screenScanline = isLight ? "rgba(0, 204, 102, 0.2)" : "rgba(0, 255, 136, 0.5)"
  const shadowOverlay = isLight ? "shadow-[inset_0_0_60px_rgba(255,255,255,0.8)]" : "shadow-[inset_0_0_60px_rgba(0,0,0,0.9)]"
  
  return (
    <div
      className={cn(
        "relative w-full max-w-sm aspect-[16/9] rounded-2xl border border-tool-call-border/70 overflow-hidden shadow-sm transition-colors duration-300",
        bgColor,
        className,
      )}
    >
      {/* 3D Scene Container */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ perspective: "800px" }}
      >
        {/* World Rotation - Angled to view from Top Left */}
        <div
          className="relative w-0 h-0"
          style={{
            transformStyle: "preserve-3d",
            transform: "rotateX(60deg) rotateZ(35deg)",
          }}
        >
          {/* Static Grid Floor */}
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              width: 1000,
              height: 1000,
              marginLeft: -500,
              marginTop: -500,
              transform: "translateZ(0px)",
              maskImage:
                isLight 
                  ? "radial-gradient(circle at center, black 10%, transparent 50%)"
                  : "radial-gradient(circle at center, white 10%, transparent 50%)",
              WebkitMaskImage:
                isLight
                  ? "radial-gradient(circle at center, black 10%, transparent 50%)"
                  : "radial-gradient(circle at center, white 10%, transparent 50%)",
            }}
          >
            <div
              className="absolute inset-0 transition-colors duration-300"
              style={{
                backgroundImage: `
                  linear-gradient(${gridLineColor} 1px, transparent 1px),
                  linear-gradient(90deg, ${gridLineColor} 1px, transparent 1px)
                `,
                backgroundSize: "40px 40px",
              }}
            />
          </div>

          <Treadmill3D xOffset={-90} yOffset={60} taken={true} isLight={isLight} />
          <Treadmill3D xOffset={-45} yOffset={60} taken={false} isLight={isLight} />
          <Treadmill3D xOffset={0} yOffset={60} taken={true} isLight={isLight} />
          <Treadmill3D xOffset={45} yOffset={60} taken={false} isLight={isLight} />
          <Treadmill3D xOffset={90} yOffset={60} taken={true} isLight={isLight} />
        </div>
      </div>

      {/* Screen Effects / Hologram Overlays */}
      <div
        className="absolute inset-0 pointer-events-none z-20 mix-blend-screen opacity-20 transition-colors duration-300"
        style={{
          backgroundImage:
            `linear-gradient(${screenScanline} 1px, transparent 1px)`,
          backgroundSize: "100% 4px",
        }}
      />
      <div className={cn("absolute inset-0 pointer-events-none z-30 transition-shadow duration-300", shadowOverlay)} />
    </div>
  )
}
