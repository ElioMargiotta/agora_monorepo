'use client'

import { Component } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react'
import { AccessibleButton } from './AccessibilityComponents'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    })
    
    // Log error to service
    console.error('Error Boundary caught an error:', error, errorInfo)
    
    // Announce error to screen readers
    if (typeof window !== 'undefined' && window.announceToScreenReader) {
      window.announceToScreenReader(
        'An error has occurred. Please try refreshing the page or contact support if the problem persists.',
        'assertive'
      )
    }
  }

  handleRefresh = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-md w-full bg-card border border-destructive/20 rounded-lg p-6 shadow-lg"
            role="alert"
            aria-labelledby="error-title"
            aria-describedby="error-description"
          >
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0" />
              <h1 id="error-title" className="text-lg font-semibold text-destructive">
                Something went wrong
              </h1>
            </div>
            
            <p id="error-description" className="text-muted-foreground mb-6">
              We apologize for the inconvenience. An unexpected error has occurred. 
              You can try refreshing the page or return to the homepage.
            </p>

            {/* Error Details (Development Mode) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 p-3 bg-muted rounded border">
                <summary className="cursor-pointer text-sm font-medium mb-2 flex items-center">
                  <Bug className="h-4 w-4 mr-2" />
                  Error Details (Development)
                </summary>
                <pre className="text-xs text-muted-foreground overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <AccessibleButton
                onClick={this.handleRefresh}
                className="flex-1"
                variant="default"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </AccessibleButton>
              
              <AccessibleButton
                onClick={this.handleGoHome}
                variant="outline"
                className="flex-1"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </AccessibleButton>
            </div>

            {/* Additional Help */}
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                If this problem persists, please{' '}
                <a 
                  href="mailto:support@aequilibra.xyz"
                  className="text-primary hover:underline focus:underline focus:outline-none"
                >
                  contact our support team
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

// Async Error Boundary for async operations
export const AsyncErrorBoundary = ({ children, fallback: Fallback }) => {
  return (
    <ErrorBoundary>
      <AsyncErrorCatcher fallback={Fallback}>
        {children}
      </AsyncErrorCatcher>
    </ErrorBoundary>
  )
}

// Helper component for catching async errors
class AsyncErrorCatcher extends Component {
  constructor(props) {
    super(props)
    this.state = { asyncError: null }
  }

  componentDidMount() {
    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection)
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection)
  }

  handleUnhandledRejection = (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    this.setState({ asyncError: event.reason })
    
    // Announce error to screen readers
    if (window.announceToScreenReader) {
      window.announceToScreenReader(
        'A network or data loading error has occurred. Please check your connection and try again.',
        'assertive'
      )
    }
  }

  render() {
    if (this.state.asyncError) {
      if (this.props.fallback) {
        return <this.props.fallback error={this.state.asyncError} />
      }
      
      return (
        <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <h3 className="font-medium text-destructive">Loading Error</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Failed to load data. Please check your connection and try again.
          </p>
          <AccessibleButton
            onClick={() => window.location.reload()}
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </AccessibleButton>
        </div>
      )
    }

    return this.props.children
  }
}

// Network Error Component
export const NetworkError = ({ onRetry, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`text-center p-6 ${className}`}
    role="alert"
  >
    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
    <h3 className="text-lg font-semibold mb-2">Connection Error</h3>
    <p className="text-muted-foreground mb-4">
      Unable to connect to our servers. Please check your internet connection.
    </p>
    <AccessibleButton onClick={onRetry}>
      <RefreshCw className="h-4 w-4 mr-2" />
      Try Again
    </AccessibleButton>
  </motion.div>
)

// 404 Error Component
export const NotFoundError = ({ className = "" }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`text-center p-8 ${className}`}
    role="main"
    aria-labelledby="not-found-title"
  >
    <div className="text-6xl font-bold text-muted-foreground mb-4">404</div>
    <h1 id="not-found-title" className="text-2xl font-bold mb-2">Page Not Found</h1>
    <p className="text-muted-foreground mb-6">
      The page you're looking for doesn't exist or has been moved.
    </p>
    <AccessibleButton onClick={() => window.location.href = '/'}>
      <Home className="h-4 w-4 mr-2" />
      Return Home
    </AccessibleButton>
  </motion.div>
)

export default ErrorBoundary