'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

function FeatureItem({ feature, index }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.3 });

  return (
    <motion.div
      ref={ref}
      variants={itemVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className="group"
    >
      <motion.div 
        className="relative py-6 px-4 sm:py-8 sm:px-6 border-l-2 border-cyan-200 dark:border-cyan-800 hover:border-cyan-400 dark:hover:border-cyan-600 transition-all duration-300"
        whileHover={{ x: 10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Animated background on hover */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-cyan-50/50 to-transparent dark:from-cyan-900/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        />
        
        {/* Content */}
        <div className="relative z-10">
          <motion.h3 
            className="text-lg sm:text-xl font-bold text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors duration-300 mb-2 sm:mb-3"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.2 + (index * 0.1) }}
          >
            {feature.title}
          </motion.h3>
          
          <motion.p 
            className="text-sm sm:text-base text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.4 + (index * 0.1) }}
          >
            {feature.description}
          </motion.p>
        </div>
        
        {/* Hover indicator */}
        <motion.div
          className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-blue-500 scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top"
        />
      </motion.div>
    </motion.div>
  );
}

export function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.1 });

  const features = [
    {
      title: 'Unified Dashboard',
      description:
        'Manage all your crypto trades and strategies in one place across multiple exchanges',

    },
    {
      title: 'Cross-Platform Trading',
      description: 'Execute trades on multiple DEXs from a single interface - no more juggling screens',
    },
    {
      title: 'Funding Rate Arbitrage',
      description:
        'Access advanced arbitrage strategies with one-click delta-neutral positions',
      
    },
    {
      title: 'Strategy Automation',
      description:
        'Build and execute custom multi-exchange strategies without coding',
      
    },
    {
      title: 'Beginner-Friendly',
      description: 'Intuitive interface designed for retail traders and newcomers',
      
    },
    {
      title: 'Multi-DEX Integration',
      description: 'Connect to Hyperliquid, Aster, Lighter, Paradex, Extended, and more',
    },
  ];

  return (
    <section className="relative w-full px-4 py-16 sm:py-20 md:py-32 overflow-hidden" ref={ref}>
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/20 to-transparent" />
      
      {/* Floating background shapes - Smaller on mobile */}
      <motion.div
        className="absolute -top-24 -left-24 w-48 h-48 md:w-96 md:h-96 rounded-full bg-cyan-400/5 blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="absolute -bottom-24 -right-24 w-48 h-48 md:w-96 md:h-96 rounded-full bg-blue-400/5 blur-3xl"
        animate={{
          x: [0, -30, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Enhanced header with animated title */}
        <motion.div 
          className="text-center space-y-4 sm:space-y-6 mb-16 sm:mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-full bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800"
          >
            <span className="text-xs sm:text-sm font-medium text-cyan-700 dark:text-cyan-300">✨ Platform Capabilities</span>
          </motion.div>
          
          <motion.h2 
            className="section-title text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-cyan-700 to-blue-700 dark:from-white dark:via-cyan-300 dark:to-blue-300 bg-clip-text text-transparent"
          >
            {"Why Choose Our Platform".split('').map((char, i) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ delay: 0.3 + (i * 0.05), duration: 0.6 }}
              >
                {char === ' ' ? '\u00A0' : char}
              </motion.span>
            ))}
          </motion.h2>
          
          <motion.p 
            className="section-description max-w-3xl mx-auto text-base sm:text-lg md:text-xl leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            Experience the future of multi-platform trading. One unified interface to trade, arbitrage, 
            and strategize across multiple DEXs without the complexity of managing multiple accounts.
          </motion.p>
        </motion.div>
        
        {/* Clean list with staggered animation */}
        <motion.div 
          className="max-w-4xl mx-auto space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {features.map((feature, index) => (
            <FeatureItem key={index} feature={feature} index={index} />
          ))}
        </motion.div>

        {/* Call to action section */}
        <motion.div
          className="text-center mt-16 sm:mt-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <motion.div
            className="inline-flex items-center gap-3 sm:gap-4 px-4 py-3 sm:px-6 sm:py-3 rounded-full bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-200 dark:border-cyan-800"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-xs sm:text-sm font-medium text-cyan-700 dark:text-cyan-300">
              Ready to trade smarter? Experience unified multi-platform trading now
            </span>
            <motion.div
              className="w-2 h-2 bg-cyan-500 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
