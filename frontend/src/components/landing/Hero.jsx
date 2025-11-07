'use client';

import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { useState, useEffect, useRef } from 'react';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5 }
};

export function Hero() {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Scroll-triggered animations
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Parallax transforms
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const shapesY = useTransform(scrollYProgress, [0, 1], ["0%", "60%"]);

  // Mouse parallax effects
  const mouseXSpring = useSpring(mousePosition.x, { stiffness: 500, damping: 50 });
  const mouseYSpring = useSpring(mousePosition.y, { stiffness: 500, damping: 50 });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mouse movement tracking for parallax
  useEffect(() => {
    const handleMouseMove = (e) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
        const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
        setMousePosition({ x: x * 50, y: y * 50 });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => container.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isLight = mounted && currentTheme === 'light';

  return (
    <section 
      ref={containerRef}
      className={`relative w-full min-h-screen flex items-center justify-center overflow-hidden ${isLight ? 'hero-light-theme' : ''}`}
    >
      {/* Dynamic background with parallax */}
      <motion.div
        style={{ y: backgroundY }}
        className="absolute inset-0 w-full h-[120%]"
      >
        {/* Gradient background with theme support */}
        <div className={`absolute inset-0 ${
          isLight 
            ? 'bg-gradient-to-br from-blue-50/80 via-white to-purple-50/80' 
            : 'bg-gradient-to-br from-blue-950/40 via-gray-900 to-purple-950/40'
        }`} />
        
        {/* Animated mesh gradient */}
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: isLight ? [
              "radial-gradient(circle at 20% 80%, #e0f2fe 0%, transparent 50%), radial-gradient(circle at 80% 20%, #f3e8ff 0%, transparent 50%)",
              "radial-gradient(circle at 40% 40%, #f3e8ff 0%, transparent 50%), radial-gradient(circle at 80% 80%, #e0f2fe 0%, transparent 50%)",
              "radial-gradient(circle at 20% 80%, #e0f2fe 0%, transparent 50%), radial-gradient(circle at 80% 20%, #f3e8ff 0%, transparent 50%)"
            ] : [
              "radial-gradient(circle at 20% 80%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 20%, #8b5cf6 0%, transparent 50%)",
              "radial-gradient(circle at 40% 40%, #8b5cf6 0%, transparent 50%), radial-gradient(circle at 80% 80%, #3b82f6 0%, transparent 50%)",
              "radial-gradient(circle at 20% 80%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 20%, #8b5cf6 0%, transparent 50%)"
            ]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      {/* Floating geometric shapes with mouse interaction */}
      <motion.div
        style={{ 
          y: shapesY,
          x: useTransform(mouseXSpring, [-50, 50], [-30, 30]),
          rotateZ: useTransform(mouseXSpring, [-50, 50], [-5, 5])
        }}
        className="absolute inset-0 pointer-events-none"
      >
        {/* Large floating shapes - Reduced size on mobile */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-32 h-32 md:w-72 md:h-72 rounded-full"
          style={{
            background: isLight 
              ? "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))"
              : "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))",
            filter: "blur(60px)",
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
          className="absolute bottom-1/4 right-1/4 w-48 h-48 md:w-96 md:h-96 rounded-full"
          style={{
            background: isLight 
              ? "linear-gradient(225deg, rgba(139, 92, 246, 0.08), rgba(59, 130, 246, 0.08))"
              : "linear-gradient(225deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.15))",
            filter: "blur(80px)",
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

        {/* Smaller decorative elements */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 rounded-full opacity-40 ${
              isLight 
                ? 'bg-gradient-to-r from-blue-300 to-purple-300' 
                : 'bg-gradient-to-r from-blue-400 to-purple-400'
            }`}
            style={{
              left: `${20 + (i * 10)}%`,
              top: `${15 + (i * 8)}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.4, 0.8, 0.4],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + (i * 0.5),
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2
            }}
          />
        ))}
      </motion.div>

      {/* Main content with parallax */}
      <motion.div 
        style={{ y: textY }}
        className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 text-center"
      >
        <motion.div 
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-8 sm:space-y-12"
        >
          {/* Kinetic typography */}
          <motion.div variants={fadeInUp} className="space-y-6 sm:space-y-8">
            {/* Animated tagline */}
            <motion.p 
              className={`text-xs sm:text-sm md:text-base font-mono tracking-[0.15em] sm:tracking-[0.2em] uppercase font-medium ${
                isLight ? 'text-slate-800' : 'text-cyan-300'
              }`}
            >
              {['/', '/', ' ', 'U', 'N', 'I', 'F', 'I', 'E', 'D', ' ', 'M', 'U', 'L', 'T', 'I', '-', 'P', 'L', 'A', 'T', 'F', 'O', 'R', 'M', ' ', 'T', 'R', 'A', 'D', 'I', 'N', 'G'].map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="inline-block"
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              ))}
            </motion.p>

            {/* Main title with word-by-word animation */}
            <motion.h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold leading-tight">
              {["Aequilibra"].map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 100, rotateX: -90 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    rotateX: 0,
                    transition: {
                      duration: 0.8,
                      delay: i * 0.1,
                      ease: [0.6, -0.05, 0.01, 0.99]
                    }
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    transition: { duration: 0.3 }
                  }}
                  className={`inline-block ${
                    isLight 
                      ? "text-slate-900" 
                      : "text-cyan-400"
                  }`}
                >
                  {word}
                </motion.span>
              ))}
            </motion.h1>

            <motion.div
              variants={fadeInUp}
              className="max-w-3xl mx-auto"
            >
              <motion.p 
                className={`text-lg sm:text-xl md:text-2xl leading-relaxed ${
                  isLight ? 'text-slate-700' : 'text-gray-300'
                }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
              >
                {"Trade, arbitrage, and strategize across multiple exchanges seamlessly.".split('').map((char, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 + (i * 0.01) }}
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.p>
            </motion.div>

            {/* Interactive badges */}
            <motion.div 
              variants={fadeInUp}
              className="flex flex-wrap justify-center gap-2 sm:gap-4"
            >
              {["Cross-platform trading", "Funding rate arbitrage", "Automated strategies", "Unified experience"].map((note, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2 + (i * 0.1), type: "spring", stiffness: 200 }}
                  whileHover={{ 
                    scale: 1.1, 
                    rotate: [0, -5, 5, 0],
                    transition: { duration: 0.3 }
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className={`px-3 py-2 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium border backdrop-blur-sm ${
                    isLight 
                      ? 'bg-white/90 border-slate-300 text-slate-800 hover:bg-slate-50 hover:border-slate-400' 
                      : 'bg-gray-800/80 border-gray-600 text-gray-200 hover:bg-cyan-900/30 hover:border-cyan-500'
                  } transition-all duration-300`}>
                    {note}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center justify-center px-4"
            variants={scaleIn}
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Button 
                size="lg" 
                asChild 
                className={`relative overflow-hidden font-semibold text-base sm:text-lg px-8 py-4 sm:px-12 sm:py-6 h-auto uppercase tracking-wider shadow-xl w-full sm:w-auto ${
                  isLight 
                    ? 'bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white' 
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white'
                }`}
              >
                <a href="/app/funding-comparison">
                  <motion.div
                    className="absolute inset-0 bg-white/20"
                    initial={{ x: "-100%", skewX: -15 }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.8 }}
                  />
                  <span className="relative z-10">Start Trading Unified</span>
                </a>
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Button 
                variant="outline" 
                size="lg" 
                className={`backdrop-blur-sm border-2 font-medium px-8 py-4 sm:px-12 sm:py-6 h-auto text-base sm:text-lg w-full sm:w-auto ${
                  isLight 
                    ? 'bg-white/90 border-slate-400 text-slate-800 hover:bg-slate-50 hover:border-slate-600 hover:text-slate-900' 
                    : 'bg-gray-800/50 border-gray-600 text-gray-200 hover:bg-cyan-900/30 hover:border-cyan-500 hover:text-cyan-300'
                } transition-all duration-300`}
              >
                How it works
              </Button>
            </motion.div>
          </motion.div>

          {/* Additional descriptive text */}
          <motion.div 
            className="max-w-4xl mx-auto px-4"
            variants={fadeInUp}
          >
            <motion.p 
              className={`text-base sm:text-lg leading-relaxed ${
                isLight ? 'text-slate-700' : 'text-gray-300'
              }`}
            >
              Connect to multiple DEXs through one interface. Execute cross-platform trades, access funding rate arbitrage, 
              and build custom strategies across Hyperliquid, Aster, Lighter, Paradex, Extended, and more - all in one place.
            </motion.p>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.8 }}
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className={`w-6 h-10 border-2 rounded-full flex justify-center ${
              isLight ? 'border-slate-500/60' : 'border-cyan-400/60'
            }`}
          >
            <motion.div
              animate={{ y: [0, 12, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className={`w-1 h-3 rounded-full mt-2 ${
                isLight ? 'bg-slate-600' : 'bg-cyan-400'
              }`}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
