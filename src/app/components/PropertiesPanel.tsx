'use client'

import { motion } from 'framer-motion'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { RobloxElement } from '../../types/roblox'

interface PropertiesPanelProps {
  element: RobloxElement | null
  onUpdateElement: (id: string, properties: Partial<RobloxElement['properties']>) => void
}

interface ColorInputProps {
  label: string
  value: { R: number; G: number; B: number }
  onChange: (color: { R: number; G: number; B: number }) => void
}

function ColorInput({ label, value, onChange }: ColorInputProps): JSX.Element {
  const [expanded, setExpanded] = useState<boolean>(false)
  
  const hexValue = `#${Math.round(value.R * 255).toString(16).padStart(2, '0')}${Math.round(value.G * 255).toString(16).padStart(2, '0')}${Math.round(value.B * 255).toString(16).padStart(2, '0')}`

  const handleHexChange = (hex: string): void => {
    const cleanHex = hex.replace('#', '')
    if (cleanHex.length === 6) {
      const r = parseInt(cleanHex.substr(0, 2), 16) / 255
      const g = parseInt(cleanHex.substr(2, 2), 16) / 255
      const b = parseInt(cleanHex.substr(4, 2), 16) / 255
      onChange({ R: r, G: g, B: b })
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left text-xs sm:text-sm font-medium text-white"
      >
        {label}
        {expanded ? <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" /> : <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />}
      </button>
      
      {expanded && (
        <div className="space-y-2 pl-2">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border border-gray-600 flex-shrink-0"
              style={{ backgroundColor: hexValue }}
            />
            <input
              type="text"
              value={hexValue}
              onChange={(e) => handleHexChange(e.target.value)}
              className="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-purple-400"
              placeholder="#FFFFFF"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-gray-400">R: {Math.round(value.R * 255)}</label>
            <input
              type="range"
              min="0"
              max="255"
              value={Math.round(value.R * 255)}
              onChange={(e) => onChange({ ...value, R: parseInt(e.target.value) / 255 })}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-gray-400">G: {Math.round(value.G * 255)}</label>
            <input
              type="range"
              min="0"
              max="255"
              value={Math.round(value.G * 255)}
              onChange={(e) => onChange({ ...value, G: parseInt(e.target.value) / 255 })}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-gray-400">B: {Math.round(value.B * 255)}</label>
            <input
              type="range"
              min="0"
              max="255"
              value={Math.round(value.B * 255)}
              onChange={(e) => onChange({ ...value, B: parseInt(e.target.value) / 255 })}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  )
}

interface UDim2InputProps {
  label: string
  value: { X: { Scale: number; Offset: number }; Y: { Scale: number; Offset: number } }
  onChange: (value: { X: { Scale: number; Offset: number }; Y: { Scale: number; Offset: number } }) => void
}

function UDim2Input({ label, value, onChange }: UDim2InputProps): JSX.Element {
  const [expanded, setExpanded] = useState<boolean>(false)

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left text-xs sm:text-sm font-medium text-white"
      >
        {label}
        {expanded ? <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" /> : <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />}
      </button>
      
      {expanded && (
        <div className="space-y-3 pl-2">
          <div className="space-y-2">
            <label className="text-xs text-gray-400">X</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">Scale</label>
                <input
                  type="number"
                  step="0.01"
                  value={value.X.Scale}
                  onChange={(e) => onChange({
                    ...value,
                    X: { ...value.X, Scale: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Offset</label>
                <input
                  type="number"
                  value={value.X.Offset}
                  onChange={(e) => onChange({
                    ...value,
                    X: { ...value.X, Offset: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs text-gray-400">Y</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">Scale</label>
                <input
                  type="number"
                  step="0.01"
                  value={value.Y.Scale}
                  onChange={(e) => onChange({
                    ...value,
                    Y: { ...value.Y, Scale: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Offset</label>
                <input
                  type="number"
                  value={value.Y.Offset}
                  onChange={(e) => onChange({
                    ...value,
                    Y: { ...value.Y, Offset: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PropertiesPanel({ element, onUpdateElement }: PropertiesPanelProps): JSX.Element {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    transform: false,
    appearance: false,
    text: false,
    image: false,
    effects: false
  })

  const toggleSection = (section: string): void => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  if (!element) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 opacity-50">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm">No element selected</p>
          <p className="text-xs">Select an element to edit properties</p>
        </div>
      </div>
    )
  }

  const updateProperty = (property: string, value: any): void => {
    onUpdateElement(element.id, { [property]: value })
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-3 sm:p-4 space-y-4">
        <div className="border-b border-gray-800 pb-3">
          <h3 className="text-sm sm:text-base font-semibold text-white">{element.name}</h3>
          <p className="text-xs text-gray-400">{element.type}</p>
        </div>

        {/* Basic Properties */}
        <div className="space-y-3">
          <button
            onClick={() => toggleSection('basic')}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-white"
          >
            Basic Properties
            {expandedSections.basic ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          
          {expandedSections.basic && (
            <div className="space-y-3 pl-2">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={element.name}
                  onChange={(e) => onUpdateElement(element.id, { name: e.target.value })}
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-purple-400"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">Visible</label>
                <input
                  type="checkbox"
                  checked={element.properties.Visible}
                  onChange={(e) => updateProperty('Visible', e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-700 rounded focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-400 mb-1">ZIndex</label>
                <input
                  type="number"
                  value={element.properties.ZIndex || 1}
                  onChange={(e) => updateProperty('ZIndex', parseInt(e.target.value) || 1)}
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-purple-400"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">Clips Descendants</label>
                <input
                  type="checkbox"
                  checked={element.properties.ClipsDescendants}
                  onChange={(e) => updateProperty('ClipsDescendants', e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-700 rounded focus:ring-purple-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Transform Properties */}
        <div className="space-y-3">
          <button
            onClick={() => toggleSection('transform')}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-white"
          >
            Transform
            {expandedSections.transform ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          
          {expandedSections.transform && (
            <div className="space-y-3 pl-2">
              <UDim2Input
                label="Position"
                value={element.properties.Position || { X: { Scale: 0, Offset: 0 }, Y: { Scale: 0, Offset: 0 } }}
                onChange={(value) => updateProperty('Position', value)}
              />
              
              <UDim2Input
                label="Size"
                value={element.properties.Size || { X: { Scale: 0.2, Offset: 0 }, Y: { Scale: 0.1, Offset: 0 } }}
                onChange={(value) => updateProperty('Size', value)}
              />
              
              <div className="space-y-2">
                <label className="text-xs text-gray-400">Anchor Point</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">X</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={element.properties.AnchorPoint?.X || 0}
                      onChange={(e) => updateProperty('AnchorPoint', {
                        ...element.properties.AnchorPoint,
                        X: parseFloat(e.target.value) || 0
                      })}
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Y</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={element.properties.AnchorPoint?.Y || 0}
                      onChange={(e) => updateProperty('AnchorPoint', {
                        ...element.properties.AnchorPoint,
                        Y: parseFloat(e.target.value) || 0
                      })}
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Appearance Properties */}
        <div className="space-y-3">
          <button
            onClick={() => toggleSection('appearance')}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-white"
          >
            Appearance
            {expandedSections.appearance ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          
          {expandedSections.appearance && (
            <div className="space-y-3 pl-2">
              <ColorInput
                label="Background Color"
                value={element.properties.BackgroundColor3 || { R: 1, G: 1, B: 1 }}
                onChange={(value) => updateProperty('BackgroundColor3', value)}
              />
              
              <div>
                <label className="block text-xs text-gray-400 mb-1">Background Transparency</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={element.properties.BackgroundTransparency || 0}
                  onChange={(e) => updateProperty('BackgroundTransparency', parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-xs text-gray-500 mt-1">{Math.round((element.properties.BackgroundTransparency || 0) * 100)}%</div>
              </div>
              
              <ColorInput
                label="Border Color"
                value={element.properties.BorderColor3 || { R: 0, G: 0, B: 0 }}
                onChange={(value) => updateProperty('BorderColor3', value)}
              />
              
              <div>
                <label className="block text-xs text-gray-400 mb-1">Border Size</label>
                <input
                  type="number"
                  min="0"
                  value={element.properties.BorderSizePixel || 1}
                  onChange={(e) => updateProperty('BorderSizePixel', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Text Properties */}
        {(element.type === 'TextLabel' || element.type === 'TextButton' || element.type === 'TextBox') && (
          <div className="space-y-3">
            <button
              onClick={() => toggleSection('text')}
              className="flex items-center justify-between w-full text-left text-sm font-medium text-white"
            >
              Text Properties
              {expandedSections.text ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {expandedSections.text && (
              <div className="space-y-3 pl-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Text</label>
                  <textarea
                    value={element.properties.Text || ''}
                    onChange={(e) => updateProperty('Text', e.target.value)}
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-purple-400 resize-none"
                    rows={2}
                  />
                </div>
                
                <ColorInput
                  label="Text Color"
                  value={element.properties.TextColor3 || { R: 0, G: 0, B: 0 }}
                  onChange={(value) => updateProperty('TextColor3', value)}
                />
                
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Text Size</label>
                  <input
                    type="number"
                    min="1"
                    value={element.properties.TextSize || 14}
                    onChange={(e) => updateProperty('TextSize', parseInt(e.target.value) || 14)}
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Font</label>
                  <select
                    value={element.properties.Font || 'SourceSans'}
                    onChange={(e) => updateProperty('Font', e.target.value)}
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="SourceSans">SourceSans</option>
                    <option value="Arial">Arial</option>
                    <option value="ArialBold">ArialBold</option>
                    <option value="Legacy">Legacy</option>
                    <option value="Cartoon">Cartoon</option>
                    <option value="Code">Code</option>
                    <option value="Highway">Highway</option>
                    <option value="SciFi">SciFi</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">X Alignment</label>
                    <select
                      value={element.properties.TextXAlignment || 'Center'}
                      onChange={(e) => updateProperty('TextXAlignment', e.target.value)}
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-purple-400"
                    >
                      <option value="Left">Left</option>
                      <option value="Center">Center</option>
                      <option value="Right">Right</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Y Alignment</label>
                    <select
                      value={element.properties.TextYAlignment || 'Center'}
                      onChange={(e) => updateProperty('TextYAlignment', e.target.value)}
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-purple-400"
                    >
                      <option value="Top">Top</option>
                      <option value="Center">Center</option>
                      <option value="Bottom">Bottom</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Image Properties */}
        {(element.type === 'ImageLabel' || element.type === 'ImageButton') && (
          <div className="space-y-3">
            <button
              onClick={() => toggleSection('image')}
              className="flex items-center justify-between w-full text-left text-sm font-medium text-white"
            >
              Image Properties
              {expandedSections.image ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {expandedSections.image && (
              <div className="space-y-3 pl-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={element.properties.Image || ''}
                    onChange={(e) => updateProperty('Image', e.target.value)}
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-purple-400"
                    placeholder="rbxasset://textures/..."
                  />
                </div>
                
                <ColorInput
                  label="Image Color"
                  value={element.properties.ImageColor3 || { R: 1, G: 1, B: 1 }}
                  onChange={(value) => updateProperty('ImageColor3', value)}
                />
                
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Image Transparency</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={element.properties.ImageTransparency || 0}
                    onChange={(e) => updateProperty('ImageTransparency', parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-xs text-gray-500 mt-1">{Math.round((element.properties.ImageTransparency || 0) * 100)}%</div>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Scale Type</label>
                  <select
                    value={element.properties.ScaleType || 'Stretch'}
                    onChange={(e) => updateProperty('ScaleType', e.target.value)}
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="Stretch">Stretch</option>
                    <option value="Fit">Fit</option>
                    <option value="Crop">Crop</option>
                    <option value="Tile">Tile</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* UI Effects */}
        <div className="space-y-3">
          <button
            onClick={() => toggleSection('effects')}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-white"
          >
            UI Effects
            {expandedSections.effects ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          
          {expandedSections.effects && (
            <div className="space-y-3 pl-2">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Corner Radius</label>
                <input
                  type="number"
                  min="0"
                  value={element.properties.UICorner?.CornerRadius || 0}
                  onChange={(e) => updateProperty('UICorner', { CornerRadius: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-purple-400"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-400 mb-1">Stroke Thickness</label>
                <input
                  type="number"
                  min="0"
                  value={element.properties.UIStroke?.Thickness || 0}
                  onChange={(e) => updateProperty('UIStroke', { 
                    ...element.properties.UIStroke,
                    Thickness: parseInt(e.target.value) || 0 
                  })}
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-purple-400"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-400 mb-1">Padding</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Left/Right</label>
                    <input
                      type="number"
                      min="0"
                      value={element.properties.UIPadding?.PaddingLeft || 0}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0
                        updateProperty('UIPadding', {
                          ...element.properties.UIPadding,
                          PaddingLeft: value,
                          PaddingRight: value
                        })
                      }}
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Top/Bottom</label>
                    <input
                      type="number"
                      min="0"
                      value={element.properties.UIPadding?.PaddingTop || 0}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0
                        updateProperty('UIPadding', {
                          ...element.properties.UIPadding,
                          PaddingTop: value,
                          PaddingBottom: value
                        })
                      }}
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}