'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { 
  X, 
  Settings, 
  ChevronDown, 
  ChevronRight,
  Palette,
  Move,
  Type,
  Image as ImageIcon,
  Layout,
  Eye,
  Layers
} from 'lucide-react'
import type { UIElement, RobloxProperties, Color3, UDim2, UDim, Vector2 } from '@/types/roblox'

interface PropertiesPanelProps {
  selectedElement: UIElement | null
  onUpdateElement: (id: string, updates: Partial<UIElement>) => void
  onClose: () => void
}

interface PropertySection {
  id: string
  name: string
  icon: React.ReactNode
  expanded: boolean
}

export function PropertiesPanel({
  selectedElement,
  onUpdateElement,
  onClose
}: PropertiesPanelProps): JSX.Element {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['transform', 'appearance', 'text'])
  )

  const toggleSection = (sectionId: string): void => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const updateProperty = (path: string[], value: any): void => {
    if (!selectedElement) return

    const newProperties = { ...selectedElement.properties }
    let current = newProperties

    // Navigate to the nested property
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        current[path[i]] = {}
      }
      current = current[path[i]]
    }

    // Set the final value
    current[path[path.length - 1]] = value

    onUpdateElement(selectedElement.id, { properties: newProperties })
  }

  const getPropertyValue = (path: string[]): any => {
    if (!selectedElement) return undefined

    let current = selectedElement.properties
    for (const key of path) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        return undefined
      }
    }
    return current
  }

  const renderColorInput = (label: string, path: string[], defaultValue: Color3 = { R: 1, G: 1, B: 1 }): JSX.Element => {
    const color = getPropertyValue(path) || defaultValue
    const hexColor = `#${Math.round(color.R * 255).toString(16).padStart(2, '0')}${Math.round(color.G * 255).toString(16).padStart(2, '0')}${Math.round(color.B * 255).toString(16).padStart(2, '0')}`

    return (
      <div className="space-y-2">
        <Label className="text-xs text-gray-300">{label}</Label>
        <div className="flex gap-2">
          <input
            type="color"
            value={hexColor}
            onChange={(e) => {
              const hex = e.target.value
              const r = parseInt(hex.slice(1, 3), 16) / 255
              const g = parseInt(hex.slice(3, 5), 16) / 255
              const b = parseInt(hex.slice(5, 7), 16) / 255
              updateProperty(path, { R: r, G: g, B: b })
            }}
            className="w-8 h-8 rounded border border-gray-600 cursor-pointer"
          />
          <div className="flex-1 grid grid-cols-3 gap-1">
            <Input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={color.R.toFixed(2)}
              onChange={(e) => updateProperty(path, { ...color, R: parseFloat(e.target.value) || 0 })}
              className="h-8 text-xs"
              placeholder="R"
            />
            <Input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={color.G.toFixed(2)}
              onChange={(e) => updateProperty(path, { ...color, G: parseFloat(e.target.value) || 0 })}
              className="h-8 text-xs"
              placeholder="G"
            />
            <Input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={color.B.toFixed(2)}
              onChange={(e) => updateProperty(path, { ...color, B: parseFloat(e.target.value) || 0 })}
              className="h-8 text-xs"
              placeholder="B"
            />
          </div>
        </div>
      </div>
    )
  }

  const renderUDim2Input = (label: string, path: string[], defaultValue: UDim2 = { X: { Scale: 0, Offset: 100 }, Y: { Scale: 0, Offset: 100 } }): JSX.Element => {
    const value = getPropertyValue(path) || defaultValue

    return (
      <div className="space-y-2">
        <Label className="text-xs text-gray-300">{label}</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-gray-400">X</Label>
            <div className="grid grid-cols-2 gap-1">
              <Input
                type="number"
                step="0.01"
                value={value.X.Scale}
                onChange={(e) => updateProperty(path, {
                  ...value,
                  X: { ...value.X, Scale: parseFloat(e.target.value) || 0 }
                })}
                className="h-7 text-xs"
                placeholder="Scale"
              />
              <Input
                type="number"
                value={value.X.Offset}
                onChange={(e) => updateProperty(path, {
                  ...value,
                  X: { ...value.X, Offset: parseInt(e.target.value) || 0 }
                })}
                className="h-7 text-xs"
                placeholder="Offset"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-400">Y</Label>
            <div className="grid grid-cols-2 gap-1">
              <Input
                type="number"
                step="0.01"
                value={value.Y.Scale}
                onChange={(e) => updateProperty(path, {
                  ...value,
                  Y: { ...value.Y, Scale: parseFloat(e.target.value) || 0 }
                })}
                className="h-7 text-xs"
                placeholder="Scale"
              />
              <Input
                type="number"
                value={value.Y.Offset}
                onChange={(e) => updateProperty(path, {
                  ...value,
                  Y: { ...value.Y, Offset: parseInt(e.target.value) || 0 }
                })}
                className="h-7 text-xs"
                placeholder="Offset"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderVector2Input = (label: string, path: string[], defaultValue: Vector2 = { X: 0, Y: 0 }): JSX.Element => {
    const value = getPropertyValue(path) || defaultValue

    return (
      <div className="space-y-2">
        <Label className="text-xs text-gray-300">{label}</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            step="0.01"
            value={value.X}
            onChange={(e) => updateProperty(path, { ...value, X: parseFloat(e.target.value) || 0 })}
            className="h-8 text-xs"
            placeholder="X"
          />
          <Input
            type="number"
            step="0.01"
            value={value.Y}
            onChange={(e) => updateProperty(path, { ...value, Y: parseFloat(e.target.value) || 0 })}
            className="h-8 text-xs"
            placeholder="Y"
          />
        </div>
      </div>
    )
  }

  const renderSliderInput = (label: string, path: string[], min: number = 0, max: number = 1, step: number = 0.01, defaultValue: number = 0): JSX.Element => {
    const value = getPropertyValue(path) ?? defaultValue

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-xs text-gray-300">{label}</Label>
          <span className="text-xs text-gray-400">{value.toFixed(2)}</span>
        </div>
        <Slider
          value={[value]}
          onValueChange={([newValue]) => updateProperty(path, newValue)}
          min={min}
          max={max}
          step={step}
          className="w-full"
        />
      </div>
    )
  }

  const renderTextInput = (label: string, path: string[], defaultValue: string = ''): JSX.Element => {
    const value = getPropertyValue(path) ?? defaultValue

    return (
      <div className="space-y-2">
        <Label className="text-xs text-gray-300">{label}</Label>
        <Input
          value={value}
          onChange={(e) => updateProperty(path, e.target.value)}
          className="h-8 text-xs"
          placeholder={defaultValue}
        />
      </div>
    )
  }

  const renderNumberInput = (label: string, path: string[], defaultValue: number = 0, min?: number, max?: number): JSX.Element => {
    const value = getPropertyValue(path) ?? defaultValue

    return (
      <div className="space-y-2">
        <Label className="text-xs text-gray-300">{label}</Label>
        <Input
          type="number"
          value={value}
          onChange={(e) => updateProperty(path, parseFloat(e.target.value) || 0)}
          className="h-8 text-xs"
          min={min}
          max={max}
        />
      </div>
    )
  }

  const renderSelectInput = (label: string, path: string[], options: string[], defaultValue: string = options[0]): JSX.Element => {
    const value = getPropertyValue(path) ?? defaultValue

    return (
      <div className="space-y-2">
        <Label className="text-xs text-gray-300">{label}</Label>
        <Select value={value} onValueChange={(newValue) => updateProperty(path, newValue)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  const renderSwitchInput = (label: string, path: string[], defaultValue: boolean = false): JSX.Element => {
    const value = getPropertyValue(path) ?? defaultValue

    return (
      <div className="flex items-center justify-between">
        <Label className="text-xs text-gray-300">{label}</Label>
        <Switch
          checked={value}
          onCheckedChange={(checked) => updateProperty(path, checked)}
        />
      </div>
    )
  }

  const renderSection = (id: string, name: string, icon: React.ReactNode, children: React.ReactNode): JSX.Element => {
    const isExpanded = expandedSections.has(id)

    return (
      <div className="border border-gray-700 rounded-lg">
        <button
          onClick={() => toggleSection(id)}
          className="w-full p-3 flex items-center justify-between hover:bg-gray-800 transition-colors rounded-t-lg"
        >
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium">{name}</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-3 pt-0 space-y-3 border-t border-gray-700"
          >
            {children}
          </motion.div>
        )}
      </div>
    )
  }

  if (!selectedElement) {
    return (
      <motion.div
        className="w-64 sm:w-72 bg-gray-900 border-l border-gray-800 flex flex-col h-full"
        initial={{ x: 320, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Properties
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
        </div>
        <div className="flex-1 flex items-center justify-center text-center p-8">
          <div className="text-gray-500">
            <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No element selected</p>
            <p className="text-xs">Select an element to edit its properties</p>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="w-64 sm:w-72 bg-gray-900 border-l border-gray-800 flex flex-col h-full"
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Properties
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
        <div className="text-xs text-gray-400">
          {selectedElement.name} ({selectedElement.type})
        </div>
      </div>

      {/* Properties */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Basic Properties */}
          {renderSection('basic', 'Basic', <Layout className="w-4 h-4" />, (
            <div className="space-y-3">
              {renderTextInput('Name', [], selectedElement.name)}
              {renderSwitchInput('Visible', ['Visible'], true)}
              {renderNumberInput('ZIndex', ['ZIndex'], 1)}
              {renderSwitchInput('Clips Descendants', ['ClipsDescendants'], false)}
            </div>
          ))}

          {/* Transform */}
          {renderSection('transform', 'Transform', <Move className="w-4 h-4" />, (
            <div className="space-y-3">
              {renderUDim2Input('Position', ['Position'])}
              {renderUDim2Input('Size', ['Size'])}
              {renderVector2Input('Anchor Point', ['AnchorPoint'])}
            </div>
          ))}

          {/* Appearance */}
          {renderSection('appearance', 'Appearance', <Palette className="w-4 h-4" />, (
            <div className="space-y-3">
              {renderColorInput('Background Color', ['BackgroundColor3'])}
              {renderSliderInput('Background Transparency', ['BackgroundTransparency'])}
              {renderColorInput('Border Color', ['BorderColor3'])}
              {renderNumberInput('Border Size', ['BorderSizePixel'], 0, 0)}
            </div>
          ))}

          {/* Text Properties (for text elements) */}
          {(selectedElement.type === 'TextLabel' || selectedElement.type === 'TextButton' || selectedElement.type === 'TextBox') && 
            renderSection('text', 'Text', <Type className="w-4 h-4" />, (
              <div className="space-y-3">
                {renderTextInput('Text', ['Text'], 'Text')}
                {renderColorInput('Text Color', ['TextColor3'])}
                {renderNumberInput('Text Size', ['TextSize'], 14, 1)}
                {renderSwitchInput('Text Scaled', ['TextScaled'], false)}
                {renderSelectInput('Font', ['Font'], ['SourceSans', 'SourceSansBold', 'SourceSansItalic', 'SourceSansLight', 'SourceSansSemibold', 'Legacy', 'Arial', 'ArialBold', 'BodyMovers', 'Cartoon', 'Code', 'Fantasy', 'Garamond', 'Gotham', 'GothamBold', 'GothamMedium', 'Highway', 'SciFi', 'Arcade', 'Antique', 'Fondamento', 'Creepster', 'DenkOne', 'Bangers', 'LuckiestGuy', 'Merriweather', 'Michroma', 'Nunito', 'Oswald', 'PatrickHand', 'PermanentMarker', 'Roboto', 'RobotoCondensed', 'RobotoMono', 'Sarpanch', 'SpecialElite', 'TitilliumWeb', 'Ubuntu'], 'SourceSans')}
                {renderSelectInput('Text X Alignment', ['TextXAlignment'], ['Left', 'Center', 'Right'], 'Center')}
                {renderSelectInput('Text Y Alignment', ['TextYAlignment'], ['Top', 'Center', 'Bottom'], 'Center')}
                
                {/* TextWrapped - Disabled when TextTruncate is not None */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-300">Text Wrapped</Label>
                  <Switch
                    checked={getPropertyValue(['TextWrapped']) ?? false}
                    disabled={getPropertyValue(['TextTruncate']) && getPropertyValue(['TextTruncate']) !== 'None'}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        // Enable TextWrapped, disable TextTruncate
                        updateProperty(['TextWrapped'], true)
                        updateProperty(['TextTruncate'], 'None')
                      } else {
                        updateProperty(['TextWrapped'], false)
                      }
                    }}
                  />
                </div>
                
                {/* TextTruncate - Disabled when TextWrapped is enabled */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-300">Text Truncate</Label>
                  <Select 
                    value={getPropertyValue(['TextTruncate']) ?? 'None'} 
                    disabled={getPropertyValue(['TextWrapped']) === true}
                    onValueChange={(newValue) => {
                      if (newValue !== 'None') {
                        // Enable TextTruncate, disable TextWrapped
                        updateProperty(['TextTruncate'], newValue)
                        updateProperty(['TextWrapped'], false)
                      } else {
                        updateProperty(['TextTruncate'], 'None')
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None">None</SelectItem>
                      <SelectItem value="AtEnd">At End (...text)</SelectItem>
                      <SelectItem value="AtStart">At Start (text...)</SelectItem>
                      <SelectItem value="AtMiddle">At Middle (te...xt)</SelectItem>
                      <SelectItem value="SplitWord">Split Word</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))
          }

          {/* Image Properties (for image elements) */}
          {(selectedElement.type === 'ImageLabel' || selectedElement.type === 'ImageButton') && 
            renderSection('image', 'Image', <ImageIcon className="w-4 h-4" />, (
              <div className="space-y-3">
                {renderTextInput('Image', ['Image'], 'rbxasset://textures/ui/GuiImagePlaceholder.png')}
                {renderColorInput('Image Color', ['ImageColor3'])}
                {renderSliderInput('Image Transparency', ['ImageTransparency'])}
                {renderSelectInput('Scale Type', ['ScaleType'], ['Stretch', 'Slice', 'Tile', 'Fit', 'Crop'], 'Stretch')}
              </div>
            ))
          }

          {/* Scrolling Properties (for ScrollingFrame) */}
          {selectedElement.type === 'ScrollingFrame' && 
            renderSection('scrolling', 'Scrolling', <Eye className="w-4 h-4" />, (
              <div className="space-y-3">
                {renderUDim2Input('Canvas Size', ['CanvasSize'])}
                {renderNumberInput('ScrollBar Thickness', ['ScrollBarThickness'], 12, 0)}
                {renderSwitchInput('Scrolling Enabled', ['ScrollingEnabled'], true)}
              </div>
            ))
          }

          {/* UI Effects */}
          {renderSection('effects', 'UI Effects', <Layers className="w-4 h-4" />, (
            <div className="space-y-4">
              {/* UI Corner */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-300">UI Corner</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={getPropertyValue(['UICorner', 'CornerRadius', 'Scale']) ?? 0}
                    onChange={(e) => updateProperty(['UICorner'], {
                      CornerRadius: {
                        Scale: parseFloat(e.target.value) || 0,
                        Offset: getPropertyValue(['UICorner', 'CornerRadius', 'Offset']) ?? 0
                      }
                    })}
                    className="h-7 text-xs"
                    placeholder="Scale"
                  />
                  <Input
                    type="number"
                    value={getPropertyValue(['UICorner', 'CornerRadius', 'Offset']) ?? 0}
                    onChange={(e) => updateProperty(['UICorner'], {
                      CornerRadius: {
                        Scale: getPropertyValue(['UICorner', 'CornerRadius', 'Scale']) ?? 0,
                        Offset: parseInt(e.target.value) || 0
                      }
                    })}
                    className="h-7 text-xs"
                    placeholder="Offset"
                  />
                </div>
              </div>

              {/* UI Stroke */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-300">UI Stroke</Label>
                {renderColorInput('Stroke Color', ['UIStroke', 'Color'], { R: 0, G: 0, B: 0 })}
                {renderNumberInput('Stroke Thickness', ['UIStroke', 'Thickness'], 1, 0)}
                {renderSliderInput('Stroke Transparency', ['UIStroke', 'Transparency'])}
                {renderSelectInput('Apply Stroke Mode', ['UIStroke', 'ApplyStrokeMode'], ['Contextual', 'Border'], 'Contextual')}
              </div>

              {/* UI Padding */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-300">UI Padding</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">Top</Label>
                    <div className="grid grid-cols-2 gap-1">
                      <Input
                        type="number"
                        step="0.01"
                        value={getPropertyValue(['UIPadding', 'PaddingTop', 'Scale']) ?? 0}
                        onChange={(e) => updateProperty(['UIPadding', 'PaddingTop'], {
                          Scale: parseFloat(e.target.value) || 0,
                          Offset: getPropertyValue(['UIPadding', 'PaddingTop', 'Offset']) ?? 0
                        })}
                        className="h-6 text-xs"
                        placeholder="S"
                      />
                      <Input
                        type="number"
                        value={getPropertyValue(['UIPadding', 'PaddingTop', 'Offset']) ?? 0}
                        onChange={(e) => updateProperty(['UIPadding', 'PaddingTop'], {
                          Scale: getPropertyValue(['UIPadding', 'PaddingTop', 'Scale']) ?? 0,
                          Offset: parseInt(e.target.value) || 0
                        })}
                        className="h-6 text-xs"
                        placeholder="O"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">Bottom</Label>
                    <div className="grid grid-cols-2 gap-1">
                      <Input
                        type="number"
                        step="0.01"
                        value={getPropertyValue(['UIPadding', 'PaddingBottom', 'Scale']) ?? 0}
                        onChange={(e) => updateProperty(['UIPadding', 'PaddingBottom'], {
                          Scale: parseFloat(e.target.value) || 0,
                          Offset: getPropertyValue(['UIPadding', 'PaddingBottom', 'Offset']) ?? 0
                        })}
                        className="h-6 text-xs"
                        placeholder="S"
                      />
                      <Input
                        type="number"
                        value={getPropertyValue(['UIPadding', 'PaddingBottom', 'Offset']) ?? 0}
                        onChange={(e) => updateProperty(['UIPadding', 'PaddingBottom'], {
                          Scale: getPropertyValue(['UIPadding', 'PaddingBottom', 'Scale']) ?? 0,
                          Offset: parseInt(e.target.value) || 0
                        })}
                        className="h-6 text-xs"
                        placeholder="O"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">Left</Label>
                    <div className="grid grid-cols-2 gap-1">
                      <Input
                        type="number"
                        step="0.01"
                        value={getPropertyValue(['UIPadding', 'PaddingLeft', 'Scale']) ?? 0}
                        onChange={(e) => updateProperty(['UIPadding', 'PaddingLeft'], {
                          Scale: parseFloat(e.target.value) || 0,
                          Offset: getPropertyValue(['UIPadding', 'PaddingLeft', 'Offset']) ?? 0
                        })}
                        className="h-6 text-xs"
                        placeholder="S"
                      />
                      <Input
                        type="number"
                        value={getPropertyValue(['UIPadding', 'PaddingLeft', 'Offset']) ?? 0}
                        onChange={(e) => updateProperty(['UIPadding', 'PaddingLeft'], {
                          Scale: getPropertyValue(['UIPadding', 'PaddingLeft', 'Scale']) ?? 0,
                          Offset: parseInt(e.target.value) || 0
                        })}
                        className="h-6 text-xs"
                        placeholder="O"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">Right</Label>
                    <div className="grid grid-cols-2 gap-1">
                      <Input
                        type="number"
                        step="0.01"
                        value={getPropertyValue(['UIPadding', 'PaddingRight', 'Scale']) ?? 0}
                        onChange={(e) => updateProperty(['UIPadding', 'PaddingRight'], {
                          Scale: parseFloat(e.target.value) || 0,
                          Offset: getPropertyValue(['UIPadding', 'PaddingRight', 'Offset']) ?? 0
                        })}
                        className="h-6 text-xs"
                        placeholder="S"
                      />
                      <Input
                        type="number"
                        value={getPropertyValue(['UIPadding', 'PaddingRight', 'Offset']) ?? 0}
                        onChange={(e) => updateProperty(['UIPadding', 'PaddingRight'], {
                          Scale: getPropertyValue(['UIPadding', 'PaddingRight', 'Scale']) ?? 0,
                          Offset: parseInt(e.target.value) || 0
                        })}
                        className="h-6 text-xs"
                        placeholder="O"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </motion.div>
  )
}