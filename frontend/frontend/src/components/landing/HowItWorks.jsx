'use client';

import { motion } from 'framer-motion';
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

function StepCard({ step, index, totalSteps }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.3 });
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => setIsActive(true), index * 1500);
      return () => clearTimeout(timer);
    }
  }, [isInView, index]);

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
          
        </div>
      )}

      <motion.div
        whileHover={{ 
          y: -15,
          scale: 1.02,
          transition: { duration: 0.3, ease: "easeOut" }
        }}
        animate={isActive ? {
          boxShadow: "0 20px 40px rgba(77, 137, 176, 0.15)",
        } : {}}
        transition={{ duration: 0.5 }}
      >
        <Card className={`relative overflow-hidden h-full border-0 transition-all duration-500 group ${
          isActive 
            ? 'bg-[#4D89B0]/5 dark:bg-[#4D89B0]/10' 
            : ''
        } hover:shadow-xl hover:shadow-[#4D89B0]/20`}>
          {/* Animated background */}
          <motion.div 
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={isActive ? { 
              opacity: 1,
              background: "linear-gradient(135deg, rgba(77, 137, 176, 0.05) 0%, rgba(77, 137, 176, 0.05) 100%)"
            } : { opacity: 0 }}
            transition={{ duration: 0.8 }}
          />
          
          {/* Pulse effect for active step */}
          {isActive && (
            <motion.div
              className="absolute inset-0 rounded-lg"
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
                  ? 'bg-[#4D89B0] text-white scale-110'
                  : 'bg-[#4D89B0]/80 text-white'
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
              isActive ? 'text-white' : 'group-hover:text-[#4D89B0]'
            }`}>
              {step.title}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="relative z-10 text-center">
            <motion.p 
              className={`text-sm leading-relaxed transition-colors duration-300 ${
                isActive ? 'text-white/80' : 'text-muted-foreground group-hover:text-foreground/80'
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
                className="bg-[#4D89B0] h-2 rounded-full"
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

  const steps = [
    {
      step: '1',
      title: 'Visit Agora & Register Your Space',
      description:
        'Start by visiting the Agora website and connecting your Web3 wallet. Register a unique .agora domain name to create your decentralized governance space identifier.',
    },
    {
      step: '2',
      title: 'Configure Governance Rules',
      description:
        'Set up your governance space with custom parameters: define membership rules (public, token holders, NFT owners, or whitelist), configure voting models, and establish roles and permissions.',
    },
    {
      step: '3',
      title: 'Invite Community & Create Proposals',
      description:
        'Share access with community members and assign roles (Owner, Admin, Member). Submit private proposals with rich descriptions, configurable voting periods, and automated Chainlink workflows.',
    },
    {
      step: '4',
      title: 'Vote Anonymously, Reveal Results',
      description:
        'Cast encrypted votes using FHE technology to maintain privacy. Chainlink automation handles tallying and reveals verifiable, transparent outcomes without compromising anonymity.',
    },
  ];

  return (
    <section className="relative w-full px-4 py-20 md:py-32 overflow-hidden" ref={ref}>
      {/* Background elements */}
      
      
      {/* Floating shapes */}
      <motion.div
        className="absolute top-20 left-10 w-32 h-32 rounded-full bg-[#4D89B0]/10 blur-2xl"
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
        className="absolute bottom-20 right-10 w-40 h-40 rounded-full bg-[#4D89B0]/10 blur-2xl"
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

      <div className="relative max-w-7xl mx-auto z-10">
        {/* Enhanced header */}
        <motion.div 
          className="text-center space-y-6 mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
        >
          
          <motion.h2 
            className="section-title text-4xl sm:text-5xl lg:text-6xl font-bold text-[#4D89B0]"
          >
            How It Works
          </motion.h2>
          
          <motion.p 
            className="section-description max-w-3xl mx-auto text-lg sm:text-xl leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Experience the power of privacy-preserving governance with Agora. Follow these four steps to create secure, decentralized spaces where your community's votes remain encrypted.
          </motion.p>
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
            />
          ))}
        </motion.div>

        
      </div>
    </section>
  );
}