'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertTriangle, X, Copy } from 'lucide-react'

interface ErrorDebugModalProps {
  error: Error | null
  errorInfo: React.ErrorInfo | null
  onClose: () => void
}

export function ErrorDebugModal({ error, errorInfo, onClose }: ErrorDebugModalProps): JSX.Element | null {
  if (!error) return null

  // Extract component names and function names from stack trace
  const extractErrorContext = (stack: string | undefined): { components: string[]; suggestions: string[] } => {
    if (!stack) return { components: [], suggestions: [] }
    
    const components: string[] = []
    const stackLines = stack.split('\n')
    
    // Extract component/function names from stack trace
    for (const line of stackLines) {
      // Match patterns like: at ComponentName (https://...)
      const componentMatch = line.match(/at\s+(\w+)\s+\(/)
      if (componentMatch && componentMatch[1]) {
        const name = componentMatch[1]
        // Filter out common React internal names
        if (!name.startsWith('a') && name !== 'Object' && name !== 'Module') {
          components.push(name)
        }
      }
    }
    
    // Generate helpful suggestions based on error message
    const suggestions: string[] = []
    const errorMsg = stack.toLowerCase()
    
    if (errorMsg.includes('insertbefore')) {
      suggestions.push('🎯 DOM Error: React tried to insert a node in wrong position')
      suggestions.push('📍 Check Canvas.tsx renderElement function around lines 1068-1334')
      suggestions.push('📍 Check if elements are being filtered/reordered dynamically')
      suggestions.push('💡 Solution: Ensure stable keys and no conditional rendering')
    }
    
    if (errorMsg.includes('null') || errorMsg.includes('undefined')) {
      suggestions.push('🎯 Null/Undefined Error: A value is missing')
      suggestions.push('💡 Check if all required props are passed to components')
    }
    
    if (errorMsg.includes('map') || errorMsg.includes('filter')) {
      suggestions.push('🎯 Array Error: Issue with array operations')
      suggestions.push('💡 Check if array exists before calling .map() or .filter()')
    }
    
    return { components: components.slice(0, 5), suggestions }
  }

  const { components, suggestions } = extractErrorContext(error.stack)

  const copyToClipboard = () => {
    const errorText = `
ERROR: ${error.message}

COMPONENTS INVOLVED:
${components.join(' → ')}

HELPFUL CONTEXT:
${suggestions.join('\n')}

FULL STACK:
${error.stack || 'No stack trace'}

COMPONENT STACK:
${errorInfo?.componentStack || 'No component stack'}
    `.trim()
    
    navigator.clipboard.writeText(errorText)
    alert('Error details copied to clipboard!')
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 border-2 border-red-500 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-red-500/20 border-b border-red-500/50 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <div>
                <h2 className="text-lg font-bold text-white">🚨 Error Caught!</h2>
                <p className="text-xs text-red-300">Component context & debugging info below</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={copyToClipboard}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-red-500/20"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-red-500/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Error Content */}
          <ScrollArea className="h-[60vh] p-4">
            <div className="space-y-4">
              {/* Error Message */}
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-red-300 mb-2">❌ Error Message:</h3>
                <p className="text-white font-mono text-sm break-words">{error.message}</p>
              </div>

              {/* Components Involved */}
              {components.length > 0 && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                  <h3 className="text-sm font-semibold text-purple-300 mb-2">🧩 Components Involved:</h3>
                  <div className="text-sm font-mono text-purple-200 bg-purple-900/20 p-2 rounded">
                    {components.join(' → ')}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    ⬆️ Error occurred in these components during render/state update
                  </p>
                </div>
              )}

              {/* Helpful Suggestions */}
              {suggestions.length > 0 && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <h3 className="text-sm font-semibold text-green-300 mb-2">💡 Helpful Context:</h3>
                  <div className="space-y-1">
                    {suggestions.map((suggestion, idx) => (
                      <div key={idx} className="text-xs text-green-200 bg-green-900/20 p-2 rounded">
                        {suggestion}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stack Trace */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">🔍 Full Stack Trace:</h3>
                <pre className="text-xs text-gray-400 whitespace-pre-wrap break-words font-mono">
                  {error.stack || 'No stack trace available'}
                </pre>
              </div>

              {/* Component Stack */}
              {errorInfo?.componentStack && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <h3 className="text-sm font-semibold text-blue-300 mb-2">🧩 Component Stack:</h3>
                  <pre className="text-xs text-gray-400 whitespace-pre-wrap break-words font-mono">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}

              {/* Helpful Tips */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-yellow-300 mb-2">💡 Debug Tips:</h3>
                <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
                  <li>Check the components and helpful context sections above</li>
                  <li>Look at the browser console (F12) for detailed stack traces</li>
                  <li>The error happened during React render or state update</li>
                  <li>Copy this error to share with support or for debugging</li>
                </ul>
              </div>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="bg-gray-800/50 border-t border-gray-700 p-4 flex justify-between items-center">
            <p className="text-xs text-gray-400">
              Error caught before crashing • Check components & context above
            </p>
            <Button
              onClick={onClose}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Close & Continue
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
