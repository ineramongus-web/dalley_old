'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { RotateCw, Trash2 } from 'lucide-react'
import type { Color3 } from '@/types/roblox'

interface ColorKeypoint {
  Time: number
  Value: Color3
}

interface TransparencyKeypoint {
  Time: number
  Value: number
}

interface UIGradientData {
  Color: {
    Keypoints: ColorKeypoint[]
  }
  Transparency: {
    Keypoints: TransparencyKeypoint[]
  }
  Rotation: number
  Offset?: { X: number; Y: number }
}

interface GradientEditorProps {
  gradient: UIGradientData
  onChange: (gradient: UIGradientData) => void
}

export function GradientEditor({ gradient, onChange }: GradientEditorProps): JSX.Element {
  const [selectedColorKeypoint, setSelectedColorKeypoint] = useState<number | null>(null)
  const [selectedTransparencyKeypoint, setSelectedTransparencyKeypoint] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState<{ type: 'color' | 'transparency'; index: number } | null>(null)
  const colorBarRef = useRef<HTMLDivElement>(null)
  const transparencyBarRef = useRef<HTMLDivElement>(null)

  const color3ToHex = (color: Color3): string => {
    const r = Math.round((color.R || 0) * 255)
    const g = Math.round((color.G || 0) * 255)
    const b = Math.round((color.B || 0) * 255)
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  const hexToColor3 = (hex: string): Color3 => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      R: parseInt(result[1], 16) / 255,
      G: parseInt(result[2], 16) / 255,
      B: parseInt(result[3], 16) / 255
    } : { R: 1, G: 1, B: 1 }
  }

  const generateGradientPreview = (): string => {
    const colorStops = gradient.Color.Keypoints
      .map(keypoint => {
        const color = color3ToHex(keypoint.Value)
        return `${color} ${keypoint.Time * 100}%`
      })
      .join(', ')
    
    return `linear-gradient(${gradient.Rotation}deg, ${colorStops})`
  }

  const generateTransparencyPreview = (): string => {
    const transparencyStops = gradient.Transparency.Keypoints
      .map(keypoint => {
        const alpha = 1 - keypoint.Value
        return `rgba(255, 255, 255, ${alpha}) ${keypoint.Time * 100}%`
      })
      .join(', ')
    
    return `linear-gradient(90deg, ${transparencyStops})`
  }

  const getPositionFromEvent = (e: React.MouseEvent | React.TouchEvent, barRef: React.RefObject<HTMLDivElement>): number => {
    if (!barRef.current) return 0
    const rect = barRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0]?.clientX || e.changedTouches[0]?.clientX : e.clientX
    const x = clientX - rect.left
    const position = Math.max(0, Math.min(1, x / rect.width))
    return Math.round(position * 100) / 100 // Round to 2 decimal places
  }

  const handleColorBarClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (isDragging) return
    const position = getPositionFromEvent(e, colorBarRef)
    
    // Add new color keypoint
    const newKeypoints = [...gradient.Color.Keypoints, {
      Time: position,
      Value: { R: 1, G: 1, B: 1 } // Default to white
    }].sort((a, b) => a.Time - b.Time)
    
    const newIndex = newKeypoints.findIndex(k => k.Time === position)
    setSelectedColorKeypoint(newIndex)
    
    onChange({
      ...gradient,
      Color: { Keypoints: newKeypoints }
    })
  }

  const handleTransparencyBarClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (isDragging) return
    const position = getPositionFromEvent(e, transparencyBarRef)
    
    // Add new transparency keypoint
    const newKeypoints = [...gradient.Transparency.Keypoints, {
      Time: position,
      Value: 0 // Default to fully opaque
    }].sort((a, b) => a.Time - b.Time)
    
    const newIndex = newKeypoints.findIndex(k => k.Time === position)
    setSelectedTransparencyKeypoint(newIndex)
    
    onChange({
      ...gradient,
      Transparency: { Keypoints: newKeypoints }
    })
  }

  const handleColorKeypointMouseDown = (e: React.MouseEvent | React.TouchEvent, index: number) => {
    e.stopPropagation()
    setIsDragging({ type: 'color', index })
    setSelectedColorKeypoint(index)
  }

  const handleTransparencyKeypointMouseDown = (e: React.MouseEvent | React.TouchEvent, index: number) => {
    e.stopPropagation()
    setIsDragging({ type: 'transparency', index })
    setSelectedTransparencyKeypoint(index)
  }

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return

    if (isDragging.type === 'color' && colorBarRef.current) {
      const rect = colorBarRef.current.getBoundingClientRect()
      const clientX = 'touches' in e ? e.touches[0]?.clientX || e.changedTouches[0]?.clientX : e.clientX
      const x = clientX - rect.left
      const position = Math.max(0, Math.min(1, x / rect.width))
      
      const newKeypoints = [...gradient.Color.Keypoints]
      newKeypoints[isDragging.index] = { ...newKeypoints[isDragging.index], Time: Math.round(position * 100) / 100 }
      newKeypoints.sort((a, b) => a.Time - b.Time)
      
      // Update selected index after sorting
      const newIndex = newKeypoints.findIndex(k => k === newKeypoints[isDragging.index])
      setSelectedColorKeypoint(newIndex)
      
      onChange({
        ...gradient,
        Color: { Keypoints: newKeypoints }
      })
    } else if (isDragging.type === 'transparency' && transparencyBarRef.current) {
      const rect = transparencyBarRef.current.getBoundingClientRect()
      const clientX = 'touches' in e ? e.touches[0]?.clientX || e.changedTouches[0]?.clientX : e.clientX
      const x = clientX - rect.left
      const position = Math.max(0, Math.min(1, x / rect.width))
      
      const newKeypoints = [...gradient.Transparency.Keypoints]
      newKeypoints[isDragging.index] = { ...newKeypoints[isDragging.index], Time: Math.round(position * 100) / 100 }
      newKeypoints.sort((a, b) => a.Time - b.Time)
      
      // Update selected index after sorting
      const newIndex = newKeypoints.findIndex(k => k === newKeypoints[isDragging.index])
      setSelectedTransparencyKeypoint(newIndex)
      
      onChange({
        ...gradient,
        Transparency: { Keypoints: newKeypoints }
      })
    }
  }, [isDragging, gradient, onChange])

  const handleMouseUp = useCallback(() => {
    setIsDragging(null)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleMouseMove)
      document.addEventListener('touchend', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleMouseMove)
        document.removeEventListener('touchend', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const updateSelectedColorKeypoint = (updates: Partial<ColorKeypoint>) => {
    if (selectedColorKeypoint === null) return
    
    const newKeypoints = [...gradient.Color.Keypoints]
    newKeypoints[selectedColorKeypoint] = { ...newKeypoints[selectedColorKeypoint], ...updates }
    
    onChange({
      ...gradient,
      Color: { Keypoints: newKeypoints }
    })
  }

  const updateSelectedTransparencyKeypoint = (updates: Partial<TransparencyKeypoint>) => {
    if (selectedTransparencyKeypoint === null) return
    
    const newKeypoints = [...gradient.Transparency.Keypoints]
    newKeypoints[selectedTransparencyKeypoint] = { ...newKeypoints[selectedTransparencyKeypoint], ...updates }
    
    onChange({
      ...gradient,
      Transparency: { Keypoints: newKeypoints }
    })
  }

  const removeSelectedColorKeypoint = () => {
    if (selectedColorKeypoint === null || gradient.Color.Keypoints.length <= 2) return
    
    const newKeypoints = gradient.Color.Keypoints.filter((_, i) => i !== selectedColorKeypoint)
    onChange({
      ...gradient,
      Color: { Keypoints: newKeypoints }
    })
    setSelectedColorKeypoint(null)
  }

  const removeSelectedTransparencyKeypoint = () => {
    if (selectedTransparencyKeypoint === null || gradient.Transparency.Keypoints.length <= 2) return
    
    const newKeypoints = gradient.Transparency.Keypoints.filter((_, i) => i !== selectedTransparencyKeypoint)
    onChange({
      ...gradient,
      Transparency: { Keypoints: newKeypoints }
    })
    setSelectedTransparencyKeypoint(null)
  }

  return (
    <div className="space-y-6">
      {/* Gradient Preview */}
      <div className="space-y-2">
        <Label className="text-gray-300">Preview</Label>
        <div 
          className="w-full h-8 rounded border border-gray-600"
          style={{ background: generateGradientPreview() }}
        />
      </div>

      {/* Rotation */}
      <div className="space-y-2">
        <Label className="text-gray-300 flex items-center gap-2">
          <RotateCw className="w-4 h-4" />
          Rotation: {gradient.Rotation}°
        </Label>
        <Slider
          value={[gradient.Rotation]}
          onValueChange={([value]) => onChange({ ...gradient, Rotation: value })}
          min={0}
          max={360}
          step={1}
          className="w-full"
        />
      </div>

      {/* Color Gradient Bar */}
      <div className="space-y-3">
        <Label className="text-gray-300">Colors (Click to add, drag to move)</Label>
        <div className="relative">
          <div
            ref={colorBarRef}
            className="w-full h-8 rounded border border-gray-600 cursor-crosshair relative"
            style={{ background: generateGradientPreview() }}
            onClick={handleColorBarClick}
            onTouchStart={handleColorBarClick}
          >
            {gradient.Color.Keypoints.map((keypoint, index) => (
              <div
                key={index}
                className={`absolute top-0 w-3 h-8 cursor-grab active:cursor-grabbing transform -translate-x-1/2 border-2 rounded-sm ${
                  selectedColorKeypoint === index ? 'border-white' : 'border-gray-800'
                }`}
                style={{
                  left: `${keypoint.Time * 100}%`,
                  backgroundColor: color3ToHex(keypoint.Value)
                }}
                onMouseDown={(e) => handleColorKeypointMouseDown(e, index)}
                onTouchStart={(e) => handleColorKeypointMouseDown(e, index)}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedColorKeypoint(index)
                }}
              />
            ))}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Click anywhere on the bar to add a color point
          </div>
        </div>

        {/* Selected Color Controls */}
        {selectedColorKeypoint !== null && (
          <div className="p-3 bg-gray-800 rounded border border-gray-600">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Label className="text-xs text-gray-400">Color</Label>
                <Input
                  type="color"
                  value={color3ToHex(gradient.Color.Keypoints[selectedColorKeypoint].Value)}
                  onChange={(e) => updateSelectedColorKeypoint({ Value: hexToColor3(e.target.value) })}
                  className="h-8 p-1 bg-gray-700 border-gray-600"
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs text-gray-400">Position</Label>
                <div className="text-sm text-gray-300">
                  {Math.round(gradient.Color.Keypoints[selectedColorKeypoint].Time * 100)}%
                </div>
              </div>
              {gradient.Color.Keypoints.length > 2 && (
                <Button
                  onClick={removeSelectedColorKeypoint}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Transparency Gradient Bar */}
      <div className="space-y-3">
        <Label className="text-gray-300">Transparency (Click to add, drag to move)</Label>
        <div className="relative">
          <div
            ref={transparencyBarRef}
            className="w-full h-8 rounded border border-gray-600 cursor-crosshair relative"
            style={{ 
              background: `linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
              backgroundSize: '8px 8px',
              backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
            }}
            onClick={handleTransparencyBarClick}
            onTouchStart={handleTransparencyBarClick}
          >
            <div
              className="absolute inset-0 rounded"
              style={{ background: generateTransparencyPreview() }}
            />
            {gradient.Transparency.Keypoints.map((keypoint, index) => (
              <div
                key={index}
                className={`absolute top-0 w-3 h-8 cursor-grab active:cursor-grabbing transform -translate-x-1/2 border-2 rounded-sm ${
                  selectedTransparencyKeypoint === index ? 'border-white' : 'border-gray-800'
                }`}
                style={{
                  left: `${keypoint.Time * 100}%`,
                  backgroundColor: `rgba(255, 255, 255, ${1 - keypoint.Value})`
                }}
                onMouseDown={(e) => handleTransparencyKeypointMouseDown(e, index)}
                onTouchStart={(e) => handleTransparencyKeypointMouseDown(e, index)}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedTransparencyKeypoint(index)
                }}
              />
            ))}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Click anywhere on the bar to add a transparency point
          </div>
        </div>

        {/* Selected Transparency Controls */}
        {selectedTransparencyKeypoint !== null && (
          <div className="p-3 bg-gray-800 rounded border border-gray-600">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Label className="text-xs text-gray-400">Transparency</Label>
                <Slider
                  value={[gradient.Transparency.Keypoints[selectedTransparencyKeypoint].Value]}
                  onValueChange={([value]) => updateSelectedTransparencyKeypoint({ Value: value })}
                  min={0}
                  max={1}
                  step={0.01}
                  className="w-full"
                />
                <div className="text-xs text-gray-400 mt-1">
                  {Math.round(gradient.Transparency.Keypoints[selectedTransparencyKeypoint].Value * 100)}%
                </div>
              </div>
              <div className="flex-1">
                <Label className="text-xs text-gray-400">Position</Label>
                <div className="text-sm text-gray-300">
                  {Math.round(gradient.Transparency.Keypoints[selectedTransparencyKeypoint].Time * 100)}%
                </div>
              </div>
              {gradient.Transparency.Keypoints.length > 2 && (
                <Button
                  onClick={removeSelectedTransparencyKeypoint}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}