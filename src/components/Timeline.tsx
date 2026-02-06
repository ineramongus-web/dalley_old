'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Plus,
  Trash2,
  Clock,
  ChevronDown,
  ChevronRight,
  Zap,
  Edit3,
  Target,
  Settings,
  Copy,
  X
} from 'lucide-react'
import type { AnimationKeyframe, UIElement, TimelineTrack, FunctionAnimation, ROBLOX_EVENTS } from '@/types/roblox'
import { ROBLOX_EVENTS } from '@/types/roblox'
import { KeyframeEditor } from './KeyframeEditor'

interface TimelineProps {
  animations: AnimationKeyframe[]
  elements: UIElement[]
  currentTime: number
  duration: number
  isPlaying: boolean
  selectedElement: string | null
  onTimeChange: (time: number) => void
  onDurationChange: (duration: number) => void
  onPlayToggle: () => void
  onAddKeyframe: (elementId: string, time: number, properties: Record<string, any>, sprSettings?: { dampingRatio: number; undampedFrequency: number }) => void
  onUpdateKeyframe: (id: string, updates: Partial<AnimationKeyframe>) => void
  onDeleteKeyframe: (id: string) => void
  onSelectElement?: (id: string | null) => void
  editingKeyframe: string | null
  setEditingKeyframe: (id: string | null) => void
  isEditingMode: boolean
  setIsEditingMode: (editing: boolean) => void
  editingFunction?: { elementId: string; functionId: string; animationId: string } | null
  setEditingFunction?: (editing: { elementId: string; functionId: string; animationId: string } | null) => void
  onExitFunctionEditing?: () => void
  functionAnimations?: FunctionAnimation[]
  setFunctionAnimations?: (animations: FunctionAnimation[]) => void
}

export function Timeline({
  animations,
  elements,
  currentTime,
  duration,
  isPlaying,
  selectedElement,
  onTimeChange,
  onDurationChange,
  onPlayToggle,
  onAddKeyframe,
  onUpdateKeyframe,
  onDeleteKeyframe,
  onSelectElement,
  editingKeyframe,
  setEditingKeyframe,
  isEditingMode,
  setIsEditingMode,
  editingFunction,
  setEditingFunction,
  onExitFunctionEditing,
  functionAnimations = [],
  setFunctionAnimations
}: TimelineProps): JSX.Element {
  const timelineRef = useRef<HTMLDivElement>(null)
  const [expandedTracks, setExpandedTracks] = useState<Set<string>>(new Set())
  const [draggedKeyframe, setDraggedKeyframe] = useState<string | null>(null)

  // Get current function animation keyframes if editing a function
  const currentFunctionKeyframes = editingFunction ? 
    functionAnimations.find(anim => anim.id === editingFunction.animationId)?.keyframes || [] : []
  
  // Create timeline tracks from elements
  const tracks: TimelineTrack[] = elements.map(element => {
    let elementKeyframes: AnimationKeyframe[] = []
    
    if (editingFunction) {
      // When editing function, show function keyframes for all elements but highlight the target
      elementKeyframes = currentFunctionKeyframes.filter(kf => kf.elementId === element.id)
    } else {
      // Normal mode: show regular animations but grey them out if any function is being edited
      elementKeyframes = animations.filter(anim => anim.elementId === element.id)
    }
    
    return {
      elementId: element.id,
      elementName: element.name,
      keyframes: elementKeyframes,
      expanded: expandedTracks.has(element.id)
    }
  })

  // Timeline scale (pixels per second)
  const timelineScale = 100

  // Toggle track expansion
  const toggleTrack = (elementId: string): void => {
    const newExpanded = new Set(expandedTracks)
    if (newExpanded.has(elementId)) {
      newExpanded.delete(elementId)
    } else {
      newExpanded.add(elementId)
    }
    setExpandedTracks(newExpanded)
  }

  // Handle timeline click/touch to set current time
  const handleTimelineClick = (e: React.MouseEvent | React.TouchEvent): void => {
    if (!timelineRef.current || draggedKeyframe) return
    
    const rect = timelineRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const x = clientX - rect.left
    const currentDuration = editingFunction ? 
      functionAnimations.find(anim => anim.id === editingFunction.animationId)?.duration || duration : 
      duration
    const time = Math.max(0, Math.min(currentDuration, x / timelineScale))
    onTimeChange(time)
  }

  // Handle timeline touch events for mobile
  const handleTimelineTouch = (e: React.TouchEvent): void => {
    e.preventDefault()
    if (!timelineRef.current || draggedKeyframe) return
    
    const rect = timelineRef.current.getBoundingClientRect()
    const touch = e.touches[0]
    const x = touch.clientX - rect.left
    const currentDuration = editingFunction ? 
      functionAnimations.find(anim => anim.id === editingFunction.animationId)?.duration || duration : 
      duration
    const time = Math.max(0, Math.min(currentDuration, x / timelineScale))
    onTimeChange(time)
  }

  // Add keyframe at current time
  const addKeyframeAtTime = (elementId: string): void => {
    const element = elements.find(el => el.id === elementId)
    if (!element) return

    if (editingFunction) {
      // When editing a function, add keyframe to the function animation
      const functionAnimation = functionAnimations.find(anim => anim.id === editingFunction.animationId)
      if (!functionAnimation) return

      // For SPR-style animation: Always copy element's CURRENT properties as the TARGET
      // This ensures the element base stays unchanged, and the keyframe represents where to animate TO
      const properties: Record<string, any> = {
        Position: JSON.parse(JSON.stringify(element.properties.Position)),
        Size: JSON.parse(JSON.stringify(element.properties.Size)),
        BackgroundColor3: JSON.parse(JSON.stringify(element.properties.BackgroundColor3)),
        BackgroundTransparency: element.properties.BackgroundTransparency || 0
      }

      // Add text properties for text elements
      const isTextElement = ['TextLabel', 'TextButton', 'TextBox'].includes(element.type)
      if (isTextElement) {
        properties.TextTransparency = element.properties.TextTransparency || 0
        properties.TextColor3 = JSON.parse(JSON.stringify(element.properties.TextColor3))
        properties.TextSize = element.properties.TextSize
        properties.Text = element.properties.Text
      }

      // Add image properties for image elements
      const isImageElement = ['ImageLabel', 'ImageButton'].includes(element.type)
      if (isImageElement) {
        properties.ImageTransparency = element.properties.ImageTransparency || 0
        properties.ImageColor3 = JSON.parse(JSON.stringify(element.properties.ImageColor3))
        properties.Image = element.properties.Image
      }

      const newKeyframe: AnimationKeyframe = {
        id: `func_keyframe_${Date.now()}`,
        elementId,
        time: currentTime,
        properties,
        easing: 'linear',
        sprSettings: {
          dampingRatio: 0.7,
          undampedFrequency: 4
        }
      }

      // Update function animation with new keyframe
      const updatedKeyframes = [...functionAnimation.keyframes, newKeyframe]
      const updatedAnimation = { ...functionAnimation, keyframes: updatedKeyframes }
      
      // Update function animations state
      setFunctionAnimations?.(functionAnimations.map(anim => 
        anim.id === editingFunction.animationId ? updatedAnimation : anim
      ))
      
      // Automatically enter editing mode for the new keyframe
      setEditingKeyframe(newKeyframe.id)
    } else {
      // Normal mode: add to regular animations
      // For SPR-style animation: Always copy element's CURRENT properties as the TARGET
      // This ensures the element base stays unchanged, and the keyframe represents where to animate TO
      const properties: Record<string, any> = {
        Position: JSON.parse(JSON.stringify(element.properties.Position)),
        Size: JSON.parse(JSON.stringify(element.properties.Size)),
        BackgroundColor3: JSON.parse(JSON.stringify(element.properties.BackgroundColor3)),
        BackgroundTransparency: element.properties.BackgroundTransparency || 0
      }

      // Add text properties for text elements
      const isTextElement = ['TextLabel', 'TextButton', 'TextBox'].includes(element.type)
      if (isTextElement) {
        properties.TextTransparency = element.properties.TextTransparency || 0
        properties.TextColor3 = JSON.parse(JSON.stringify(element.properties.TextColor3))
        properties.TextSize = element.properties.TextSize
        properties.Text = element.properties.Text
      }

      // Add image properties for image elements
      const isImageElement = ['ImageLabel', 'ImageButton'].includes(element.type)
      if (isImageElement) {
        properties.ImageTransparency = element.properties.ImageTransparency || 0
        properties.ImageColor3 = JSON.parse(JSON.stringify(element.properties.ImageColor3))
        properties.Image = element.properties.Image
      }

      onAddKeyframe(elementId, currentTime, properties, {
        dampingRatio: 0.7,
        undampedFrequency: 4
      })
      
      // Get the newly created keyframe ID (it will be the last one for this element at this time)
      setTimeout(() => {
        const newKeyframe = animations.find(kf => kf.elementId === elementId && Math.abs(kf.time - currentTime) < 0.01)
        if (newKeyframe) {
          setEditingKeyframe(newKeyframe.id)
        }
      }, 50)
    }
    
    setIsEditingMode(true)
  }

  // Duplicate keyframe
  const duplicateKeyframe = (keyframeId: string): void => {
    let keyframe: AnimationKeyframe | undefined
    
    if (editingFunction) {
      // Find keyframe in function animations
      const functionAnimation = functionAnimations.find(anim => anim.id === editingFunction.animationId)
      if (functionAnimation) {
        keyframe = functionAnimation.keyframes.find(kf => kf.id === keyframeId)
      }
    } else {
      // Find keyframe in regular animations
      keyframe = animations.find(anim => anim.id === keyframeId)
    }
    
    if (!keyframe) return

    if (editingFunction) {
      // Duplicate function keyframe
      const functionAnimation = functionAnimations.find(anim => anim.id === editingFunction.animationId)
      if (!functionAnimation) return

      const newKeyframe: AnimationKeyframe = {
        id: `func_keyframe_${Date.now()}`,
        elementId: keyframe.elementId,
        time: currentTime,
        properties: { ...keyframe.properties },
        easing: keyframe.easing,
        sprSettings: keyframe.sprSettings ? { ...keyframe.sprSettings } : undefined
      }

      const updatedKeyframes = [...functionAnimation.keyframes, newKeyframe]
      const updatedAnimation = { ...functionAnimation, keyframes: updatedKeyframes }
      
      setFunctionAnimations?.(functionAnimations.map(anim => 
        anim.id === editingFunction.animationId ? updatedAnimation : anim
      ))
    } else {
      // Create duplicate at current time with same properties and spring settings
      onAddKeyframe(
        keyframe.elementId, 
        currentTime, 
        keyframe.properties,
        keyframe.sprSettings
      )
    }
    setIsEditingMode(true)
  }

  // Handle keyframe drag
  const handleKeyframeDrag = (keyframeId: string, newTime: number): void => {
    const currentDuration = editingFunction ? 
      functionAnimations.find(anim => anim.id === editingFunction.animationId)?.duration || duration : 
      duration
    const clampedTime = Math.max(0, Math.min(currentDuration, newTime))
    
    if (editingFunction) {
      // Update function animation keyframe
      const functionAnimation = functionAnimations.find(anim => anim.id === editingFunction.animationId)
      if (functionAnimation) {
        const updatedKeyframes = functionAnimation.keyframes.map(kf => 
          kf.id === keyframeId ? { ...kf, time: clampedTime } : kf
        )
        const updatedAnimation = { ...functionAnimation, keyframes: updatedKeyframes }
        
        setFunctionAnimations?.(functionAnimations.map(anim => 
          anim.id === editingFunction.animationId ? updatedAnimation : anim
        ))
      }
    } else {
      // Update regular animation keyframe
      onUpdateKeyframe(keyframeId, { time: clampedTime })
    }
  }

  // Animation playback control
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      if (currentTime >= duration) {
        onPlayToggle()
        onTimeChange(0)
      } else {
        onTimeChange(Math.min(duration, currentTime + 0.016))
      }
    }, 16)

    return () => clearInterval(interval)
  }, [isPlaying, duration, currentTime, onTimeChange, onPlayToggle])

  // Render keyframe
  const renderKeyframe = (keyframe: AnimationKeyframe, trackIndex: number): JSX.Element => {
    const x = keyframe.time * timelineScale
    const isSelected = draggedKeyframe === keyframe.id
    const isEditing = editingKeyframe === keyframe.id
    const isAtCurrentTime = Math.abs(keyframe.time - currentTime) < 0.1

    return (
      <motion.div
        key={keyframe.id}
        className={`absolute w-4 h-6 rounded cursor-pointer border shadow-sm group
                   ${isSelected ? 'ring-2 ring-white z-20' : ''}
                   ${isEditing ? 'bg-yellow-400 border-yellow-500' : 
                     editingFunction ? 'bg-gradient-to-r from-orange-400 to-red-400 border-orange-500' :
                     isAtCurrentTime ? 'bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] border-white' :
                     'bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] border-gray-600'}
                   ${isEditingMode && !isEditing ? 'opacity-50' : 'hover:scale-110'}`}
        style={{
          left: x - 8,
          top: trackIndex * 40 + 8
        }}
        drag="x"
        dragConstraints={{ left: 0, right: (editingFunction ? 
          functionAnimations.find(anim => anim.id === editingFunction.animationId)?.duration || duration : 
          duration) * timelineScale }}
        dragElastic={0}
        onDragStart={() => setDraggedKeyframe(keyframe.id)}
        onDragEnd={() => setDraggedKeyframe(null)}
        onDrag={(_, info) => {
          const newTime = (info.point.x + 8) / timelineScale
          handleKeyframeDrag(keyframe.id, newTime)
        }}
        onClick={(e) => {
          e.stopPropagation()
          setEditingKeyframe(isEditing ? null : keyframe.id)
          onTimeChange(keyframe.time)
        }}
        whileHover={{ scale: 1.1 }}
        whileDrag={{ scale: 1.2, zIndex: 30 }}
        title={`Keyframe at ${keyframe.time.toFixed(2)}s${isEditing ? ' (Editing)' : ''}`}
      >
        {/* Keyframe icon */}
        <div className="w-full h-full flex items-center justify-center">
          {isEditing ? (
            <Edit3 className="w-2 h-2 text-black" />
          ) : isAtCurrentTime ? (
            <Target className="w-2 h-2 text-black" />
          ) : (
            <div className="w-1.5 h-1.5 bg-black rounded-full" />
          )}
        </div>


      </motion.div>
    )
  }

  return (
    <motion.div
      className="h-full bg-black border-t border-gray-800 flex flex-col"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Timeline Header */}
      <div className="h-12 bg-black border-b border-gray-700 flex items-center px-4 gap-4 overflow-x-auto">
        {/* Playback Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTimeChange(0)}
            className="text-gray-300 hover:text-white px-2 py-1"
          >
            <SkipBack className="w-3 h-3" />
          </Button>
          
          <Button
            variant={isPlaying ? "default" : "ghost"}
            size="sm"
            onClick={onPlayToggle}
            className={`px-2 py-1 ${isPlaying ? 
              "bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] text-black" : 
              "text-gray-300 hover:text-white"}`}
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTimeChange(duration)}
            className="text-gray-300 hover:text-white px-2 py-1"
          >
            <SkipForward className="w-3 h-3" />
          </Button>
        </div>

        {/* Time Display */}
        <div className="flex items-center gap-2 text-sm flex-shrink-0">
          <Clock className="w-3 h-3 text-gray-400" />
          <span className="text-gray-300 font-mono text-xs">
            {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
          </span>
        </div>

        {/* Duration Control */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-400">Duration:</span>
          <Input
            type="number"
            value={editingFunction ? 
              functionAnimations.find(anim => anim.id === editingFunction.animationId)?.duration || duration : 
              duration}
            onChange={(e) => {
              const newDuration = parseFloat(e.target.value)
              if (editingFunction) {
                // Update function animation duration
                setFunctionAnimations?.(functionAnimations.map(anim => 
                  anim.id === editingFunction.animationId ? { ...anim, duration: newDuration } : anim
                ))
              } else {
                // Update main timeline duration
                onDurationChange(newDuration)
              }
            }}
            className="w-16 h-6 bg-gray-700 border-gray-600 text-white text-xs rounded-xl"
          />
          <span className="text-xs text-gray-400">s</span>
        </div>

        {/* Function Editing Indicator */}
        {editingFunction && (() => {
          const element = elements.find(el => el.id === editingFunction.elementId)
          const func = element?.functions?.find(f => f.id === editingFunction.functionId)
          const event = func ? ROBLOX_EVENTS.find(e => e.name === func.eventName) : null
          const animation = functionAnimations.find(a => a.id === editingFunction.animationId)
          
          return (
            <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-500/30 rounded-md flex-shrink-0">
              <Zap className="w-3 h-3 text-orange-400" />
              <span className="text-xs text-orange-300 font-medium">
                Editing {event?.displayName || func?.eventName} • {element?.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onExitFunctionEditing?.()}
                className="w-4 h-4 p-0 text-orange-400 hover:text-orange-300 ml-1"
                title="Exit function editing"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )
        })()}

        {/* Edit Mode Toggle - Hide when editing functions */}
        {!editingFunction && (
          <Button
            variant={isEditingMode ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setIsEditingMode(!isEditingMode)
              setEditingKeyframe(null)
            }}
            className={`gap-1 text-xs px-2 py-1 flex-shrink-0 ${isEditingMode ? 
              "bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] text-black" : 
              "text-gray-300 hover:text-white"}`}
          >
            <Edit3 className="w-3 h-3" />
            {isEditingMode ? 'Exit Edit' : 'Edit Mode'}
          </Button>
        )}

        {/* Add/Delete/Duplicate Keyframe Buttons */}
        {selectedElement && (
          editingKeyframe ? (
            <div className="flex gap-2 flex-shrink-0">
              <Button
                onClick={() => duplicateKeyframe(editingKeyframe)}
                className="bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] hover:from-[#ff669e] hover:to-[#ff4080] text-black font-medium gap-1 text-xs px-2 py-1"
                size="sm"
              >
                <Copy className="w-3 h-3" />
                Duplicate
              </Button>
              <Button
                onClick={() => {
                  if (editingFunction) {
                    // Delete function keyframe
                    const functionAnimation = functionAnimations.find(anim => anim.id === editingFunction.animationId)
                    if (functionAnimation) {
                      const updatedKeyframes = functionAnimation.keyframes.filter(kf => kf.id !== editingKeyframe)
                      const updatedAnimation = { ...functionAnimation, keyframes: updatedKeyframes }
                      
                      setFunctionAnimations?.(functionAnimations.map(anim => 
                        anim.id === editingFunction.animationId ? updatedAnimation : anim
                      ))
                    }
                  } else {
                    // Delete regular keyframe
                    onDeleteKeyframe(editingKeyframe)
                  }
                  setEditingKeyframe(null)
                }}
                className="bg-red-500 text-white hover:bg-red-600 gap-1 text-xs px-2 py-1"
                size="sm"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => addKeyframeAtTime(selectedElement)}
              className="bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] text-black hover:from-[#ff669e] hover:to-[#ff4080] gap-1 text-xs px-2 py-1 flex-shrink-0"
              size="sm"
            >
              <Plus className="w-3 h-3" />
              Add Keyframe
            </Button>
          )
        )}
      </div>

      {/* Timeline Content */}
      <div className="flex-1 flex min-h-0">
        {/* Track Labels */}
        <div className="w-32 sm:w-48 bg-gray-850 border-r border-gray-700 flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {tracks.map((track, index) => (
                <motion.div
                  key={track.elementId}
                  className={`p-2 rounded cursor-pointer transition-colors
                             ${selectedElement === track.elementId ? 
                               'bg-gradient-to-r from-[#fff0f5]/20 to-[#ff669e]/20' : 
                               'hover:bg-gray-700'}`}
                  onClick={() => {
                    toggleTrack(track.elementId)
                    // Also select the element when clicking on track
                    if (onSelectElement) {
                      onSelectElement(track.elementId)
                    }
                  }}
                  whileHover={{ x: 2 }}
                >
                  <div className="flex items-center gap-2">
                    {track.keyframes.length > 0 ? (
                      track.expanded ? (
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                      )
                    ) : (
                      <div className="w-3 h-3" />
                    )}
                    <Zap className="w-4 h-4 text-white" />
                    <span className="text-sm text-gray-300 truncate">
                      {track.elementName}
                    </span>
                    {track.keyframes.length > 0 && (
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {track.keyframes.length}
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Timeline Grid */}
        <div className="flex-1 relative overflow-x-auto overflow-y-auto">
          <div
            ref={timelineRef}
            className="relative cursor-pointer touch-manipulation"
            style={{ width: Math.max(400, (editingFunction ? 
              functionAnimations.find(anim => anim.id === editingFunction.animationId)?.duration || duration : 
              duration) * timelineScale + 100), height: '100%' }}
            onClick={handleTimelineClick}
            onTouchStart={handleTimelineTouch}
            onTouchMove={handleTimelineTouch}
          >
            {/* Time Grid */}
            <div className="absolute inset-0">
              {Array.from({ length: Math.ceil(editingFunction ? 
                functionAnimations.find(anim => anim.id === editingFunction.animationId)?.duration || duration : 
                duration) + 1 }, (_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-l border-gray-700"
                  style={{ left: i * timelineScale }}
                >
                  <div className="absolute -top-6 left-1 text-xs text-gray-400">
                    {i}s
                  </div>
                </div>
              ))}
            </div>

            {/* Track Backgrounds */}
            {tracks.map((_, index) => (
              <div
                key={index}
                className={`absolute left-0 right-0 h-10 border-b border-gray-800
                           ${index % 2 === 0 ? 'bg-gray-900/50' : 'bg-gray-800/30'}`}
                style={{ top: index * 40 }}
              />
            ))}

            {/* Keyframes */}
            {tracks.map((track, trackIndex) =>
              track.keyframes.map(keyframe => renderKeyframe(keyframe, trackIndex))
            )}

            {/* Current Time Indicator */}
            <motion.div
              className="absolute top-0 bottom-0 w-0.5 bg-white z-30 pointer-events-none"
              style={{ left: currentTime * timelineScale }}
              animate={{ opacity: isPlaying ? [1, 0.5, 1] : 1 }}
              transition={{ duration: 0.5, repeat: isPlaying ? Infinity : 0 }}
            >
              <div className="absolute -top-2 -left-2 w-4 h-4 bg-white rounded-full" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Keyframe Spring Physics Controls */}
      {editingKeyframe && (() => {
        let keyframe: AnimationKeyframe | undefined
        let updateHandler: (id: string, updates: Partial<AnimationKeyframe>) => void
        
        if (editingFunction) {
          // Find keyframe in function animations
          const functionAnimation = functionAnimations.find(anim => anim.id === editingFunction.animationId)
          if (functionAnimation) {
            keyframe = functionAnimation.keyframes.find(kf => kf.id === editingKeyframe)
          }
          
          // Create update handler for function keyframes
          updateHandler = (keyframeId: string, updates: Partial<AnimationKeyframe>) => {
            const functionAnimation = functionAnimations.find(anim => anim.id === editingFunction!.animationId)
            if (functionAnimation) {
              const updatedKeyframes = functionAnimation.keyframes.map(kf => 
                kf.id === keyframeId ? { ...kf, ...updates } : kf
              )
              const updatedAnimation = { ...functionAnimation, keyframes: updatedKeyframes }
              
              setFunctionAnimations?.(functionAnimations.map(anim => 
                anim.id === editingFunction!.animationId ? updatedAnimation : anim
              ))
            }
          }
        } else {
          // Find keyframe in regular animations
          keyframe = animations.find(anim => anim.id === editingKeyframe)
          updateHandler = onUpdateKeyframe
        }
        
        if (!keyframe) return null
        
        return (
          <KeyframeEditor
            keyframe={keyframe}
            onUpdateKeyframe={updateHandler}
            onClose={() => setEditingKeyframe(null)}
          />
        )
      })()}

      {/* Timeline Footer */}
      <div className="h-8 bg-black border-t border-gray-700 flex items-center px-4 justify-between">
        <div className="text-xs text-gray-500">
          {editingFunction ? (
            `${currentFunctionKeyframes.length} function keyframe${currentFunctionKeyframes.length !== 1 ? 's' : ''} • 
             ${tracks.filter(t => t.keyframes.length > 0).length} animated element${tracks.filter(t => t.keyframes.length > 0).length !== 1 ? 's' : ''}`
          ) : (
            `${animations.length} keyframe${animations.length !== 1 ? 's' : ''} • 
             ${tracks.filter(t => t.keyframes.length > 0).length} animated element${tracks.filter(t => t.keyframes.length > 0).length !== 1 ? 's' : ''}`
          )}
        </div>
        {editingFunction ? (
          <div className="text-xs text-orange-400 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Function Edit Mode
          </div>
        ) : isEditingMode ? (
          <div className="text-xs text-yellow-400 flex items-center gap-1">
            <Edit3 className="w-3 h-3" />
            Edit Mode Active
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}