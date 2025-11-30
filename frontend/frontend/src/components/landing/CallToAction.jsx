'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';

export function CallToAction() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.3 });

  return (
    <section className="relative w-full px-4 py-16 md:py-24 overflow-hidden" ref={ref}>
      {/* Background gradient */}
      
      
      {/* Animated background elements */}
      <motion.div
        className="absolute top-20 left-20 w-32 h-32 rounded-full blur-2xl"
        style={{
          background: "linear-gradient(135deg, rgba(77, 137, 176, 0.1), rgba(77, 137, 176, 0.1))",
        }}
        animate={{
          y: [-20, 20, -20],
          rotate: [-5, 5, -5],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-40 h-40 rounded-full blur-2xl"
        style={{
          background: "linear-gradient(225deg, rgba(77, 137, 176, 0.08), rgba(77, 137, 176, 0.08))",
        }}
        animate={{
          y: [30, -30, 30],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <motion.div 
        className="relative mx-auto max-w-4xl text-center space-y-8 z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.8 }}
      >
        <motion.h2 
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#4D89B0] px-4 sm:px-0"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Ready to Experience the Future of Privacy?
        </motion.h2>
        
        <motion.p 
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4 sm:px-0 mt-8 text-justify"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
        Discover how Zama’s Fully Homomorphic Encryption brings private governance to public blockchains. Enter Agora to create your space, launch encrypted proposals, and let Chainlink automate verifiable outcomes.        
        </motion.p>

        <motion.p 
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4 sm:px-0 mt-8 text-justify"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
        Public results, hidden votes.
        </motion.p>

        {/* Call to action */}
        <motion.div
          className="text-center mt-20 space-y-6"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 1.5 }}
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.a
              href="/app"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#4D89B0] text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(77, 137, 176, 0.3)"
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
            </motion.a>

            <motion.a
              href="/app/docs"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full border-2 border-[#4D89B0] text-[#4D89B0] bg-transparent hover:bg-[#4D89B0] hover:text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(77, 137, 176, 0.3)"
              }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.6, delay: 1.7 }}
            >
              <span>View Documentation</span>
              <motion.div
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                
              </motion.div>
            </motion.a>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
