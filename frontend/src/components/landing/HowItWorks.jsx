'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const stepVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2
    }
  }
};

function StepCard({ step, index, totalSteps, progressValue }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.3 });
  const [isActive, setIsActive] = useState(false);

  // Determine if this step should be highlighted based on progress
  const shouldHighlight = progressValue >= (index + 1) / totalSteps;

  useEffect(() => {
    if (shouldHighlight) {
      const timer = setTimeout(() => setIsActive(true), index * 500);
      return () => clearTimeout(timer);
    }
  }, [shouldHighlight, index]);

  return (
    <motion.div
      ref={ref}
      variants={stepVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className="relative"
    >
      {/* Step connector line */}
      {index < totalSteps - 1 && (
        <div className="hidden lg:block absolute top-1/2 left-full w-full h-0.5 z-0">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400/30 to-transparent"
            initial={{ scaleX: 0 }}
            animate={isActive ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            style={{ originX: 0 }}
          />
        </div>
      )}

      <motion.div
        whileHover={{ 
          y: -15,
          scale: 1.02,
          transition: { duration: 0.3, ease: "easeOut" }
        }}
        animate={isActive ? {
          boxShadow: "0 20px 40px rgba(6, 182, 212, 0.15)",
        } : {}}
        transition={{ duration: 0.5 }}
      >
        <Card className={`relative overflow-hidden h-full border-2 transition-all duration-500 group ${
          isActive 
            ? 'border-cyan-400/60 bg-cyan-50/50 dark:bg-cyan-900/10' 
            : 'border-muted/20 hover:border-cyan-400/40'
        } hover:shadow-xl hover:shadow-cyan-400/20`}>
          {/* Animated background */}
          <motion.div 
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={isActive ? { 
              opacity: 1,
              background: "linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)"
            } : { opacity: 0 }}
            transition={{ duration: 0.8 }}
          />
          
          {/* Pulse effect for active step */}
          {isActive && (
            <motion.div
              className="absolute inset-0 border-2 border-cyan-400/30 rounded-lg"
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
          
          <CardHeader className="relative z-10 text-center">
            {/* Animated step number */}
            <motion.div
              className={`flex h-16 w-16 mx-auto items-center justify-center rounded-full font-bold text-xl mb-4 shadow-lg transition-all duration-500 ${
                isActive
                  ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white scale-110'
                  : 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground'
              }`}
              whileHover={{ 
                scale: isActive ? 1.2 : 1.1,
                rotate: [0, -5, 5, 0],
                transition: { duration: 0.3 }
              }}
              initial={{ scale: 0, rotate: -180 }}
              animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
              transition={{ duration: 0.6, delay: index * 0.1, type: "spring", stiffness: 200 }}
            >
              {step.step}
            </motion.div>
            
            <CardTitle className={`text-xl font-bold transition-all duration-300 ${
              isActive ? 'text-cyan-600 dark:text-cyan-400' : 'group-hover:text-primary'
            }`}>
              {step.title}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="relative z-10 text-center">
            <motion.p 
              className={`text-sm leading-relaxed transition-colors duration-300 ${
                isActive ? 'text-cyan-700 dark:text-cyan-300' : 'text-muted-foreground group-hover:text-foreground/80'
              }`}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.5 + (index * 0.1) }}
            >
              {step.description}
            </motion.p>
            
            {/* Progress indicator */}
            <motion.div
              className="w-full bg-muted/30 rounded-full h-1 mt-4"
              initial={{ opacity: 0 }}
              animate={isActive ? { opacity: 1 } : { opacity: 0 }}
            >
              <motion.div
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-1 rounded-full"
                initial={{ width: 0 }}
                animate={isActive ? { width: "100%" } : { width: 0 }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.1 });
  const [progressValue, setProgressValue] = useState(0);

  // Scroll-based progress animation
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"]
  });

  useEffect(() => {
    const unsubscribe = scrollYProgress.onChange(latest => {
      setProgressValue(latest);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  const steps = [
    {
      step: '1',
      title: 'Connect & Unify',
      description: 'Connect your wallet and access multiple DEXs through our unified dashboard interface',
    },
    {
      step: '2',
      title: 'Explore Markets',
      description: 'Browse all available markets across Hyperliquid, Aster, Lighter, Paradex, Extended in one view',
    },
    {
      step: '3',
      title: 'Build Strategies',
      description: 'Create cross-platform trades, funding arbitrage, or custom strategies without complexity',
    },
    {
      step: '4',
      title: 'Execute Seamlessly',
      description: 'Trade across multiple exchanges as if they were one platform with unified position tracking',
    },
  ];

  return (
    <section className="relative w-full px-4 py-20 md:py-32 overflow-hidden" ref={ref}>
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-50/30 to-transparent dark:via-cyan-950/30" />
      
      {/* Floating shapes */}
      <motion.div
        className="absolute top-20 left-10 w-32 h-32 rounded-full bg-cyan-400/10 blur-2xl"
        animate={{
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="absolute bottom-20 right-10 w-40 h-40 rounded-full bg-blue-400/10 blur-2xl"
        animate={{
          y: [0, 20, 0],
          scale: [1.1, 1, 1.1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Enhanced header */}
        <motion.div 
          className="text-center space-y-6 mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-200 dark:border-cyan-800"
          >
            <span className="text-sm font-medium text-cyan-700 dark:text-cyan-300">🚀 Get Started</span>
          </motion.div>
          
          <motion.h2 
            className="section-title text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-cyan-700 to-blue-700 dark:from-white dark:via-cyan-300 dark:to-blue-300 bg-clip-text text-transparent"
          >
            How It Works
          </motion.h2>
          
          <motion.p 
            className="section-description max-w-3xl mx-auto text-lg sm:text-xl leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Experience the power of unified multi-platform trading in four simple steps. From connection to execution, 
            we make cross-exchange trading accessible to everyone, regardless of experience level.
          </motion.p>

          {/* Progress bar */}
          <motion.div 
            className="max-w-2xl mx-auto mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div className="w-full bg-muted/30 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressValue * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Scroll to see the process unfold
            </p>
          </motion.div>
        </motion.div>
        
        {/* Steps grid with enhanced animations */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {steps.map((step, index) => (
            <StepCard 
              key={index} 
              step={step} 
              index={index} 
              totalSteps={steps.length}
              progressValue={progressValue}
            />
          ))}
        </motion.div>

        {/* Call to action */}
        <motion.div
          className="text-center mt-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 1.5 }}
        >
          <motion.button
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 20px 40px rgba(6, 182, 212, 0.3)"
            }}
            whileTap={{ scale: 0.95 }}
          >
            <span>Start Your Journey</span>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.div>
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}