'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  X, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock,
  ChevronRight,
  ChevronDown,
  Square,
  Type,
  Image,
  MousePointer,
  Scroll,
  Edit3,
  Monitor,
  Layers
} from 'lucide-react'
import type { UIElement, RobloxElementType } from '@/types/roblox'

interface SidebarProps {
  elements: UIElement[]
  selectedElement: string | null
  onSelectElement: (id: string | null) => void
  onAddElement: (element: UIElement) => void
  onUpdateElement: (id: string, updates: Partial<UIElement>) => void
  onDeleteElement: (id: string) => void
  onClose: () => void
}

const elementTemplates: Array<{
  type: RobloxElementType
  name: string
  icon: React.ReactNode
  description: string
  defaultProperties: any
}> = [
  {
    type: 'Frame',
    name: 'Frame',
    icon: <Square className="w-4 h-4" />,
    description: 'Basic container element',
    defaultProperties: {
      Size: { X: { Scale: 0, Offset: 200 }, Y: { Scale: 0, Offset: 100 } },
      Position: { X: { Scale: 0, Offset: 50 }, Y: { Scale: 0, Offset: 50 } },
      BackgroundColor3: { R: 0.2, G: 0.2, B: 0.2 },
      BorderSizePixel: 0
    }
  },
  {
    type: 'TextLabel',
    name: 'Text Label',
    icon: <Type className="w-4 h-4" />,
    description: 'Display text content',
    defaultProperties: {
      Size: { X: { Scale: 0, Offset: 200 }, Y: { Scale: 0, Offset: 50 } },
      Position: { X: { Scale: 0, Offset: 50 }, Y: { Scale: 0, Offset: 50 } },
      BackgroundTransparency: 1,
      Text: 'Label',
      TextColor3: { R: 1, G: 1, B: 1 },
      TextSize: 14,
      Font: 'SourceSans'
    }
  },
  {
    type: 'TextButton',
    name: 'Text Button',
    icon: <MousePointer className="w-4 h-4" />,
    description: 'Interactive button with text',
    defaultProperties: {
      Size: { X: { Scale: 0, Offset: 150 }, Y: { Scale: 0, Offset: 40 } },
      Position: { X: { Scale: 0, Offset: 50 }, Y: { Scale: 0, Offset: 50 } },
      BackgroundColor3: { R: 0.3, G: 0.3, B: 0.8 },
      Text: 'Button',
      TextColor3: { R: 1, G: 1, B: 1 },
      TextSize: 14,
      Font: 'SourceSansBold'
    }
  },
  {
    type: 'ImageLabel',
    name: 'Image Label',
    icon: <Image className="w-4 h-4" />,
    description: 'Display images',
    defaultProperties: {
      Size: { X: { Scale: 0, Offset: 100 }, Y: { Scale: 0, Offset: 100 } },
      Position: { X: { Scale: 0, Offset: 50 }, Y: { Scale: 0, Offset: 50 } },
      BackgroundTransparency: 1,
      Image: 'rbxasset://textures/ui/GuiImagePlaceholder.png'
    }
  },
  {
    type: 'ScrollingFrame',
    name: 'Scrolling Frame',
    icon: <Scroll className="w-4 h-4" />,
    description: 'Scrollable container',
    defaultProperties: {
      Size: { X: { Scale: 0, Offset: 200 }, Y: { Scale: 0, Offset: 150 } },
      Position: { X: { Scale: 0, Offset: 50 }, Y: { Scale: 0, Offset: 50 } },
      BackgroundColor3: { R: 0.15, G: 0.15, B: 0.15 },
      CanvasSize: { X: { Scale: 0, Offset: 0 }, Y: { Scale: 0, Offset: 300 } },
      ScrollBarThickness: 8
    }
  },
  {
    type: 'TextBox',
    name: 'Text Box',
    icon: <Edit3 className="w-4 h-4" />,
    description: 'Editable text input',
    defaultProperties: {
      Size: { X: { Scale: 0, Offset: 200 }, Y: { Scale: 0, Offset: 30 } },
      Position: { X: { Scale: 0, Offset: 50 }, Y: { Scale: 0, Offset: 50 } },
      BackgroundColor3: { R: 0.9, G: 0.9, B: 0.9 },
      Text: 'TextBox',
      TextColor3: { R: 0, G: 0, B: 0 },
      TextSize: 14
    }
  }
]

export function Sidebar({
  elements,
  selectedElement,
  onSelectElement,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  onClose
}: SidebarProps): JSX.Element {
  const [expandedElements, setExpandedElements] = useState<Set<string>>(new Set())
  const [showTemplates, setShowTemplates] = useState<boolean>(false)

  const toggleExpanded = (id: string): void => {
    const newExpanded = new Set(expandedElements)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedElements(newExpanded)
  }

  const createElement = (template: typeof elementTemplates[0]): void => {
    const element: UIElement = {
      id: `element_${Date.now()}`,
      name: template.name,
      type: template.type,
      parent: undefined,  // New elements are created at root level
      properties: template.defaultProperties,
      children: [],
      visible: true,
      locked: false
    }
    onAddElement(element)
    setShowTemplates(false)
  }

  const renderElement = (element: UIElement, depth: number = 0): JSX.Element => {
    const isSelected = selectedElement === element.id
    const isExpanded = expandedElements.has(element.id)
    const hasChildren = element.children.length > 0

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="select-none"
      >
        <div
          className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors
                     ${isSelected ? 'bg-gradient-to-r from-[#faf7ff]/20 to-[#e2d4ff]/20 border border-[#e2d4ff]/30' : 'hover:bg-gray-800'}
                     ${depth > 0 ? 'ml-4' : ''}`}
          onClick={() => onSelectElement(isSelected ? null : element.id)}
          style={{ marginLeft: depth * 16 }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="w-4 h-4 p-0 hover:bg-transparent"
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(element.id)
              }}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </Button>
          )}

          {/* Element Icon */}
          <div className="w-4 h-4 flex items-center justify-center">
            {elementTemplates.find(t => t.type === element.type)?.icon || <Square className="w-4 h-4" />}
          </div>

          {/* Element Name */}
          <span className="flex-1 text-sm truncate">{element.name}</span>

          {/* Element Type Badge */}
          <Badge variant="secondary" className="text-xs px-1 py-0">
            {element.type}
          </Badge>

          {/* Visibility Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="w-4 h-4 p-0 hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation()
              onUpdateElement(element.id, { visible: !element.visible })
            }}
          >
            {element.visible ? (
              <Eye className="w-3 h-3 text-gray-400" />
            ) : (
              <EyeOff className="w-3 h-3 text-gray-600" />
            )}
          </Button>

          {/* Lock Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="w-4 h-4 p-0 hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation()
              onUpdateElement(element.id, { locked: !element.locked })
            }}
          >
            {element.locked ? (
              <Lock className="w-3 h-3 text-gray-600" />
            ) : (
              <Unlock className="w-3 h-3 text-gray-400" />
            )}
          </Button>

          {/* Delete Button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-4 h-4 p-0 hover:bg-red-600/20 text-red-400"
            onClick={(e) => {
              e.stopPropagation()
              onDeleteElement(element.id)
            }}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </motion.div>
    )
  }

  // Helper to get all elements in hierarchical order with depth - FLAT LIST
  const getHierarchicalElements = (): Array<{ element: UIElement; depth: number }> => {
    const result: Array<{ element: UIElement; depth: number }> = []
    const processElement = (el: UIElement, depth: number) => {
      result.push({ element: el, depth })
      if (expandedElements.has(el.id)) {
        el.children.forEach(child => processElement(child, depth + 1))
      }
    }
    elements.forEach(element => processElement(element, 0))
    return result
  }

  return (
    <motion.div
      className="w-64 sm:w-72 bg-gray-900 border-r border-gray-800 flex flex-col h-full"
      initial={{ x: -320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Elements
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Add Element Button */}
        <Button
          onClick={() => setShowTemplates(!showTemplates)}
          className="w-full bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] text-black hover:from-[#e2d4ff] hover:to-[#d1c4e9] gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Element
        </Button>
      </div>

      {/* Element Templates */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-800 p-4 space-y-2"
          >
            <h3 className="text-sm font-medium text-gray-300 mb-2">Element Types</h3>
            <div className="grid grid-cols-1 gap-2">
              {elementTemplates.map((template) => (
                <motion.button
                  key={template.type}
                  onClick={() => createElement(template)}
                  className="p-2 sm:p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {template.icon}
                    <span className="text-sm font-medium">{template.name}</span>
                  </div>
                  <p className="text-xs text-gray-400">{template.description}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Elements List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-1">
          {elements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No elements yet</p>
              <p className="text-xs">Click "Add Element" to get started</p>
            </div>
          ) : (
            getHierarchicalElements().map(({ element, depth }) => (
              <React.Fragment key={element.id}>
                {renderElement(element, depth)}
              </React.Fragment>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <div className="text-xs text-gray-500 text-center">
          {elements.length} element{elements.length !== 1 ? 's' : ''}
        </div>
      </div>
    </motion.div>
  )
}