'use client'

import { motion } from 'framer-motion'
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import type { RobloxElement } from '../types/roblox'

interface ElementManagerProps {
  elements: RobloxElement[]
  selectedElement: string | null
  onSelectElement: (id: string | null) => void
  onAddElement: (type: RobloxElement['type']) => void
  onDeleteElement: (id: string) => void
}

const elementTypes: { type: RobloxElement['type']; label: string; description: string }[] = [
  { type: 'Frame', label: 'Frame', description: 'Basic container' },
  { type: 'TextLabel', label: 'Text Label', description: 'Display text' },
  { type: 'TextButton', label: 'Text Button', description: 'Clickable text' },
  { type: 'TextBox', label: 'Text Box', description: 'Text input' },
  { type: 'ImageLabel', label: 'Image Label', description: 'Display image' },
  { type: 'ImageButton', label: 'Image Button', description: 'Clickable image' },
  { type: 'ScrollingFrame', label: 'Scrolling Frame', description: 'Scrollable container' }
]

export default function ElementManager({
  elements,
  selectedElement,
  onSelectElement,
  onAddElement,
  onDeleteElement
}: ElementManagerProps): JSX.Element {
  return (
    <div className="h-full flex flex-col">
      {/* Add Element Section */}
      <div className="p-3 sm:p-4 border-b border-gray-800">
        <h3 className="text-sm sm:text-base font-semibold text-white mb-3">Add Element</h3>
        <div className="grid grid-cols-1 gap-2">
          {elementTypes.map((elementType) => (
            <button
              key={elementType.type}
              onClick={() => onAddElement(elementType.type)}
              className="flex items-center gap-2 p-2 sm:p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-medium text-white truncate">
                  {elementType.label}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  {elementType.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Elements List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 sm:p-4">
          <h3 className="text-sm sm:text-base font-semibold text-white mb-3">
            Elements ({elements.length})
          </h3>
          
          {elements.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No elements yet</p>
              <p className="text-xs">Add an element to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {elements.map((element) => (
                <motion.div
                  key={element.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-2 sm:p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedElement === element.id
                      ? 'bg-purple-900/30 border-purple-400'
                      : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                  }`}
                  onClick={() => onSelectElement(element.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-medium text-white truncate">
                          {element.name}
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-700 px-1.5 py-0.5 rounded flex-shrink-0">
                          {element.type}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {element.properties.Visible ? (
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            Visible
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <EyeOff className="w-3 h-3" />
                            Hidden
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteElement(element.id)
                      }}
                      className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors flex-shrink-0"
                      title="Delete Element"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Layers({ className }: { className?: string }): JSX.Element {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
      <polyline points="2,17 12,22 22,17"></polyline>
      <polyline points="2,12 12,17 22,12"></polyline>
    </svg>
  )
}