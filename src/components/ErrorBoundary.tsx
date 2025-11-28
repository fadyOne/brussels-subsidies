'use client'
/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the whole app.
 * 
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Update state with error info
    this.setState({
      error,
      errorInfo,
    })

    // Call optional error handler (e.g., for error tracking service)
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log to Sentry if available
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
          },
          tags: {
            errorBoundary: true,
          },
        })
      }).catch(() => {
        // Sentry not available, ignore
      })
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
              <Card className="max-w-2xl w-full border-red-200 shadow-lg mx-4">
                <CardHeader className="bg-red-50 border-b border-red-200 p-4 sm:p-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 flex-shrink-0" />
                    <div>
                      <CardTitle className="text-xl sm:text-2xl text-red-900">Une erreur s&apos;est produite</CardTitle>
                      <CardDescription className="text-sm sm:text-base text-red-700 mt-1">
                        L&apos;application a rencontré un problème inattendu
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-sm text-gray-700 mb-2">Détails de l&apos;erreur (mode développement):</h3>
                  <pre className="text-xs text-gray-600 overflow-auto max-h-48 font-mono">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack && (
                      <>
                        {'\n\n'}
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 mb-2">
                  <strong>Que pouvez-vous faire ?</strong>
                </p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Réessayer en cliquant sur &quot;Réessayer&quot;</li>
                  <li>Recharger la page complètement</li>
                  <li>Retourner à la page d&apos;accueil</li>
                  <li>Si le problème persiste, contactez le support</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2">
                <Button
                  onClick={this.handleReset}
                  className="flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4" />
                  Réessayer
                </Button>
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto"
                >
                  <RefreshCw className="h-4 w-4" />
                  Recharger la page
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto"
                >
                  <Home className="h-4 w-4" />
                  Retour à l&apos;accueil
                </Button>
              </div>

              {process.env.NODE_ENV === 'production' && (
                <p className="text-xs text-gray-500 text-center pt-2">
                  Code d&apos;erreur: {this.state.error?.name || 'UNKNOWN'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook-style error boundary wrapper for functional components
 * Note: Error boundaries must be class components, but this provides a cleaner API
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

