"use client"

import { cn } from "@/lib/utils"
import { motion, useMotionTemplate, useMotionValue } from "motion/react"

const dotPatterns = {
  default: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='16' height='16' fill='none'%3E%3Ccircle fill='%23404040' cx='10' cy='10' r='2.5'%3E%3C/circle%3E%3C/svg%3E")`,
  hover: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='16' height='16' fill='none'%3E%3Ccircle fill='%23f59e0b' cx='10' cy='10' r='2.5'%3E%3C/circle%3E%3C/svg%3E")`,
}

export function HeroDotBackground({ className }: { className?: string }) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  return (
    <div
      className={cn("group absolute inset-0 overflow-hidden", className)}
      onMouseMove={handleMouseMove}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: dotPatterns.default }}
      />
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          backgroundImage: dotPatterns.hover,
          WebkitMaskImage: useMotionTemplate`
            radial-gradient(220px circle at ${mouseX}px ${mouseY}px, black 0%, transparent 100%)
          `,
          maskImage: useMotionTemplate`
            radial-gradient(220px circle at ${mouseX}px ${mouseY}px, black 0%, transparent 100%)
          `,
        }}
      />
    </div>
  )
}
