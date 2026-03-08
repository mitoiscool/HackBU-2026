"use client"

import { motion } from "framer-motion"
import Image, { type StaticImageData } from "next/image"

export type BaxterOverlayPosition = {
  bottom?: string
  left?: string
  right?: string
  top?: string
}

type BaxterOverlayProps = {
  position: BaxterOverlayPosition
  src: StaticImageData
  onDismiss: () => void
}

export function BaxterOverlay({ position, src, onDismiss }: BaxterOverlayProps) {
  return (
    <motion.button
      type="button"
      className="fixed z-50 block cursor-pointer bg-transparent p-0"
      style={{ ...position, width: "clamp(84px, 22vw, 180px)" }}
      initial={{ scale: 0.3, opacity: 0, rotate: -8, x: 80 }}
      animate={{ scale: 1, opacity: 1, rotate: 0, x: 0 }}
      exit={{ scale: 0.7, opacity: 0, rotate: 4, x: 60 }}
      transition={{ type: "spring", stiffness: 350, damping: 22 }}
      onClick={onDismiss}
      aria-label="Dismiss Baxter"
    >
      <Image
        src={src}
        alt="Baxter"
        className="h-auto w-full object-contain"
        sizes="(max-width: 640px) 96px, (max-width: 1024px) 144px, 180px"
        priority
      />
    </motion.button>
  )
}
