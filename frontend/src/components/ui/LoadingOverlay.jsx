'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

const LoadingOverlay = ({ 
  isLoading, 
  message = "Loading...", 
  variant = "default",
  showProgress = false,
  progress = 0 
}) => {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const brandColors = {
    primary: theme === 'dark' ? '#06B6D4' : '#0DA8BA',
    secondary: theme === 'dark' ? '#8B5CF6' : '#6366F1',
    accent: theme === 'dark' ? '#F59E0B' : '#F97316'
  }

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ 
              duration: 0.4, 
              type: "spring",
              stiffness: 100 
            }}
            className="flex flex-col items-center space-y-6"
          >
            {/* Brand Loading Spinner */}
            {variant === "default" && (
              <div className="relative">
                {/* Outer ring */}
                <motion.div
                  className="w-16 h-16 border-4 border-transparent rounded-full"
                  style={{
                    borderTopColor: brandColors.primary,
                    borderRightColor: brandColors.secondary,
                  }}
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
                
                {/* Inner pulse */}
                <motion.div
                  className="absolute inset-2 rounded-full"
                  style={{ backgroundColor: brandColors.primary }}
                  animate={{
                    scale: [0.8, 1.2, 0.8],
                    opacity: [0.3, 0.7, 0.3]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Center dot */}
                <div 
                  className="absolute inset-6 rounded-full"
                  style={{ backgroundColor: brandColors.accent }}
                />
              </div>
            )}

            {/* Geometric Loading Animation */}
            {variant === "geometric" && (
              <div className="relative w-16 h-16">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 border-2 rounded-full"
                    style={{ 
                      borderColor: i === 0 ? brandColors.primary : 
                                  i === 1 ? brandColors.secondary : 
                                  brandColors.accent
                    }}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [1, 0.3, 1]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
            )}

            {/* Dots Loading Animation */}
            {variant === "dots" && (
              <div className="flex space-x-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: brandColors.primary }}
                    animate={{
                      y: [0, -10, 0],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
            )}

            {/* Progress Bar */}
            {showProgress && (
              <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: brandColors.primary }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
            )}

            {/* Loading Message */}
            <motion.p
              className="text-sm font-medium text-muted-foreground"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {message}
            </motion.p>

            {/* Floating particles for enhanced effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full opacity-60"
                  style={{
                    backgroundColor: i % 3 === 0 ? brandColors.primary :
                                    i % 3 === 1 ? brandColors.secondary :
                                    brandColors.accent,
                    left: `${20 + i * 15}%`,
                    top: `${30 + (i % 2) * 40}%`
                  }}
                  animate={{
                    y: [0, -20, 0],
                    x: [0, 10, 0],
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 0.8, 0.3]
                  }}
                  transition={{
                    duration: 3 + i * 0.5,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Page Transition Wrapper
export const PageTransition = ({ children, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.4,
        type: "spring",
        stiffness: 100,
        damping: 20
      }}
      className={`page-transition ${className}`}
    >
      {children}
    </motion.div>
  )
}

// Section Reveal Animation
export const SectionReveal = ({ 
  children, 
  delay = 0, 
  direction = "up",
  className = "" 
}) => {
  const directions = {
    up: { y: 30 },
    down: { y: -30 },
    left: { x: -30 },
    right: { x: 30 }
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        ...directions[direction]
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0
      }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.6,
        delay,
        type: "spring",
        stiffness: 100,
        damping: 20
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Skeleton Component for Loading States
export const Skeleton = ({ className = "", variant = "default", ...props }) => {
  const variants = {
    default: "h-4 w-full",
    text: "h-4 w-3/4",
    title: "h-6 w-1/2",
    avatar: "h-10 w-10 rounded-full",
    button: "h-10 w-24 rounded-md",
    card: "h-32 w-full rounded-lg"
  }

  return (
    <div
      className={`skeleton bg-muted animate-pulse ${variants[variant]} ${className}`}
      {...props}
    />
  )
}

export default LoadingOverlay