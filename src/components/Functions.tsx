'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  X, 
  Play,
  MousePointer,
  Hand,
  Focus,
  Zap,
  AlertCircle,
  Settings,
  Trash2
} from 'lucide-react'
import type { UIElement, UIElementFunction, FunctionAnimation, ROBLOX_EVENTS, RobloxEvent } from '@/types/roblox'
import { ROBLOX_EVENTS } from '@/types/roblox'

interface FunctionsProps {
  selectedElement: string | null
  elements: UIElement[]
  functionAnimations: FunctionAnimation[]
  onUpdateElement: (id: string, updates: Partial<UIElement>) => void
  onAddFunctionAnimation: (animation: FunctionAnimation) => void
  onUpdateFunctionAnimation: (id: string, updates: Partial<FunctionAnimation>) => void
  onDeleteFunctionAnimation: (id: string) => void
  onEditFunction: (elementId: string, functionId: string, animationId: string) => void
}

export function Functions({
  selectedElement,
  elements,
  functionAnimations,
  onUpdateElement,
  onAddFunctionAnimation,
  onUpdateFunctionAnimation,
  onDeleteFunctionAnimation,
  onEditFunction
}: FunctionsProps): JSX.Element {
  const [showAddFunction, setShowAddFunction] = useState<boolean>(false)
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [newAnimationName, setNewAnimationName] = useState<string>('')

  const element = selectedElement ? elements.find(el => el.id === selectedElement) : null

  // Check if the selected element supports functions
  const supportsEvents = element && ['TextButton', 'ImageButton', 'TextBox'].includes(element.type)
  
  // Get supported events for the current element
  const supportedEvents = element ? ROBLOX_EVENTS.filter(event => 
    event.supportedElements.includes(element.type)
  ) : []

  const getEventIcon = (eventName: string): JSX.Element => {
    switch (eventName) {
      case 'MouseButton1Click':
      case 'MouseButton1Down':
      case 'MouseButton1Up':
        return <MousePointer className="w-4 h-4" />
      case 'TouchTap':
      case 'TouchLongPress':
        return <Hand className="w-4 h-4" />
      case 'FocusLost':
        return <Focus className="w-4 h-4" />
      case 'Activated':
        return <Zap className="w-4 h-4" />
      default:
        return <Settings className="w-4 h-4" />
    }
  }

  const addFunction = (): void => {
    if (!element || !selectedEvent || !newAnimationName.trim()) return

    // Create new function animation
    const newAnimation: FunctionAnimation = {
      id: `func_anim_${Date.now()}`,
      name: newAnimationName.trim(),
      keyframes: [],
      duration: 1
    }

    // Create new function for the element
    const newFunction: UIElementFunction = {
      id: `func_${Date.now()}`,
      eventName: selectedEvent,
      animationId: newAnimation.id,
      enabled: true
    }

    // Update element with new function
    const updatedFunctions = [...(element.functions || []), newFunction]
    onUpdateElement(element.id, { functions: updatedFunctions })

    // Add the function animation
    onAddFunctionAnimation(newAnimation)

    // Reset form
    setSelectedEvent('')
    setNewAnimationName('')
    setShowAddFunction(false)
  }

  const removeFunction = (functionId: string): void => {
    if (!element) return

    const functionToRemove = element.functions?.find(f => f.id === functionId)
    if (functionToRemove) {
      // Remove the function animation
      onDeleteFunctionAnimation(functionToRemove.animationId)
    }

    // Remove function from element
    const updatedFunctions = (element.functions || []).filter(f => f.id !== functionId)
    onUpdateElement(element.id, { functions: updatedFunctions })
  }

  const toggleFunction = (functionId: string): void => {
    if (!element) return

    const updatedFunctions = (element.functions || []).map(f =>
      f.id === functionId ? { ...f, enabled: !f.enabled } : f
    )
    onUpdateElement(element.id, { functions: updatedFunctions })
  }

  if (!selectedElement) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8">
        <Zap className="w-12 h-12 mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">No Element Selected</h3>
        <p className="text-sm text-center">
          Select an element to add interactive functions and triggers
        </p>
      </div>
    )
  }

  if (!supportsEvents) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8">
        <AlertCircle className="w-12 h-12 mb-4 text-orange-400" />
        <h3 className="text-lg font-medium mb-2">Element Not Interactive</h3>
        <p className="text-sm text-center mb-4">
          This element type ({element?.type}) doesn't support interactive functions.
        </p>
        <div className="text-xs text-gray-600 text-center">
          <p className="mb-1">Supported elements:</p>
          <div className="flex flex-wrap gap-1 justify-center">
            <Badge variant="secondary" className="text-xs">TextButton</Badge>
            <Badge variant="secondary" className="text-xs">ImageButton</Badge>
            <Badge variant="secondary" className="text-xs">TextBox</Badge>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Functions
          </h2>
          <Badge variant="outline" className="text-xs bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400/30 text-white font-medium px-3 py-1">
            {element?.name}
          </Badge>
        </div>

        {/* Add Function Button */}
        <Button
          onClick={() => setShowAddFunction(!showAddFunction)}
          className="w-full bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] text-gray-900 font-semibold hover:opacity-90 gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Function
        </Button>
      </div>

      {/* Add Function Form */}
      <AnimatePresence>
        {showAddFunction && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-800 max-h-80 overflow-y-auto"
          >
            <div className="p-4 space-y-3">
              <h3 className="text-sm font-medium text-gray-300">Add New Function</h3>
              
              {/* Event Selection */}
              <div className="space-y-2">
                <label className="text-xs text-gray-400">Event Trigger</label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select an event..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {supportedEvents.map((event) => (
                      <SelectItem key={event.name} value={event.name}>
                        <div className="flex items-center gap-2">
                          {getEventIcon(event.name)}
                          <div>
                            <div className="font-medium">{event.displayName}</div>
                            <div className="text-xs text-gray-500">{event.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Animation Name */}
              <div className="space-y-2">
                <label className="text-xs text-gray-400">Animation Name</label>
                <Input
                  value={newAnimationName}
                  onChange={(e) => setNewAnimationName(e.target.value)}
                  placeholder="e.g., Button Click Animation"
                  className="bg-gray-800 border-gray-700"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={addFunction}
                  disabled={!selectedEvent || !newAnimationName.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Add Function
                </Button>
                <Button
                  onClick={() => {
                    setShowAddFunction(false)
                    setSelectedEvent('')
                    setNewAnimationName('')
                  }}
                  variant="outline"
                  className="px-3 bg-black text-white border-gray-600 hover:bg-gray-800"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Functions List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {(!element.functions || element.functions.length === 0) ? (
            <div className="text-center py-8 text-gray-500">
              <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No functions added yet</p>
              <p className="text-xs">Click "Add Function" to get started</p>
            </div>
          ) : (
            element.functions.map((func) => {
              const event = ROBLOX_EVENTS.find(e => e.name === func.eventName)
              const animation = functionAnimations.find(a => a.id === func.animationId)
              
              return (
                <motion.div
                  key={func.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`p-3 rounded-lg border transition-colors ${
                    func.enabled 
                      ? 'bg-gray-800 border-gray-700' 
                      : 'bg-gray-800/50 border-gray-700/50'
                  }`}
                >
                  {/* Function Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getEventIcon(func.eventName)}
                      <div>
                        <div className="font-medium text-sm">
                          {event?.displayName || func.eventName}
                        </div>
                        <div className="text-xs text-gray-400">
                          {animation?.name || 'Unknown Animation'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {/* Enable/Disable Toggle */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFunction(func.id)}
                        className={`w-8 h-8 p-0 ${
                          func.enabled 
                            ? 'text-green-400 hover:text-green-300' 
                            : 'text-gray-600 hover:text-gray-500'
                        }`}
                      >
                        <Play className="w-3 h-3" />
                      </Button>
                      
                      {/* Delete Function */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFunction(func.id)}
                        className="w-8 h-8 p-0 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Function Details */}
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Event:</span>
                      <code className="bg-gray-700 px-1 rounded">{func.eventName}</code>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{animation?.duration || 1}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Keyframes:</span>
                      <span>{animation?.keyframes.length || 0}</span>
                    </div>

                  </div>

                  {/* Edit Animation Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 text-xs text-black bg-white border-gray-300 hover:bg-gray-100"
                    onClick={() => {
                      onEditFunction(element.id, func.id, func.animationId)
                    }}
                  >
                    Edit Animation
                  </Button>
                </motion.div>
              )
            })
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <div className="text-xs text-gray-500 text-center">
          {element.functions?.length || 0} function{(element.functions?.length || 0) !== 1 ? 's' : ''} configured
        </div>
      </div>
    </div>
  )
}