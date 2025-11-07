'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Skip Navigation Component
export const SkipNavigation = () => {
  const skipLinks = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#navigation', label: 'Skip to navigation' },
    { href: '#footer', label: 'Skip to footer' }
  ]

  return (
    <nav className="sr-only focus-within:not-sr-only">
      <ul className="flex space-x-2 p-2">
        {skipLinks.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="skip-to-content focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// Live Announcer for Screen Readers
export const LiveAnnouncer = () => {
  const [announcement, setAnnouncement] = useState('')
  const [politeness, setPoliteness] = useState('polite')
  const timeoutRef = useRef(null)

  useEffect(() => {
    const announce = (message, level = 'polite') => {
      setPoliteness(level)
      setAnnouncement(message)
      
      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      // Clear announcement after it's been read
      timeoutRef.current = setTimeout(() => {
        setAnnouncement('')
      }, 1000)
    }

    // Global function for announcements
    window.announceToScreenReader = announce

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      delete window.announceToScreenReader
    }
  }, [])

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  )
}

// Focus Trap Component
export const FocusTrap = ({ 
  children, 
  active = true, 
  restoreFocus = true,
  className = "" 
}) => {
  const containerRef = useRef(null)
  const previousActiveElement = useRef(null)

  useEffect(() => {
    if (!active) return

    const container = containerRef.current
    if (!container) return

    // Store the currently focused element
    previousActiveElement.current = document.activeElement

    // Get all focusable elements
    const getFocusableElements = () => {
      return container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    }

    const handleKeyDown = (event) => {
      if (event.key !== 'Tab') return

      const focusableElements = getFocusableElements()
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement?.focus()
        }
      }
    }

    // Focus first element when trap activates
    const focusableElements = getFocusableElements()
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      
      // Restore focus when trap deactivates
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }
  }, [active, restoreFocus])

  if (!active) return children

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}

// Accessible Motion Component with Reduced Motion Support
export const AccessibleMotion = ({ 
  children, 
  reduceMotion = false,
  fallback = null,
  ...motionProps 
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  if (prefersReducedMotion || reduceMotion) {
    return fallback || <div className="transition-opacity duration-150">{children}</div>
  }

  return (
    <motion.div {...motionProps}>
      {children}
    </motion.div>
  )
}

// Progress Announcer for Loading States
export const ProgressAnnouncer = ({ 
  progress, 
  label = "Loading progress",
  announceInterval = 25 
}) => {
  const [lastAnnouncedProgress, setLastAnnouncedProgress] = useState(0)

  useEffect(() => {
    const shouldAnnounce = progress - lastAnnouncedProgress >= announceInterval
    
    if (shouldAnnounce && window.announceToScreenReader) {
      const message = `${label}: ${progress}% complete`
      window.announceToScreenReader(message, 'polite')
      setLastAnnouncedProgress(progress)
    }
  }, [progress, label, announceInterval, lastAnnouncedProgress])

  return (
    <div
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="sr-only"
    >
      {progress}% complete
    </div>
  )
}

// High Contrast Mode Detector
export const HighContrastMode = ({ children, fallback }) => {
  const [highContrast, setHighContrast] = useState(false)

  useEffect(() => {
    const checkHighContrast = () => {
      const mediaQuery = window.matchMedia('(prefers-contrast: high)')
      setHighContrast(mediaQuery.matches)

      const handleChange = (e) => setHighContrast(e.matches)
      mediaQuery.addEventListener('change', handleChange)

      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    return checkHighContrast()
  }, [])

  return highContrast && fallback ? fallback : children
}

// Keyboard Navigation Helper
export const KeyboardNavigation = ({ children, onEscape, onEnter }) => {
  const handleKeyDown = (event) => {
    switch (event.key) {
      case 'Escape':
        if (onEscape) {
          event.preventDefault()
          onEscape(event)
        }
        break
      case 'Enter':
        if (onEnter) {
          event.preventDefault()
          onEnter(event)
        }
        break
    }
  }

  return (
    <div onKeyDown={handleKeyDown} role="group">
      {children}
    </div>
  )
}

// Screen Reader Only Text
export const ScreenReaderOnly = ({ children, className = "" }) => {
  return (
    <span className={`sr-only ${className}`}>
      {children}
    </span>
  )
}

// Accessible Button with Loading State
export const AccessibleButton = ({
  children,
  loading = false,
  loadingText = "Loading...",
  disabled = false,
  onClick,
  variant = "default",
  size = "default",
  className = "",
  ...props
}) => {
  const isDisabled = disabled || loading

  const handleClick = (event) => {
    if (isDisabled) return
    
    if (onClick) {
      onClick(event)
      
      // Announce action completion
      if (window.announceToScreenReader) {
        window.announceToScreenReader("Action completed", "polite")
      }
    }
  }

  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
  }

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 px-3 py-1",
    lg: "h-11 px-8 py-3"
  }

  return (
    <button
      className={`
        inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium 
        transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring 
        focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={isDisabled}
      onClick={handleClick}
      aria-label={loading ? loadingText : undefined}
      {...props}
    >
      {loading && (
        <>
          <motion.div
            className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <ScreenReaderOnly>{loadingText}</ScreenReaderOnly>
        </>
      )}
      {children}
    </button>
  )
}