'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { useTheme } from 'next-themes'
import { SkipNavigation, LiveAnnouncer } from './AccessibilityComponents'
import LoadingOverlay from './LoadingOverlay'

export const AnimatedLayout = ({ 
  children, 
  loading = false,
  enableParallax = true,
  className = "" 
}) => {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { scrollY } = useScroll()
  
  // Parallax transforms
  const backgroundY = useTransform(scrollY, [0, 500], [0, 150])
  const contentY = useTransform(scrollY, [0, 500], [0, -50])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <LoadingOverlay isLoading={true} message="Initializing..." />
  }

  return (
    <div className={`min-h-screen relative overflow-hidden ${className}`}>
      {/* Skip Navigation */}
      <SkipNavigation />
      
      {/* Live Announcer for Screen Readers */}
      <LiveAnnouncer />
      
      {/* Loading Overlay */}
      <LoadingOverlay isLoading={loading} />

      {/* Animated Background */}
      {enableParallax && (
        <motion.div
          style={{ y: backgroundY }}
          className="fixed inset-0 -z-10"
        >
          {/* Dynamic gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
          
          {/* Floating shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full opacity-10"
                style={{
                  width: `${100 + i * 20}px`,
                  height: `${100 + i * 20}px`,
                  left: `${10 + i * 12}%`,
                  top: `${5 + i * 15}%`,
                  background: `linear-gradient(135deg, ${
                    theme === 'dark' ? '#06B6D4' : '#0DA8BA'
                  }, ${
                    theme === 'dark' ? '#8B5CF6' : '#6366F1'
                  })`
                }}
                animate={{
                  y: [0, -30, 0],
                  rotate: [0, 180, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 8 + i * 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.5
                }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Main Content with Parallax */}
      <motion.main
        id="main-content"
        style={{ y: enableParallax ? contentY : 0 }}
        className="relative z-10"
      >
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </motion.main>

      {/* Scroll Progress Indicator */}
      <ScrollProgressIndicator />
    </div>
  )
}

// Scroll Progress Indicator
const ScrollProgressIndicator = () => {
  const { scrollYProgress } = useScroll()
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-primary/20 z-50"
      style={{ scaleX }}
      initial={{ scaleX: 0 }}
    >
      <motion.div
        className="h-full bg-primary origin-left"
        style={{ scaleX }}
      />
    </motion.div>
  )
}

// Intersection Observer Hook for Scroll Animations
export const useInView = (threshold = 0.1, rootMargin = "0px") => {
  const [inView, setInView] = useState(false)
  const [ref, setRef] = useState(null)

  useEffect(() => {
    if (!ref) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
      },
      { threshold, rootMargin }
    )

    observer.observe(ref)

    return () => {
      if (ref) observer.unobserve(ref)
    }
  }, [ref, threshold, rootMargin])

  return [setRef, inView]
}

// Scroll-triggered Animation Component
export const ScrollAnimation = ({
  children,
  animation = "fadeInUp",
  delay = 0,
  threshold = 0.1,
  className = ""
}) => {
  const [ref, inView] = useInView(threshold)

  const animations = {
    fadeInUp: {
      hidden: { opacity: 0, y: 50 },
      visible: { opacity: 1, y: 0 }
    },
    fadeInDown: {
      hidden: { opacity: 0, y: -50 },
      visible: { opacity: 1, y: 0 }
    },
    fadeInLeft: {
      hidden: { opacity: 0, x: -50 },
      visible: { opacity: 1, x: 0 }
    },
    fadeInRight: {
      hidden: { opacity: 0, x: 50 },
      visible: { opacity: 1, x: 0 }
    },
    scaleIn: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: { opacity: 1, scale: 1 }
    },
    slideInUp: {
      hidden: { opacity: 0, y: "100%" },
      visible: { opacity: 1, y: 0 }
    }
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={animations[animation]}
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

// Stagger Container for Multiple Animations
export const StaggerContainer = ({ 
  children, 
  staggerDelay = 0.1,
  className = "" 
}) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Individual Stagger Item
export const StaggerItem = ({ 
  children, 
  animation = "fadeInUp",
  className = "" 
}) => {
  const animations = {
    fadeInUp: {
      hidden: { opacity: 0, y: 30 },
      visible: { opacity: 1, y: 0 }
    },
    fadeInLeft: {
      hidden: { opacity: 0, x: -30 },
      visible: { opacity: 1, x: 0 }
    },
    fadeInRight: {
      hidden: { opacity: 0, x: 30 },
      visible: { opacity: 1, x: 0 }
    },
    scaleIn: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: { opacity: 1, scale: 1 }
    }
  }

  return (
    <motion.div
      variants={animations[animation]}
      transition={{
        duration: 0.5,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Magnetic Hover Effect
export const MagneticHover = ({ 
  children, 
  strength = 0.3,
  className = "" 
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    setMousePosition({
      x: (e.clientX - centerX) * strength,
      y: (e.clientY - centerY) * strength
    })
  }

  return (
    <motion.div
      className={`magnetic-hover ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setMousePosition({ x: 0, y: 0 })
      }}
      animate={{
        x: isHovered ? mousePosition.x : 0,
        y: isHovered ? mousePosition.y : 0
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 20
      }}
    >
      {children}
    </motion.div>
  )
}

export default AnimatedLayout