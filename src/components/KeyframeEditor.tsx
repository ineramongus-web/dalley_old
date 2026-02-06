'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings } from 'lucide-react'
import type { AnimationKeyframe } from '@/types/roblox'

interface KeyframeEditorProps {
  keyframe: AnimationKeyframe
  onUpdateKeyframe: (id: string, updates: Partial<AnimationKeyframe>) => void
  onClose: () => void
}

export function KeyframeEditor({ keyframe, onUpdateKeyframe, onClose }: KeyframeEditorProps): JSX.Element {
  const currentSprSettings = keyframe.sprSettings || {
    dampingRatio: 0.8,
    undampedFrequency: 15
  }

  // Local state for input values to allow temporary empty strings
  const [frequencyInput, setFrequencyInput] = useState<string>(
    currentSprSettings.undampedFrequency?.toString() || '15'
  )
  const [dampingInput, setDampingInput] = useState<string>(
    currentSprSettings.dampingRatio?.toString() || '0.8'
  )

  // Update local state when keyframe changes
  useEffect(() => {
    setFrequencyInput(currentSprSettings.undampedFrequency?.toString() || '15')
    setDampingInput(currentSprSettings.dampingRatio?.toString() || '0.8')
  }, [keyframe.id, currentSprSettings.undampedFrequency, currentSprSettings.dampingRatio])

  const handleFrequencyChange = (value: string): void => {
    setFrequencyInput(value)
  }

  const handleFrequencyBlur = (): void => {
    // On blur, ensure we have a valid number, default to 15 if empty or invalid
    const numValue = parseFloat(frequencyInput)
    if (isNaN(numValue) || frequencyInput === '') {
      setFrequencyInput('15')
      onUpdateKeyframe(keyframe.id, {
        sprSettings: {
          ...currentSprSettings,
          undampedFrequency: 15
        }
      })
    } else {
      onUpdateKeyframe(keyframe.id, {
        sprSettings: {
          ...currentSprSettings,
          undampedFrequency: numValue
        }
      })
    }
  }

  const handleDampingChange = (value: string): void => {
    setDampingInput(value)
  }

  const handleDampingBlur = (): void => {
    // On blur, ensure we have a valid number, default to 0.8 if empty or invalid
    const numValue = parseFloat(dampingInput)
    if (isNaN(numValue) || dampingInput === '') {
      setDampingInput('0.8')
      onUpdateKeyframe(keyframe.id, {
        sprSettings: {
          ...currentSprSettings,
          dampingRatio: 0.8
        }
      })
    } else {
      onUpdateKeyframe(keyframe.id, {
        sprSettings: {
          ...currentSprSettings,
          dampingRatio: numValue
        }
      })
    }
  }

  return (
    <motion.div
      className="bg-gray-800 border-t border-gray-700 p-2 sm:p-4"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2">
          <Settings className="w-3 h-3 sm:w-4 sm:h-4 text-[#ff669e]" />
          <span className="text-xs sm:text-sm font-medium text-white">
            Spring Physics - {keyframe.time.toFixed(2)}s
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-700"
          title="Close keyframe editor"
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <div className="space-y-1 sm:space-y-2">
          <Label className="text-gray-300 text-xs">
            Frequency
          </Label>
          <Input
            type="number"
            value={frequencyInput}
            onChange={(e) => handleFrequencyChange(e.target.value)}
            onBlur={handleFrequencyBlur}
            className="w-full h-7 sm:h-8 bg-[#1C1F26] border-gray-700 text-white text-xs sm:text-sm rounded-xl"
          />
          <p className="text-xs text-gray-400 hidden sm:block">
            Speed (1-30)
          </p>
        </div>

        <div className="space-y-1 sm:space-y-2">
          <Label className="text-gray-300 text-xs">
            Damping
          </Label>
          <Input
            type="number"
            value={dampingInput}
            onChange={(e) => handleDampingChange(e.target.value)}
            onBlur={handleDampingBlur}
            className="w-full h-7 sm:h-8 bg-[#1C1F26] border-gray-700 text-white text-xs sm:text-sm rounded-xl"
          />
          <p className="text-xs text-gray-400 hidden sm:block">
            Bounce (0.1-2)
          </p>
        </div>
      </div>
    </motion.div>
  )
}
