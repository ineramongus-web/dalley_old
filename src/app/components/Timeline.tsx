'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, Square, Plus, Trash2 } from 'lucide-react'
import type { RobloxElement, AnimationKeyframe } from '../../types/roblox'

interface TimelineProps {
  elements: RobloxElement[]
  keyframes: AnimationKeyframe[]
  currentTime: number
  isPlaying: boolean
  duration: number
  onTimeChange: (time: number) => void
  onPlayToggle: () => void
  onAddKeyframe: (elementId: string, time: number, properties: Partial<RobloxElement['properties']>) => void
  onUpdateKeyframe: (id: string, updates: Partial<AnimationKeyframe>) => void
  onDeleteKeyframe: (id: string) => void
}

export default function Timeline({
  elements,
  keyframes,
  currentTime,
  isPlaying,
  duration,
  onTimeChange,
  onPlayToggle,
  onAddKeyframe,
  onUpdateKeyframe,
  onDeleteKeyframe
}: TimelineProps): JSX.Element {
  const [draggedKeyframe, setDraggedKeyframe] = useState<string | null>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  // Animation playback
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      onTimeChange((prevTime) => {
        const newTime = prevTime + 1/60 // 60 FPS
        if (newTime >= duration) {
          return 0 // Loop back to start
        }
        return newTime
      })
    }, 1000/60)

    return () => clearInterval(interval)
  }, [isPlaying, duration, onTimeChange])

  const handleTimelineClick = (e: React.MouseEvent): void => {
    if (!timelineRef.current) return
    
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const timelineWidth = rect.width - 128 // Account for track labels
    const clickedTime = (x - 128) / timelineWidth * duration
    
    if (clickedTime >= 0 && clickedTime <= duration) {
      onTimeChange(Math.max(0, Math.min(duration, clickedTime)))
    }
  }

  const handleKeyframeDrag = (keyframeId: string, e: React.MouseEvent): void => {
    e.preventDefault()
    setDraggedKeyframe(keyframeId)
    
    const handleMouseMove = (e: MouseEvent): void => {
      if (!timelineRef.current) return
      
      const rect = timelineRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const timelineWidth = rect.width - 128
      const newTime = (x - 128) / timelineWidth * duration
      
      if (newTime >= 0 && newTime <= duration) {
        onUpdateKeyframe(keyframeId, { time: Math.max(0, Math.min(duration, newTime)) })
      }
    }
    
    const handleMouseUp = (): void => {
      setDraggedKeyframe(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const addKeyframeAtCurrentTime = (elementId: string): void => {
    const element = elements.find(el => el.id === elementId)
    if (!element) return
    
    onAddKeyframe(elementId, currentTime, {
      Position: element.properties.Position,
      Size: element.properties.Size,
      BackgroundColor3: element.properties.BackgroundColor3,
      BackgroundTransparency: element.properties.BackgroundTransparency
    })
  }

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    const frames = Math.floor((time % 1) * 60)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Timeline Controls */}
      <div className="p-2 sm:p-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onPlayToggle}
            className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] text-black hover:opacity-80 transition-opacity"
          >
            {isPlaying ? <Pause className="w-3 h-3 sm:w-4 sm:h-4" /> : <Play className="w-3 h-3 sm:w-4 sm:h-4" />}
          </button>
          
          <button
            onClick={() => {
              onTimeChange(0)
            }}
            className="p-1.5 sm:p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
          >
            <Square className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
        
        <div className="text-xs sm:text-sm text-gray-300 font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-auto">
        <div
          ref={timelineRef}
          className="relative min-h-full cursor-pointer"
          onClick={handleTimelineClick}
        >
          {/* Time ruler */}
          <div className="h-8 border-b border-gray-800 flex">
            <div className="w-24 sm:w-32 bg-gray-800 border-r border-gray-700 flex items-center justify-center text-xs text-gray-400">
              Time
            </div>
            <div className="flex-1 relative">
              {Array.from({ length: Math.ceil(duration) + 1 }, (_, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full border-l border-gray-700 flex items-center"
                  style={{ left: `${(i / duration) * 100}%` }}
                >
                  <span className="text-xs text-gray-400 ml-1">{i}s</span>
                </div>
              ))}
              
              {/* Current time indicator */}
              <div
                className="absolute top-0 w-0.5 h-full bg-purple-400 z-10"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          </div>

          {/* Element tracks */}
          {elements.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400">
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-2 opacity-50">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm">No elements to animate</p>
                <p className="text-xs">Add elements to create animations</p>
              </div>
            </div>
          ) : (
            elements.map((element, index) => {
              const elementKeyframes = keyframes.filter(kf => kf.elementId === element.id)
              
              return (
                <div key={element.id} className="h-12 border-b border-gray-800 flex">
                  <div className="w-24 sm:w-32 bg-gray-800 border-r border-gray-700 flex items-center justify-between px-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-white truncate">{element.name}</div>
                      <div className="text-xs text-gray-400">{element.type}</div>
                    </div>
                    <button
                      onClick={() => addKeyframeAtCurrentTime(element.id)}
                      className="p-1 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
                      title="Add keyframe at current time"
                    >
                      <Plus className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                  
                  <div className="flex-1 relative">
                    {/* Keyframes */}
                    {elementKeyframes.map((keyframe) => (
                      <div
                        key={keyframe.id}
                        className={`absolute top-2 w-2 h-8 rounded cursor-move group ${
                          draggedKeyframe === keyframe.id ? 'bg-purple-300' : 'bg-purple-500 hover:bg-purple-400'
                        }`}
                        style={{ left: `${(keyframe.time / duration) * 100}%` }}
                        onMouseDown={(e) => handleKeyframeDrag(keyframe.id, e)}
                        title={`Keyframe at ${formatTime(keyframe.time)}`}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteKeyframe(keyframe.id)
                          }}
                          className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <Trash2 className="w-2 h-2 text-white" />
                        </button>
                      </div>
                    ))}
                    
                    {/* Current time indicator */}
                    <div
                      className="absolute top-0 w-0.5 h-full bg-purple-400 z-10 pointer-events-none"
                      style={{ left: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}