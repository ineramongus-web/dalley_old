'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  ChevronDown,
  ChevronRight,
  Settings,
  Move,
  Palette,
  Type,
  Image,
  Layout,
  Zap,
  Edit3,
  Check,
  X,
  Copy,
  Trash2,
  Save,
  Plus,
  Minus
} from 'lucide-react'
import { GradientEditor } from './GradientEditor'
import { FontDropdown } from './FontDropdown'
import type { UIElement, AnimationKeyframe, FunctionAnimation } from '@/types/roblox'

interface PropertiesProps {
  selectedElement: string | null
  elements: UIElement[]
  onUpdateElement: (id: string, properties: Partial<UIElement['properties']>) => void
  onUpdateElementDirect: (id: string, updates: Partial<UIElement>) => void
  editingKeyframe: string | null
  animations: AnimationKeyframe[]
  onUpdateKeyframe: (id: string, updates: Partial<AnimationKeyframe>) => void
  editingFunction?: { elementId: string; functionId: string; animationId: string } | null
  functionAnimations?: FunctionAnimation[]
  onUpdateFunctionKeyframe?: (animationId: string, keyframeId: string, updates: Partial<AnimationKeyframe>) => void
  onDuplicateElement?: (id: string) => void
  onDeleteElement?: (id: string) => void
  onSaveAsCustomElement?: (element: UIElement, includeChildren: boolean, includeEffects: boolean, includeKeyframes: boolean, includeEvents: boolean) => void
}

interface PropertySection {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  expanded: boolean
}

export function Properties({
  selectedElement,
  elements,
  onUpdateElement,
  onUpdateElementDirect,
  editingKeyframe,
  animations,
  onUpdateKeyframe,
  editingFunction,
  functionAnimations = [],
  onUpdateFunctionKeyframe,
  onDuplicateElement,
  onDeleteElement,
  onSaveAsCustomElement
}: PropertiesProps): JSX.Element {
  const [sections, setSections] = useState<PropertySection[]>([
    { id: 'transform', title: 'Transform', icon: Move, expanded: true },
    { id: 'appearance', title: 'Appearance', icon: Palette, expanded: true },
    { id: 'text', title: 'Text', icon: Type, expanded: false },
    { id: 'image', title: 'Image', icon: Image, expanded: false },
    { id: 'layout', title: 'Layout', icon: Layout, expanded: false },
    { id: 'effects', title: 'Effects', icon: Zap, expanded: false }
  ])
  
  const [isEditingName, setIsEditingName] = useState<boolean>(false)
  const [editingNameValue, setEditingNameValue] = useState<string>('')
  const [showSaveCustomDialog, setShowSaveCustomDialog] = useState<boolean>(false)
  const [includeChildren, setIncludeChildren] = useState<boolean>(true)
  const [includeEffects, setIncludeEffects] = useState<boolean>(true)
  const [includeKeyframes, setIncludeKeyframes] = useState<boolean>(true)
  const [includeEvents, setIncludeEvents] = useState<boolean>(true)

  const element = elements.find(el => el.id === selectedElement)
  
  // Handle both regular keyframes and function keyframes
  let keyframe: AnimationKeyframe | null = null
  if (editingKeyframe) {
    if (editingFunction) {
      // Find keyframe in function animations
      const functionAnimation = functionAnimations.find(anim => anim.id === editingFunction.animationId)
      keyframe = functionAnimation?.keyframes.find(kf => kf.id === editingKeyframe) || null
    } else {
      // Find keyframe in regular animations
      keyframe = animations.find(kf => kf.id === editingKeyframe) || null
    }
  }
  
  const isEditingKeyframe = !!editingKeyframe && !!keyframe

  const toggleSection = (sectionId: string) => {
    setSections(sections.map(section => 
      section.id === sectionId 
        ? { ...section, expanded: !section.expanded }
        : section
    ))
  }

  const updateProperty = (property: string, value: any) => {
    if (isEditingKeyframe && keyframe) {
      // Update keyframe properties - handle both regular and function keyframes
      if (editingFunction && onUpdateFunctionKeyframe) {
        // Update function keyframe
        onUpdateFunctionKeyframe(editingFunction.animationId, keyframe.id, {
          properties: {
            ...keyframe.properties,
            [property]: value
          }
        })
      } else {
        // Update regular keyframe
        onUpdateKeyframe(keyframe.id, {
          properties: {
            ...keyframe.properties,
            [property]: value
          }
        })
      }
    } else if (selectedElement) {
      // Update element properties
      onUpdateElement(selectedElement, { [property]: value })
    }
  }

  const updateNestedProperty = (parentProperty: string, childProperty: string, value: any) => {
    if (isEditingKeyframe && keyframe) {
      // Update keyframe properties - handle both regular and function keyframes
      const currentParent = keyframe.properties[parentProperty] || {}
      if (editingFunction && onUpdateFunctionKeyframe) {
        // Update function keyframe
        onUpdateFunctionKeyframe(editingFunction.animationId, keyframe.id, {
          properties: {
            ...keyframe.properties,
            [parentProperty]: {
              ...currentParent,
              [childProperty]: value
            }
          }
        })
      } else {
        // Update regular keyframe
        onUpdateKeyframe(keyframe.id, {
          properties: {
            ...keyframe.properties,
            [parentProperty]: {
              ...currentParent,
              [childProperty]: value
            }
          }
        })
      }
    } else if (selectedElement && element) {
      // Update element properties
      const currentParent = element.properties[parentProperty] || {}
      onUpdateElement(selectedElement, {
        [parentProperty]: {
          ...currentParent,
          [childProperty]: value
        }
      })
    }
  }

  const updateUDim2Property = (property: string, axis: 'X' | 'Y', type: 'Scale' | 'Offset', value: number) => {
    if (isEditingKeyframe && keyframe) {
      // Update keyframe properties - handle both regular and function keyframes
      const currentUDim2 = keyframe.properties[property] || { X: { Scale: 0, Offset: 0 }, Y: { Scale: 0, Offset: 0 } }
      if (editingFunction && onUpdateFunctionKeyframe) {
        // Update function keyframe
        onUpdateFunctionKeyframe(editingFunction.animationId, keyframe.id, {
          properties: {
            ...keyframe.properties,
            [property]: {
              ...currentUDim2,
              [axis]: {
                ...currentUDim2[axis],
                [type]: value
              }
            }
          }
        })
      } else {
        // Update regular keyframe
        onUpdateKeyframe(keyframe.id, {
          properties: {
            ...keyframe.properties,
            [property]: {
              ...currentUDim2,
              [axis]: {
                ...currentUDim2[axis],
                [type]: value
              }
            }
          }
        })
      }
    } else if (selectedElement && element) {
      // Update element properties
      const currentUDim2 = element.properties[property] || { X: { Scale: 0, Offset: 0 }, Y: { Scale: 0, Offset: 0 } }
      onUpdateElement(selectedElement, {
        [property]: {
          ...currentUDim2,
          [axis]: {
            ...currentUDim2[axis],
            [type]: value
          }
        }
      })
    }
  }

  const updateColor3Property = (property: string, channel: 'R' | 'G' | 'B', value: number) => {
    if (isEditingKeyframe && keyframe) {
      // Update keyframe properties - handle both regular and function keyframes
      const currentColor = keyframe.properties[property] || { R: 1, G: 1, B: 1 }
      if (editingFunction && onUpdateFunctionKeyframe) {
        // Update function keyframe
        onUpdateFunctionKeyframe(editingFunction.animationId, keyframe.id, {
          properties: {
            ...keyframe.properties,
            [property]: {
              ...currentColor,
              [channel]: value / 255
            }
          }
        })
      } else {
        // Update regular keyframe
        onUpdateKeyframe(keyframe.id, {
          properties: {
            ...keyframe.properties,
            [property]: {
              ...currentColor,
              [channel]: value / 255
            }
          }
        })
      }
    } else if (selectedElement && element) {
      // Update element properties
      const currentColor = element.properties[property] || { R: 1, G: 1, B: 1 }
      onUpdateElement(selectedElement, {
        [property]: {
          ...currentColor,
          [channel]: value / 255
        }
      })
    }
  }

  const hexToColor3 = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      R: parseInt(result[1], 16) / 255,
      G: parseInt(result[2], 16) / 255,
      B: parseInt(result[3], 16) / 255
    } : { R: 1, G: 1, B: 1 }
  }

  const color3ToHex = (color: any) => {
    if (!color) return '#ffffff'
    const r = Math.round((color.R || 0) * 255)
    const g = Math.round((color.G || 0) * 255)
    const b = Math.round((color.B || 0) * 255)
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  if (!element) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Element Selected</h3>
          <p className="text-sm">Select an element to edit its properties</p>
        </div>
      </div>
    )
  }

  const isTextElement = ['TextLabel', 'TextButton', 'TextBox'].includes(element.type)
  const isImageElement = ['ImageLabel', 'ImageButton'].includes(element.type)
  const isScrollingFrame = element.type === 'ScrollingFrame'

  return (
    <ScrollArea className="h-full">
      <motion.div
        className="p-4 space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Element Info */}
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] rounded-full" />
            {isEditingName ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={editingNameValue}
                  onChange={(e) => setEditingNameValue(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white text-sm h-7 flex-1"
                  placeholder="Element name"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (editingNameValue.trim() && selectedElement && onUpdateElementDirect) {
                        onUpdateElementDirect(selectedElement, { name: editingNameValue.trim() })
                      }
                      setIsEditingName(false)
                    } else if (e.key === 'Escape') {
                      setIsEditingName(false)
                      setEditingNameValue(element.name)
                    }
                  }}
                />
                <motion.button
                  onClick={() => {
                    if (editingNameValue.trim() && selectedElement && onUpdateElementDirect) {
                      onUpdateElementDirect(selectedElement, { name: editingNameValue.trim() })
                    }
                    setIsEditingName(false)
                  }}
                  className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Check className="w-3 h-3 text-green-400" />
                </motion.button>
                <motion.button
                  onClick={() => {
                    setIsEditingName(false)
                    setEditingNameValue(element.name)
                  }}
                  className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-3 h-3 text-red-400" />
                </motion.button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-medium text-white">{element.name}</span>
                  <motion.button
                    onClick={() => {
                      setIsEditingName(true)
                      setEditingNameValue(element.name)
                    }}
                    className="p-1 hover:bg-gray-700/50 rounded transition-colors opacity-60 hover:opacity-100"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Rename element"
                  >
                    <Edit3 className="w-3 h-3 text-gray-400" />
                  </motion.button>
                </div>
                {/* Quick Actions */}
                <div className="flex items-center gap-1 ml-auto">
                  <motion.button
                    onClick={() => setShowSaveCustomDialog(true)}
                    className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Save as Custom Element"
                  >
                    <Save className="w-3 h-3 text-gray-300" />
                  </motion.button>
                  {onDuplicateElement && (
                    <motion.button
                      onClick={() => onDuplicateElement(element.id)}
                      className="p-1 hover:bg-green-500/20 rounded transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Duplicate Element"
                    >
                      <Copy className="w-3 h-3 text-green-400" />
                    </motion.button>
                  )}
                  {onDeleteElement && (
                    <motion.button
                      onClick={() => onDeleteElement(element.id)}
                      className="p-1 hover:bg-red-500/20 rounded transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Delete Element"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </motion.button>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="text-sm text-gray-400">
            Type: {element.type}
          </div>
          
          {/* Save as Custom Element Dialog */}
          <AnimatePresence>
            {showSaveCustomDialog && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 p-3 bg-gray-800/50 border border-gray-700/50 rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-200">Save as Custom Element</span>
                  <button
                    onClick={() => setShowSaveCustomDialog(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-gray-300">Include Children</Label>
                    <Switch
                      checked={includeChildren}
                      onCheckedChange={setIncludeChildren}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-gray-300">Include Effects (UIStroke, Gradients, etc.)</Label>
                    <Switch
                      checked={includeEffects}
                      onCheckedChange={setIncludeEffects}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-gray-300">Include Keyframes (Animations)</Label>
                    <Switch
                      checked={includeKeyframes}
                      onCheckedChange={setIncludeKeyframes}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-gray-300">Include Events (Functions)</Label>
                    <Switch
                      checked={includeEvents}
                      onCheckedChange={setIncludeEvents}
                    />
                  </div>
                  <Button
                    onClick={() => {
                      if (onSaveAsCustomElement) {
                        onSaveAsCustomElement(element, includeChildren, includeEffects, includeKeyframes, includeEvents)
                        setShowSaveCustomDialog(false)
                      }
                    }}
                    className="w-full bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] hover:from-[#ff669e] hover:to-[#ff4080] text-black font-medium"
                    size="sm"
                  >
                    Save Custom Element
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {isEditingKeyframe && keyframe && (
            <div className={`mt-2 p-2 border rounded ${
              editingFunction 
                ? 'bg-orange-500/20 border-orange-500/30' 
                : 'bg-yellow-500/20 border-yellow-500/30'
            }`}>
              <div className={`text-xs font-medium ${
                editingFunction ? 'text-orange-300' : 'text-yellow-300'
              }`}>
                {editingFunction ? '⚡' : '🎬'} Editing {editingFunction ? 'Function ' : ''}Keyframe at {keyframe.time.toFixed(2)}s
              </div>
              <div className={`text-xs mt-1 ${
                editingFunction ? 'text-orange-400' : 'text-yellow-400'
              }`}>
                Changes will affect this specific {editingFunction ? 'function ' : ''}frame
              </div>
            </div>
          )}
        </div>

        {/* Transform Properties */}
        <Collapsible
          open={sections.find(s => s.id === 'transform')?.expanded}
          onOpenChange={() => toggleSection('transform')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2 text-white hover:bg-gray-800">
              {sections.find(s => s.id === 'transform')?.expanded ? 
                <ChevronDown className="w-4 h-4" /> : 
                <ChevronRight className="w-4 h-4" />
              }
              <Move className="w-4 h-4" />
              Transform
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-2">
            {/* UDim2 Position */}
            <div className="space-y-2">
              <Label className="text-gray-300">Position</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-400">X Scale</Label>
                  <Input
                    type="number"
                    value={(isEditingKeyframe && keyframe ? keyframe.properties.Position?.X?.Scale : element.properties.Position?.X?.Scale) ?? ''}
                    onChange={(e) => updateUDim2Property('Position', 'X', 'Scale', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                    className="bg-[#1C1F26] border-gray-700 text-white text-xs rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">X Offset</Label>
                  <Input
                    type="number"
                    value={(isEditingKeyframe && keyframe ? keyframe.properties.Position?.X?.Offset : element.properties.Position?.X?.Offset) ?? ''}
                    onChange={(e) => updateUDim2Property('Position', 'X', 'Offset', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                    className="bg-[#1C1F26] border-gray-700 text-white text-xs rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Y Scale</Label>
                  <Input
                    type="number"
                    value={(isEditingKeyframe && keyframe ? keyframe.properties.Position?.Y?.Scale : element.properties.Position?.Y?.Scale) ?? ''}
                    onChange={(e) => updateUDim2Property('Position', 'Y', 'Scale', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                    className="bg-[#1C1F26] border-gray-700 text-white text-xs rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Y Offset</Label>
                  <Input
                    type="number"
                    value={(isEditingKeyframe && keyframe ? keyframe.properties.Position?.Y?.Offset : element.properties.Position?.Y?.Offset) ?? ''}
                    onChange={(e) => updateUDim2Property('Position', 'Y', 'Offset', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                    className="bg-[#1C1F26] border-gray-700 text-white text-xs rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* UDim2 Size */}
            <div className="space-y-2">
              <Label className="text-gray-300">Size</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-400">Width Scale</Label>
                  <Input
                    type="number"
                    value={(isEditingKeyframe && keyframe ? keyframe.properties.Size?.X?.Scale : element.properties.Size?.X?.Scale) || 0}
                    onChange={(e) => updateUDim2Property('Size', 'X', 'Scale', parseFloat(e.target.value) || 0)}
                    className="bg-gray-700 border-gray-600 text-white text-xs"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Width Offset</Label>
                  <Input
                    type="number"
                    value={(isEditingKeyframe && keyframe ? keyframe.properties.Size?.X?.Offset : element.properties.Size?.X?.Offset) || 0}
                    onChange={(e) => updateUDim2Property('Size', 'X', 'Offset', parseFloat(e.target.value) || 0)}
                    className="bg-gray-700 border-gray-600 text-white text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Height Scale</Label>
                  <Input
                    type="number"
                    value={(isEditingKeyframe && keyframe ? keyframe.properties.Size?.Y?.Scale : element.properties.Size?.Y?.Scale) || 0}
                    onChange={(e) => updateUDim2Property('Size', 'Y', 'Scale', parseFloat(e.target.value) || 0)}
                    className="bg-gray-700 border-gray-600 text-white text-xs"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Height Offset</Label>
                  <Input
                    type="number"
                    value={(isEditingKeyframe && keyframe ? keyframe.properties.Size?.Y?.Offset : element.properties.Size?.Y?.Offset) || 0}
                    onChange={(e) => updateUDim2Property('Size', 'Y', 'Offset', parseFloat(e.target.value) || 0)}
                    className="bg-gray-700 border-gray-600 text-white text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Anchor Point */}
            <div className="space-y-2">
              <Label className="text-gray-300">Anchor Point</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-400">X</Label>
                  <Input
                    type="number"
                    value={(isEditingKeyframe && keyframe ? keyframe.properties.AnchorPoint?.X : element.properties.AnchorPoint?.X) ?? ''}
                    onChange={(e) => updateNestedProperty('AnchorPoint', 'X', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                    className="bg-[#1C1F26] border-gray-700 text-white text-xs rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Y</Label>
                  <Input
                    type="number"
                    value={(isEditingKeyframe && keyframe ? keyframe.properties.AnchorPoint?.Y : element.properties.AnchorPoint?.Y) ?? ''}
                    onChange={(e) => updateNestedProperty('AnchorPoint', 'Y', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                    className="bg-[#1C1F26] border-gray-700 text-white text-xs rounded-xl"
                  />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Appearance Properties */}
        <Collapsible
          open={sections.find(s => s.id === 'appearance')?.expanded}
          onOpenChange={() => toggleSection('appearance')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2 text-white hover:bg-gray-800">
              {sections.find(s => s.id === 'appearance')?.expanded ? 
                <ChevronDown className="w-4 h-4" /> : 
                <ChevronRight className="w-4 h-4" />
              }
              <Palette className="w-4 h-4" />
              Appearance
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-2">
            {/* Background Color */}
            <div className="space-y-2">
              <Label className="text-gray-300">Background Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={color3ToHex(isEditingKeyframe && keyframe ? keyframe.properties.BackgroundColor3 : element.properties.BackgroundColor3)}
                  onChange={(e) => updateProperty('BackgroundColor3', hexToColor3(e.target.value))}
                  className="w-12 h-8 p-1 bg-gray-700 border-gray-600"
                />
                <Input
                  type="text"
                  value={color3ToHex(isEditingKeyframe && keyframe ? keyframe.properties.BackgroundColor3 : element.properties.BackgroundColor3)}
                  onChange={(e) => updateProperty('BackgroundColor3', hexToColor3(e.target.value))}
                  className="flex-1 bg-gray-700 border-gray-600 text-white text-xs"
                  placeholder="#ffffff"
                />
              </div>
              <div className="flex gap-2">
                <select
                  onChange={(e) => {
                    if (!e.target.value) return
                    try {
                      const themes = JSON.parse(localStorage.getItem('zomex-color-themes') || '[]')
                      const theme = themes.find((t: any) => t.id === e.target.value)
                      if (!theme) return
                      
                      // Apply first color from theme
                      if (theme.colors && theme.colors.length > 0) {
                        updateProperty('BackgroundColor3', hexToColor3(theme.colors[0].hex))
                      }
                      
                      // Apply first gradient if exists
                      if (theme.gradients && theme.gradients.length > 0) {
                        const grad = theme.gradients[0]
                        updateProperty('UIGradient', {
                          Color: { 
                            Keypoints: grad.keypoints.map((kp: any) => ({ Time: kp.time, Value: hexToColor3(kp.hex) })) 
                          },
                          Rotation: grad.rotation,
                          Transparency: { 
                            Keypoints: grad.keypoints.map((kp: any) => ({ Time: kp.time, Value: 0 })) 
                          }
                        })
                      }
                      
                      // Reset select
                      e.target.value = ''
                    } catch (error) {
                      console.error('Failed to load theme:', error)
                    }
                  }}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-xs"
                  defaultValue=""
                >
                  <option value="">Select theme to import...</option>
                  {(() => {
                    try {
                      const themes = JSON.parse(localStorage.getItem('zomex-color-themes') || '[]')
                      return themes.map((theme: any) => (
                        <option key={theme.id} value={theme.id}>
                          {theme.name} ({theme.colors?.length || 0} colors, {theme.gradients?.length || 0} gradients)
                        </option>
                      ))
                    } catch {
                      return <option value="" disabled>No themes available</option>
                    }
                  })()}
                </select>
              </div>
            </div>

            {/* Background Transparency */}
            <div className="space-y-2">
              <Label className="text-gray-300">
                Background Transparency: {(((isEditingKeyframe && keyframe ? keyframe.properties.BackgroundTransparency : element.properties.BackgroundTransparency) || 0) * 100).toFixed(0)}%
              </Label>
              <Slider
                value={[((isEditingKeyframe && keyframe ? keyframe.properties.BackgroundTransparency : element.properties.BackgroundTransparency) || 0) * 100]}
                onValueChange={([value]) => updateProperty('BackgroundTransparency', value / 100)}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            {/* Gradient Editor */}
            <div className="space-y-2">
              <Label className="text-gray-300">Gradient</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-400">Enable Gradient</Label>
                  <Switch
                    checked={!!(isEditingKeyframe && keyframe ? keyframe.properties.UIGradient : element.properties.UIGradient)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateProperty('UIGradient', {
                          Color: { 
                            Keypoints: [
                              { Time: 0, Value: { R: 1, G: 1, B: 1 } }, 
                              { Time: 1, Value: { R: 0, G: 0, B: 0 } }
                            ] 
                          },
                          Rotation: 0,
                          Transparency: { 
                            Keypoints: [
                              { Time: 0, Value: 0 }, 
                              { Time: 1, Value: 0 }
                            ] 
                          }
                        })
                      } else {
                        updateProperty('UIGradient', null)
                      }
                    }}
                  />
                </div>
                {(isEditingKeyframe && keyframe ? keyframe.properties.UIGradient : element.properties.UIGradient) && (
                  <div className="mt-3">
                    <GradientEditor
                      gradient={isEditingKeyframe && keyframe ? keyframe.properties.UIGradient : element.properties.UIGradient}
                      onChange={(newGradient) => updateProperty('UIGradient', newGradient)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Border */}
            <div className="space-y-2">
              <Label className="text-gray-300">Border</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-400">Size (px)</Label>
                  <Input
                    type="number"
                    value={(isEditingKeyframe && keyframe ? keyframe.properties.BorderSizePixel : element.properties.BorderSizePixel) ?? ''}
                    onChange={(e) => updateProperty('BorderSizePixel', e.target.value === '' ? 0 : parseInt(e.target.value))}
                    className="bg-gray-700 border-gray-600 text-white text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Color</Label>
                  <Input
                    type="color"
                    value={color3ToHex(element.properties.BorderColor3)}
                    onChange={(e) => updateProperty('BorderColor3', hexToColor3(e.target.value))}
                    className="w-full h-8 p-1 bg-gray-700 border-gray-600"
                  />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Text Properties */}
        {isTextElement && (
          <Collapsible
            open={sections.find(s => s.id === 'text')?.expanded}
            onOpenChange={() => toggleSection('text')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 text-white hover:bg-gray-800">
                {sections.find(s => s.id === 'text')?.expanded ? 
                  <ChevronDown className="w-4 h-4" /> : 
                  <ChevronRight className="w-4 h-4" />
                }
                <Type className="w-4 h-4" />
                Text
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-2">
              {/* Text Content */}
              <div className="space-y-2">
                <Label className="text-gray-300">Text</Label>
                <Input
                  type="text"
                  value={element.properties.Text || ''}
                  onChange={(e) => updateProperty('Text', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Enter text..."
                />
              </div>

              {/* Text Color */}
              <div className="space-y-2">
                <Label className="text-gray-300">Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={color3ToHex(element.properties.TextColor3)}
                    onChange={(e) => updateProperty('TextColor3', hexToColor3(e.target.value))}
                    className="w-12 h-8 p-1 bg-gray-700 border-gray-600"
                  />
                  <Input
                    type="text"
                    value={color3ToHex(element.properties.TextColor3)}
                    onChange={(e) => updateProperty('TextColor3', hexToColor3(e.target.value))}
                    className="flex-1 bg-gray-700 border-gray-600 text-white text-xs"
                    placeholder="#000000"
                  />
                </div>
              </div>

              {/* Text Size */}
              <div className="space-y-2">
                <Label className="text-gray-300">Text Size</Label>
                <Input
                  type="number"
                  value={(isEditingKeyframe && keyframe ? keyframe.properties.TextSize : element.properties.TextSize) || ''}
                  onChange={(e) => updateProperty('TextSize', parseInt(e.target.value) || 14)}
                  className="bg-gray-700 border-gray-600 text-white"
                  min="1"
                  max="100"
                  placeholder=""
                />
              </div>

              {/* Text Transparency */}
              <div className="space-y-2">
                <Label className="text-gray-300">
                  Text Transparency: {(((isEditingKeyframe && keyframe ? keyframe.properties.TextTransparency : element.properties.TextTransparency) || 0) * 100).toFixed(0)}%
                </Label>
                <Slider
                  value={[((isEditingKeyframe && keyframe ? keyframe.properties.TextTransparency : element.properties.TextTransparency) || 0) * 100]}
                  onValueChange={([value]) => updateProperty('TextTransparency', value / 100)}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Font */}
              <div className="space-y-2">
                <Label className="text-gray-300">Font</Label>
                <FontDropdown
                  value={(isEditingKeyframe && keyframe ? keyframe.properties.Font : element.properties.Font) || 'SourceSans'}
                  onChange={(value) => updateProperty('Font', value)}
                />
              </div>

              {/* Text Alignment */}
              <div className="space-y-2">
                <Label className="text-gray-300">Text Alignment</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-400">Horizontal</Label>
                    <select
                      value={element.properties.TextXAlignment || 'Center'}
                      onChange={(e) => updateProperty('TextXAlignment', e.target.value)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-xs"
                    >
                      <option value="Left">Left</option>
                      <option value="Center">Center</option>
                      <option value="Right">Right</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Vertical</Label>
                    <select
                      value={element.properties.TextYAlignment || 'Center'}
                      onChange={(e) => updateProperty('TextYAlignment', e.target.value)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-xs"
                    >
                      <option value="Top">Top</option>
                      <option value="Center">Center</option>
                      <option value="Bottom">Bottom</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Text Scaled */}
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Text Scaled</Label>
                <Switch
                  checked={element.properties.TextScaled || false}
                  onCheckedChange={(checked) => updateProperty('TextScaled', checked)}
                />
              </div>

              {/* Text Wrapped */}
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Text Wrapped</Label>
                <Switch
                  checked={element.properties.TextWrapped || false}
                  onCheckedChange={(checked) => {
                    // If enabling TextWrapped, disable TextTruncate
                    if (checked && element.properties.TextTruncate && element.properties.TextTruncate !== 'None') {
                      updateProperty('TextTruncate', 'None')
                    }
                    updateProperty('TextWrapped', checked)
                  }}
                />
              </div>

              {/* Text Truncate */}
              <div className="space-y-2">
                <Label className="text-gray-300">Text Truncate</Label>
                <select
                  value={element.properties.TextTruncate || 'None'}
                  onChange={(e) => {
                    const newValue = e.target.value
                    // If enabling TextTruncate (not None), disable TextWrapped
                    if (newValue !== 'None' && element.properties.TextWrapped) {
                      updateProperty('TextWrapped', false)
                    }
                    updateProperty('TextTruncate', newValue)
                  }}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                >
                  <option value="None">None</option>
                  <option value="AtEnd">At End (…)</option>
                  <option value="AtMiddle">At Middle (…)</option>
                  <option value="AtStart">At Start (…)</option>
                  <option value="SplitWord">Split Word</option>
                </select>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Image Properties */}
        {isImageElement && (
          <Collapsible
            open={sections.find(s => s.id === 'image')?.expanded}
            onOpenChange={() => toggleSection('image')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 text-white hover:bg-gray-800">
                {sections.find(s => s.id === 'image')?.expanded ? 
                  <ChevronDown className="w-4 h-4" /> : 
                  <ChevronRight className="w-4 h-4" />
                }
                <Image className="w-4 h-4" />
                Image
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-2">
              {/* Image Source */}
              <div className="space-y-2">
                <Label className="text-gray-300">Image ID</Label>
                <Input
                  type="text"
                  value={element.properties.Image || ''}
                  onChange={(e) => updateProperty('Image', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="rbxassetid://123456789"
                />
              </div>

              {/* Image Color */}
              <div className="space-y-2">
                <Label className="text-gray-300">Image Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={color3ToHex(element.properties.ImageColor3)}
                    onChange={(e) => updateProperty('ImageColor3', hexToColor3(e.target.value))}
                    className="w-12 h-8 p-1 bg-gray-700 border-gray-600"
                  />
                  <Input
                    type="text"
                    value={color3ToHex(element.properties.ImageColor3)}
                    onChange={(e) => updateProperty('ImageColor3', hexToColor3(e.target.value))}
                    className="flex-1 bg-gray-700 border-gray-600 text-white text-xs"
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              {/* Image Transparency */}
              <div className="space-y-2">
                <Label className="text-gray-300">
                  Image Transparency: {((element.properties.ImageTransparency || 0) * 100).toFixed(0)}%
                </Label>
                <Slider
                  value={[(element.properties.ImageTransparency || 0) * 100]}
                  onValueChange={([value]) => updateProperty('ImageTransparency', value / 100)}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Scale Type */}
              <div className="space-y-2">
                <Label className="text-gray-300">Scale Type</Label>
                <select
                  value={element.properties.ScaleType || 'Stretch'}
                  onChange={(e) => updateProperty('ScaleType', e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                >
                  <option value="Stretch">Stretch</option>
                  <option value="Slice">Slice</option>
                  <option value="Tile">Tile</option>
                  <option value="Fit">Fit</option>
                  <option value="Crop">Crop</option>
                </select>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Layout Properties */}
        <Collapsible
          open={sections.find(s => s.id === 'layout')?.expanded}
          onOpenChange={() => toggleSection('layout')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2 text-white hover:bg-gray-800">
              {sections.find(s => s.id === 'layout')?.expanded ? 
                <ChevronDown className="w-4 h-4" /> : 
                <ChevronRight className="w-4 h-4" />
              }
              <Layout className="w-4 h-4" />
              Layout
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-2">
            {/* Visible */}
            <div className="flex items-center justify-between">
              <Label className="text-gray-300">Visible</Label>
              <Switch
                checked={element.properties.Visible !== false}
                onCheckedChange={(checked) => updateProperty('Visible', checked)}
              />
            </div>

            {/* ZIndex */}
            <div className="space-y-2">
              <Label className="text-gray-300">Z-Index</Label>
              <Input
                type="number"
                value={(isEditingKeyframe && keyframe ? keyframe.properties.ZIndex : element.properties.ZIndex) || ''}
                onChange={(e) => updateProperty('ZIndex', parseInt(e.target.value) || 1)}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Z-Index"
              />
            </div>

            {/* Parent */}
            <div className="space-y-2">
              <Label className="text-gray-300">Parent</Label>
              <select
                value={element.parent || 'script.Parent'}
                onChange={(e) => {
                  if (selectedElement) {
                    onUpdateElementDirect(selectedElement, { parent: e.target.value })
                  }
                }}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              >
                <option value="script.Parent">script.Parent</option>
                {elements.filter(el => el.id !== selectedElement).map(el => (
                  <option key={el.id} value={el.id}>{el.name}</option>
                ))}
              </select>
            </div>

            {/* Clips Descendants */}
            <div className="flex items-center justify-between">
              <Label className="text-gray-300">Clips Descendants</Label>
              <Switch
                checked={element.properties.ClipsDescendants || false}
                onCheckedChange={(checked) => updateProperty('ClipsDescendants', checked)}
              />
            </div>

            {/* UIListLayout */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">UIListLayout</Label>
                <Switch
                  checked={!!(isEditingKeyframe && keyframe ? keyframe.properties.UIListLayout : element.properties.UIListLayout)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      // Disable UIGridLayout if enabled
                      if (isEditingKeyframe && keyframe ? keyframe.properties.UIGridLayout : element.properties.UIGridLayout) {
                        updateProperty('UIGridLayout', null)
                      }
                      updateProperty('UIListLayout', {
                        FillDirection: 'Vertical',
                        SortOrder: 'LayoutOrder',
                        HorizontalAlignment: 'Center',
                        VerticalAlignment: 'Top',
                        Padding: { Scale: 0, Offset: 0 },
                        Wraps: false
                      })
                    } else {
                      updateProperty('UIListLayout', null)
                    }
                  }}
                />
              </div>
              
              {(isEditingKeyframe && keyframe ? keyframe.properties.UIListLayout : element.properties.UIListLayout) && (
                <div className="space-y-3 pl-4 border-l-2 border-gray-600">
                  {/* Fill Direction */}
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-400">Fill Direction</Label>
                    <select
                      value={(isEditingKeyframe && keyframe ? keyframe.properties.UIListLayout?.FillDirection : element.properties.UIListLayout?.FillDirection) || 'Vertical'}
                      onChange={(e) => updateNestedProperty('UIListLayout', 'FillDirection', e.target.value)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-xs"
                    >
                      <option value="Horizontal">Horizontal</option>
                      <option value="Vertical">Vertical</option>
                    </select>
                  </div>

                  {/* Sort Order */}
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-400">Sort Order</Label>
                    <select
                      value={(isEditingKeyframe && keyframe ? keyframe.properties.UIListLayout?.SortOrder : element.properties.UIListLayout?.SortOrder) || 'LayoutOrder'}
                      onChange={(e) => updateNestedProperty('UIListLayout', 'SortOrder', e.target.value)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-xs"
                    >
                      <option value="LayoutOrder">Layout Order</option>
                      <option value="Name">Name</option>
                    </select>
                  </div>

                  {/* Horizontal Alignment */}
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-400">Horizontal Alignment</Label>
                    <select
                      value={(isEditingKeyframe && keyframe ? keyframe.properties.UIListLayout?.HorizontalAlignment : element.properties.UIListLayout?.HorizontalAlignment) || 'Center'}
                      onChange={(e) => updateNestedProperty('UIListLayout', 'HorizontalAlignment', e.target.value)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-xs"
                    >
                      <option value="Left">Left</option>
                      <option value="Center">Center</option>
                      <option value="Right">Right</option>
                    </select>
                  </div>

                  {/* Vertical Alignment */}
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-400">Vertical Alignment</Label>
                    <select
                      value={(isEditingKeyframe && keyframe ? keyframe.properties.UIListLayout?.VerticalAlignment : element.properties.UIListLayout?.VerticalAlignment) || 'Top'}
                      onChange={(e) => updateNestedProperty('UIListLayout', 'VerticalAlignment', e.target.value)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-xs"
                    >
                      <option value="Top">Top</option>
                      <option value="Center">Center</option>
                      <option value="Bottom">Bottom</option>
                    </select>
                  </div>

                  {/* Padding */}
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-400">Padding</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-gray-500">Scale</Label>
                        <Input
                          type="number"
                          value={(isEditingKeyframe && keyframe ? keyframe.properties.UIListLayout?.Padding?.Scale : element.properties.UIListLayout?.Padding?.Scale) || 0}
                          onChange={(e) => {
                            const currentPadding = (isEditingKeyframe && keyframe ? keyframe.properties.UIListLayout?.Padding : element.properties.UIListLayout?.Padding) || { Scale: 0, Offset: 0 }
                            updateNestedProperty('UIListLayout', 'Padding', {
                              ...currentPadding,
                              Scale: parseFloat(e.target.value) || 0
                            })
                          }}
                          className="bg-gray-700 border-gray-600 text-white text-xs"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Offset</Label>
                        <Input
                          type="number"
                          value={(isEditingKeyframe && keyframe ? keyframe.properties.UIListLayout?.Padding?.Offset : element.properties.UIListLayout?.Padding?.Offset) || 0}
                          onChange={(e) => {
                            const currentPadding = (isEditingKeyframe && keyframe ? keyframe.properties.UIListLayout?.Padding : element.properties.UIListLayout?.Padding) || { Scale: 0, Offset: 0 }
                            updateNestedProperty('UIListLayout', 'Padding', {
                              ...currentPadding,
                              Offset: parseInt(e.target.value) || 0
                            })
                          }}
                          className="bg-gray-700 border-gray-600 text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Wraps */}
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-gray-400">Wraps</Label>
                    <Switch
                      checked={(isEditingKeyframe && keyframe ? keyframe.properties.UIListLayout?.Wraps : element.properties.UIListLayout?.Wraps) || false}
                      onCheckedChange={(checked) => updateNestedProperty('UIListLayout', 'Wraps', checked)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* UIGridLayout */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">UIGridLayout</Label>
                <Switch
                  checked={!!(isEditingKeyframe && keyframe ? keyframe.properties.UIGridLayout : element.properties.UIGridLayout)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      // Disable UIListLayout if enabled
                      if (isEditingKeyframe && keyframe ? keyframe.properties.UIListLayout : element.properties.UIListLayout) {
                        updateProperty('UIListLayout', null)
                      }
                      updateProperty('UIGridLayout', {
                        FillDirection: 'Horizontal',
                        SortOrder: 'LayoutOrder',
                        HorizontalAlignment: 'Left',
                        VerticalAlignment: 'Top',
                        CellPadding: { X: { Scale: 0, Offset: 0 }, Y: { Scale: 0, Offset: 0 } },
                        CellSize: { X: { Scale: 0, Offset: 100 }, Y: { Scale: 0, Offset: 100 } },
                        StartCorner: 'TopLeft'
                      })
                    } else {
                      updateProperty('UIGridLayout', null)
                    }
                  }}
                />
              </div>
              
              {(isEditingKeyframe && keyframe ? keyframe.properties.UIGridLayout : element.properties.UIGridLayout) && (
                <div className="space-y-3 pl-4 border-l-2 border-gray-600">
                  {/* Fill Direction */}
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-400">Fill Direction</Label>
                    <select
                      value={(isEditingKeyframe && keyframe ? keyframe.properties.UIGridLayout?.FillDirection : element.properties.UIGridLayout?.FillDirection) || 'Horizontal'}
                      onChange={(e) => updateNestedProperty('UIGridLayout', 'FillDirection', e.target.value)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-xs"
                    >
                      <option value="Horizontal">Horizontal</option>
                      <option value="Vertical">Vertical</option>
                    </select>
                  </div>

                  {/* Sort Order */}
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-400">Sort Order</Label>
                    <select
                      value={(isEditingKeyframe && keyframe ? keyframe.properties.UIGridLayout?.SortOrder : element.properties.UIGridLayout?.SortOrder) || 'LayoutOrder'}
                      onChange={(e) => updateNestedProperty('UIGridLayout', 'SortOrder', e.target.value)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-xs"
                    >
                      <option value="LayoutOrder">Layout Order</option>
                      <option value="Name">Name</option>
                    </select>
                  </div>

                  {/* Horizontal Alignment */}
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-400">Horizontal Alignment</Label>
                    <select
                      value={(isEditingKeyframe && keyframe ? keyframe.properties.UIGridLayout?.HorizontalAlignment : element.properties.UIGridLayout?.HorizontalAlignment) || 'Left'}
                      onChange={(e) => updateNestedProperty('UIGridLayout', 'HorizontalAlignment', e.target.value)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-xs"
                    >
                      <option value="Left">Left</option>
                      <option value="Center">Center</option>
                      <option value="Right">Right</option>
                    </select>
                  </div>

                  {/* Vertical Alignment */}
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-400">Vertical Alignment</Label>
                    <select
                      value={(isEditingKeyframe && keyframe ? keyframe.properties.UIGridLayout?.VerticalAlignment : element.properties.UIGridLayout?.VerticalAlignment) || 'Top'}
                      onChange={(e) => updateNestedProperty('UIGridLayout', 'VerticalAlignment', e.target.value)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-xs"
                    >
                      <option value="Top">Top</option>
                      <option value="Center">Center</option>
                      <option value="Bottom">Bottom</option>
                    </select>
                  </div>

                  {/* Cell Padding */}
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-400">Cell Padding</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-gray-500">X Scale</Label>
                        <Input
                          type="number"
                          value={(isEditingKeyframe && keyframe ? keyframe.properties.UIGridLayout?.CellPadding?.X?.Scale : element.properties.UIGridLayout?.CellPadding?.X?.Scale) || 0}
                          onChange={(e) => {
                            const currentPadding = (isEditingKeyframe && keyframe ? keyframe.properties.UIGridLayout?.CellPadding : element.properties.UIGridLayout?.CellPadding) || { X: { Scale: 0, Offset: 0 }, Y: { Scale: 0, Offset: 0 } }
                            updateNestedProperty('UIGridLayout', 'CellPadding', {
                              ...currentPadding,
                              X: {
                                ...currentPadding.X,
                                Scale: parseFloat(e.target.value) || 0
                              }
                            })
                          }}
                          className="bg-gray-700 border-gray-600 text-white text-xs"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">X Offset</Label>
                        <Input
                          type="number"
                          value={(isEditingKeyframe && keyframe ? keyframe.properties.UIGridLayout?.CellPadding?.X?.Offset : element.properties.UIGridLayout?.CellPadding?.X?.Offset) || 0}
                          onChange={(e) => {
                            const currentPadding = (isEditingKeyframe && keyframe ? keyframe.properties.UIGridLayout?.CellPadding : element.properties.UIGridLayout?.CellPadding) || { X: { Scale: 0, Offset: 0 }, Y: { Scale: 0, Offset: 0 } }
                            updateNestedProperty('UIGridLayout', 'CellPadding', {
                              ...currentPadding,
                              X: {
                                ...currentPadding.X,
                                Offset: parseInt(e.target.value) || 0
                              }
                            })
                          }}
                          className="bg-gray-700 border-gray-600 text-white text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Y Scale</Label>
                        <Input
                          type="number"
                          value={(isEditingKeyframe && keyframe ? keyframe.properties.UIGridLayout?.CellPadding?.Y?.Scale : element.properties.UIGridLayout?.CellPadding?.Y?.Scale) || 0}
                          onChange={(e) => {
                            const currentPadding = (isEditingKeyframe && keyframe ? keyframe.properties.UIGridLayout?.CellPadding : element.properties.UIGridLayout?.CellPadding) || { X: { Scale: 0, Offset: 0 }, Y: { Scale: 0, Offset: 0 } }
                            updateNestedProperty('UIGridLayout', 'CellPadding', {
                              ...currentPadding,
                              Y: {
                                ...currentPadding.Y,
                                Scale: parseFloat(e.target.value) || 0
                              }
                            })
                          }}
                          className="bg-gray-700 border-gray-600 text-white text-xs"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Y Offset</Label>
                        <Input
                          type="number"
                          value={(isEditingKeyframe && keyframe ? keyframe.properties.UIGridLayout?.CellPadding?.Y?.Offset : element.properties.UIGridLayout?.CellPadding?.Y?.Offset) || 0}
                          onChange={(e) => {
                            const currentPadding = (isEditingKeyframe && keyframe ? keyframe.properties.UIGridLayout?.CellPadding : element.properties.UIGridLayout?.CellPadding) || { X: { Scale: 0, Offset: 0 }, Y: { Scale: 0, Offset: 0 } }
                            updateNestedProperty('UIGridLayout', 'CellPadding', {
                              ...currentPadding,
                              Y: {
                                ...currentPadding.Y,
                                Offset: parseInt(e.target.value) || 0
                              }
                            })
                          }}
                          className="bg-gray-700 border-gray-600 text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cell Size */}
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-400">Cell Size</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-gray-500">Width Scale</Label>
                        <Input
                          type="number"
                          value={(isEditingKeyframe && keyframe ? keyframe.properties.UIGridLayout?.CellSize?.X?.Scale : element.properties.UIGridLayout?.CellSize?.X?.Scale) || 0}
                          onChange={(e) => {
                            const currentSize = (isEditingKeyframe && keyframe ? keyframe.properties.UIGridLayout?.CellSize : element.properties.UIGridLayout?.CellSize) || { X: { Scale: 0, Offset: 100 }, Y: { Scale: 0, Offset: 100 } }
                            updateNestedProperty('UIGridLayout', 'CellSize', {
                              ...currentSize,
                              X: {
                                ...currentSize.X,
                                Scale: parseFloat(e.target.value) || 0
                              }
                            })
                          }}
                          className="bg-gray-700 border-gray-600 text-white text-xs"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Width Offset</Label>
                        <Input
                          type="number"
                          value={(isEditingKeyframe && keyframe ? keyframe.properties.UIGridLayout?.CellSize?.X?.Offset : element.properties.UIGridLayout?.CellSize?.X?.Offset) || 100}
                          onChange={(e) => {
                            const currentSize = (isEditingKeyframe && keyframe ? keyframe.properties.UIGridLayout?.CellSize : element.properties.UIGridLayout?.CellSize) || { X: { Scale: 0, Offset: 100 }, Y: { Scale: 0, Offset: 100 } }
                            updateNestedProperty('UIGridLayout', 'CellSize', {
                              ...currentSize,
                              X: {
                                ...currentSize.X,
                                Offset: parseInt(e.target.value) || 100
                              }
                            })
                          }}
                          className="bg-gray-700 border-gray-600 text-white text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Height Scale</Label>
                        <Input
                          type="number"
                          value={(isEditingKeyframe && keyframe ? keyframe.properties.UIGridLayout?.CellSize?.Y?.Scale : element.properties.UIGridLayout?.CellSize?.Y?.Scale) || 0}
                          onChange={(e) => {
                            const currentSize = (isEditingKeyframe && keyframe ? keyframe.properties.UIGridLayout?.CellSize : element.properties.UIGridLayout?.CellSize) || { X: { Scale: 0, Offset: 100 }, Y: { Scale: 0, Offset: 100 } }
                            updateNestedProperty('UIGridLayout', 'CellSize', {
                              ...currentSize,
                              Y: {
                                ...currentSize.Y,
                                Scale: parseFloat(e.target.value) || 0
                              }
                            })
                          }}
                          className="bg-gray-700 border-gray-600 text-white text-xs"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Height Offset</Label>
                        <Input
                          type="number"
                          value={(isEditingKeyframe && keyframe ? keyframe.properties.UIGridLayout?.CellSize?.Y?.Offset : element.properties.UIGridLayout?.CellSize?.Y?.Offset) || 100}
                          onChange={(e) => {
                            const currentSize = (isEditingKeyframe && keyframe ? keyframe.properties.UIGridLayout?.CellSize : element.properties.UIGridLayout?.CellSize) || { X: { Scale: 0, Offset: 100 }, Y: { Scale: 0, Offset: 100 } }
                            updateNestedProperty('UIGridLayout', 'CellSize', {
                              ...currentSize,
                              Y: {
                                ...currentSize.Y,
                                Offset: parseInt(e.target.value) || 100
                              }
                            })
                          }}
                          className="bg-gray-700 border-gray-600 text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Start Corner */}
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-400">Start Corner</Label>
                    <select
                      value={(isEditingKeyframe && keyframe ? keyframe.properties.UIGridLayout?.StartCorner : element.properties.UIGridLayout?.StartCorner) || 'TopLeft'}
                      onChange={(e) => updateNestedProperty('UIGridLayout', 'StartCorner', e.target.value)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-xs"
                    >
                      <option value="TopLeft">Top Left</option>
                      <option value="TopRight">Top Right</option>
                      <option value="BottomLeft">Bottom Left</option>
                      <option value="BottomRight">Bottom Right</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Scrolling Frame Properties */}
            {isScrollingFrame && (
              <>
                <div className="space-y-2">
                  <Label className="text-gray-300">Canvas Size</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-gray-400">Width Scale</Label>
                      <Input
                        type="number"
                        value={element.properties.CanvasSize?.X?.Scale || 0}
                        onChange={(e) => updateUDim2Property('CanvasSize', 'X', 'Scale', parseFloat(e.target.value) || 0)}
                        className="bg-gray-700 border-gray-600 text-white text-xs"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-400">Height Scale</Label>
                      <Input
                        type="number"
                        value={element.properties.CanvasSize?.Y?.Scale || 0}
                        onChange={(e) => updateUDim2Property('CanvasSize', 'Y', 'Scale', parseFloat(e.target.value) || 0)}
                        className="bg-gray-700 border-gray-600 text-white text-xs"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Scrollbar Thickness</Label>
                  <Input
                    type="number"
                    value={element.properties.ScrollBarThickness || 12}
                    onChange={(e) => updateProperty('ScrollBarThickness', parseInt(e.target.value) || 12)}
                    className="bg-gray-700 border-gray-600 text-white"
                    min="0"
                    max="50"
                  />
                </div>
              </>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Effects Properties */}
        <Collapsible
          open={sections.find(s => s.id === 'effects')?.expanded}
          onOpenChange={() => toggleSection('effects')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2 text-white hover:bg-gray-800">
              {sections.find(s => s.id === 'effects')?.expanded ? 
                <ChevronDown className="w-4 h-4" /> : 
                <ChevronRight className="w-4 h-4" />
              }
              <Zap className="w-4 h-4" />
              Effects
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-2">
            {/* UI Corner */}
            <div className="space-y-2">
              <Label className="text-gray-300">Corner Radius</Label>
              <Input
                type="number"
                value={(isEditingKeyframe && keyframe ? keyframe.properties.UICorner?.CornerRadius?.Offset : element.properties.UICorner?.CornerRadius?.Offset) || ''}
                onChange={(e) => updateProperty('UICorner', {
                  CornerRadius: { Scale: 0, Offset: parseInt(e.target.value) || 0 }
                })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            {/* UI Stroke */}
            <div className="space-y-2">
              <Label className="text-gray-300">Stroke</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-400">Thickness</Label>
                  <Input
                    type="number"
                    value={(isEditingKeyframe && keyframe ? keyframe.properties.UIStroke?.Thickness : element.properties.UIStroke?.Thickness) ?? ''}
                    onChange={(e) => {
                      const currentStroke = (isEditingKeyframe && keyframe ? keyframe.properties.UIStroke : element.properties.UIStroke) || {}
                      updateProperty('UIStroke', {
                        ...currentStroke,
                        Thickness: e.target.value === '' ? 0 : parseFloat(e.target.value)
                      })
                    }}
                    className="bg-gray-700 border-gray-600 text-white text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Color</Label>
                  <Input
                    type="color"
                    value={color3ToHex(element.properties.UIStroke?.Color)}
                    onChange={(e) => {
                      const currentStroke = (isEditingKeyframe && keyframe ? keyframe.properties.UIStroke : element.properties.UIStroke) || {}
                      updateProperty('UIStroke', {
                        ...currentStroke,
                        Color: hexToColor3(e.target.value)
                      })
                    }}
                    className="w-full h-8 p-1 bg-gray-700 border-gray-600"
                  />
                </div>
              </div>

              {/* Stroke Transparency */}
              <div className="space-y-2">
                <Label className="text-gray-300">
                  Stroke Transparency: {(((isEditingKeyframe && keyframe ? keyframe.properties.UIStroke?.Transparency : element.properties.UIStroke?.Transparency) || 0) * 100).toFixed(0)}%
                </Label>
                <Slider
                  value={[((isEditingKeyframe && keyframe ? keyframe.properties.UIStroke?.Transparency : element.properties.UIStroke?.Transparency) || 0) * 100]}
                  onValueChange={([value]) => {
                    const currentStroke = (isEditingKeyframe && keyframe ? keyframe.properties.UIStroke : element.properties.UIStroke) || {}
                    updateProperty('UIStroke', {
                      ...currentStroke,
                      Transparency: value / 100
                    })
                  }}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Stroke Sizing Mode */}
              <div className="space-y-2">
                <Label className="text-gray-300">Sizing Mode</Label>
                <select
                  value={(isEditingKeyframe && keyframe ? keyframe.properties.UIStroke?.StrokeSizingMode : element.properties.UIStroke?.StrokeSizingMode) || 'FixedSize'}
                  onChange={(e) => {
                    const currentStroke = (isEditingKeyframe && keyframe ? keyframe.properties.UIStroke : element.properties.UIStroke) || {}
                    updateProperty('UIStroke', {
                      ...currentStroke,
                      StrokeSizingMode: e.target.value as 'FixedSize' | 'ScaledSize'
                    })
                  }}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                >
                  <option value="FixedSize">Fixed Size (Pixels)</option>
                  <option value="ScaledSize">Scaled Size (% of parent)</option>
                </select>
                <p className="text-xs text-gray-400">
                  FixedSize: Thickness in pixels | ScaledSize: Thickness as % of parent's shortest side
                </p>
              </div>

              {/* Border Offset */}
              <div className="space-y-2">
                <Label className="text-gray-300">Border Offset</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-400">Scale</Label>
                    <Input
                      type="number"
                      value={(isEditingKeyframe && keyframe ? keyframe.properties.UIStroke?.BorderOffset?.Scale : element.properties.UIStroke?.BorderOffset?.Scale) || 0}
                      onChange={(e) => {
                        const currentStroke = (isEditingKeyframe && keyframe ? keyframe.properties.UIStroke : element.properties.UIStroke) || {}
                        const currentOffset = currentStroke.BorderOffset || { Scale: 0, Offset: 0 }
                        updateProperty('UIStroke', {
                          ...currentStroke,
                          BorderOffset: {
                            ...currentOffset,
                            Scale: parseFloat(e.target.value) || 0
                          }
                        })
                      }}
                      className="bg-gray-700 border-gray-600 text-white text-xs"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Offset (px)</Label>
                    <Input
                      type="number"
                      value={(isEditingKeyframe && keyframe ? keyframe.properties.UIStroke?.BorderOffset?.Offset : element.properties.UIStroke?.BorderOffset?.Offset) || 0}
                      onChange={(e) => {
                        const currentStroke = (isEditingKeyframe && keyframe ? keyframe.properties.UIStroke : element.properties.UIStroke) || {}
                        const currentOffset = currentStroke.BorderOffset || { Scale: 0, Offset: 0 }
                        updateProperty('UIStroke', {
                          ...currentStroke,
                          BorderOffset: {
                            ...currentOffset,
                            Offset: parseInt(e.target.value) || 0
                          }
                        })
                      }}
                      className="bg-gray-700 border-gray-600 text-white text-xs"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  Offset the stroke position (inward/outward from border)
                </p>
              </div>

              {/* Stroke Gradient */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-400">Enable Stroke Gradient</Label>
                  <Switch
                    checked={!!(isEditingKeyframe && keyframe ? keyframe.properties.UIStroke?.UIGradient : element.properties.UIStroke?.UIGradient)}
                    onCheckedChange={(checked) => {
                      const currentStroke = (isEditingKeyframe && keyframe ? keyframe.properties.UIStroke : element.properties.UIStroke) || {}
                      
                      if (checked) {
                        updateProperty('UIStroke', {
                          ...currentStroke,
                          UIGradient: {
                            Color: { 
                              Keypoints: [
                                { Time: 0, Value: currentStroke.Color || { R: 1, G: 1, B: 1 } }, 
                                { Time: 1, Value: { R: 0, G: 0, B: 0 } }
                              ] 
                            },
                            Rotation: 0,
                            Transparency: { 
                              Keypoints: [
                                { Time: 0, Value: 0 }, 
                                { Time: 1, Value: 0 }
                              ] 
                            }
                          }
                        })
                      } else {
                        const { UIGradient, ...strokeWithoutGradient } = currentStroke
                        updateProperty('UIStroke', strokeWithoutGradient)
                      }
                    }}
                  />
                </div>
                {(isEditingKeyframe && keyframe ? keyframe.properties.UIStroke?.UIGradient : element.properties.UIStroke?.UIGradient) && (() => {
                  const strokeGradient = (isEditingKeyframe && keyframe ? keyframe.properties.UIStroke?.UIGradient : element.properties.UIStroke?.UIGradient)
                  if (!strokeGradient) return null
                  
                  return (
                    <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-orange-400 rounded-full" />
                        <Label className="text-xs text-orange-300">Stroke Gradient</Label>
                      </div>
                      <GradientEditor
                        gradient={strokeGradient}
                        onChange={(newGradient) => {
                          const currentStroke = (isEditingKeyframe && keyframe ? keyframe.properties.UIStroke : element.properties.UIStroke) || {}
                          updateProperty('UIStroke', {
                            ...currentStroke,
                            UIGradient: newGradient
                          })
                        }}
                      />
                    </div>
                  )
                })()}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </motion.div>
    </ScrollArea>
  )
}

export default Properties