'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const testimonials = [
  {
    name: "Alex Chen",
    role: "DeFi Trader",
    avatar: "AC",
    content: "Aequilibra helped me find funding arbitrage opportunities I never knew existed. My portfolio performance has improved by 20% since I started using it.",
    rating: 5
  },
  {
    name: "Sarah Williams",
    role: "Crypto Fund Manager",
    avatar: "SW",
    content: "The multi-DEX comparison feature is invaluable. It saves me hours of manual research and ensures I never miss profitable opportunities.",
    rating: 5
  },
  {
    name: "Marcus Rodriguez",
    role: "Arbitrage Bot Developer",
    avatar: "MR",
    content: "The API integration is seamless and the data accuracy is top-notch. Essential tool for anyone serious about funding rate arbitrage.",
    rating: 5
  },
  {
    name: "Emma Thompson",
    role: "Retail Trader",
    avatar: "ET",
    content: "Simple, clean interface that makes complex funding strategies accessible to everyone. Game-changer for retail traders like me.",
    rating: 5
  },
  {
    name: "David Kim",
    role: "Quantitative Analyst",
    avatar: "DK",
    content: "The historical data and analytics help me backtest strategies effectively. Robust platform with excellent execution speed.",
    rating: 5
  },
  {
    name: "Lisa Park",
    role: "Portfolio Manager",
    avatar: "LP",
    content: "Cross-chain funding analysis has opened up new revenue streams for our fund. Couldn't imagine trading without it now.",
    rating: 5
  }
];

const StarIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.1 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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

  return (
    <section className="w-full px-4 py-16 md:py-24 bg-muted/30" ref={ref}>
      <motion.div 
        className="mx-auto max-w-7xl"
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={containerVariants}
      >
        <motion.div 
          className="text-center space-y-4 mb-16"
          variants={cardVariants}
        >
          <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
            Trusted by Traders Worldwide
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join thousands of successful traders who rely on Aequilibra for their funding rate strategies
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              variants={cardVariants}
              whileHover={{ 
                y: -5,
                transition: { duration: 0.2 }
              }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 border-muted/50 bg-background/50 backdrop-blur-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
                        transition={{ 
                          delay: 0.5 + (index * 0.1) + (i * 0.05),
                          type: "spring",
                          stiffness: 200,
                          damping: 10
                        }}
                      >
                        <StarIcon className="text-yellow-400" />
                      </motion.div>
                    ))}
                  </div>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  
                  <div className="flex items-center gap-3 pt-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={testimonial.image} alt={testimonial.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                        {testimonial.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-foreground">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className="text-center mt-12"
          variants={cardVariants}
        >
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <div className="flex -space-x-2">
              {testimonials.slice(0, 4).map((testimonial, index) => (
                <motion.div
                  key={testimonial.name}
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : { scale: 0 }}
                  transition={{ delay: 1 + (index * 0.1) }}
                >
                  <Avatar className="w-8 h-8 border-2 border-background">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                      {testimonial.avatar}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
              ))}
            </div>
            <span className="text-sm">+2,500 happy traders</span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
