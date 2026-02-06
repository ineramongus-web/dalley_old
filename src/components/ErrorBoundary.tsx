'use client'

import React from 'react'
import { ErrorDebugModal } from './ErrorDebugModal'

interface ErrorBoundaryProps {
  children: React.ReactNode
  ignoreCrashes?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  showModal: boolean
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showModal: false
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
      showModal: true
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error to console with full details
    console.error('❌ ERROR BOUNDARY CAUGHT ERROR:', {
      error,
      errorInfo,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    })

    // Update state with error info
    this.setState({
      hasError: true,
      error,
      errorInfo
    })
  }

  handleCloseModal = (): void => {
    // Just hide the modal, DON'T reset error state
    // This prevents React from remounting everything (which causes intro animations)
    this.setState({
      showModal: false
    })
  }

  render(): React.ReactNode {
    if (this.state.hasError && this.state.error) {
      // If ignoreCrashes is true, continue session WITHOUT showing error modal
      // If ignoreCrashes is false, show error modal
      return (
        <>
          {/* Still render children to continue session */}
          {this.props.children}
          {/* Only show modal if ignoreCrashes is false AND showModal is true */}
          {!this.props.ignoreCrashes && this.state.showModal && (
            <ErrorDebugModal
              error={this.state.error}
              errorInfo={this.state.errorInfo}
              onClose={this.handleCloseModal}
            />
          )}
        </>
      )
    }

    return this.props.children
  }
}
