"use client"

import { AnimatePresence, motion } from "framer-motion"
import Image, { type StaticImageData } from "next/image"

type BaxterOverlayProps = {
  src: StaticImageData | null
  visible: boolean
  onDismiss: () => void
}

export function BaxterOverlay({ src, visible, onDismiss }: BaxterOverlayProps) {
  return (
    <AnimatePresence>
      {visible && src && (
        <motion.div
          key="baxter-overlay"
          className="pointer-events-none fixed right-2 top-[42%] z-50 flex -translate-y-1/2 items-center justify-end md:right-4 md:top-1/2"
        >
          <motion.div
            className="cursor-pointer pointer-events-auto"
            initial={{ scale: 0.3, opacity: 0, rotate: -8, x: 80 }}
            animate={{ scale: 1, opacity: 1, rotate: 0, x: 0 }}
            exit={{ scale: 0.7, opacity: 0, rotate: 4, x: 60 }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
            style={{ width: "clamp(84px, 22vw, 180px)" }}
            onClick={onDismiss}
          >
            <Image
              src={src}
              alt="Baxter"
              className="h-auto w-full object-contain"
              sizes="(max-width: 640px) 96px, (max-width: 1024px) 144px, 180px"
              priority
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
