'use client';

import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';

function formatCurrency(amount) {
  if (amount >= 1e9) {
    return `$${(amount / 1e9).toFixed(2)}B`;
  } else if (amount >= 1e6) {
    return `$${(amount / 1e6).toFixed(0)}M`;
  }
  return `$${amount.toLocaleString()}`;
}

// Enhanced 3D DEX Card Component
function Enhanced3DDexCard({ dex, index, isComingSoon = false }) {
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true, threshold: 0.3 });
  const [isHovered, setIsHovered] = useState(false);

  // Mouse tracking for 3D effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-100, 100], [10, -10]);
  const rotateY = useTransform(mouseX, [-100, 100], [-10, 10]);

  // Spring animations for smooth movement
  const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 30 });
  const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 30 });

  const handleMouseMove = (event) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set((event.clientX - centerX) / 2);
    mouseY.set((event.clientY - centerY) / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50, rotateX: -15 }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 50, rotateX: -15 }}
      transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      whileHover={{ z: 50 }}
      className="group perspective-1000"
    >
      <motion.div
        className={`relative p-6 rounded-2xl border-2 transition-all duration-500 ${
          isComingSoon
            ? 'bg-muted/50 border-muted/30 backdrop-blur-sm'
            : 'bg-white/80 dark:bg-gray-900/80 border-cyan-200/50 dark:border-cyan-800/50 backdrop-blur-md'
        } shadow-lg hover:shadow-2xl hover:shadow-cyan-500/20`}
        style={{
          transform: "translateZ(20px)",
          backfaceVisibility: "hidden",
        }}
        animate={isHovered && !isComingSoon ? {
          boxShadow: [
            "0 10px 30px rgba(6, 182, 212, 0.1)",
            "0 20px 60px rgba(6, 182, 212, 0.25)",
            "0 10px 30px rgba(6, 182, 212, 0.1)"
          ],
        } : {}}
        transition={{ duration: 2, repeat: isHovered ? Infinity : 0 }}
      >
        {/* Holographic border effect */}
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: "linear-gradient(45deg, transparent 30%, rgba(6, 182, 212, 0.2) 50%, transparent 70%)",
            backgroundSize: "200% 200%",
            padding: "2px",
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
          }}
          animate={isHovered ? {
            backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Status indicator */}
        {!isComingSoon && (
          <motion.div
            className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg"
            animate={{
              scale: [1, 1.2, 1],
              boxShadow: [
                "0 0 0 0 rgba(34, 197, 94, 0.4)",
                "0 0 0 8px rgba(34, 197, 94, 0)",
                "0 0 0 0 rgba(34, 197, 94, 0)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {/* DEX Logo */}
        <motion.div
          className="relative mb-4"
          style={{ transform: "translateZ(30px)" }}
          whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.3 }}
        >
          {dex.logo ? (
            <div className="relative w-16 h-16 mx-auto">
              <Image
                src={dex.logo}
                alt={`${dex.name} logo`}
                fill
                className="rounded-lg object-contain filter group-hover:brightness-110 transition-all duration-300"
              />
              {/* Glow effect */}
              <motion.div
                className="absolute inset-0 rounded-lg bg-cyan-400/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                animate={isHovered ? {
                  scale: [1, 1.2, 1],
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          ) : (
            <motion.div
              className="w-16 h-16 mx-auto bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xl"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              {dex.name.charAt(0)}
            </motion.div>
          )}
        </motion.div>

        {/* DEX Name */}
        <motion.h3
          className={`text-xl font-bold mb-2 text-center ${
            isComingSoon ? 'text-muted-foreground' : 'text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400'
          } transition-colors duration-300`}
          style={{ transform: "translateZ(25px)" }}
        >
          {dex.name}
        </motion.h3>

        {/* Description */}
        <motion.p
          className="text-sm text-muted-foreground text-center mb-4 leading-relaxed"
          style={{ transform: "translateZ(20px)" }}
        >
          {dex.description}
        </motion.p>

        {/* Chain badges */}
        <motion.div
          className="flex flex-wrap gap-2 justify-center mb-4"
          style={{ transform: "translateZ(15px)" }}
        >
          {dex.chains?.map((chain, i) => (
            <motion.span
              key={chain}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                isComingSoon
                  ? 'bg-muted/50 text-muted-foreground'
                  : 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800'
              }`}
              initial={{ opacity: 0, scale: 0 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
              transition={{ delay: 0.2 + (i * 0.1) }}
              whileHover={{ scale: 1.05 }}
            >
              {chain}
            </motion.span>
          ))}
        </motion.div>

        {/* Volume or Status */}
        <motion.div
          className="text-center"
          style={{ transform: "translateZ(10px)" }}
        >
          {isComingSoon ? (
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 border border-amber-200 dark:border-amber-800"
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(245, 158, 11, 0.2)",
                  "0 0 0 8px rgba(245, 158, 11, 0)",
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                className="w-2 h-2 bg-amber-500 rounded-full"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Coming Soon
              </span>
            </motion.div>
          ) : (
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-800"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                className="w-2 h-2 bg-green-500 rounded-full"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Live Data
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Particle effect on hover */}
        {isHovered && !isComingSoon && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-cyan-400 rounded-full pointer-events-none"
                style={{
                  left: "50%",
                  top: "50%",
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: [0, (Math.random() - 0.5) * 200],
                  y: [0, (Math.random() - 0.5) * 200],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeOut"
                }}
              />
            ))}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

const staticDexes = [
  {
    name: 'Hyperliquid',
    logo: '/hyprliquid.png',
    status: 'active',
  },
  {
    name: 'Aster',
    logo: '/aster.png',
    status: 'active',
    apiName: 'Aster Perps'
  },
  {
    name: 'Extended',
    logo: '/extended.png',
    status: 'active',
  },
  {
    name: 'Lighter',
    logo: '/lighter.png',
    status: 'active',
  },
  {
    name: 'Paradex',
    logo: '/paradex.png',
    status: 'active',
  }
];

const comingSoonDexes = [
  {
    name: 'Avantis',
    logo: '/avantis.png',
    status: 'comingSoon',
  },
  {
    name: 'Synfutures',
    logo: '/synfutures.png',
    status: 'comingSoon',
  }
];

const chains = [
  { name: 'Hyperliquid L1', icon: '/hyprliquid.png', color: 'from-blue-400 to-purple-600' },
  { name: 'Arbitrum', icon: '/chain-icons/arb.svg', color: 'from-blue-500 to-cyan-400' },
  { name: 'StarkNet', icon: '/chain-icons/eth.svg', color: 'from-purple-500 to-purple-700' },
  { name: 'dYdX Chain', icon: '/chain-icons/eth.svg', color: 'from-gray-600 to-gray-800' },
  { name: 'NEAR', icon: '/chain-icons/eth.svg', color: 'from-green-400 to-green-600' },
  { name: 'Ethereum', icon: '/chain-icons/eth.svg', color: 'from-blue-400 to-blue-600' }
];

export function SupportedDexes() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.1 });
  const [dexes, setDexes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDexData() {
      try {
        // Import the DefiLlamaAPI dynamically to avoid SSR issues
        const { DefiLlamaAPI } = await import('@/lib/defilamaAPI');
        const data = await DefiLlamaAPI.getAllProtocolsData();
        
        // Map static dex info with live volume data
        const updatedDexes = staticDexes.map(dex => {
          const apiData = data.allProtocols.find(protocol => 
            protocol.name === dex.apiName || protocol.name.includes(dex.name)
          );
          
          return {
            ...dex,
            volume24h: apiData ? formatCurrency(apiData.volume24h) : 'N/A',
            change24h: apiData ? apiData.change24h : 0,
            rawVolume: apiData ? apiData.volume24h : 0
          };
        });
        
        // Sort by volume (highest first)
        updatedDexes.sort((a, b) => b.rawVolume - a.rawVolume);
        
        setDexes(updatedDexes);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching DEX data:', err);
        // Fallback to static data
        setDexes(staticDexes.map(dex => ({
          ...dex,
          volume24h: 'Loading...',
          change24h: 0,
          rawVolume: 0
        })));
        setLoading(false);
      }
    }

    fetchDexData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const chainVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "backOut"
      }
    }
  };

  return (
    <section className="relative w-full px-4 py-20 md:py-32 overflow-hidden" ref={ref}>
      {/* Subtle Background */}
      <div className="absolute inset-0">
        {/* Light gradient background only */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-50/30 to-blue-50/20 dark:from-transparent dark:via-cyan-950/20 dark:to-blue-950/10" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <motion.div 
          className="text-center space-y-8 mb-20"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-200 dark:border-cyan-800"
          >
            <motion.div
              className="w-2 h-2 bg-cyan-500 rounded-full"
              animate={{ 
                scale: [1, 1.4, 1], 
                opacity: [0.7, 1, 0.7] 
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm font-medium text-cyan-700 dark:text-cyan-300">
              Unified in One Interface
            </span>
          </motion.div>

          <motion.h2 
            className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-cyan-600 to-blue-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Supported DEX Platforms
            <motion.span 
              className="block text-transparent bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 bg-clip-text"
              animate={{ 
                backgroundPosition: ["0%", "100%", "0%"] 
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              style={{ 
                backgroundSize: "200% 200%" 
              }}
            >
              (Unified in One Interface)
            </motion.span>
          </motion.h2>

          <motion.p 
            className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            We integrate with several cutting-edge decentralized exchanges (DEXs), 
            so you get the best each has to offer without hopping between sites. All accessible through our single platform.
          </motion.p>

          {/* Network Stats */}
          <motion.div
            className="flex flex-wrap justify-center gap-8 mt-12"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <motion.div 
              className="text-center"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div 
                className="text-3xl font-bold text-cyan-600 dark:text-cyan-400"
                animate={{ 
                  textShadow: [
                    "0 0 0px rgba(6, 182, 212, 0)",
                    "0 0 20px rgba(6, 182, 212, 0.3)",
                    "0 0 0px rgba(6, 182, 212, 0)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {staticDexes.length}+
              </motion.div>
              <p className="text-sm text-muted-foreground">Live Exchanges</p>
            </motion.div>
            
            <motion.div 
              className="text-center"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div 
                className="text-3xl font-bold text-amber-600 dark:text-amber-400"
                animate={{ 
                  textShadow: [
                    "0 0 0px rgba(245, 158, 11, 0)",
                    "0 0 20px rgba(245, 158, 11, 0.3)",
                    "0 0 0px rgba(245, 158, 11, 0)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              >
                {comingSoonDexes.length}+
              </motion.div>
              <p className="text-sm text-muted-foreground">Coming Soon</p>
            </motion.div>
            
            <motion.div 
              className="text-center"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div 
                className="text-3xl font-bold text-purple-600 dark:text-purple-400"
                animate={{ 
                  textShadow: [
                    "0 0 0px rgba(147, 51, 234, 0)",
                    "0 0 20px rgba(147, 51, 234, 0.3)",
                    "0 0 0px rgba(147, 51, 234, 0)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              >
                6+
              </motion.div>
              <p className="text-sm text-muted-foreground">Blockchains</p>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Live Exchanges Grid */}
        <motion.div 
          className="mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <motion.div
            className="flex items-center justify-center gap-4 mb-12"
            whileHover={{ scale: 1.02 }}
          >
            <motion.div
              className="w-3 h-3 bg-green-500 rounded-full"
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <h3 className="text-2xl font-bold text-center">Live Data Available</h3>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {staticDexes.map((dex, index) => (
              <Enhanced3DDexCard 
                key={dex.name} 
                dex={dex} 
                index={index} 
                isComingSoon={false} 
              />
            ))}
          </div>
        </motion.div>

        {/* Coming Soon Exchanges */}
        <motion.div 
          className="mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 1.5 }}
        >
          <motion.div
            className="flex items-center justify-center gap-4 mb-12"
            whileHover={{ scale: 1.02 }}
          >
            <motion.div
              className="w-3 h-3 bg-amber-500 rounded-full"
              animate={{ 
                scale: [1, 1.5, 1], 
                opacity: [0.7, 1, 0.7],
                boxShadow: ["0 0 0 0 rgba(245, 158, 11, 0.4)", "0 0 0 10px rgba(245, 158, 11, 0)", "0 0 0 0 rgba(245, 158, 11, 0)"]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <h3 className="text-2xl font-bold text-center">Integration Pipeline</h3>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {comingSoonDexes.map((dex, index) => (
              <Enhanced3DDexCard 
                key={dex.name} 
                dex={dex} 
                index={index} 
                isComingSoon={true} 
              />
            ))}
          </div>
        </motion.div>

        {/* Final Call to Action */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 2.5 }}
        >
          <motion.div
            className="inline-flex items-center gap-4 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-md border border-cyan-300/50 dark:border-cyan-700/50"
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 20px 40px rgba(6, 182, 212, 0.2)"
            }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              🚀
            </motion.div>
            <span className="font-medium">More exchanges joining weekly - Stay tuned!</span>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
