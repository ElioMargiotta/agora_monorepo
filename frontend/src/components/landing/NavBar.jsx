'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Menu, X } from 'lucide-react';

export function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Close mobile menu on resize to desktop
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <motion.nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'border-b border-border/40 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 shadow-sm' 
          : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="mx-auto flex h-20 max-w-screen-2xl items-center justify-between px-6 md:px-8">
        <motion.div 
          className="flex items-center"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <motion.a 
            className="flex items-center space-x-2" 
            href="/"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.span 
              className="font-bold text-xl bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent"
              whileHover={{
                backgroundPosition: '200% center',
                transition: { duration: 0.3 }
              }}
            >
              Aequilibra
            </motion.span>
          </motion.a>
          
          <motion.nav 
            className="hidden md:flex items-center gap-6 text-base ml-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.a
              className="relative transition-colors hover:text-foreground/80 text-foreground/60 py-2"
              href="/docs"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Docs
              <motion.div
                className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-300"
                initial={{ width: 0 }}
                whileHover={{ width: "100%" }}
                transition={{ duration: 0.2 }}
              />
            </motion.a>
            <motion.a
              className="relative transition-colors hover:text-foreground/80 text-foreground/60 py-2"
              href="/legal"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Legal
              <motion.div
                className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-300"
                initial={{ width: 0 }}
                whileHover={{ width: "100%" }}
                transition={{ duration: 0.2 }}
              />
            </motion.a>
          </motion.nav>
        </motion.div>
        
        <motion.div 
          className="flex items-center space-x-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {/* Mobile Menu Button */}
          <motion.button
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted/50 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </motion.button>

          {/* Desktop Controls */}
          <div className="hidden md:flex items-center space-x-3">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <ThemeToggle />
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                asChild 
                size="lg" 
                className="bg-cyan-400 hover:bg-cyan-300 text-black font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <a href="/app/funding-comparison">Launch App</a>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Mobile Menu */}
      <motion.div
        className={`md:hidden border-t border-border/40 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 ${
          mobileMenuOpen ? 'block' : 'hidden'
        }`}
        initial={{ opacity: 0, height: 0 }}
        animate={mobileMenuOpen ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="px-6 py-4 space-y-4">
          <nav className="space-y-4">
            <motion.a
              className="block py-2 text-foreground/80 hover:text-foreground transition-colors"
              href="/docs"
              onClick={() => setMobileMenuOpen(false)}
              whileTap={{ scale: 0.98 }}
            >
              Documentation
            </motion.a>
            <motion.a
              className="block py-2 text-foreground/80 hover:text-foreground transition-colors"
              href="/legal"
              onClick={() => setMobileMenuOpen(false)}
              whileTap={{ scale: 0.98 }}
            >
              Legal
            </motion.a>
          </nav>
          
          <div className="flex items-center justify-between pt-4 border-t border-border/20">
            <ThemeToggle />
            <Button 
              asChild 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              <a href="/app/funding-comparison">Launch App</a>
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.nav>
  );
}
