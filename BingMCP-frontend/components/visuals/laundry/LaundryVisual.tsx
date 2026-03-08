"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface LaundryVisualProps {
  className?: string
  taken?: number
  free?: number
}

const Face = ({ w, h, transform, color, bg = "rgba(0,0,0,0.8)", shadow, children }: any) => (
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

const Washer3D = ({ x, y, rotationZ = 0, isOn }: { x: number; y: number; rotationZ?: number; isOn: boolean }) => {
  const w = 24
  const l = 24
  const h = 32
  const cGreen = "#00ff88"
  const cWhite = "#ffffff"
  const cBlue = "#00aaff"
  
  // Glowing green when OFF, white when ON
  const color = isOn ? cWhite : cGreen
  const bg = isOn ? "rgba(255,255,255,0.1)" : "rgba(0,255,136,0.05)"
  const shadow = isOn ? `0 0 10px ${cWhite}40, inset 0 0 10px ${cWhite}40` : `0 0 10px ${cGreen}40, inset 0 0 10px ${cGreen}40`

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
              duration: 0.1 + Math.random() * 0.1, 
              ease: "linear" 
            }
          : { duration: 0 }
      }
    >
      {/* Base container lifted by h/2 so it sits on the floor */}
      <div className="absolute w-0 h-0" style={{ transformStyle: "preserve-3d", transform: `translateZ(${h/2}px)` }}>
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
                   transition={{ repeat: Infinity, duration: 0.6 + Math.random() * 0.4, ease: "linear" }}
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

const Basket3D = ({ x, y, rotationZ = 0 }: { x: number; y: number; rotationZ?: number }) => {
  const w = 18
  const l = 24
  const h = 12
  const cColor = "rgba(255, 255, 255, 0.4)"
  
  return (
    <div
      className="absolute w-0 h-0 flex items-center justify-center"
      style={{ 
        transformStyle: "preserve-3d",
        left: "50%",
        top: "50%",
        transform: `translate3d(${x}px, ${y}px, 0px) rotateZ(${rotationZ}deg)`
      }}
    >
      <div className="absolute w-0 h-0" style={{ transformStyle: "preserve-3d", transform: `translateZ(${h/2}px)` }}>
        {/* Top (Open) */}
        <Face w={w} h={l} transform={`translateZ(${h / 2}px)`} color={cColor} bg="rgba(0,0,0,0)" shadow="none">
          <div className="absolute top-1 left-1 w-10 h-10 bg-[#00aaff] opacity-30 blur-[2px] rounded-full" />
          <div className="absolute bottom-1 right-1 w-8 h-10 bg-[#00ff88] opacity-30 blur-[2px] rounded-full" />
        </Face>
        <Face w={w} h={l} transform={`translateZ(${-h / 2}px)`} color={cColor} />
        <Face w={w} h={h} transform={`translateY(${-l / 2}px) rotateX(90deg)`} color={cColor} />
        <Face w={w} h={h} transform={`translateY(${l / 2}px) rotateX(-90deg)`} color={cColor} />
        <Face w={l} h={h} transform={`translateX(${-w / 2}px) rotateY(-90deg)`} color={cColor} />
        <Face w={l} h={h} transform={`translateX(${w / 2}px) rotateY(90deg)`} color={cColor} />
      </div>
    </div>
  )
}

export function LaundryVisual({ className, taken = 3, free = 3 }: LaundryVisualProps) {
  const total = taken + free;
  // Increase spacing a bit so they aren't cramped, and center them.
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
      // The first 'taken' machines will be ON
      isOn: i < taken,
    });

    // Dryers in the back row (y = 40, facing backwards)
    machines.push({
      id: `d-${i}`,
      x: startX + i * spacing,
      y: 40,
      rotationZ: 180,
      // For variety, let the dryers fill up from the opposite end
      isOn: (total - 1 - i) < taken,
    });
  }

  return (
    <div
      className={cn(
        "relative w-full max-w-sm aspect-[16/9] rounded-2xl border border-tool-call-border/70 bg-black overflow-hidden shadow-sm",
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
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255, 255, 255, 0.15) 1px, transparent 1px)
                `,
                backgroundSize: "40px 40px",
              }}
            />
          </div>

          {machines.map((m) => (
            <Washer3D key={m.id} x={m.x} y={m.y} rotationZ={m.rotationZ} isOn={m.isOn} />
          ))}

          <Basket3D x={-50} y={0} rotationZ={20} />
          <Basket3D x={40} y={-5} rotationZ={-15} />

        </div>
      </div>

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
