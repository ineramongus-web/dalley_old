'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Move, Maximize2, Hand } from 'lucide-react'
import type { UIElement } from '@/types/roblox'

interface CanvasToolsProps {
  activeTool: 'select' | 'move' | 'resize' | 'pan'
  onToolChange: (tool: 'select' | 'move' | 'resize' | 'pan') => void
}

export function CanvasTools({ activeTool, onToolChange }: CanvasToolsProps): JSX.Element {
  return (
    <div className="flex gap-1 bg-black/50 backdrop-blur-sm rounded-lg p-1">
      <Button
        variant={activeTool === 'move' ? "default" : "ghost"}
        size="sm"
        onClick={() => onToolChange('move')}
        className={`gap-1 text-xs px-2 py-1 ${
          activeTool === 'move' ? 
          'bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] text-black' : 
          'text-white hover:bg-gray-800'
        }`}
        title="Move Tool - Drag elements to reposition them"
      >
        <Move className="w-3 h-3" />
        <span className="hidden sm:inline text-xs">Move</span>
      </Button>
      
      <Button
        variant={activeTool === 'resize' ? "default" : "ghost"}
        size="sm"
        onClick={() => onToolChange('resize')}
        className={`gap-1 text-xs px-2 py-1 ${
          activeTool === 'resize' ? 
          'bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] text-black' : 
          'text-white hover:bg-gray-800'
        }`}
        title="Size Tool - Drag to resize elements"
      >
        <Maximize2 className="w-3 h-3" />
        <span className="hidden sm:inline text-xs">Size</span>
      </Button>
      
      <Button
        variant={activeTool === 'pan' ? "default" : "ghost"}
        size="sm"
        onClick={() => onToolChange('pan')}
        className={`gap-1 text-xs px-2 py-1 ${
          activeTool === 'pan' ? 
          'bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] text-black' : 
          'text-white hover:bg-gray-800'
        }`}
        title="Pan Tool - Move around the canvas"
      >
        <Hand className="w-3 h-3" />
        <span className="hidden sm:inline text-xs">Pan</span>
      </Button>
    </div>
  )
}

interface DragHandlesProps {
  element: UIElement
  elements: UIElement[]
  viewport: {
    zoom: number
    pan: { X: number; Y: number }
    size: { width: number; height: number }
  }
  onDrag: (elementId: string, newAbsolutePosition: { x: number; y: number }) => void
  onResizeEnd: (elementId: string, newSize: { width: number; height: number }, newPosition?: { x: number; y: number }) => void
  activeTool: 'select' | 'move' | 'resize' | 'pan'
  overridePosition?: { x: number; y: number }
  overrideSize?: { width: number; height: number }
  animations?: any[]
  currentTime?: number
  isPlaying?: boolean
}

export function DragHandles({ 
  element, 
  elements,
  viewport, 
  onDrag, 
  onResizeEnd, 
  activeTool,
  overridePosition,
  overrideSize
}: DragHandlesProps): JSX.Element {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [initialBounds, setInitialBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [visualSize, setVisualSize] = useState<{ width: number; height: number } | null>(null)
  const [visualPosition, setVisualPosition] = useState<{ x: number; y: number } | null>(null)

  const udim2ToPixels = useCallback((udim2: { X: { Scale: number; Offset: number }; Y: { Scale: number; Offset: number } }, parentSize: { width: number; height: number }): { x: number; y: number } => {
    return {
      x: (udim2.X.Scale * parentSize.width) + udim2.X.Offset,
      y: (udim2.Y.Scale * parentSize.height) + udim2.Y.Offset
    }
  }, [])

  const udim2SizeToPixels = useCallback((udim2Size: { X: { Scale: number; Offset: number }; Y: { Scale: number; Offset: number } }, parentSize: { width: number; height: number }): { width: number; height: number } => {
    return {
      width: Math.max(20, (udim2Size.X.Scale * parentSize.width) + udim2Size.X.Offset),
      height: Math.max(20, (udim2Size.Y.Scale * parentSize.height) + udim2Size.Y.Offset)
    }
  }, [])

  const getAbsolutePosition = useCallback((element: UIElement): { x: number; y: number } => {
    if (!element.parent || element.parent === 'script.Parent') {
      const pixelPosition = element.properties.Position ? 
        udim2ToPixels(element.properties.Position, viewport.size) : 
        element.position
      return pixelPosition
    }
    
    const parentElement = elements.find(el => 
      el.id === element.parent || el.name.replace(/\s+/g, '') === element.parent
    )
    
    if (!parentElement) {
      return element.position
    }
    
    const parentAbsPos = getAbsolutePosition(parentElement)
    const parentPixelSize = parentElement.properties.Size ? 
      udim2SizeToPixels(parentElement.properties.Size, viewport.size) : 
      parentElement.size
    
    const childPixelPosition = element.properties.Position ? 
      udim2ToPixels(element.properties.Position, parentPixelSize) : 
      element.position
    
    return {
      x: parentAbsPos.x + childPixelPosition.x,
      y: parentAbsPos.y + childPixelPosition.y
    }
  }, [elements, udim2ToPixels, udim2SizeToPixels, viewport.size])

  // CRITICAL: Always recalculate size from UDim2 when viewport changes
  const getCanvasSize = useCallback(() => {
    const parentElement = element.parent && element.parent !== 'script.Parent' ? 
      elements.find(el => el.id === element.parent || el.name.replace(/\s+/g, '') === element.parent) : 
      null
    const parentSize = parentElement ? 
      (parentElement.properties.Size ? 
        udim2SizeToPixels(parentElement.properties.Size, viewport.size) : 
        parentElement.size) : 
      viewport.size
    
    return element.properties.Size ? 
      udim2SizeToPixels(element.properties.Size, parentSize) : 
      element.size
  }, [element, elements, viewport.size, udim2SizeToPixels])

  const canvasSize = overrideSize || getCanvasSize()
  
  const canvasPosition = overridePosition || (() => {
    const absolutePosition = getAbsolutePosition(element)
    const anchorPoint = element.properties.AnchorPoint || { X: 0, Y: 0 }
    const anchorOffsetX = canvasSize.width * anchorPoint.X
    const anchorOffsetY = canvasSize.height * anchorPoint.Y
    return {
      x: absolutePosition.x - anchorOffsetX,
      y: absolutePosition.y - anchorOffsetY
    }
  })()
  const anchorPoint = element.properties.AnchorPoint || { X: 0, Y: 0 }
  const anchorOffsetX = canvasSize.width * anchorPoint.X
  const anchorOffsetY = canvasSize.height * anchorPoint.Y

  console.log('🎯 DragHandles INSTANT UPDATE SYSTEM:', {
    elementName: element.name,
    isDragging,
    isResizing,
    canvasPosition,
    canvasSize
  })

  const handleMoveStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (activeTool !== 'move') return
    
    e.preventDefault()
    e.stopPropagation()
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    console.log('🚀 DRAG START - instant updates enabled')
    setIsDragging(true)
    setDragStart({ x: clientX, y: clientY })
    setInitialBounds({ x: canvasPosition.x, y: canvasPosition.y, width: canvasSize.width, height: canvasSize.height })
  }, [activeTool, canvasPosition, canvasSize])

  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent, handle: string) => {
    if (activeTool !== 'resize') return
    
    e.preventDefault()
    e.stopPropagation()
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    console.log('🚀 RESIZE START - freezing DOM structure')
    setIsResizing(true)
    setResizeHandle(handle)
    setDragStart({ x: clientX, y: clientY })
    setInitialBounds({ x: canvasPosition.x, y: canvasPosition.y, width: canvasSize.width, height: canvasSize.height })
    setVisualSize(null)
    setVisualPosition(null)
  }, [activeTool, canvasPosition, canvasSize])

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragStart || !initialBounds) return

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    const deltaX = (clientX - dragStart.x) / viewport.zoom
    const deltaY = (clientY - dragStart.y) / viewport.zoom

    if (isDragging) {
      // INSTANT UPDATE - Update element position immediately so it follows cursor
      const newAnchoredX = initialBounds.x + deltaX
      const newAnchoredY = initialBounds.y + deltaY
      const anchorOffsetX = canvasSize.width * anchorPoint.X
      const anchorOffsetY = canvasSize.height * anchorPoint.Y
      const newAbsoluteX = newAnchoredX + anchorOffsetX
      const newAbsoluteY = newAnchoredY + anchorOffsetY
      
      console.log('✨ INSTANT DRAG - element follows cursor immediately')
      onDrag(element.id, { x: newAbsoluteX, y: newAbsoluteY })
    } else if (isResizing && resizeHandle) {
      let newX = initialBounds.x
      let newY = initialBounds.y
      let newWidth = initialBounds.width
      let newHeight = initialBounds.height

      switch (resizeHandle) {
        case 'top-left':
          newX = initialBounds.x + deltaX
          newY = initialBounds.y + deltaY
          newWidth = initialBounds.width - deltaX
          newHeight = initialBounds.height - deltaY
          break
        case 'top-right':
          newY = initialBounds.y + deltaY
          newWidth = initialBounds.width + deltaX
          newHeight = initialBounds.height - deltaY
          break
        case 'bottom-left':
          newX = initialBounds.x + deltaX
          newWidth = initialBounds.width - deltaX
          newHeight = initialBounds.height + deltaY
          break
        case 'bottom-right':
          newWidth = initialBounds.width + deltaX
          newHeight = initialBounds.height + deltaY
          break
        case 'top':
          newY = initialBounds.y + deltaY
          newHeight = initialBounds.height - deltaY
          break
        case 'bottom':
          newHeight = initialBounds.height + deltaY
          break
        case 'left':
          newX = initialBounds.x + deltaX
          newWidth = initialBounds.width - deltaX
          break
        case 'right':
          newWidth = initialBounds.width + deltaX
          break
      }

      newWidth = Math.max(20, newWidth)
      newHeight = Math.max(20, newHeight)

      // VISUAL-ONLY UPDATE
      console.log('🎨 VISUAL RESIZE - CSS only, NO state updates')
      setVisualSize({ width: newWidth, height: newHeight })
      if (newX !== initialBounds.x || newY !== initialBounds.y) {
        setVisualPosition({ x: newX, y: newY })
      } else {
        setVisualPosition(null)
      }
    }
  }, [dragStart, initialBounds, isDragging, isResizing, resizeHandle, viewport.zoom, element.id, onDrag, canvasSize.width, canvasSize.height, anchorPoint.X, anchorPoint.Y])

  const handleDragEnd = useCallback(() => {
    if (!initialBounds) return

    if (isResizing && visualSize) {
      // SINGLE ATOMIC COMMIT for resize
      console.log('✅ RESIZE END - committing final size in SINGLE atomic update')
      if (visualPosition) {
        const newAbsoluteX = visualPosition.x + anchorOffsetX
        const newAbsoluteY = visualPosition.y + anchorOffsetY
        onResizeEnd(element.id, visualSize, { x: newAbsoluteX, y: newAbsoluteY })
      } else {
        onResizeEnd(element.id, visualSize)
      }
    }

    console.log('✅ DRAG END - cleanup')
    setIsDragging(false)
    setIsResizing(false)
    setDragStart(null)
    setInitialBounds(null)
    setResizeHandle(null)
    setVisualSize(null)
    setVisualPosition(null)
  }, [isResizing, visualSize, visualPosition, initialBounds, anchorOffsetX, anchorOffsetY, element.id, onResizeEnd])

  React.useEffect(() => {
    if (isDragging || isResizing) {
      const handleMouseMove = (e: MouseEvent) => handleDragMove(e)
      const handleTouchMove = (e: TouchEvent) => {
        try {
          e.preventDefault()
        } catch (error) {
          // Ignore passive event listener errors
        }
        handleDragMove(e)
      }
      const handleMouseUp = () => handleDragEnd()
      const handleTouchEnd = () => handleDragEnd()

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchend', handleTouchEnd)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging, isResizing, handleDragMove, handleDragEnd])

  if (activeTool === 'select' || activeTool === 'pan') return <></>

  const displayPosition = visualPosition || canvasPosition
  const displaySize = visualSize || canvasSize

  return (
    <>
      {/* Move Handle - Instant dragging */}
      {activeTool === 'move' && (
        <div
          className="absolute cursor-move pointer-events-auto touch-manipulation"
          style={{
            left: canvasPosition.x,
            top: canvasPosition.y,
            width: canvasSize.width,
            height: canvasSize.height,
            zIndex: 1000
          }}
          onMouseDown={handleMoveStart}
          onTouchStart={handleMoveStart}
        >
          <div className="absolute inset-0 border-2 border-blue-400 border-dashed bg-blue-400/10 rounded" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white p-1 rounded text-xs pointer-events-none">
            <Move className="w-3 h-3" />
          </div>
        </div>
      )}

      {/* Resize Handles */}
      {activeTool === 'resize' && (
        <>
          <div
            className="absolute border-2 border-blue-400 border-dashed bg-blue-400/10 rounded pointer-events-none"
            style={{
              left: displayPosition.x,
              top: displayPosition.y,
              width: displaySize.width,
              height: displaySize.height,
              zIndex: 999
            }}
          />
          
          {[
            { position: 'top-left', cursor: 'nw-resize', left: -6, top: -6 },
            { position: 'top-right', cursor: 'ne-resize', left: displaySize.width - 6, top: -6 },
            { position: 'bottom-left', cursor: 'sw-resize', left: -6, top: displaySize.height - 6 },
            { position: 'bottom-right', cursor: 'se-resize', left: displaySize.width - 6, top: displaySize.height - 6 }
          ].map((handle) => (
            <div
              key={handle.position}
              className="absolute w-6 h-6 md:w-3 md:h-3 bg-blue-500 border border-white rounded-sm pointer-events-auto touch-manipulation"
              style={{
                left: displayPosition.x + handle.left,
                top: displayPosition.y + handle.top,
                cursor: handle.cursor,
                zIndex: 1001
              }}
              onMouseDown={(e) => handleResizeStart(e, handle.position)}
              onTouchStart={(e) => handleResizeStart(e, handle.position)}
            />
          ))}

          {[
            { position: 'top', cursor: 'n-resize', left: displaySize.width / 2 - 6, top: -6 },
            { position: 'right', cursor: 'e-resize', left: displaySize.width - 6, top: displaySize.height / 2 - 6 },
            { position: 'bottom', cursor: 's-resize', left: displaySize.width / 2 - 6, top: displaySize.height - 6 },
            { position: 'left', cursor: 'w-resize', left: -6, top: displaySize.height / 2 - 6 }
          ].map((handle) => (
            <div
              key={handle.position}
              className="absolute w-6 h-6 md:w-3 md:h-3 bg-blue-500 border border-white rounded-sm pointer-events-auto touch-manipulation"
              style={{
                left: displayPosition.x + handle.left,
                top: displayPosition.y + handle.top,
                cursor: handle.cursor,
                zIndex: 1001
              }}
              onMouseDown={(e) => handleResizeStart(e, handle.position)}
              onTouchStart={(e) => handleResizeStart(e, handle.position)}
            />
          ))}
        </>
      )}
    </>
  )
}
