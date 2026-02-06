'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useMemo, useState, useEffect } from 'react'
import { AlertTriangle, Info, XCircle } from 'lucide-react'
import type { UIElement } from '@/types/roblox'

interface Warning {
  id: string
  type: 'error' | 'warning' | 'info'
  message: string
  elementId: string
}

interface SmartWarningsProps {
  elements: UIElement[]
  selectedElement: string | null
}

export function SmartWarnings({ elements, selectedElement }: SmartWarningsProps): JSX.Element {
  // Track visible warnings with timestamps for auto-hide
  const [visibleWarnings, setVisibleWarnings] = useState<Map<string, number>>(new Map())

  // Generate warnings based on current UI state
  const warnings = useMemo(() => {
    const warns: Warning[] = []

    elements.forEach((element) => {
      // Warning: Gradient on stroke with dark/black color (gradient will be invisible)
      if (element.properties.UIStroke?.UIGradient && element.properties.UIStroke.Color) {
        const color = element.properties.UIStroke.Color
        const brightness = (color.R + color.G + color.B) / 3
        if (brightness < 0.5) {
          warns.push({
            id: `${element.id}-stroke-dark-gradient`,
            type: 'warning',
            message: `"${element.name}": UIStroke color is dark (${Math.round(brightness * 100)}% brightness). Gradient may be barely visible. Use white (Color3.new(1,1,1)) for best gradient visibility.`,
            elementId: element.id
          })
        }
      }

      // Warning: UICorner radius larger than element size
      if (element.properties.UICorner?.CornerRadius?.Offset) {
        const radius = element.properties.UICorner.CornerRadius.Offset
        const minSize = Math.min(element.size.width, element.size.height)
        if (radius > minSize / 2) {
          warns.push({
            id: `${element.id}-corner-size-mismatch`,
            type: 'warning',
            message: `"${element.name}": Corner radius (${radius}px) is larger than half the smallest dimension (${Math.round(minSize / 2)}px). This may cause unexpected rendering.`,
            elementId: element.id
          })
        }
      }

      // Warning: UIStroke thickness too large for element size
      if (element.properties.UIStroke?.Thickness && element.properties.UIStroke.StrokeSizingMode === 'FixedSize') {
        const thickness = element.properties.UIStroke.Thickness
        const minSize = Math.min(element.size.width, element.size.height)
        if (thickness > minSize / 4) {
          warns.push({
            id: `${element.id}-stroke-thick`,
            type: 'info',
            message: `"${element.name}": UIStroke thickness (${thickness}px) is quite large relative to element size (${Math.round(minSize)}px). Consider using ScaledSize mode for better responsiveness.`,
            elementId: element.id
          })
        }
      }

      // Warning: Element with parent ClipsDescendants may be clipped
      if (element.parent && element.parent !== 'script.Parent') {
        const parentElement = elements.find(el => el.id === element.parent || el.name.replace(/\s+/g, '') === element.parent)
        if (parentElement?.properties.ClipsDescendants) {
          // Check if element extends beyond parent bounds
          const parentSize = parentElement.size
          const elementPosition = element.position
          const elementSize = element.size

          const isOutside = 
            elementPosition.x < 0 ||
            elementPosition.y < 0 ||
            elementPosition.x + elementSize.width > parentSize.width ||
            elementPosition.y + elementSize.height > parentSize.height

          if (isOutside) {
            warns.push({
              id: `${element.id}-clipped`,
              type: 'warning',
              message: `"${element.name}": Element extends outside parent "${parentElement.name}" which has ClipsDescendants enabled. Content will be clipped.`,
              elementId: element.id
            })
          }
        }
      }

      // Warning: Text element with TextScaled but no size constraints
      if (element.properties.TextScaled && !element.properties.TextSize) {
        warns.push({
          id: `${element.id}-textscaled-nosize`,
          type: 'info',
          message: `"${element.name}": TextScaled is enabled without TextSize constraint. Text may scale unexpectedly.`,
          elementId: element.id
        })
      }

      // Warning: Transparent background with no border/stroke
      if (element.properties.BackgroundTransparency === 1 && 
          !element.properties.UIStroke && 
          (element.properties.BorderSizePixel === 0 || !element.properties.BorderSizePixel)) {
        warns.push({
          id: `${element.id}-invisible`,
          type: 'info',
          message: `"${element.name}": Element is fully transparent with no border or stroke. It may be invisible unless it contains visible children.`,
          elementId: element.id
        })
      }

      // Warning: UIListLayout and UIGridLayout conflict
      if (element.properties.UIListLayout && element.properties.UIGridLayout) {
        warns.push({
          id: `${element.id}-layout-conflict`,
          type: 'error',
          message: `"${element.name}": Cannot have both UIListLayout and UIGridLayout. Only one layout should be active.`,
          elementId: element.id
        })
      }

      // Warning: Very small element (may be hard to interact with)
      const area = element.size.width * element.size.height
      if (area < 100) {
        warns.push({
          id: `${element.id}-too-small`,
          type: 'info',
          message: `"${element.name}": Element is very small (${element.size.width}×${element.size.height}). May be difficult to interact with on mobile devices.`,
          elementId: element.id
        })
      }

      // Warning: UIStroke with ScaledSize but thickness > 1 (may be too large)
      if (element.properties.UIStroke?.StrokeSizingMode === 'ScaledSize' && element.properties.UIStroke.Thickness > 0.1) {
        warns.push({
          id: `${element.id}-scaled-stroke-large`,
          type: 'warning',
          message: `"${element.name}": UIStroke ScaledSize thickness is ${(element.properties.UIStroke.Thickness * 100).toFixed(0)}% of element size. This may appear very thick. Consider values between 0.01-0.05 (1-5%).`,
          elementId: element.id
        })
      }

      // Warning: Gradient on element background with very low opacity
      if (element.properties.UIGradient && element.properties.BackgroundTransparency > 0.9) {
        warns.push({
          id: `${element.id}-gradient-invisible-bg`,
          type: 'warning',
          message: `"${element.name}": Has gradient but background transparency is ${(element.properties.BackgroundTransparency * 100).toFixed(0)}%. Gradient will be barely visible.`,
          elementId: element.id
        })
      }

      // Warning: Text element with empty text
      if ((element.type === 'TextLabel' || element.type === 'TextButton' || element.type === 'TextBox') && !element.properties.Text) {
        warns.push({
          id: `${element.id}-empty-text`,
          type: 'info',
          message: `"${element.name}": Text element has no text content. Add text or consider using a Frame instead.`,
          elementId: element.id
        })
      }

      // Warning: Image element with no image source
      if ((element.type === 'ImageLabel' || element.type === 'ImageButton') && !element.properties.Image) {
        warns.push({
          id: `${element.id}-no-image`,
          type: 'info',
          message: `"${element.name}": Image element has no image source. Add an image URL or rbxassetid.`,
          elementId: element.id
        })
      }

      // Warning: Text color same as background color
      if (element.properties.TextColor3 && element.properties.BackgroundColor3) {
        const textColor = element.properties.TextColor3
        const bgColor = element.properties.BackgroundColor3
        const colorDiff = Math.abs(textColor.R - bgColor.R) + Math.abs(textColor.G - bgColor.G) + Math.abs(textColor.B - bgColor.B)
        if (colorDiff < 0.3) {
          warns.push({
            id: `${element.id}-poor-contrast`,
            type: 'warning',
            message: `"${element.name}": Text color and background color are very similar. Text may be hard to read. Increase contrast for better readability.`,
            elementId: element.id
          })
        }
      }

      // Warning: Element positioned outside canvas bounds
      if (element.position.x < -element.size.width || element.position.y < -element.size.height) {
        warns.push({
          id: `${element.id}-off-canvas`,
          type: 'warning',
          message: `"${element.name}": Element is positioned completely outside the canvas. It will not be visible unless moved or the canvas is adjusted.`,
          elementId: element.id
        })
      }

      // Warning: Very large element (performance concern)
      if (area > 500000) {
        warns.push({
          id: `${element.id}-too-large`,
          type: 'info',
          message: `"${element.name}": Element is very large (${element.size.width}×${element.size.height}). This may impact performance, especially on mobile devices.`,
          elementId: element.id
        })
      }

      // Warning: Overlapping elements with same ZIndex
      elements.forEach((otherElement) => {
        if (otherElement.id !== element.id && otherElement.properties.ZIndex === element.properties.ZIndex) {
          // Check if elements overlap
          const overlap = !(element.position.x + element.size.width < otherElement.position.x ||
                           otherElement.position.x + otherElement.size.width < element.position.x ||
                           element.position.y + element.size.height < otherElement.position.y ||
                           otherElement.position.y + otherElement.size.height < element.position.y)
          
          if (overlap) {
            warns.push({
              id: `${element.id}-zindex-conflict-${otherElement.id}`,
              type: 'info',
              message: `"${element.name}" and "${otherElement.name}" overlap and have the same ZIndex (${element.properties.ZIndex}). Render order may be unpredictable.`,
              elementId: element.id
            })
          }
        }
      })
    })

    return warns
  }, [elements])

  // Update visible warnings map when warnings change
  useEffect(() => {
    const now = Date.now()
    const newVisibleWarnings = new Map(visibleWarnings)
    
    // Add new warnings with current timestamp
    warnings.forEach(warning => {
      if (!newVisibleWarnings.has(warning.id)) {
        newVisibleWarnings.set(warning.id, now)
      }
    })
    
    // Remove warnings that are no longer relevant (not in current warnings)
    const currentWarningIds = new Set(warnings.map(w => w.id))
    for (const [id] of newVisibleWarnings) {
      if (!currentWarningIds.has(id)) {
        newVisibleWarnings.delete(id)
      }
    }
    
    setVisibleWarnings(newVisibleWarnings)
  }, [warnings])

  // Auto-hide timer: Remove warnings after 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const updatedWarnings = new Map(visibleWarnings)
      let hasChanges = false
      
      for (const [id, timestamp] of updatedWarnings) {
        if (now - timestamp >= 5000) {
          updatedWarnings.delete(id)
          hasChanges = true
        }
      }
      
      if (hasChanges) {
        setVisibleWarnings(updatedWarnings)
      }
    }, 100) // Check every 100ms for smooth fade-out
    
    return () => clearInterval(interval)
  }, [visibleWarnings])

  // Filter warnings: only show those that are still visible and relevant
  const activeWarnings = warnings.filter(w => visibleWarnings.has(w.id))
  const relevantWarnings = selectedElement 
    ? activeWarnings.filter(w => w.elementId === selectedElement)
    : activeWarnings

  if (relevantWarnings.length === 0) return <></>

  const getIcon = (type: Warning['type']) => {
    switch (type) {
      case 'error':
        return <XCircle className="w-4 h-4" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />
      case 'info':
        return <Info className="w-4 h-4" />
    }
  }

  const getColors = (type: Warning['type']) => {
    switch (type) {
      case 'error':
        return 'bg-red-500/10 border-red-500/30 text-red-300'
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
      case 'info':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-300'
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md space-y-2">
      <AnimatePresence>
        {relevantWarnings.slice(0, 3).map((warning) => (
          <motion.div
            key={warning.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`p-3 rounded-lg border backdrop-blur-sm ${getColors(warning.type)}`}
          >
            <div className="flex items-start gap-2">
              {getIcon(warning.type)}
              <p className="text-sm flex-1">{warning.message}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {relevantWarnings.length > 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-gray-400 text-center"
        >
          +{relevantWarnings.length - 3} more warnings
        </motion.div>
      )}
    </div>
  )
}
