'use client'

import React, { memo } from 'react'
import type { UIElement } from '@/types/roblox'

interface CanvasElementProps {
  element: UIElement
  isSelected: boolean
  onSelectElement: (id: string) => void
  activeTool: 'select' | 'move' | 'resize' | 'pan'
  elementStyle: React.CSSProperties
  gradientStrokeStyle: React.CSSProperties | null
  properties: any
}

// Memoized element component - only re-renders when props actually change
const CanvasElementComponent = ({
  element,
  isSelected,
  onSelectElement,
  activeTool,
  elementStyle,
  gradientStrokeStyle,
  properties
}: CanvasElementProps): JSX.Element => {
  return (
    <div
      data-element-id={element.id}
      data-element-name={element.name}
      style={elementStyle}
      className={`canvas-element ${isSelected ? 'ring-2 ring-white ring-opacity-50' : ''} ${element.visible === false ? 'opacity-50' : ''}`}
      onClick={(e) => {
        if (activeTool === 'pan') return
        e.stopPropagation()
        // Only select if not already selected - prevents unnecessary re-renders
        if (!element.locked && !isSelected) {
          onSelectElement(element.id)
        }
      }}
    >
      {/* Gradient Stroke - Stable structure, always rendered */}
      <div
        style={{
          position: 'absolute',
          inset: gradientStrokeStyle?.inset || '0px',
          borderRadius: gradientStrokeStyle?.borderRadius || 0,
          background: gradientStrokeStyle?.background || 'transparent',
          WebkitMask: gradientStrokeStyle?.WebkitMask || 'none',
          WebkitMaskComposite: gradientStrokeStyle?.WebkitMaskComposite as any,
          maskComposite: gradientStrokeStyle?.maskComposite as any,
          padding: gradientStrokeStyle?.padding || '0px',
          pointerEvents: 'none',
          zIndex: -1,
          opacity: gradientStrokeStyle ? 1 : 0
        }}
      />

      {/* Element Content */}
      {element.type === 'TextLabel' || element.type === 'TextButton' || element.type === 'TextBox' ? (
        <span 
          className={`w-full h-full flex px-2 ${
            properties.TextYAlignment === 'Top' ? 'items-start' :
            properties.TextYAlignment === 'Bottom' ? 'items-end' : 'items-center'
          } ${
            properties.TextXAlignment === 'Left' ? 'justify-start text-left' :
            properties.TextXAlignment === 'Right' ? 'justify-end text-right' : 'justify-center text-center'
          }`}
        >
          {properties.Text || element.type}
        </span>
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

      {/* Selection Indicator - Always rendered, controlled by opacity */}
      <div
        className="absolute inset-0 border-2 border-white pointer-events-none transition-opacity duration-150"
        style={{ 
          borderRadius: 'inherit',
          opacity: isSelected ? 1 : 0,
          pointerEvents: 'none'
        }}
      />

      {/* Element Label - Always rendered, controlled by opacity */}
      <div
        className="absolute -top-6 left-0 bg-white text-black px-2 py-1 rounded text-xs font-medium transition-opacity duration-150"
        style={{
          opacity: isSelected ? 1 : 0,
          pointerEvents: isSelected ? 'auto' : 'none'
        }}
      >
        {element.name}
      </div>

      {/* Layout Indicators - Always rendered, controlled by visibility */}
      <div 
        className="absolute top-1 right-1 flex gap-1"
        style={{
          opacity: (properties.UIListLayout || properties.UIGridLayout) ? 1 : 0,
          pointerEvents: 'none'
        }}
      >
        {/* UIListLayout Badge */}
        <div
          className="bg-blue-500/90 text-white px-1 py-0.5 rounded text-xs font-medium flex items-center gap-1"
          style={{
            display: properties.UIListLayout ? 'flex' : 'none'
          }}
        >
          <span>📋</span>
          {properties.UIListLayout && (properties.UIListLayout.FillDirection === 'Horizontal' ? '↔' : '↕')}
        </div>
        {/* UIGridLayout Badge */}
        <div
          className="bg-green-500/90 text-white px-1 py-0.5 rounded text-xs font-medium flex items-center gap-1"
          style={{
            display: properties.UIGridLayout ? 'flex' : 'none'
          }}
        >
          <span>⬜</span>
          {properties.UIGridLayout && (properties.UIGridLayout.FillDirection === 'Horizontal' ? '→' : '↓')}
        </div>
      </div>
    </div>
  )
}

// Export WITHOUT memoization to ensure proper re-renders when elements overlap
// This prevents React from getting confused about DOM order when elements change position
export const CanvasElement = CanvasElementComponent
