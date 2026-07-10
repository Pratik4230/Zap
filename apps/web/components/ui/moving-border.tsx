"use client"

import React, { useRef } from "react"
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "motion/react"
import { cn } from "@/lib/utils"

type MovingBorderButtonProps<C extends React.ElementType = "button"> = {
  borderRadius?: string
  children: React.ReactNode
  as?: C
  containerClassName?: string
  borderClassName?: string
  duration?: number
  className?: string
} & Omit<React.ComponentPropsWithoutRef<C>, "as" | "children" | "className">

export function Button<C extends React.ElementType = "button">({
  borderRadius = "1.75rem",
  children,
  as,
  containerClassName,
  borderClassName,
  duration,
  className,
  ...otherProps
}: MovingBorderButtonProps<C>) {
  const Component = as ?? "button"

  return (
    <Component
      className={cn(
        "relative h-16 w-40 overflow-hidden bg-transparent p-px text-xl",
        containerClassName
      )}
      style={{
        borderRadius,
      }}
      {...otherProps}
    >
      <div
        className="absolute inset-0"
        style={{ borderRadius: `calc(${borderRadius} * 0.96)` }}
      >
        <MovingBorder duration={duration} rx="30%" ry="30%">
          <div
            className={cn(
              "size-20 bg-[radial-gradient(#0ea5e9_40%,transparent_60%)] opacity-80",
              borderClassName
            )}
          />
        </MovingBorder>
      </div>

      <div
        className={cn(
          "relative flex h-full w-full items-center justify-center border border-slate-800 bg-slate-900/80 text-sm text-white antialiased backdrop-blur-xl",
          className
        )}
        style={{
          borderRadius: `calc(${borderRadius} * 0.96)`,
        }}
      >
        {children}
      </div>
    </Component>
  )
}

export const MovingBorder = ({
  children,
  duration = 3000,
  rx,
  ry,
  ...otherProps
}: {
  children: React.ReactNode
  duration?: number
  rx?: string
  ry?: string
} & React.SVGProps<SVGSVGElement>) => {
  const pathRef = useRef<SVGRectElement>(null)
  const progress = useMotionValue<number>(0)

  useAnimationFrame((time) => {
    const length = pathRef.current?.getTotalLength()
    if (length) {
      const pxPerMillisecond = length / duration
      progress.set((time * pxPerMillisecond) % length)
    }
  })

  const x = useTransform(
    progress,
    (val) => pathRef.current?.getPointAtLength(val).x
  )
  const y = useTransform(
    progress,
    (val) => pathRef.current?.getPointAtLength(val).y
  )

  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="absolute size-full"
        width="100%"
        height="100%"
        {...otherProps}
      >
        <rect fill="none" width="100%" height="100%" rx={rx} ry={ry} ref={pathRef} />
      </svg>
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "inline-block",
          transform,
        }}
      >
        {children}
      </motion.div>
    </>
  )
}
