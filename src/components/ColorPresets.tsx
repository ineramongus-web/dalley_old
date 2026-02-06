'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Palette, Plus, Trash2, Check } from 'lucide-react'
import type { UIElement } from '@/types/roblox'

interface ColorPreset {
  id: string
  name: string
  backgroundColor?: { R: number; G: number; B: number }
  textColor?: { R: number; G: number; B: number }
  strokeColor?: { R: number; G: number; B: number }
  gradient?: any
  timestamp: number
}

interface ColorPresetsProps {
  selectedElement: string | null
  elements: UIElement[]
  onUpdateElement: (id: string, properties: Partial<UIElement['properties']>) => void
}

export function ColorPresets({ selectedElement, elements, onUpdateElement }: ColorPresetsProps): JSX.Element {
  const [presets, setPresets] = useState<ColorPreset[]>([])
  const [open, setOpen] = useState<boolean>(false)
  const [newPresetName, setNewPresetName] = useState<string>('')
  const [showAddForm, setShowAddForm] = useState<boolean>(false)

  const element = elements.find(el => el.id === selectedElement)

  // Load presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('zomex-color-presets')
    if (saved) {
      try {
        setPresets(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to load color presets:', error)
      }
    }
  }, [])

  // Save presets to localStorage
  useEffect(() => {
    localStorage.setItem('zomex-color-presets', JSON.stringify(presets))
  }, [presets])

  const color3ToHex = (color: any): string => {
    if (!color) return '#ffffff'
    const r = Math.round((color.R || 0) * 255)
    const g = Math.round((color.G || 0) * 255)
    const b = Math.round((color.B || 0) * 255)
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  const hexToColor3 = (hex: string): { R: number; G: number; B: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      R: parseInt(result[1], 16) / 255,
      G: parseInt(result[2], 16) / 255,
      B: parseInt(result[3], 16) / 255
    } : { R: 1, G: 1, B: 1 }
  }

  const saveCurrentAsPreset = (): void => {
    if (!element || !newPresetName.trim()) return

    const newPreset: ColorPreset = {
      id: `preset_${Date.now()}`,
      name: newPresetName.trim(),
      backgroundColor: element.properties.BackgroundColor3,
      textColor: element.properties.TextColor3,
      strokeColor: element.properties.UIStroke?.Color,
      gradient: element.properties.UIGradient,
      timestamp: Date.now()
    }

    setPresets([newPreset, ...presets])
    setNewPresetName('')
    setShowAddForm(false)
  }

  const applyPreset = (preset: ColorPreset): void => {
    if (!selectedElement) return

    const updates: Partial<UIElement['properties']> = {}

    if (preset.backgroundColor) {
      updates.BackgroundColor3 = preset.backgroundColor
    }

    if (preset.textColor) {
      updates.TextColor3 = preset.textColor
    }

    if (preset.strokeColor && element?.properties.UIStroke) {
      updates.UIStroke = {
        ...element.properties.UIStroke,
        Color: preset.strokeColor
      }
    }

    if (preset.gradient) {
      updates.UIGradient = preset.gradient
    }

    onUpdateElement(selectedElement, updates)
    setOpen(false)
  }

  const deletePreset = (id: string): void => {
    setPresets(presets.filter(p => p.id !== id))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-gray-800 bg-black/50 backdrop-blur-sm px-2 py-1"
          title="Color Presets"
        >
          <Palette className="w-3 h-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-gray-900 border-gray-700">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-white">Color Presets</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
              className="h-8 w-8 p-0"
              disabled={!element}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Add New Preset Form */}
          <AnimatePresence>
            {showAddForm && element && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 p-3 bg-gray-800 rounded-lg border border-gray-600"
              >
                <Label className="text-gray-300">Save Current Colors</Label>
                <div className="flex gap-2">
                  <Input
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="Preset name..."
                    className="bg-gray-700 border-gray-600 text-white text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveCurrentAsPreset()
                      if (e.key === 'Escape') setShowAddForm(false)
                    }}
                    autoFocus
                  />
                  <Button
                    onClick={saveCurrentAsPreset}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    disabled={!newPresetName.trim()}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {element.properties.BackgroundColor3 && (
                    <div className="flex items-center gap-1">
                      <div
                        className="w-4 h-4 rounded border border-gray-600"
                        style={{ backgroundColor: color3ToHex(element.properties.BackgroundColor3) }}
                      />
                      <span className="text-gray-400">BG</span>
                    </div>
                  )}
                  {element.properties.TextColor3 && (
                    <div className="flex items-center gap-1">
                      <div
                        className="w-4 h-4 rounded border border-gray-600"
                        style={{ backgroundColor: color3ToHex(element.properties.TextColor3) }}
                      />
                      <span className="text-gray-400">Text</span>
                    </div>
                  )}
                  {element.properties.UIStroke?.Color && (
                    <div className="flex items-center gap-1">
                      <div
                        className="w-4 h-4 rounded border border-gray-600"
                        style={{ backgroundColor: color3ToHex(element.properties.UIStroke.Color) }}
                      />
                      <span className="text-gray-400">Stroke</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preset List */}
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {presets.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <Palette className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No color presets saved</p>
                  <p className="text-xs mt-1">Select an element and save colors</p>
                </div>
              ) : (
                presets.map((preset) => (
                  <motion.div
                    key={preset.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 bg-gray-800 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium text-white text-sm">{preset.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePreset(preset.id)}
                        className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Color Swatches */}
                    <div className="flex gap-2 mb-2">
                      {preset.backgroundColor && (
                        <div
                          className="w-8 h-8 rounded border border-gray-600"
                          style={{ backgroundColor: color3ToHex(preset.backgroundColor) }}
                          title="Background"
                        />
                      )}
                      {preset.textColor && (
                        <div
                          className="w-8 h-8 rounded border border-gray-600"
                          style={{ backgroundColor: color3ToHex(preset.textColor) }}
                          title="Text"
                        />
                      )}
                      {preset.strokeColor && (
                        <div
                          className="w-8 h-8 rounded border border-gray-600"
                          style={{ backgroundColor: color3ToHex(preset.strokeColor) }}
                          title="Stroke"
                        />
                      )}
                      {preset.gradient && (
                        <div
                          className="w-8 h-8 rounded border border-gray-600"
                          style={{
                            backgroundImage: `linear-gradient(${preset.gradient.Rotation || 0}deg, ${preset.gradient.Color.Keypoints.map((kp: any) => color3ToHex(kp.Value)).join(', ')})`
                          }}
                          title="Gradient"
                        />
                      )}
                    </div>

                    <Button
                      onClick={() => applyPreset(preset)}
                      size="sm"
                      className="w-full bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] text-black hover:from-[#ff669e] hover:to-[#ff4080]"
                      disabled={!selectedElement}
                    >
                      Apply to Selected
                    </Button>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  )
}
