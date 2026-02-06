'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Copy, X, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { useState } from 'react'

interface DuplicateDebugMenuProps {
  open: boolean
  onClose: () => void
  elementName: string
  onDuplicate: (mode: DuplicateMode) => void
}

export type DuplicateMode = 
  | 'normal'
  | 'no-parent'
  | 'no-keyframes'
  | 'no-events'
  | 'clean-slate'
  | 'deep-clone'
  | 'with-delay'

interface DuplicateModeConfig {
  id: DuplicateMode
  name: string
  description: string
  icon: typeof Info
  color: string
}

const duplicateModes: DuplicateModeConfig[] = [
  {
    id: 'normal',
    name: 'Normal Duplicate',
    description: 'Standard duplicate with all properties, keyframes, and events',
    icon: Copy,
    color: 'blue'
  },
  {
    id: 'no-parent',
    name: 'No Parent (Root Level)',
    description: 'Duplicate without any parent relationship - always root level',
    icon: AlertCircle,
    color: 'purple'
  },
  {
    id: 'no-keyframes',
    name: 'Without Keyframes',
    description: 'Duplicate without animation keyframes',
    icon: CheckCircle,
    color: 'green'
  },
  {
    id: 'no-events',
    name: 'Without Events',
    description: 'Duplicate without function animations/events',
    icon: Info,
    color: 'yellow'
  },
  {
    id: 'clean-slate',
    name: 'Clean Slate',
    description: 'Only properties, no keyframes, no events, no parent',
    icon: X,
    color: 'red'
  },
  {
    id: 'deep-clone',
    name: 'Deep Clone',
    description: 'Complete JSON.parse(JSON.stringify()) clone',
    icon: Copy,
    color: 'indigo'
  },
  {
    id: 'with-delay',
    name: 'With Delay (Debug)',
    description: 'Adds 100ms delay between operations to debug timing issues',
    icon: AlertCircle,
    color: 'orange'
  }
]

export function DuplicateDebugMenu({ open, onClose, elementName, onDuplicate }: DuplicateDebugMenuProps): JSX.Element {
  const [selectedMode, setSelectedMode] = useState<DuplicateMode>('normal')

  const handleDuplicate = () => {
    try {
      onDuplicate(selectedMode)
      onClose()
    } catch (error) {
      console.error('❌ Duplicate error:', error)
      alert(`Duplicate failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'border-blue-500/30 hover:bg-blue-500/10 focus:ring-blue-500',
      purple: 'border-purple-500/30 hover:bg-purple-500/10 focus:ring-purple-500',
      green: 'border-green-500/30 hover:bg-green-500/10 focus:ring-green-500',
      yellow: 'border-yellow-500/30 hover:bg-yellow-500/10 focus:ring-yellow-500',
      red: 'border-red-500/30 hover:bg-red-500/10 focus:ring-red-500',
      indigo: 'border-indigo-500/30 hover:bg-indigo-500/10 focus:ring-indigo-500',
      orange: 'border-orange-500/30 hover:bg-orange-500/10 focus:ring-orange-500'
    }
    return colorMap[color] || colorMap.blue
  }

  if (!open) return <></>

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
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-b border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Copy className="w-5 h-5" />
                  Duplicate Debug Menu
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Duplicating: <span className="text-white font-medium">{elementName}</span>
                </p>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Mode Selection */}
          <ScrollArea className="h-[50vh] p-4">
            <div className="space-y-3">
              {duplicateModes.map((mode) => {
                const Icon = mode.icon
                const isSelected = selectedMode === mode.id

                return (
                  <motion.button
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? `${getColorClasses(mode.color)} ring-2`
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-${mode.color}-500/20 flex-shrink-0`}>
                        <Icon className={`w-5 h-5 text-${mode.color}-400`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{mode.name}</h3>
                        <p className="text-sm text-gray-400 mt-1">{mode.description}</p>
                        {isSelected && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-2 text-xs text-green-400 flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Selected
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="bg-gray-800/50 border-t border-gray-700 p-4 flex justify-between items-center">
            <p className="text-xs text-gray-400">
              Choose a duplicate mode to test different approaches
            </p>
            <div className="flex gap-2">
              <Button
                onClick={onClose}
                variant="ghost"
                className="text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDuplicate}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
