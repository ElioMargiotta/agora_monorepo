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
        className="relative py-6 px-4 sm:py-8 sm:px-6 border-l-2 border-cyan-200 dark:border-cyan-800 hover:border-[#4D89B0] dark:hover:border-[#4D89B0] transition-all duration-300"
        whileHover={{ x: 10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Animated background on hover */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-[#4D89B0]/10 to-transparent dark:from-[#4D89B0]/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        />
        
        {/* Content */}
        <div className="relative z-10">
          <motion.h3 
            className="text-lg sm:text-xl font-bold text-foreground group-hover:text-[#4D89B0] dark:group-hover:text-[#4D89B0] transition-colors duration-300 mb-2 sm:mb-3"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.2 + (index * 0.1) }}
          >
            {feature.title}
          </motion.h3>
          
          <motion.p 
            className="text-sm sm:text-base text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300 leading-relaxed text-justify"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.4 + (index * 0.1) }}
          >
            {feature.description}
          </motion.p>
        </div>
        
        {/* Hover indicator */}
        <motion.div
          className="absolute left-0 top-0 w-1 h-full bg-[#4D89B0] scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top"
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
      title: 'Privacy vs. Transparency Trade-off',
      description:
        'FHE enables computation on encrypted data, allowing vote tallying without ever decrypting individual ballots—decisions stay public, votes stay private.',
    },
    {
      title: 'Voter Intimidation',
      description:
        'Anonymous voting prevents coercion and ensures free expression, protecting participants from external pressures.',
    },
    {
      title: 'Sybil Attacks',
      description:
        'Token-based eligibility systems prevent manipulation while maintaining privacy, ensuring fair and secure governance.',
    },
    {
      title: 'Scalability',
      description:
        'Efficient encrypted computation enables large-scale governance without performance degradation, supporting growing communities.',
    },
  ];

  return (
    <section className="relative w-full px-4 py-16 sm:py-20 md:py-32 overflow-hidden" ref={ref}>
      {/* Background elements */}
      
      
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

      <div className="relative max-w-7xl mx-auto z-10">
        {/* Enhanced header with animated title */}
        <motion.div 
          className="text-center space-y-4 sm:space-y-6 mb-16 sm:mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
        >
          
          <motion.h2 
            className="section-title text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#4D89B0]"
          >
            {"Our Vision".split('').map((char, i) => (
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
            className="section-description max-w-3xl mx-auto text-base sm:text-lg md:text-xl leading-relaxed text-justify"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            The core purpose of Agora is to democratize governance by solving the fundamental privacy paradox in decentralized systems: how to maintain transparency in decision-making while protecting individual voter privacy. Traditional DAOs often require sacrificing anonymity for accountability, but Agora uses cutting-edge cryptography to provide both.
          </motion.p>
        </motion.div>
        
        {/* Subheading for problems solved */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <h3 className="text-2xl sm:text-3xl font-semibold text-[#4D89B0] mb-4">
            The Problems Agora Solves
          </h3>          <p className="text-muted-foreground max-w-2xl mx-auto text-justify">
          </p>
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

        </motion.div>
      </div>
    </section>
  );
}
