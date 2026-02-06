'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ZoomIn, ZoomOut, RotateCcw, Smartphone, Tablet, Monitor, Grid3X3 } from 'lucide-react'
import type { RobloxElement, AnimationKeyframe } from '../../types/roblox'

interface CanvasProps {
  elements: RobloxElement[]
  selectedElement: string | null
  onSelectElement: (id: string | null) => void
  currentTime: number
  keyframes: AnimationKeyframe[]
}

interface DevicePreset {
  name: string
  width: number
  height: number
  icon: React.ComponentType<{ className?: string }>
}

const devicePresets: DevicePreset[] = [
  { name: 'Mobile', width: 320, height: 568, icon: Smartphone },
  { name: 'Tablet', width: 768, height: 1024, icon: Tablet },
  { name: 'Desktop', width: 1200, height: 800, icon: Monitor }
]

export default function Canvas({ 
  elements, 
  selectedElement, 
  onSelectElement, 
  currentTime, 
  keyframes 
}: CanvasProps): JSX.Element {
  const [zoom, setZoom] = useState<number>(0.6)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [selectedDevice, setSelectedDevice] = useState<DevicePreset>(devicePresets[0])
  const [showGrid, setShowGrid] = useState<boolean>(true)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent): void => {
    if (e.target === canvasRef.current) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent): void => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = (): void => {
    setIsDragging(false)
  }

  const resetView = (): void => {
    setZoom(0.6)
    setPan({ x: 0, y: 0 })
  }

  const getElementStyle = (element: RobloxElement): React.CSSProperties => {
    // Find the latest keyframe for this element at current time
    const elementKeyframes = keyframes
      .filter(kf => kf.elementId === element.id && kf.time <= currentTime)
      .sort((a, b) => b.time - a.time)
    
    const latestKeyframe = elementKeyframes[0]
    const props = latestKeyframe ? { ...element.properties, ...latestKeyframe.properties } : element.properties

    const position = props.Position || { X: { Scale: 0, Offset: 0 }, Y: { Scale: 0, Offset: 0 } }
    const size = props.Size || { X: { Scale: 0.2, Offset: 0 }, Y: { Scale: 0.1, Offset: 0 } }
    const anchorPoint = props.AnchorPoint || { X: 0, Y: 0 }

    const left = (position.X.Scale * selectedDevice.width) + position.X.Offset - (size.X.Scale * selectedDevice.width + size.X.Offset) * anchorPoint.X
    const top = (position.Y.Scale * selectedDevice.height) + position.Y.Offset - (size.Y.Scale * selectedDevice.height + size.Y.Offset) * anchorPoint.Y
    const width = (size.X.Scale * selectedDevice.width) + size.X.Offset
    const height = (size.Y.Scale * selectedDevice.height) + size.Y.Offset

    const backgroundColor = props.BackgroundColor3 
      ? `rgb(${Math.round(props.BackgroundColor3.R * 255)}, ${Math.round(props.BackgroundColor3.G * 255)}, ${Math.round(props.BackgroundColor3.B * 255)})`
      : 'rgb(255, 255, 255)'
    
    const borderColor = props.BorderColor3
      ? `rgb(${Math.round(props.BorderColor3.R * 255)}, ${Math.round(props.BorderColor3.G * 255)}, ${Math.round(props.BorderColor3.B * 255)})`
      : 'rgb(0, 0, 0)'

    return {
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      backgroundColor,
      borderWidth: `${props.BorderSizePixel || 1}px`,
      borderColor,
      borderStyle: 'solid',
      opacity: 1 - (props.BackgroundTransparency || 0),
      zIndex: props.ZIndex || 1,
      overflow: props.ClipsDescendants ? 'hidden' : 'visible',
      borderRadius: props.UICorner ? `${props.UICorner.CornerRadius}px` : '0px',
      cursor: 'pointer',
      boxSizing: 'border-box'
    }
  }

  const renderElement = (element: RobloxElement): JSX.Element => {
    const style = getElementStyle(element)
    const isSelected = selectedElement === element.id
    const props = element.properties

    let content: React.ReactNode = null

    if (element.type === 'TextLabel' || element.type === 'TextButton' || element.type === 'TextBox') {
      const textColor = props.TextColor3 
        ? `rgb(${Math.round(props.TextColor3.R * 255)}, ${Math.round(props.TextColor3.G * 255)}, ${Math.round(props.TextColor3.B * 255)})`
        : 'rgb(0, 0, 0)'
      
      content = (
        <div
          style={{
            color: textColor,
            fontSize: `${props.TextSize || 14}px`,
            fontFamily: props.Font || 'Arial',
            textAlign: props.TextXAlignment === 'Left' ? 'left' : props.TextXAlignment === 'Right' ? 'right' : 'center',
            display: 'flex',
            alignItems: props.TextYAlignment === 'Top' ? 'flex-start' : props.TextYAlignment === 'Bottom' ? 'flex-end' : 'center',
            justifyContent: props.TextXAlignment === 'Left' ? 'flex-start' : props.TextXAlignment === 'Right' ? 'flex-end' : 'center',
            width: '100%',
            height: '100%',
            padding: '4px',
            boxSizing: 'border-box'
          }}
        >
          {props.Text || 'Text'}
        </div>
      )
    } else if (element.type === 'ImageLabel' || element.type === 'ImageButton') {
      if (props.Image) {
        content = (
          <img
            src={props.Image}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: props.ScaleType === 'Fit' ? 'contain' : props.ScaleType === 'Crop' ? 'cover' : 'fill',
              opacity: 1 - (props.ImageTransparency || 0)
            }}
          />
        )
      }
    }

    return (
      <div
        style={{
          ...style,
          outline: isSelected ? '2px solid #a855f7' : 'none',
          outlineOffset: '2px'
        }}
        onClick={(e) => {
          e.stopPropagation()
          onSelectElement(element.id)
        }}
        title={element.name}
      >
        {content}
      </div>
    )
  }

  return (
    <div className="flex-1 bg-gray-950 relative overflow-hidden flex flex-col">
      {/* Controls */}
      <div className="p-2 sm:p-4 bg-gray-900 border-b border-gray-800 flex-shrink-0">
        <div className="flex flex-wrap gap-2">
          {/* Device Selection */}
          <div className="flex bg-gray-800 rounded-lg p-1">
            {devicePresets.map((device) => {
              const IconComponent = device.icon
              return (
                <button
                  key={device.name}
                  onClick={() => setSelectedDevice(device)}
                  className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                    selectedDevice.name === device.name
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                  title={`${device.name} (${device.width}x${device.height})`}
                >
                  <IconComponent className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              )
            })}
          </div>

          {/* Zoom Controls */}
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <span className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-300 min-w-[3rem] sm:min-w-[4rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* View Controls */}
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                showGrid
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              title="Toggle Grid"
            >
              <Grid3X3 className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={resetView}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Device Info */}
          <div className="bg-gray-800 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-300">
            {selectedDevice.name}: {selectedDevice.width} × {selectedDevice.height}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => onSelectElement(null)}
      >
        <div
          className="relative bg-white shadow-2xl"
          style={{
            width: selectedDevice.width * zoom,
            height: selectedDevice.height * zoom,
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            backgroundImage: showGrid 
              ? `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`
              : 'none',
            backgroundSize: showGrid ? `${20 * zoom}px ${20 * zoom}px` : 'auto'
          }}
        >
          <div
            style={{
              width: selectedDevice.width,
              height: selectedDevice.height,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              position: 'relative'
            }}
          >
            {elements.map((element) => (
              <React.Fragment key={element.id}>
                {renderElement(element)}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}