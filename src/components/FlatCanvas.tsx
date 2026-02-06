'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { CanvasTools, DragHandles } from '@/components/CanvasTools'
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Smartphone,
  Monitor,
  Tablet,
  Undo,
  Sparkles
} from 'lucide-react'
import type { UIElement, AnimationKeyframe, CanvasViewport } from '@/types/roblox'

interface FlatCanvasProps {
  elements: UIElement[]
  animations: AnimationKeyframe[]
  currentTime: number
  selectedElement: string | null
  onSelectElement: (id: string | null) => void
  onUpdateElement: (id: string, updates: Partial<UIElement>) => void
  onUpdateKeyframe: (id: string, updates: Partial<AnimationKeyframe>) => void
  isPlaying: boolean
  exportConfig?: {
    sprSettings: {
      dampingRatio: number
      undampedFrequency: number
    }
    animationType: 'loop' | 'playOnce'
  }
  duration?: number
  editingFunction?: { elementId: string; functionId: string; animationId: string } | null
  functionAnimations?: any[]
  onUpdateFunctionKeyframe?: (animationId: string, keyframeId: string, updates: Partial<AnimationKeyframe>) => void
  editingKeyframe?: string | null
  isEditingMode?: boolean
}

const devicePresets = [
  { name: 'Mobile', icon: Smartphone, width: 320, height: 568 },
  { name: 'Tablet', icon: Tablet, width: 768, height: 1024 },
  { name: 'Desktop', icon: Monitor, width: 1200, height: 800 },
  { name: 'Actual Device', icon: Monitor, width: typeof window !== 'undefined' ? window.screen.width : 1920, height: typeof window !== 'undefined' ? window.screen.height : 1080 }
]

export function FlatCanvas(props: FlatCanvasProps): JSX.Element {
  const {
    elements,
    animations,
    currentTime,
    selectedElement,
    onSelectElement,
    onUpdateElement,
    onUpdateKeyframe,
    isPlaying,
    exportConfig = {
      sprSettings: { dampingRatio: 0.8, undampedFrequency: 15 },
      animationType: 'loop'
    },
    duration = 5,
    editingFunction,
    functionAnimations,
    onUpdateFunctionKeyframe,
    editingKeyframe,
    isEditingMode
  } = props

  const canvasRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState<CanvasViewport>({
    zoom: 0.6,
    pan: { X: 0, Y: 0 },
    size: { width: 320, height: 568 },
    orientation: 'portrait'
  })
  const [showGrid, setShowGrid] = useState<boolean>(true)
  const [isPanning, setIsPanning] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [activeTool, setActiveTool] = useState<'select' | 'move' | 'resize' | 'pan'>('pan')

  // ========== UTILITY FUNCTIONS ==========
  
  const udim2ToPixels = useCallback((udim2: { X: { Scale: number; Offset: number }; Y: { Scale: number; Offset: number } }, parentSize: { width: number; height: number }): { x: number; y: number } => {
    return {
      x: (udim2.X.Scale * parentSize.width) + udim2.X.Offset,
      y: (udim2.Y.Scale * parentSize.height) + udim2.Y.Offset
    }
  }, [])

  const udim2SizeToPixels = useCallback((udim2Size: { X: { Scale: number; Offset: number }; Y: { Scale: number; Offset: number } }, parentSize: { width: number; height: number }): { width: number; height: number } => {
    return {
      width: Math.max(0, (udim2Size.X.Scale * parentSize.width) + udim2Size.X.Offset),
      height: Math.max(0, (udim2Size.Y.Scale * parentSize.height) + udim2Size.Y.Offset)
    }
  }, [])

  const color3ToCss = (color3: any) => {
    if (!color3) return 'rgb(255, 255, 255)'
    const r = Math.round(color3.R * 255)
    const g = Math.round(color3.G * 255)
    const b = Math.round(color3.B * 255)
    return `rgb(${r}, ${g}, ${b})`
  }

  const getFontFamily = (font: string) => {
    const fontMap: Record<string, string> = {
      'Legacy': 'Times New Roman, serif',
      'Arial': 'Arial, sans-serif',
      'ArialBold': 'Arial, sans-serif',
      'SourceSans': 'Source Sans Pro, sans-serif',
      'SourceSansBold': 'Source Sans Pro, sans-serif',
      'SourceSansSemibold': 'Source Sans Pro, sans-serif',
      'SourceSansLight': 'Source Sans Pro, sans-serif',
      'SourceSansItalic': 'Source Sans Pro, sans-serif',
      'Bodoni': 'Bodoni MT, serif',
      'Garamond': 'Garamond, serif',
      'Cartoon': 'Comic Sans MS, cursive',
      'Code': 'Courier New, monospace',
      'Highway': 'Arial Black, sans-serif',
      'SciFi': 'Orbitron, sans-serif',
      'Arcade': 'Press Start 2P, monospace',
      'Fantasy': 'Papyrus, fantasy',
      'Antique': 'Old English Text MT, serif',
      'Gotham': 'Montserrat, sans-serif',
      'GothamSemibold': 'Montserrat, sans-serif',
      'GothamBold': 'Montserrat, sans-serif',
      'GothamBlack': 'Montserrat, sans-serif',
      'AmaticSC': 'Amatic SC, cursive',
      'Bangers': 'Bangers, cursive',
      'Creepster': 'Creepster, cursive',
      'DenkOne': 'Denk One, sans-serif',
      'Fondamento': 'Fondamento, cursive',
      'FredokaOne': 'Fredoka One, cursive',
      'GrenzeGotisch': 'Grenze Gotisch, cursive',
      'IndieFlower': 'Indie Flower, cursive',
      'JosefinSans': 'Josefin Sans, sans-serif',
      'Jura': 'Jura, sans-serif',
      'Kalam': 'Kalam, cursive',
      'LuckiestGuy': 'Luckiest Guy, cursive',
      'Merriweather': 'Merriweather, serif',
      'Michroma': 'Michroma, sans-serif',
      'Nunito': 'Nunito, sans-serif',
      'Oswald': 'Oswald, sans-serif',
      'PatrickHand': 'Patrick Hand, cursive',
      'PermanentMarker': 'Permanent Marker, cursive',
      'Roboto': 'Roboto, sans-serif',
      'RobotoCondensed': 'Roboto Condensed, sans-serif',
      'RobotoMono': 'Roboto Mono, monospace',
      'Sarpanch': 'Sarpanch, sans-serif',
      'SpecialElite': 'Special Elite, cursive',
      'TitilliumWeb': 'Titillium Web, sans-serif',
      'Ubuntu': 'Ubuntu, sans-serif'
    }
    return fontMap[font] || 'Source Sans Pro, sans-serif'
  }

  const getFontWeight = (font: string) => {
    const weightMap: Record<string, number> = {
      'ArialBold': 700,
      'SourceSansBold': 700,
      'SourceSansSemibold': 600,
      'SourceSansLight': 300,
      'GothamSemibold': 600,
      'GothamBold': 700,
      'GothamBlack': 900
    }
    return weightMap[font] || 400
  }

  // ========== POSITION CALCULATION ==========
  
  const getAbsolutePosition = useCallback((element: UIElement): { x: number; y: number } => {
    if (!element.parent || element.parent === 'script.Parent') {
      const pixelPosition = element.properties.Position
        ? udim2ToPixels(element.properties.Position, viewport.size)
        : element.position
      return {
        x: Math.max(0, Math.min(viewport.size.width, pixelPosition.x)),
        y: Math.max(0, Math.min(viewport.size.height, pixelPosition.y))
      }
    }

    const parentElement = elements.find(el =>
      el.id === element.parent || el.name.replace(/\\s+/g, '') === element.parent
    )

    if (!parentElement) {
      return {
        x: Math.max(0, element.position.x),
        y: Math.max(0, element.position.y)
      }
    }

    const parentAbsPos = getAbsolutePosition(parentElement)
    const parentPixelSize = parentElement.properties.Size
      ? udim2SizeToPixels(parentElement.properties.Size, viewport.size)
      : parentElement.size

    const childPixelPosition = element.properties.Position
      ? udim2ToPixels(element.properties.Position, parentPixelSize)
      : element.position

    const absolutePosition = {
      x: parentAbsPos.x + Math.max(0, childPixelPosition.x),
      y: parentAbsPos.y + Math.max(0, childPixelPosition.y)
    }

    return {
      x: Math.max(0, Math.min(viewport.size.width, absolutePosition.x)),
      y: Math.max(0, Math.min(viewport.size.height, absolutePosition.y))
    }
  }, [elements, viewport.size, udim2ToPixels, udim2SizeToPixels])

  // ========== SPRING ANIMATION - FRAMER MOTION ==========
  
  // Get target properties for spring animation
  // CRITICAL: Apply animation properties when:
  // 1. PLAYING - for smooth spring animation
  // 2. EDITING KEYFRAME - to show keyframe's target position
  // 3. PAUSED within animation window - to keep animated position
  const getTargetProperties = useCallback((elementId: string): { properties: Partial<UIElement['properties']>; sprSettings: { dampingRatio: number; undampedFrequency: number }; isInterpolated: boolean; keyframeTime: number } | null => {
    const elementAnimations = animations.filter(kf => kf.elementId === elementId)
    if (elementAnimations.length === 0) return null
    
    const sortedKeyframes = [...elementAnimations].sort((a, b) => a.time - b.time)
    
    // EDITING MODE: If editing a keyframe for this element, show that keyframe's properties
    if (isEditingMode && editingKeyframe) {
      const editedKeyframe = sortedKeyframes.find(kf => kf.id === editingKeyframe)
      if (editedKeyframe) {
        return {
          properties: editedKeyframe.properties,
          sprSettings: editedKeyframe.sprSettings || exportConfig.sprSettings,
          isInterpolated: true, // Use instant transition when editing
          keyframeTime: editedKeyframe.time
        }
      }
    }
    
    // PLAYING OR PAUSED: Show animation state based on timeline position
    // Find the last keyframe that has been reached
    const passedKeyframes = sortedKeyframes.filter(kf => currentTime >= kf.time)
    
    if (passedKeyframes.length > 0) {
      // Get the most recent keyframe
      const activeKeyframe = passedKeyframes[passedKeyframes.length - 1]
      const sprSettings = activeKeyframe.sprSettings || exportConfig.sprSettings
      
      // Check if we're within the animation window (2 seconds after keyframe)
      const isInAnimationWindow = currentTime < activeKeyframe.time + 2.0
      
      // If playing and in animation window, use spring animation
      // If paused or past animation window, use instant transition
      return {
        properties: activeKeyframe.properties,
        sprSettings,
        isInterpolated: !isPlaying || !isInAnimationWindow, // Spring only when playing within window
        keyframeTime: activeKeyframe.time
      }
    }
    
    // No keyframes reached yet, stay at base
    return null
  }, [animations, currentTime, isPlaying, isEditingMode, editingKeyframe, exportConfig.sprSettings])

  // ========== FLAT ELEMENT RENDERING ==========
  
  /**
   * CRITICAL: This function computes the absolute position, size, and style for EVERY element
   * ALL elements are rendered as FLAT SIBLINGS - no parent-child DOM relationships
   * This completely eliminates insertBefore errors
   */
  const flatElements = useMemo(() => {
    return elements.map((element) => {
      const targetAnimation = getTargetProperties(element.id)
      const properties = element.properties
      
      const position = getAbsolutePosition(element)
      
      // Get display size
      let displaySize = element.size
      if (properties.Size) {
        let parentSize = viewport.size
        if (element.parent && element.parent !== 'script.Parent') {
          const parentElement = elements.find(el =>
            el.id === element.parent || el.name.replace(/\\s+/g, '') === element.parent
          )
          if (parentElement) {
            parentSize = parentElement.properties.Size
              ? udim2SizeToPixels(parentElement.properties.Size, viewport.size)
              : parentElement.size
          }
        }
        displaySize = udim2SizeToPixels(properties.Size, parentSize)
      }

      // Handle anchor point
      const anchorPoint = properties.AnchorPoint || { X: 0, Y: 0 }
      const anchorOffsetX = displaySize.width * anchorPoint.X
      const anchorOffsetY = displaySize.height * anchorPoint.Y

      const anchoredPosition = {
        x: position.x - anchorOffsetX,
        y: position.y - anchorOffsetY
      }

      // Check if element should be clipped by parent
      let clipPath: string | undefined = undefined
      if (element.parent && element.parent !== 'script.Parent') {
        const parentElement = elements.find(el =>
          el.id === element.parent || el.name.replace(/\\s+/g, '') === element.parent
        )
        if (parentElement && parentElement.properties.ClipsDescendants) {
          const parentPos = getAbsolutePosition(parentElement)
          const parentSize = parentElement.properties.Size
            ? udim2SizeToPixels(parentElement.properties.Size, viewport.size)
            : parentElement.size
          
          const parentAnchor = parentElement.properties.AnchorPoint || { X: 0, Y: 0 }
          const parentAnchorOffsetX = parentSize.width * parentAnchor.X
          const parentAnchorOffsetY = parentSize.height * parentAnchor.Y
          const parentLeft = parentPos.x - parentAnchorOffsetX
          const parentTop = parentPos.y - parentAnchorOffsetY
          
          const clipLeft = Math.max(0, parentLeft - anchoredPosition.x)
          const clipTop = Math.max(0, parentTop - anchoredPosition.y)
          const clipRight = Math.max(0, (anchoredPosition.x + displaySize.width) - (parentLeft + parentSize.width))
          const clipBottom = Math.max(0, (anchoredPosition.y + displaySize.height) - (parentTop + parentSize.height))
          
          if (clipLeft > 0 || clipTop > 0 || clipRight > 0 || clipBottom > 0) {
            clipPath = `inset(${clipTop}px ${clipRight}px ${clipBottom}px ${clipLeft}px)`
          }
        }
      }

      // Build style WITHOUT activeTool - it will be applied during render
      const style: React.CSSProperties = {
        position: 'absolute',
        left: anchoredPosition.x,
        top: anchoredPosition.y,
        width: displaySize.width,
        height: displaySize.height,
        backgroundColor: properties.BackgroundColor3
          ? `rgba(${Math.round(properties.BackgroundColor3.R * 255)}, ${Math.round(properties.BackgroundColor3.G * 255)}, ${Math.round(properties.BackgroundColor3.B * 255)}, ${1 - (properties.BackgroundTransparency || 0)})`
          : 'transparent',
        color: properties.TextColor3
          ? `rgba(${Math.round(properties.TextColor3.R * 255)}, ${Math.round(properties.TextColor3.G * 255)}, ${Math.round(properties.TextColor3.B * 255)}, ${1 - (properties.TextTransparency || 0)})`
          : 'white',
        borderRadius: properties.UICorner ? `${properties.UICorner.CornerRadius.Offset}px` : '0',
        border: properties.BorderSizePixel ? `${properties.BorderSizePixel}px solid ${color3ToCss(properties.BorderColor3)}` : 'none',
        fontFamily: getFontFamily(properties.Font || 'SourceSans'),
        fontWeight: getFontWeight(properties.Font || 'SourceSans'),
        fontSize: properties.TextSize ? `${properties.TextSize}px` : '14px',
        fontStyle: (properties.Font === 'SourceSansItalic') ? 'italic' : 'normal',
        whiteSpace: properties.TextWrapped ? 'normal' : 'nowrap',
        overflow: properties.TextTruncate && properties.TextTruncate !== 'None' ? 'hidden' : 'visible',
        textOverflow: (properties.TextTruncate === 'AtEnd') ? 'ellipsis' : 'clip',
        direction: 'ltr' as const,
        wordWrap: properties.TextWrapped ? 'break-word' : 'normal',
        display: properties.Visible === false ? 'none' : 'flex',
        zIndex: properties.ZIndex || 1,
        userSelect: 'none',
        boxSizing: 'border-box',
        clipPath: clipPath
      }

      return {
        id: element.id,
        element,
        style,
        properties,
        displaySize,
        targetAnimation
      }
    })
  }, [elements, getAbsolutePosition, viewport.size, udim2SizeToPixels, getTargetProperties])

  // ========== EVENT HANDLERS ==========
  
  const handleElementDrag = useCallback((elementId: string, newAbsolutePosition: { x: number; y: number }) => {
    const element = elements.find(el => el.id === elementId)
    if (!element) return

    let newRelativePosition = newAbsolutePosition
    let parentSize = viewport.size

    if (element.parent && element.parent !== 'script.Parent') {
      const parentElement = elements.find(el =>
        el.id === element.parent || el.name.replace(/\\s+/g, '') === element.parent
      )
      if (parentElement) {
        const parentAbsPos = getAbsolutePosition(parentElement)
        newRelativePosition = {
          x: newAbsolutePosition.x - parentAbsPos.x,
          y: newAbsolutePosition.y - parentAbsPos.y
        }

        parentSize = parentElement.properties.Size
          ? udim2SizeToPixels(parentElement.properties.Size, viewport.size)
          : parentElement.size
      }
    }

    const safeParentWidth = Math.max(1, parentSize.width || 1)
    const safeParentHeight = Math.max(1, parentSize.height || 1)

    const newUDim2Position = {
      X: {
        Scale: newRelativePosition.x / safeParentWidth,
        Offset: 0
      },
      Y: {
        Scale: newRelativePosition.y / safeParentHeight,
        Offset: 0
      }
    }

    // CRITICAL FIX: Check if we're editing a keyframe
    // If yes, update the KEYFRAME's position, not the element's
    if (isEditingMode && editingKeyframe) {
      // Find the keyframe being edited
      const keyframe = animations.find(kf => kf.id === editingKeyframe)
      if (keyframe && keyframe.elementId === elementId) {
        // Update keyframe properties
        onUpdateKeyframe(editingKeyframe, {
          properties: {
            ...keyframe.properties,
            Position: newUDim2Position
          }
        })
        return // Don't update element
      }
    }

    // Not editing keyframe, update element normally
    onUpdateElement(elementId, {
      position: newRelativePosition,
      properties: {
        ...element.properties,
        Position: newUDim2Position
      }
    })
  }, [elements, viewport.size, onUpdateElement, onUpdateKeyframe, getAbsolutePosition, udim2SizeToPixels, isEditingMode, editingKeyframe, animations])

  const handleElementResizeEnd = useCallback((elementId: string, newSize: { width: number; height: number }, newPosition?: { x: number; y: number }) => {
    const element = elements.find(el => el.id === elementId)
    if (!element) return

    let parentSize = viewport.size
    if (element.parent && element.parent !== 'script.Parent') {
      const parentElement = elements.find(el =>
        el.id === element.parent || el.name.replace(/\\s+/g, '') === element.parent
      )
      if (parentElement) {
        parentSize = parentElement.properties.Size
          ? udim2SizeToPixels(parentElement.properties.Size, viewport.size)
          : parentElement.size
      }
    }

    const safeParentWidth = Math.max(1, parentSize.width || 1)
    const safeParentHeight = Math.max(1, parentSize.height || 1)

    const newUDim2Size = {
      X: {
        Scale: newSize.width / safeParentWidth,
        Offset: 0
      },
      Y: {
        Scale: newSize.height / safeParentHeight,
        Offset: 0
      }
    }

    const updates: Partial<UIElement> = {
      size: {
        width: Math.max(20, newSize.width),
        height: Math.max(20, newSize.height)
      },
      properties: {
        ...element.properties,
        Size: newUDim2Size
      }
    }

    if (newPosition) {
      let newRelativePosition = newPosition

      if (element.parent && element.parent !== 'script.Parent') {
        const parentElement = elements.find(el =>
          el.id === element.parent || el.name.replace(/\\s+/g, '') === element.parent
        )
        if (parentElement) {
          const parentAbsPos = getAbsolutePosition(parentElement)
          newRelativePosition = {
            x: newPosition.x - parentAbsPos.x,
            y: newPosition.y - parentAbsPos.y
          }
        }
      }

      const newUDim2Position = {
        X: {
          Scale: newRelativePosition.x / safeParentWidth,
          Offset: 0
        },
        Y: {
          Scale: newRelativePosition.y / safeParentHeight,
          Offset: 0
        }
      }

      updates.position = newRelativePosition
      updates.properties = {
        ...updates.properties,
        Position: newUDim2Position
      }
    }

    onUpdateElement(elementId, updates)
  }, [elements, viewport.size, onUpdateElement, getAbsolutePosition, udim2SizeToPixels])

  const handleToolChange = (tool: 'select' | 'move' | 'resize' | 'pan') => {
    setActiveTool(tool)
    if (tool === 'pan') {
      onSelectElement(null)
      setIsPanning(false)
      setDragStart(null)
    }
    if (activeTool === 'pan' && tool !== 'pan') {
      setIsPanning(false)
      setDragStart(null)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'pan') {
      e.preventDefault()
      e.stopPropagation()
      setIsPanning(true)
      setDragStart({ x: e.clientX, y: e.clientY })
      return
    }

    const target = e.target as HTMLElement
    const isCanvasBackground = target === canvasRef.current ||
      target.classList.contains('canvas-background') ||
      target.closest('.canvas-background')

    if (isCanvasBackground) {
      onSelectElement(null)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && dragStart && activeTool === 'pan') {
      e.preventDefault()
      e.stopPropagation()
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      setViewport(prev => ({
        ...prev,
        pan: {
          X: prev.pan.X + deltaX,
          Y: prev.pan.Y + deltaY
        }
      }))
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false)
      setDragStart(null)
    }
  }

  const handleZoom = (delta: number) => {
    setViewport(prev => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(3, prev.zoom + delta))
    }))
  }

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.05 : 0.05
    handleZoom(delta)
  }, [])

  useEffect(() => {
    const canvasElement = canvasRef.current
    if (!canvasElement) return

    canvasElement.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      canvasElement.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel])

  const toggleOrientation = () => {
    setViewport(prev => {
      const newOrientation = prev.orientation === 'portrait' ? 'landscape' : 'portrait'
      const newSize = {
        width: prev.size.height,
        height: prev.size.width
      }

      return {
        ...prev,
        orientation: newOrientation,
        size: newSize
      }
    })
  }

  const setDevicePreset = (preset: typeof devicePresets[0]) => {
    setViewport(prev => ({
      ...prev,
      size: prev.orientation === 'landscape'
        ? { width: preset.height, height: preset.width }
        : { width: preset.width, height: preset.height }
    }))
  }

  const selectedElementData = useMemo(() => {
    if (!selectedElement || activeTool === 'pan') return null
    return elements.find(el => el.id === selectedElement) || null
  }, [selectedElement, activeTool, elements])

  return (
    <div className="flex-1 bg-black relative overflow-hidden flex flex-col">
      {/* Canvas Controls */}
      <div className="flex-shrink-0 p-2 border-b border-gray-800 bg-black relative z-1">
        <div className="flex flex-col sm:flex-row gap-2 justify-between">
          <div className="flex flex-wrap gap-1">
            <div className="flex gap-1 bg-black/50 backdrop-blur-sm rounded-lg p-1">
              {devicePresets.map((preset) => (
                <Button
                  key={preset.name}
                  variant={viewport.size.width === preset.width || viewport.size.height === preset.width ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setDevicePreset(preset)}
                  className={`gap-1 text-xs px-2 py-1 ${viewport.size.width === preset.width || viewport.size.height === preset.width
                    ? 'bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] text-black'
                    : 'text-white hover:bg-gray-800'
                    }`}
                >
                  <preset.icon className="w-3 h-3" />
                  <span className="hidden sm:inline text-xs">{preset.name}</span>
                </Button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleOrientation}
              className="text-white hover:bg-gray-800 bg-black/50 backdrop-blur-sm px-2 py-1"
              title={`Switch to ${viewport.orientation === 'portrait' ? 'landscape' : 'portrait'}`}
            >
              <RotateCw className="w-3 h-3" />
            </Button>

            <CanvasTools
              activeTool={activeTool}
              onToolChange={handleToolChange}
            />
          </div>

          <div className="flex gap-1">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1 text-xs text-gray-300 flex items-center">
              {viewport.size.width} × {viewport.size.height} • {viewport.orientation} • {elements.length} element{elements.length !== 1 ? 's' : ''}
            </div>

            <div className="flex gap-1 bg-black/50 backdrop-blur-sm rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleZoom(-0.1)}
                className="text-white hover:bg-gray-800 px-2 py-1"
                title="Zoom out"
              >
                <ZoomOut className="w-3 h-3" />
              </Button>
              <input
                type="number"
                value={Math.round(viewport.zoom * 100)}
                onChange={(e) => {
                  const newZoom = Math.max(10, Math.min(300, parseInt(e.target.value) || 100)) / 100
                  setViewport(prev => ({ ...prev, zoom: newZoom }))
                }}
                className="w-16 px-2 py-1 text-xs bg-gray-800 border border-gray-600 text-white rounded text-center"
                min="10"
                max="300"
                step="10"
                title="Zoom percentage"
              />
              <span className="text-xs text-gray-400">%</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleZoom(0.1)}
                className="text-white hover:bg-gray-800 px-2 py-1"
                title="Zoom in"
              >
                <ZoomIn className="w-3 h-3" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log('Undo clicked')
              }}
              className="text-white hover:bg-gray-800 bg-black/50 backdrop-blur-sm px-2 py-1"
              title="Undo last action"
              disabled={true}
            >
              <Undo className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div
        ref={canvasRef}
        data-canvas-container
        className={`flex-1 relative flex items-center justify-center canvas-background ${activeTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
          }`}
        style={{
          touchAction: activeTool === 'pan' ? 'none' : 'auto',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid */}
        {showGrid && (
          <div
            className="absolute inset-0 opacity-20 canvas-background"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: `${20 * viewport.zoom}px ${20 * viewport.zoom}px`,
              transform: `translate(${viewport.pan.X}px, ${viewport.pan.Y}px)`
            }}
          />
        )}

        {/* Device Frame */}
        <div
          className="relative bg-gray-900 border border-gray-700 shadow-2xl canvas-background"
          style={{
            width: viewport.size.width * viewport.zoom,
            height: viewport.size.height * viewport.zoom,
            transform: `translate(${viewport.pan.X}px, ${viewport.pan.Y}px)`
          }}
        >
          {/* Device Content */}
          <div
            className="relative w-full h-full overflow-hidden bg-gray-800 canvas-background"
            style={{
              width: viewport.size.width * viewport.zoom,
              height: viewport.size.height * viewport.zoom
            }}
          >
            {/* Empty State Message */}
            {elements.length === 0 && (
              <div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{
                  transform: `scale(${viewport.zoom})`,
                  transformOrigin: 'center'
                }}
              >
                <div className="text-center">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p className="text-gray-500 text-sm font-medium">Add elements to start designing</p>
                </div>
              </div>
            )}
            {/* FLAT ELEMENTS CONTAINER - ALL SIBLINGS, NO HIERARCHY */}
            <div
              style={{
                position: 'relative',
                width: viewport.size.width,
                height: viewport.size.height,
                transform: `scale(${viewport.zoom})`,
                transformOrigin: 'top left',
                pointerEvents: 'none'
              }}
            >
              {flatElements.map(({ id, element, style, properties, targetAnimation }) => {
                const isSelected = selectedElement === element.id
                
                // Calculate target position and size for animation
                const baseStyle = {
                  ...style,
                  cursor: activeTool === 'pan' ? 'grab' : 'pointer',
                  pointerEvents: activeTool === 'pan' ? 'none' : 'auto'
                }
                
                // Calculate animated values if target exists
                let animateProps: any = {}
                let transition: any = { type: 'tween', duration: 0 }
                
                if (targetAnimation) {
                  const { properties: targetProps, sprSettings, isInterpolated, keyframeTime } = targetAnimation
                  
                  // Calculate target position
                  if (targetProps.Position) {
                    let targetPosition = { x: 0, y: 0 }
                    if (!element.parent || element.parent === 'script.Parent') {
                      targetPosition = udim2ToPixels(targetProps.Position, viewport.size)
                    } else {
                      const parentElement = elements.find(el =>
                        el.id === element.parent || el.name.replace(/\\s+/g, '') === element.parent
                      )
                      if (parentElement) {
                        const parentAbsPos = getAbsolutePosition(parentElement)
                        const parentPixelSize = parentElement.properties.Size
                          ? udim2SizeToPixels(parentElement.properties.Size, viewport.size)
                          : parentElement.size
                        const childPixelPosition = udim2ToPixels(targetProps.Position, parentPixelSize)
                        targetPosition = {
                          x: parentAbsPos.x + childPixelPosition.x,
                          y: parentAbsPos.y + childPixelPosition.y
                        }
                      }
                    }
                    
                    // Apply anchor point
                    const anchorPoint = element.properties.AnchorPoint || { X: 0, Y: 0 }
                    const displaySize = element.properties.Size
                      ? udim2SizeToPixels(element.properties.Size, viewport.size)
                      : element.size
                    const anchorOffsetX = displaySize.width * anchorPoint.X
                    const anchorOffsetY = displaySize.height * anchorPoint.Y
                    
                    animateProps.left = targetPosition.x - anchorOffsetX
                    animateProps.top = targetPosition.y - anchorOffsetY
                  }
                  
                  // Calculate target size
                  if (targetProps.Size) {
                    let parentSize = viewport.size
                    if (element.parent && element.parent !== 'script.Parent') {
                      const parentElement = elements.find(el =>
                        el.id === element.parent || el.name.replace(/\\s+/g, '') === element.parent
                      )
                      if (parentElement) {
                        parentSize = parentElement.properties.Size
                          ? udim2SizeToPixels(parentElement.properties.Size, viewport.size)
                          : parentElement.size
                      }
                    }
                    const targetSize = udim2SizeToPixels(targetProps.Size, parentSize)
                    animateProps.width = targetSize.width
                    animateProps.height = targetSize.height
                  }
                  
                  // Calculate target colors
                  if (targetProps.BackgroundColor3) {
                    const bgColor = targetProps.BackgroundColor3
                    animateProps.backgroundColor = `rgba(${Math.round(bgColor.R * 255)}, ${Math.round(bgColor.G * 255)}, ${Math.round(bgColor.B * 255)}, ${1 - (targetProps.BackgroundTransparency || 0)})`
                  }
                  
                  if (targetProps.TextColor3) {
                    const textColor = targetProps.TextColor3
                    animateProps.color = `rgba(${Math.round(textColor.R * 255)}, ${Math.round(textColor.G * 255)}, ${Math.round(textColor.B * 255)}, ${1 - (targetProps.TextTransparency || 0)})`
                  }
                  
                  // Use different transitions for playing vs scrubbing
                  if (isInterpolated) {
                    // SCRUBBING/PAUSED: Instant transition for real-time preview
                    transition = {
                      type: 'tween',
                      duration: 0,
                      ease: 'linear'
                    }
                  } else {
                    // PLAYING: Spring animation matching Roblox SPR behavior
                    // SPR formula: stiffness = (2π * frequency)^2
                    // Framer Motion stiffness needs to be higher to match SPR's speed
                    const frequency = sprSettings.undampedFrequency
                    const dampingRatio = sprSettings.dampingRatio
                    
                    // Match SPR's actual spring physics more closely
                    const stiffness = Math.pow(2 * Math.PI * frequency, 2)
                    const damping = 2 * dampingRatio * Math.sqrt(stiffness)
                    
                    transition = {
                      type: 'spring',
                      stiffness: Math.max(1, stiffness),
                      damping: Math.max(0.1, damping),
                      mass: 1,
                      restDelta: 0.001,
                      restSpeed: 0.001
                    }
                  }
                }
                
                return (
                <motion.div
                  key={id}
                  data-element-id={id}
                  style={baseStyle as React.CSSProperties}
                  animate={animateProps}
                  transition={transition}
                  className={`${isSelected ? 'ring-2 ring-white ring-opacity-50' : ''}`}
                  onClick={(e) => {
                    if (activeTool === 'pan') return
                    e.stopPropagation()
                    if (!element.locked && selectedElement !== element.id) {
                      onSelectElement(element.id)
                    }
                  }}
                >
                  {/* Element Content */}
                  {element.type === 'TextLabel' || element.type === 'TextButton' || element.type === 'TextBox' ? (
                    <div
                      data-canvas-text
                      className={`w-full h-full flex px-2 ${properties.TextYAlignment === 'Top' ? 'items-start' :
                        properties.TextYAlignment === 'Bottom' ? 'items-end' : 'items-center'
                        } ${properties.TextXAlignment === 'Left' ? 'justify-start' :
                          properties.TextXAlignment === 'Right' ? 'justify-end' : 'justify-center'
                        }`}
                      style={{
                        ['--element-font' as any]: getFontFamily(properties.Font || 'SourceSans'),
                        fontFamily: getFontFamily(properties.Font || 'SourceSans'),
                        fontWeight: getFontWeight(properties.Font || 'SourceSans'),
                        fontSize: properties.TextSize ? `${properties.TextSize}px` : '14px',
                        fontStyle: (properties.Font === 'SourceSansItalic') ? 'italic' : 'normal',
                        whiteSpace: properties.TextWrapped ? 'normal' : 'nowrap',
                        textAlign: properties.TextXAlignment === 'Left' ? 'left' :
                          properties.TextXAlignment === 'Right' ? 'right' : 'center',
                        overflow: properties.TextTruncate && properties.TextTruncate !== 'None' ? 'hidden' : 'visible',
                        textOverflow: (properties.TextTruncate === 'AtEnd') ? 'ellipsis' : 'clip',
                        direction: 'ltr',
                        wordWrap: properties.TextWrapped ? 'break-word' : 'normal'
                      }}
                    >
                      {properties.TextTruncate === 'AtMiddle' ? (
                        <span 
                          data-canvas-text 
                          style={{
                            display: 'inline-block',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {(() => {
                            try {
                              const text = String(properties.Text || element.type || '')
                              const elementWidth = Math.max(0, displaySize?.width || 100)
                              const fontSize = Math.max(1, properties.TextSize || 14)
                              const charWidth = Math.max(0.1, fontSize * 0.6)
                              const padding = 20
                              const availableWidth = Math.max(0, elementWidth - padding)
                              const maxChars = Math.max(0, Math.floor(availableWidth / charWidth))
                              
                              if (!text || text.length === 0) return text
                              if (text.length <= maxChars || maxChars < 6) {
                                return text
                              }
                              
                              const sideLength = Math.max(0, Math.floor((maxChars - 3) / 2))
                              const start = text.substring(0, sideLength)
                              const end = text.substring(Math.max(0, text.length - sideLength))
                              return `${start}...${end}`
                            } catch (error) {
                              console.error('TextTruncate AtMiddle error:', error)
                              return String(properties.Text || element.type || '')
                            }
                          })()}
                        </span>
                      ) : properties.TextTruncate === 'SplitWord' ? (
                        <span 
                          data-canvas-text
                          style={{
                            display: 'inline-block',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'clip',
                            wordBreak: 'break-all'
                          }}
                        >
                          {properties.Text || element.type}
                        </span>
                      ) : properties.TextTruncate === 'AtStart' ? (
                        <span 
                          data-canvas-text
                          style={{
                            display: 'inline-block',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            direction: 'ltr',
                            textAlign: properties.TextXAlignment === 'Left' ? 'left' :
                              properties.TextXAlignment === 'Right' ? 'right' : 'center'
                          }}
                        >
                          {(() => {
                            try {
                              const text = String(properties.Text || element.type || '')
                              const elementWidth = Math.max(0, displaySize?.width || 100)
                              const fontSize = Math.max(1, properties.TextSize || 14)
                              const charWidth = Math.max(0.1, fontSize * 0.6)
                              const padding = 20
                              const availableWidth = Math.max(0, elementWidth - padding)
                              const maxChars = Math.max(0, Math.floor(availableWidth / charWidth))
                              
                              if (!text || text.length === 0) return text
                              if (text.length <= maxChars) {
                                return text
                              }
                              
                              // Show ellipsis at start: "...text"
                              const startIndex = Math.max(0, text.length - (maxChars - 3))
                              return `...${text.substring(startIndex)}`
                            } catch (error) {
                              console.error('TextTruncate AtStart error:', error)
                              return String(properties.Text || element.type || '')
                            }
                          })()}
                        </span>
                      ) : properties.TextTruncate === 'AtEnd' ? (
                        <span 
                          data-canvas-text
                          style={{
                            display: 'inline-block',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {properties.Text || element.type}
                        </span>
                      ) : (
                        <span data-canvas-text>{properties.Text || element.type}</span>
                      )}
                    </div>
                  ) : element.type === 'ImageLabel' || element.type === 'ImageButton' ? (
                    <div
                      className="w-full h-full bg-gray-600 flex items-center justify-center text-xs text-gray-300"
                      style={{
                        backgroundImage: properties.Image ? `url(${properties.Image})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      {!properties.Image && 'Image'}
                    </div>
                  ) : (
                    <div className="w-full h-full" />
                  )}

                  {/* Selection Indicator - Always rendered, just hidden */}
                  <div
                    className="absolute inset-0 border-2 border-white pointer-events-none"
                    style={{ 
                      borderRadius: 'inherit',
                      opacity: isSelected ? 1 : 0,
                      pointerEvents: 'none'
                    }}
                  />
                  <div 
                    className="absolute -top-6 left-0 bg-white text-black px-2 py-1 rounded text-xs font-medium"
                    style={{
                      opacity: isSelected ? 1 : 0,
                      pointerEvents: 'none'
                    }}
                  >
                    {element.name}
                  </div>
                </motion.div>
              )})}
            </div>

            {/* DragHandles Layer - Completely Separate */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 1000
              }}
            >
              {selectedElementData && (() => {
                // CRITICAL: Get animated position from the motion.div's current animated state
                // This ensures selection holder follows the element during spring animation
                const flatElementData = flatElements.find(fe => fe.id === selectedElementData.id)
                
                // Calculate current displayed position (base + animation)
                let displayedPosition = flatElementData ? {
                  x: flatElementData.style.left as number,
                  y: flatElementData.style.top as number
                } : undefined
                
                let displayedSize = flatElementData ? {
                  width: flatElementData.style.width as number,
                  height: flatElementData.style.height as number
                } : undefined
                
                // When editing a keyframe, show the KEYFRAME's target position for selection holder
                // This allows you to see where the keyframe target is while editing
                if (isEditingMode && editingKeyframe) {
                  const editedKeyframe = animations.find(kf => kf.id === editingKeyframe && kf.elementId === selectedElementData.id)
                  if (editedKeyframe && editedKeyframe.properties.Position) {
                    let targetPosition = { x: 0, y: 0 }
                    if (!selectedElementData.parent || selectedElementData.parent === 'script.Parent') {
                      targetPosition = udim2ToPixels(editedKeyframe.properties.Position, viewport.size)
                    } else {
                      const parentElement = elements.find(el =>
                        el.id === selectedElementData.parent || el.name.replace(/\\s+/g, '') === selectedElementData.parent
                      )
                      if (parentElement) {
                        const parentAbsPos = getAbsolutePosition(parentElement)
                        const parentPixelSize = parentElement.properties.Size
                          ? udim2SizeToPixels(parentElement.properties.Size, viewport.size)
                          : parentElement.size
                        const childPixelPosition = udim2ToPixels(editedKeyframe.properties.Position, parentPixelSize)
                        targetPosition = {
                          x: parentAbsPos.x + childPixelPosition.x,
                          y: parentAbsPos.y + childPixelPosition.y
                        }
                      }
                    }
                    
                    const anchorPoint = selectedElementData.properties.AnchorPoint || { X: 0, Y: 0 }
                    const displaySize = selectedElementData.properties.Size
                      ? udim2SizeToPixels(selectedElementData.properties.Size, viewport.size)
                      : selectedElementData.size
                    const anchorOffsetX = displaySize.width * anchorPoint.X
                    const anchorOffsetY = displaySize.height * anchorPoint.Y
                    
                    displayedPosition = {
                      x: targetPosition.x - anchorOffsetX,
                      y: targetPosition.y - anchorOffsetY
                    }
                  }
                }
                // If playing with target animation, compute target position for selection holder to follow animation
                else if (flatElementData?.targetAnimation) {
                  const { properties: targetProps } = flatElementData.targetAnimation
                  
                  if (targetProps.Position) {
                    let targetPosition = { x: 0, y: 0 }
                    if (!selectedElementData.parent || selectedElementData.parent === 'script.Parent') {
                      targetPosition = udim2ToPixels(targetProps.Position, viewport.size)
                    } else {
                      const parentElement = elements.find(el =>
                        el.id === selectedElementData.parent || el.name.replace(/\\s+/g, '') === selectedElementData.parent
                      )
                      if (parentElement) {
                        const parentAbsPos = getAbsolutePosition(parentElement)
                        const parentPixelSize = parentElement.properties.Size
                          ? udim2SizeToPixels(parentElement.properties.Size, viewport.size)
                          : parentElement.size
                        const childPixelPosition = udim2ToPixels(targetProps.Position, parentPixelSize)
                        targetPosition = {
                          x: parentAbsPos.x + childPixelPosition.x,
                          y: parentAbsPos.y + childPixelPosition.y
                        }
                      }
                    }
                    
                    const anchorPoint = selectedElementData.properties.AnchorPoint || { X: 0, Y: 0 }
                    const displaySize = selectedElementData.properties.Size
                      ? udim2SizeToPixels(selectedElementData.properties.Size, viewport.size)
                      : selectedElementData.size
                    const anchorOffsetX = displaySize.width * anchorPoint.X
                    const anchorOffsetY = displaySize.height * anchorPoint.Y
                    
                    displayedPosition = {
                      x: targetPosition.x - anchorOffsetX,
                      y: targetPosition.y - anchorOffsetY
                    }
                  }
                }
                
                return (
                  <div
                    style={{
                      position: 'relative',
                      width: viewport.size.width,
                      height: viewport.size.height,
                      transform: `scale(${viewport.zoom})`,
                      transformOrigin: 'top left',
                      pointerEvents: 'auto'
                    }}
                  >
                    <DragHandles
                      key={selectedElementData.id}
                      element={selectedElementData}
                      elements={elements}
                      viewport={viewport}
                      onDrag={handleElementDrag}
                      onResizeEnd={handleElementResizeEnd}
                      activeTool={activeTool}
                      overridePosition={displayedPosition}
                      overrideSize={displayedSize}
                      animations={animations}
                      currentTime={currentTime}
                      isPlaying={isPlaying}
                    />
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
