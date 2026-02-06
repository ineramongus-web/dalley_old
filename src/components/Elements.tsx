'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Plus, MoreHorizontal, Eye, EyeOff, Lock, Copy, Trash2, GripVertical, ChevronRight } from 'lucide-react'
import type { UIElement, RobloxElementType } from '../types/roblox'
import SplitText from './SplitText'

interface ElementsProps {
  elements: UIElement[]
  selectedElement: string | null
  onSelectElement: (id: string) => void
  onAddElement: (type: RobloxElementType) => void
  onDeleteElement: (id: string) => void
  onDuplicateElement: (id: string) => void
  onUpdateElement?: (id: string, updates: Partial<UIElement>) => void
}

const elementTypes: { type: RobloxElementType; name: string; description: string; icon: string; color: string }[] = [
  { type: 'Frame', name: 'Frame', description: 'Basic container', icon: '⬜', color: 'bg-gray-700' },
  { type: 'TextLabel', name: 'Text Label', description: 'Display text', icon: '📝', color: 'bg-gray-600' },
  { type: 'TextButton', name: 'Text Button', description: 'Clickable text', icon: '🔘', color: 'bg-gray-600' },
  { type: 'ImageLabel', name: 'Image Label', description: 'Display image', icon: '🖼️', color: 'bg-gray-700' },
  { type: 'ImageButton', name: 'Image Button', description: 'Clickable image', icon: '🖱️', color: 'bg-gray-600' },
  { type: 'TextBox', name: 'Text Box', description: 'Text input', icon: '📄', color: 'bg-gray-700' },
  { type: 'ScrollingFrame', name: 'Scrolling Frame', description: 'Scrollable container', icon: '📜', color: 'bg-gray-600' },
  { type: 'ViewportFrame', name: 'Viewport Frame', description: '3D viewport', icon: '🎮', color: 'bg-gray-700' },
]

const screenVariants = {
  enter: {
    opacity: 0
  },
  center: {
    opacity: 1
  },
  exit: {
    opacity: 0
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { 
    opacity: 0
  },
  visible: { 
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1]
    }
  }
}

export default function Elements({ elements, selectedElement, onSelectElement, onAddElement, onDeleteElement, onDuplicateElement, onUpdateElement }: ElementsProps) {
  const [currentScreen, setCurrentScreen] = useState<'elements' | 'element-types'>('elements')
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set())

  const [expandedElements, setExpandedElements] = useState<Set<string>>(new Set())

  const toggleActions = (id: string) => {
    const newExpanded = new Set(expandedActions)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedActions(newExpanded)
  }

  const getElementIcon = (type: RobloxElementType) => {
    const elementType = elementTypes.find(et => et.type === type)
    return elementType ? elementType.icon : '⬜'
  }

  const getElementColor = (type: RobloxElementType) => {
    const elementType = elementTypes.find(et => et.type === type)
    return elementType ? elementType.color : 'bg-gray-500'
  }

  const handleAddElement = (type: RobloxElementType) => {
    onAddElement(type)
    setCurrentScreen('elements')
  }



  // Get children of a specific element
  const getChildren = (parentId: string): UIElement[] => {
    const parentElement = elements.find(el => el.id === parentId)
    return elements.filter(element => 
      element.parent === parentId || 
      (parentElement && element.parent === parentElement.name.replace(/\s+/g, ''))
    )
  }

  // Toggle element expansion
  const toggleElementExpansion = (elementId: string) => {
    const newExpanded = new Set(expandedElements)
    if (newExpanded.has(elementId)) {
      newExpanded.delete(elementId)
    } else {
      newExpanded.add(elementId)
    }
    setExpandedElements(newExpanded)
  }

  // Track previous elements length to detect new additions
  const [prevElementsLength, setPrevElementsLength] = React.useState(elements.length)
  
  // Initialize expanded state for elements with children (only for new elements)
  React.useEffect(() => {
    // Only run when elements are actually added (not on tab switches or other changes)
    if (elements.length <= prevElementsLength) {
      setPrevElementsLength(elements.length)
      return
    }
    
    const elementsWithChildren = elements.filter(element => {
      const children = getChildren(element.id)
      return children.length > 0
    })
    
    // Only auto-expand elements that aren't already in the expanded set
    // This prevents conflicts with manual expand/collapse
    const newExpanded = new Set(expandedElements)
    let hasChanges = false
    
    elementsWithChildren.forEach(element => {
      if (!expandedElements.has(element.id)) {
        newExpanded.add(element.id) // Auto-expand only new elements with children
        hasChanges = true
      }
    })
    
    if (hasChanges) {
      setExpandedElements(newExpanded)
    }
    
    setPrevElementsLength(elements.length)
  }, [elements.length, prevElementsLength, expandedElements]) // Track previous length to detect actual additions

  // Render element hierarchy FLAT - static version for children
  const renderElementHierarchyStatic = (element: UIElement, depth: number = 0): JSX.Element => {
    const children = getChildren(element.id)
    const hasChildren = children.length > 0
    const isExpanded = expandedElements.has(element.id)

    return (
      <div className="mb-1">
        <div
          className={`relative p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
            selectedElement === element.id
              ? 'bg-dalley-gradient border-transparent shadow-lg shadow-pink-500/20' 
              : 'bg-[#1C1F26] border-gray-700/50 hover:border-gray-600 hover:bg-gray-800/50'
          }`}
          style={{ marginLeft: `${depth * 16}px` }}
          onClick={() => onSelectElement(element.id)}

        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1">
              <motion.div
                whileHover={{ scale: 1.2 }}
                className="cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="w-4 h-4 text-gray-500" />
              </motion.div>
              
              {/* Expand/Collapse button for parents */}
              {hasChildren && (
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleElementExpansion(element.id)
                  }}
                  className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <motion.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  >
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                  </motion.div>
                </motion.button>
              )}
              
              <motion.div 
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-sm ${getElementColor(element.type)} shadow-sm`}
                whileHover={{ rotate: 10, scale: 1.1 }}
              >
                {getElementIcon(element.type)}
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <SplitText 
                  text={element.name}
                  className="text-sm font-medium text-white truncate"
                  delay={0.3}
                />
                <div className="flex items-center space-x-2">
                  <SplitText 
                    text={element.type}
                    className="text-xs text-gray-400"
                    delay={0.4}
                  />
                  {hasChildren && (
                    <span className="text-xs text-gray-300 bg-gray-700/50 px-1 rounded">
                      {children.length} child{children.length !== 1 ? 'ren' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              <motion.button
                onClick={(e) => {
                  e.stopPropagation()
                  if (onUpdateElement) {
                    onUpdateElement(element.id, {
                      properties: {
                        ...element.properties,
                        Visible: !element.properties.Visible
                      }
                    })
                  }
                }}
                className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <motion.div
                  animate={{ 
                    opacity: element.properties.Visible !== false ? 1 : 0.5,
                    scale: element.properties.Visible !== false ? 1 : 0.8
                  }}
                >
                  {element.properties.Visible !== false ? (
                    <Eye className="w-4 h-4 text-gray-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  )}
                </motion.div>
              </motion.button>
              
              <div className="relative">
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleActions(element.id)
                  }}
                  className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <motion.div
                    animate={{ rotate: expandedActions.has(element.id) ? 90 : 0 }}
                  >
                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  </motion.div>
                </motion.button>
                
                <AnimatePresence>
                  {expandedActions.has(element.id) && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className="absolute right-0 top-full mt-1 bg-gray-800/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl z-[100] min-w-[140px] overflow-hidden"
                    >
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleActions(element.id)
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-gray-700/50 flex items-center space-x-2 transition-colors"
                        whileHover={{ x: 5 }}
                      >
                        <Lock className="w-3 h-3" />
                        <span>Lock</span>
                      </motion.button>
                      
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDuplicateElement(element.id)
                          toggleActions(element.id)
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-gray-700/50 flex items-center space-x-2 transition-colors"
                        whileHover={{ x: 5 }}
                      >
                        <Copy className="w-3 h-3" />
                        <span>Duplicate</span>
                      </motion.button>
                      
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteElement(element.id)
                          toggleActions(element.id)
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 flex items-center space-x-2 transition-colors"
                        whileHover={{ x: 5 }}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render element hierarchy FLAT - animated version for root elements
  const renderElementHierarchy = (element: UIElement, depth: number = 0): JSX.Element => {
    const children = getChildren(element.id)
    const hasChildren = children.length > 0
    const isExpanded = expandedElements.has(element.id)

    return (
      <div className="mb-1">
        <motion.div
          variants={itemVariants}
          className={`relative p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
            selectedElement === element.id
              ? 'bg-dalley-gradient border-transparent shadow-lg shadow-pink-500/20' 
              : 'bg-[#1C1F26] border-gray-700/50 hover:border-gray-600 hover:bg-gray-800/50'
          }`}
          style={{ marginLeft: `${depth * 16}px` }}
          onClick={() => onSelectElement(element.id)}
          whileHover={{ 
            scale: 1.02,
            transition: { type: "spring", stiffness: 400, damping: 30 }
          }}
          whileTap={{ scale: 0.98 }}

        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1">
              <motion.div
                whileHover={{ scale: 1.2 }}
                className="cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="w-4 h-4 text-gray-500" />
              </motion.div>
              
              {/* Expand/Collapse button for parents */}
              {hasChildren && (
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleElementExpansion(element.id)
                  }}
                  className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <motion.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  >
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                  </motion.div>
                </motion.button>
              )}
              
              <motion.div 
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-sm ${getElementColor(element.type)} shadow-sm`}
                whileHover={{ rotate: 10, scale: 1.1 }}
              >
                {getElementIcon(element.type)}
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <SplitText 
                  text={element.name}
                  className="text-sm font-medium text-white truncate"
                  delay={0.3}
                />
                <div className="flex items-center space-x-2">
                  <SplitText 
                    text={element.type}
                    className="text-xs text-gray-400"
                    delay={0.4}
                  />
                  {hasChildren && (
                    <span className="text-xs text-gray-300 bg-gray-700/50 px-1 rounded">
                      {children.length} child{children.length !== 1 ? 'ren' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              <motion.button
                onClick={(e) => {
                  e.stopPropagation()
                  if (onUpdateElement) {
                    onUpdateElement(element.id, {
                      properties: {
                        ...element.properties,
                        Visible: !element.properties.Visible
                      }
                    })
                  }
                }}
                className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <motion.div
                  animate={{ 
                    opacity: element.properties.Visible !== false ? 1 : 0.5,
                    scale: element.properties.Visible !== false ? 1 : 0.8
                  }}
                >
                  {element.properties.Visible !== false ? (
                    <Eye className="w-4 h-4 text-gray-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  )}
                </motion.div>
              </motion.button>
              
              <div className="relative">
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleActions(element.id)
                  }}
                  className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <motion.div
                    animate={{ rotate: expandedActions.has(element.id) ? 90 : 0 }}
                  >
                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  </motion.div>
                </motion.button>
                
                <AnimatePresence>
                  {expandedActions.has(element.id) && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className="absolute right-0 top-full mt-1 bg-gray-800/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl z-[100] min-w-[140px] overflow-hidden"
                    >
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleActions(element.id)
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-gray-700/50 flex items-center space-x-2 transition-colors"
                        whileHover={{ x: 5 }}
                      >
                        <Lock className="w-3 h-3" />
                        <span>Lock</span>
                      </motion.button>
                      
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDuplicateElement(element.id)
                          toggleActions(element.id)
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-gray-700/50 flex items-center space-x-2 transition-colors"
                        whileHover={{ x: 5 }}
                      >
                        <Copy className="w-3 h-3" />
                        <span>Duplicate</span>
                      </motion.button>
                      
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteElement(element.id)
                          toggleActions(element.id)
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 flex items-center space-x-2 transition-colors"
                        whileHover={{ x: 5 }}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // Helper to get all elements in hierarchical order with depth
  const getHierarchicalElements = (): Array<{ element: UIElement; depth: number }> => {
    const result: Array<{ element: UIElement; depth: number }> = []
    const processElement = (el: UIElement, depth: number) => {
      result.push({ element: el, depth })
      if (expandedElements.has(el.id)) {
        const children = getChildren(el.id)
        children.forEach(child => processElement(child, depth + 1))
      }
    }
    elements
      .filter(element => !element.parent || element.parent === 'script.Parent')
      .forEach(element => processElement(element, 0))
    return result
  }

  if (currentScreen === 'element-types') {
    return (
      <AnimatePresence mode="wait">
        <motion.div 
          key="element-types"
          variants={screenVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 30,
            duration: 0.3 
          }}
          className="h-full flex flex-col bg-black"
        >
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 border-b border-gray-800/50"
          >
            <div className="flex items-center space-x-3">
              <motion.button
                onClick={() => setCurrentScreen('elements')}
                className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </motion.button>
              <div>
                <SplitText 
                  text="Add Element" 
                  className="text-lg font-semibold text-white"
                  delay={0.2}
                />
                <SplitText 
                  text="Choose an element type" 
                  className="text-sm text-gray-400"
                  delay={0.4}
                />
              </div>
            </div>
          </motion.div>
          
          {/* Element Types Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 gap-3"
            >
              {elementTypes.map((elementType, index) => (
                <motion.button
                  key={elementType.type}
                  variants={itemVariants}
                  onClick={() => handleAddElement(elementType.type)}
                  className="flex items-center space-x-3 p-4 text-left hover:bg-gray-800/50 rounded-lg transition-all duration-300 group border border-gray-700/50 hover:border-gray-600"
                  whileHover={{ 
                    scale: 1.02,
                    x: 5,
                    transition: { type: "spring", stiffness: 400, damping: 30 }
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div 
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${elementType.color} shadow-sm`}
                    whileHover={{ rotate: 5, scale: 1.1 }}
                  >
                    {elementType.icon}
                  </motion.div>
                  <div className="flex-1">
                    <SplitText 
                      text={elementType.name}
                      className="text-sm font-medium text-white"
                      delay={0.6 + index * 0.05}
                    />
                    <SplitText 
                      text={elementType.description}
                      className="text-xs text-gray-400"
                      delay={0.7 + index * 0.05}
                    />
                  </div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    whileHover={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  >
                    <Plus className="w-4 h-4 text-gray-400" />
                  </motion.div>
                </motion.button>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key="elements"
        variants={screenVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 30,
          duration: 0.3 
        }}
        className="h-full flex flex-col bg-black"
      >
        {elements.length === 0 ? (
          // Empty state - show welcome screen
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 30,
              delay: 0.2 
            }}
            className="flex-1 flex flex-col items-center justify-center p-6"
          >
            <motion.div 
              className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gray-800/50 flex items-center justify-center border border-gray-700"
              whileHover={{ 
                scale: 1.1, 
                rotate: 5,
                transition: { type: "spring", stiffness: 400, damping: 30 }
              }}
            >
              <span className="text-2xl">🧩</span>
            </motion.div>
            <SplitText 
              text="No elements yet" 
              className="text-lg font-semibold text-white mb-2"
              delay={0.3}
            />
            <SplitText 
              text="Add your first UI element to get started" 
              className="text-gray-400 mb-6 text-center"
              delay={0.5}
            />
            <motion.button
              onClick={() => setCurrentScreen('element-types')}
              className="px-6 py-3 bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] text-gray-900 font-semibold rounded-xl hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 10px 25px rgba(255, 102, 158, 0.3)"
              }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Plus className="w-5 h-5" />
              <span>Add Element</span>
            </motion.button>
          </motion.div>
        ) : (
          // Has elements - show hierarchy with small add button
          <>
            {/* Small header with add button */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-between p-3 border-b border-gray-800/50"
            >
              <SplitText 
                text={`${elements.length} elements`}
                className="text-sm text-gray-400"
                delay={0.2}
              />
              <motion.button
                onClick={() => setCurrentScreen('element-types')}
                className="w-8 h-8 bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] text-black rounded-lg flex items-center justify-center hover:shadow-lg transition-all duration-300"
                whileHover={{ 
                  scale: 1.1,
                  boxShadow: "0 5px 15px rgba(250, 247, 255, 0.3)"
                }}
                whileTap={{ scale: 0.9 }}
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            </motion.div>
            
            {/* Elements hierarchy */}
            <div className="flex-1 overflow-y-auto p-3">
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-1"
              >
                {/* Render hierarchical element tree - FLAT DOM with CSS indentation */}
                <div className="space-y-1">
                  {getHierarchicalElements().map(({ element, depth }) => (
                    <div key={element.id}>
                      {renderElementHierarchy(element, depth)}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  )
}