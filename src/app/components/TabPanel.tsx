'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Layers, Settings } from 'lucide-react'
import Timeline from './Timeline'
import ElementManager from './ElementManager'
import PropertiesPanel from './PropertiesPanel'
import type { RobloxElement, AnimationKeyframe } from '../types/roblox'

interface TabPanelProps {
  activeTab: 'timeline' | 'elements' | 'properties'
  onTabChange: (tab: 'timeline' | 'elements' | 'properties') => void
  elements: RobloxElement[]
  selectedElement: string | null
  keyframes: AnimationKeyframe[]
  currentTime: number
  isPlaying: boolean
  duration: number
  onSelectElement: (id: string | null) => void
  onAddElement: (type: RobloxElement['type']) => void
  onUpdateElement: (id: string, properties: Partial<RobloxElement['properties']>) => void
  onDeleteElement: (id: string) => void
  onTimeChange: (time: number) => void
  onPlayToggle: () => void
  onAddKeyframe: (elementId: string, time: number, properties: Partial<RobloxElement['properties']>) => void
  onUpdateKeyframe: (id: string, updates: Partial<AnimationKeyframe>) => void
  onDeleteKeyframe: (id: string) => void
}

const tabs = [
  { id: 'timeline' as const, label: 'Timeline', icon: Clock },
  { id: 'elements' as const, label: 'Elements', icon: Layers },
  { id: 'properties' as const, label: 'Properties', icon: Settings }
]

export default function TabPanel({
  activeTab,
  onTabChange,
  elements,
  selectedElement,
  keyframes,
  currentTime,
  isPlaying,
  duration,
  onSelectElement,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  onTimeChange,
  onPlayToggle,
  onAddKeyframe,
  onUpdateKeyframe,
  onDeleteKeyframe
}: TabPanelProps): JSX.Element {
  const selectedElementData = elements.find(el => el.id === selectedElement)

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-800 bg-gray-800">
        {tabs.map((tab) => {
          const IconComponent = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-900 text-white border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <IconComponent className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          {activeTab === 'timeline' && (
            <Timeline
              elements={elements}
              keyframes={keyframes}
              currentTime={currentTime}
              isPlaying={isPlaying}
              duration={duration}
              onTimeChange={onTimeChange}
              onPlayToggle={onPlayToggle}
              onAddKeyframe={onAddKeyframe}
              onUpdateKeyframe={onUpdateKeyframe}
              onDeleteKeyframe={onDeleteKeyframe}
            />
          )}

          {activeTab === 'elements' && (
            <ElementManager
              elements={elements}
              selectedElement={selectedElement}
              onSelectElement={onSelectElement}
              onAddElement={onAddElement}
              onDeleteElement={onDeleteElement}
            />
          )}

          {activeTab === 'properties' && (
            <PropertiesPanel
              element={selectedElementData}
              onUpdateElement={onUpdateElement}
            />
          )}
        </motion.div>
      </div>
    </div>
  )
}