"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type SpinningLoaderProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  sm: 32,
  md: 48,
  lg: 64,
};

export function SpinningLoader({
  size = "lg",
  className,
}: SpinningLoaderProps) {
  const dimension = sizeMap[size];

  return (
    <motion.div
      animate={{
        rotate: 360,
      }}
      className={cn("relative", className)}
      style={{
        width: dimension,
        height: dimension,
      }}
      transition={{
        type: "spring",
        stiffness: 50,
        damping: 8,
        mass: 1.5,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "loop",
      }}
    >
      <Image
        alt="Loading..."
        className="h-full w-full"
        height={dimension}
        priority
        src="/icon0.svg"
        width={dimension}
      />
    </motion.div>
  );
}
