# Aequilibra Frontend - Advanced Animation & Accessibility Framework

## 🎨 Animation System Overview

This project features a comprehensive animation framework built with **Framer Motion** and modern web standards, providing institutional-grade motion design with full accessibility support.

### 🚀 Key Animation Features

#### 1. **Scroll-Triggered Animations**
- Intersection Observer-based scroll animations
- Multiple animation variants: `fadeInUp`, `fadeInDown`, `fadeInLeft`, `fadeInRight`, `scaleIn`, `slideInUp`
- Configurable thresholds and delays
- Staggered container animations for sequential reveals

#### 2. **3D Graphics & Transforms**
- Hardware-accelerated 3D card effects
- Mouse-tracked perspective transforms
- Holographic borders with gradient animations
- 3D tilt effects with depth perception

#### 3. **Mouse Parallax Effects**
- Magnetic hover interactions with configurable strength
- Mouse-tracked 3D rotations and translations
- Floating particle systems responsive to cursor movement
- Dynamic background shape animations

#### 4. **Microinteractions**
- Button shimmer effects on hover
- Pulse glow animations for active states
- Gentle floating animations for visual interest
- Loading spinner variations with brand colors

#### 5. **Transitional Animations**
- Page transition system with enter/exit animations
- Section reveal animations with viewport detection
- Progress-based animations for step indicators
- Smooth state transitions between components

## ♿ Accessibility Framework

### Core Accessibility Features

#### 1. **Motion Preferences Support**
```css
@media (prefers-reduced-motion: reduce) {
  /* All animations disabled or reduced */
}
```
- Respects user's motion preferences
- Automatic fallbacks for reduced motion
- Graceful degradation for all animations

#### 2. **Focus Management**
- Focus trap components for modals/overlays
- Enhanced focus indicators with high contrast
- Skip navigation links
- Proper focus restoration

#### 3. **Screen Reader Support**
- Live announcer for dynamic content changes
- ARIA labels and descriptions
- Screen reader only content for context
- Progress announcements for loading states

#### 4. **Keyboard Navigation**
- Full keyboard accessibility
- Escape key handling for modals
- Enter key activation for interactive elements
- Logical tab order throughout the application

#### 5. **High Contrast Mode**
- Automatic detection of high contrast preferences
- Alternative styling for better visibility
- Removal of problematic transparency effects

## 🧩 Component Architecture

### Core Animation Components

#### `AnimatedLayout`
Main layout wrapper providing:
- Parallax background effects
- Scroll progress indicator
- Loading state management
- Background particle animations

```jsx
<AnimatedLayout loading={isLoading} enableParallax={true}>
  {children}
</AnimatedLayout>
```

#### `ScrollAnimation`
Individual element animations based on scroll position:
```jsx
<ScrollAnimation animation="fadeInUp" delay={0.2} threshold={0.1}>
  <YourComponent />
</ScrollAnimation>
```

#### `StaggerContainer` & `StaggerItem`
For sequential animations:
```jsx
<StaggerContainer staggerDelay={0.1}>
  <StaggerItem animation="fadeInUp">Item 1</StaggerItem>
  <StaggerItem animation="fadeInUp">Item 2</StaggerItem>
</StaggerContainer>
```

#### `MagneticHover`
Mouse-responsive magnetic effects:
```jsx
<MagneticHover strength={0.3}>
  <YourInteractiveElement />
</MagneticHover>
```

### Accessibility Components

#### `SkipNavigation`
Provides skip links for keyboard navigation:
```jsx
<SkipNavigation />
```

#### `LiveAnnouncer`
Screen reader announcements:
```jsx
<LiveAnnouncer />
// Use globally: window.announceToScreenReader("Message", "polite")
```

#### `FocusTrap`
Traps focus within modals/overlays:
```jsx
<FocusTrap active={isOpen} restoreFocus={true}>
  <ModalContent />
</FocusTrap>
```

#### `AccessibleButton`
Enhanced button with loading states and announcements:
```jsx
<AccessibleButton 
  loading={isLoading} 
  loadingText="Processing..." 
  onClick={handleClick}
>
  Submit
</AccessibleButton>
```

### Loading & Error Components

#### `LoadingOverlay`
Multiple loading animation variants:
```jsx
<LoadingOverlay 
  isLoading={loading}
  variant="geometric" // or "default", "dots"
  showProgress={true}
  progress={75}
  message="Loading data..."
/>
```

#### `ErrorBoundary`
Comprehensive error handling:
```jsx
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

## 🎯 Enhanced Landing Page Components

### Hero Section
- Kinetic typography with word-by-word reveals
- Mouse parallax with 3D shapes
- Scroll-based background transforms
- Dynamic gradient animations

### Features Section
- 3D card tilt effects
- Shimmer animations on hover
- Corner accent animations
- Progressive reveal on scroll

### How It Works Section
- Step-by-step narrative unfolding
- Progress-based animations
- Interactive step indicators
- Connector line animations

### Supported DEXes Section
- Enhanced 3D card interactions
- Holographic border effects
- Particle system animations
- Network visualization effects

## 🛠 CSS Animation Framework

### Custom Animation Classes

```css
/* Utility Classes */
.animate-spin-slow         /* Slow rotation */
.animate-pulse-glow        /* Pulsing glow effect */
.animate-float-gentle      /* Gentle floating */
.animate-shimmer-advanced  /* Advanced shimmer */

/* 3D Utilities */
.perspective-1000         /* 3D perspective */
.preserve-3d              /* Preserve 3D transforms */
.hover-3d                 /* 3D hover effects */

/* Interactive Effects */
.btn-magnetic             /* Magnetic button effect */
.glass-card               /* Glass morphism */
.holographic-border       /* Holographic borders */
```

### Animation Variables

```css
:root {
  --animation-duration-fast: 0.2s;
  --animation-duration-normal: 0.3s;
  --animation-duration-slow: 0.5s;
  --animation-timing-ease-out: cubic-bezier(0, 0, 0.2, 1);
  --animation-timing-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

## 📊 Performance Considerations

### Optimization Strategies

1. **GPU Acceleration**
   - All animations use `transform` and `opacity`
   - Hardware acceleration with `transform3d(0,0,0)`
   - Minimal layout thrashing

2. **Intersection Observer**
   - Efficient scroll-based animations
   - Only animate elements in viewport
   - Automatic cleanup and memory management

3. **Reduced Motion Support**
   - Automatic detection and fallback
   - Maintains functionality without motion
   - Performance benefits for users who prefer reduced motion

4. **Code Splitting**
   - Framer Motion loaded only when needed
   - Lazy loading of animation components
   - Progressive enhancement approach

## 🔧 Configuration

### Environment Variables
```env
NEXT_PUBLIC_ENABLE_ANIMATIONS=true
NEXT_PUBLIC_ENABLE_PARALLAX=true
NEXT_PUBLIC_ANIMATION_DEBUG=false
```

### Theme Integration
The animation system integrates seamlessly with the existing theme system:
- Dynamic colors based on light/dark mode
- Consistent with design system variables
- OnchainKit component compatibility

## 🚦 Usage Guidelines

### Best Practices

1. **Animation Timing**
   - Use consistent easing functions
   - Keep durations under 500ms for interactions
   - Use spring animations for natural feel

2. **Accessibility First**
   - Always provide reduced motion alternatives
   - Include proper ARIA labels
   - Test with screen readers

3. **Performance**
   - Use `transform` instead of changing layout properties
   - Implement proper cleanup in useEffect hooks
   - Monitor bundle size and loading performance

4. **User Experience**
   - Animations should enhance, not distract
   - Provide loading states for all async operations
   - Ensure keyboard navigation works perfectly

## 🧪 Testing

### Accessibility Testing
- Screen reader compatibility (NVDA, JAWS, VoiceOver)
- Keyboard-only navigation testing
- High contrast mode verification
- Reduced motion preference testing

### Animation Testing
- Performance profiling with Chrome DevTools
- Frame rate monitoring during animations
- Memory usage during complex interactions
- Cross-browser compatibility testing

## 📱 Mobile Considerations

- Touch-friendly interactive elements (44px minimum)
- Reduced animation complexity on mobile devices
- Optimized particle systems for mobile performance
- Proper viewport handling for mobile Safari

## 🔮 Future Enhancements

Planned improvements include:
- WebGL-based advanced effects
- More sophisticated particle systems
- AI-driven animation personalization
- Advanced gesture recognition
- Performance monitoring dashboard

---

This animation and accessibility framework provides a solid foundation for creating engaging, inclusive user experiences that work for everyone while maintaining high performance standards.