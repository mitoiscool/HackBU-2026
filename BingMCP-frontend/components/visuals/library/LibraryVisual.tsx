"use client"

import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface LibraryVisualProps {
  className?: string
}

const Room = ({ side, z, open, isLight }: { side: "left" | "right", z: number, open: boolean, isLight: boolean }) => {
  const x = side === "left" ? -100 : 100
  const rotY = side === "left" ? 90 : -90
  
  // Theme colors
  const color = open 
    ? (isLight ? "#059669" : "#10b981") // Emerald darker in light mode
    : (isLight ? "#d97706" : "#f59e0b") // Amber darker in light mode
    
  const gridColor = isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)"
  const deskColor = isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.05)"
  const deskBorder = isLight ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.4)"
  const glassBg = isLight ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.4)"
  const glassBorder = isLight ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.3)"
  const highlightStart = isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.1)"
  const handleColor = isLight ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.7)"
  const shadowOpacity = isLight ? "20" : "30"
  const roomBg = isLight ? `${color}15` : `${color}10`
  
  const isLeft = side === "left"
  const doorSwing = open ? (isLeft ? -75 : 75) : 0
  const origin = isLeft ? "left" : "right"

  return (
    <div 
      className="absolute left-1/2 top-1/2" 
      style={{ 
        transform: `translate3d(${x}px, 0px, ${z}px) rotateY(${rotY}deg)`,
        transformStyle: "preserve-3d"
      }}
    >
        {/* The Room Wall Cutout / Frame */}
      <div 
        className="absolute" 
        style={{ 
          width: 80, 
          height: 120, 
          marginLeft: -40, 
          marginTop: -60, 
          border: `2px solid ${color}`, 
          backgroundColor: roomBg, 
          boxShadow: `0 0 15px ${color}${shadowOpacity}, inset 0 0 15px ${color}${shadowOpacity}`,
          transformStyle: "preserve-3d"
        }}
      >
        {/* Status Indicator Above Door */}
        <div 
          className="absolute -top-6 w-8 h-1 rounded-full"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: color,
            boxShadow: isLight ? `0 0 4px ${color}` : `0 0 8px ${color}, 0 0 16px ${color}`
          }}
        />

        {/* Desk/Seat */}
        {/* Interior Desk */}
        <div 
          className="absolute bottom-[30%] w-24 h-6 border-t"
          style={{
            left: "50%",
            transform: `translateX(-50%) translateZ(-70px)`,
            backgroundColor: deskColor,
            borderColor: deskBorder
          }}
        />
        {/* Desk leg */}
        <div 
          className="absolute bottom-0 w-0.5 h-[30%]"
          style={{
            left: "50%",
            transform: `translateX(-50%) translateZ(-70px)`,
            backgroundColor: deskBorder
          }}
        />

        {/* Interior Seat */}
        <div 
          className="absolute bottom-[15%] w-8 h-8 border-t rounded-full"
          style={{
            left: "50%",
            transform: `translateX(-50%) translateZ(-30px) rotateX(70deg)`,
            backgroundColor: isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.1)",
            borderColor: isLight ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.3)"
          }}
        />
        {/* Seat leg */}
        <div 
          className="absolute bottom-0 w-1 h-[15%]"
          style={{
            left: "50%",
            transform: `translateX(-50%) translateZ(-30px)`,
            backgroundColor: isLight ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.3)"
          }}
        />

        {/* The Glass Door */}
        <div 
          className="absolute top-0 w-full h-full backdrop-blur-[2px]"
          style={{
            transformOrigin: origin,
            transform: `rotateY(${doorSwing}deg)`,
            transition: "transform 1s ease-in-out",
            transformStyle: "preserve-3d",
            backgroundColor: glassBg,
            border: `1px solid ${glassBorder}`
          }}
        >
          {/* Glass pane highlights */}
          <div 
            className="absolute top-[10%] left-[10%] w-[80%] h-[35%]" 
            style={{ 
              border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)'}`,
              background: `linear-gradient(to bottom right, ${highlightStart}, transparent)`
            }} 
          />
          <div 
            className="absolute top-[50%] left-[10%] w-[80%] h-[40%]" 
            style={{ 
              border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)'}`,
              background: `linear-gradient(to bottom right, ${highlightStart}, transparent)`
            }} 
          />
          
          {/* Handle */}
          <div 
            className={`absolute top-[55%] ${isLeft ? 'right-[10%]' : 'left-[10%]'} w-1.5 h-10 rounded-sm`} 
            style={{ 
              transform: "translateZ(5px)",
              backgroundColor: handleColor,
              boxShadow: isLight ? "none" : `0 0 8px ${handleColor}`
            }}
          />
        </div>
      </div>
    </div>
  )
}

const Scanline = ({ isLight }: { isLight: boolean }) => (
  <motion.div
    className="absolute left-0 top-0 w-full h-4 blur-[2px] z-50 pointer-events-none mix-blend-overlay"
    style={{ backgroundColor: isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.2)" }}
    animate={{ top: ["-10%", "110%"] }}
    transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
  />
)

export function LibraryVisual({ className }: LibraryVisualProps) {
  const { theme } = useTheme()
  const isLight = theme === "light"
  // A long repeating segment of rooms for the loop
  const roomPattern = [
    { side: "left", zOffset: 0, open: true },
    { side: "right", zOffset: -50, open: false },
    { side: "left", zOffset: -250, open: false },
    { side: "right", zOffset: -300, open: true },
    { side: "left", zOffset: -500, open: true },
    { side: "right", zOffset: -550, open: false },
    { side: "left", zOffset: -750, open: true },
    { side: "right", zOffset: -800, open: false },
  ] as const

  // We loop the pattern twice to ensure the camera never sees empty space before resetting
  const rooms = [
    ...roomPattern.map(r => ({ ...r, z: r.zOffset })),
    ...roomPattern.map(r => ({ ...r, z: r.zOffset - 1000 }))
  ]

  // The distance the camera travels before snapping back to 0 to create the infinite loop
  const LOOP_DISTANCE = 1000

  return (
    <div
      className={cn(
        "relative w-full max-w-sm aspect-[16/9] rounded-2xl overflow-hidden shadow-sm transition-colors duration-300",
        isLight ? "bg-slate-100 border-border/70" : "bg-black border-tool-call-border/70",
        className,
      )}
    >
      <Scanline isLight={isLight} />
      
      {/* 3D Scene Container */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ perspective: "800px" }}
      >
        {/* Camera / World Position */}
        <motion.div
          className="relative w-0 h-0"
          style={{ 
            transformStyle: "preserve-3d",
            // For isometric corner view, we rotate the WORLD instead of the camera
            transform: "rotateX(-15deg) rotateY(25deg)",
          }}
        >
          <motion.div
            className="absolute left-0 top-0"
            style={{ transformStyle: "preserve-3d" }}
            animate={{ z: [0, LOOP_DISTANCE] }}
            transition={{ z: { repeat: Infinity, duration: 8, ease: "linear" } }}
          >
            {/* Center the world content relative to the parent view */}
            <div className="absolute left-0 top-0" style={{ transformStyle: "preserve-3d", transform: "translateY(50px) translateZ(200px)" }}>
              {/* Hallway Floor */}
              <div 
                className="absolute" 
                style={{
                  width: 400, height: 2800,
                  left: -200, top: -1400,
                  transform: "translateY(60px) rotateX(90deg)",
                  borderLeft: `2px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.4)'}`,
                  borderRight: `2px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.4)'}`,
                  background: `
                    linear-gradient(0deg, ${isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.1)'} 1px, transparent 1px), 
                    linear-gradient(90deg, ${isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.1)'} 1px, transparent 1px)
                  `,
                  backgroundSize: "40px 40px",
                  boxShadow: isLight ? "inset 0 0 100px rgba(255,255,255,0.5)" : "inset 0 0 100px rgba(0,0,0,0.8)"
                }} 
              />
              
              {/* Hallway Ceiling */}
              <div 
                className="absolute" 
                style={{
                  width: 400, height: 2800,
                  left: -200, top: -1400,
                  transform: "translateY(-60px) rotateX(90deg)",
                  borderLeft: `2px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.4)'}`,
                  borderRight: `2px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.4)'}`,
                  background: `
                    linear-gradient(0deg, ${isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.1)'} 1px, transparent 1px), 
                    linear-gradient(90deg, ${isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.1)'} 1px, transparent 1px)
                  `,
                  backgroundSize: "40px 40px",
                  boxShadow: isLight ? "inset 0 0 100px rgba(255,255,255,0.5)" : "inset 0 0 100px rgba(0,0,0,0.8)"
                }} 
              />

              {/* Hallway Wall Side Left */}
              <div 
                className="absolute" 
                style={{
                  width: 2800, height: 120,
                  left: -1400, top: -60,
                  transform: "translateZ(-1400px) rotateY(90deg) translateZ(200px)",
                  borderTop: `2px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.4)'}`,
                  borderBottom: `2px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.4)'}`,
                  background: `
                    linear-gradient(0deg, ${isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.1)'} 1px, transparent 1px), 
                    linear-gradient(90deg, ${isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.1)'} 1px, transparent 1px)
                  `,
                  backgroundSize: "40px 40px",
                }} 
              />
              
              {/* Hallway Wall Side Right */}
              <div 
                className="absolute" 
                style={{
                  width: 2800, height: 120,
                  left: -1400, top: -60,
                  transform: "translateZ(-1400px) rotateY(-90deg) translateZ(200px)",
                  borderTop: `2px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.4)'}`,
                  borderBottom: `2px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.4)'}`,
                  background: `
                    linear-gradient(0deg, ${isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.1)'} 1px, transparent 1px), 
                    linear-gradient(90deg, ${isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.1)'} 1px, transparent 1px)
                  `,
                  backgroundSize: "40px 40px",
                }} 
              />

              {/* Rooms */}
              {rooms.map((r, i) => (
                <Room key={i} side={r.side} z={r.z} open={r.open} isLight={isLight} />
              ))}

              {/* Hallway Fade Out (Fog effect at the end) - stationary relative to view */}
            </div>
          </motion.div>
          
          <div 
            className="absolute left-1/2 top-1/2 w-full h-full"
            style={{
              width: 800,
              height: 800,
              marginLeft: -400,
              marginTop: -400,
              transform: "translateZ(-800px)",
              background: isLight 
                ? "radial-gradient(circle, rgba(241,245,249,0) 0%, rgba(241,245,249,1) 50%)" 
                : "radial-gradient(circle, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 50%)",
              transformStyle: "preserve-3d"
            }}
          />
        </motion.div>
      </div>

      {/* Screen Effects / Hologram Overlays */}
      <div
        className="absolute inset-0 pointer-events-none z-20 mix-blend-screen opacity-10"
        style={{
          backgroundImage: `linear-gradient(${isLight ? 'rgba(0, 0, 0, 0.5)' : 'rgba(245, 158, 11, 0.5)'} 1px, transparent 1px)`,
          backgroundSize: "100% 4px",
        }}
      />
      <div 
        className="absolute inset-0 pointer-events-none z-30 transition-shadow duration-300"
        style={{
          boxShadow: isLight ? "inset 0 0 60px rgba(0,0,0,0.1)" : "inset 0 0 60px rgba(0,0,0,0.9)"
        }}
      />
    </div>
  )
}
