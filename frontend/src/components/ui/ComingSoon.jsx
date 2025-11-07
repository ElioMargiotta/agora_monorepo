'use client';

import { motion } from 'framer-motion';
import { Clock, Smartphone, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function ComingSoon({ 
  title = "Coming Soon", 
  description = "We're working hard to bring you this feature.", 
  showMobileOnly = true 
}) {
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${showMobileOnly ? 'md:hidden' : ''}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-6 max-w-md mx-auto"
      >
        {/* Animated Clock Icon */}
        <motion.div
          className="flex justify-center"
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.div
            className="relative p-6 bg-orange-500/10 rounded-full"
            animate={{ 
              boxShadow: [
                "0 0 0 0 rgba(249, 115, 22, 0.4)",
                "0 0 0 20px rgba(249, 115, 22, 0)",
                "0 0 0 0 rgba(249, 115, 22, 0)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Clock className="h-12 w-12 text-orange-500" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-2xl font-bold text-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {title}
        </motion.h1>

        {/* Description */}
        <motion.p
          className="text-muted-foreground leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {description}
        </motion.p>

        {/* Mobile Optimized Badge */}
        {showMobileOnly && (
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Smartphone className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Mobile Optimized</span>
          </motion.div>
        )}

        {/* Floating dots animation */}
        <motion.div 
          className="flex justify-center gap-2 py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-orange-500 rounded-full"
              animate={{
                y: [0, -10, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>

        {/* Back to Markets Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <Button asChild className="w-full">
            <Link href="/app/funding-comparison">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Markets
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}

// Desktop fallback component
export function DesktopFallback({ children, comingSoonTitle, comingSoonDescription }) {
  return (
    <>
      {/* Mobile: Coming Soon */}
      <div className="md:hidden">
        <ComingSoon 
          title={comingSoonTitle}
          description={comingSoonDescription}
          showMobileOnly={true}
        />
      </div>
      
      {/* Desktop: Show actual content */}
      <div className="hidden md:block">
        {children}
      </div>
    </>
  );
}