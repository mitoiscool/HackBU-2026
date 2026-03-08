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
          className="fixed right-0 bottom-0 z-50 flex items-end justify-end pointer-events-none"
          style={{ right: 0, bottom: 0 }}
        >
          <motion.div
            className="cursor-pointer pointer-events-auto"
            initial={{ scale: 0.3, opacity: 0, rotate: -8, x: 80 }}
            animate={{ scale: 1, opacity: 1, rotate: 0, x: 0 }}
            exit={{ scale: 0.7, opacity: 0, rotate: 4, x: 60 }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
            style={{ height: "75vh", width: "auto" }}
            onClick={onDismiss}
          >
            <Image
              src={src}
              alt="Baxter"
              style={{ height: "75vh", width: "auto", objectFit: "contain" }}
              priority
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
