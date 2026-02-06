'use client'
import { useState, useEffect } from 'react'
import '@/styles/fonts'
import { motion } from 'framer-motion'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/Header'
import { FlatCanvas } from '@/components/FlatCanvas'
import { Timeline } from '@/components/Timeline'
import Elements from '@/components/Elements'
import { Properties } from '@/components/Properties'
import { Functions } from '@/components/Functions'
import { ImportDialog } from '@/components/ImportDialog'
import { ExportDialog } from '@/components/ExportDialog'
import { HomeModal } from '@/components/HomeModal'
import { SmartWarnings } from '@/components/SmartWarnings'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { DuplicateDebugMenu, type DuplicateMode } from '@/components/DuplicateDebugMenu'
import { Settings as SettingsComponent } from '@/components/Settings'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Clock, 
  Layers, 
  Settings,
  Sparkles,
  Grid,
  Undo,
  Zap
} from 'lucide-react'
import type { UIElement, AnimationKeyframe, Project, ExportConfig, FunctionAnimation } from '@/types/roblox'
import { initializeFirebaseAuth, loadSettings, saveSettings, type UserSettings } from '@/lib/firebase'
import { handleSaveCustomElement } from '@/lib/save-custom-element'

import { sdk } from '@farcaster/miniapp-sdk'
import { useAddMiniApp } from "@/hooks/useAddMiniApp";
import { useQuickAuth } from "@/hooks/useQuickAuth";
import { useIsInFarcaster } from "@/hooks/useIsInFarcaster";

// Enhanced animations with staggered text effects
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
}

const textVariants = {
  hidden: { 
    opacity: 0,
    y: 20,
    filter: "blur(4px)"
  },
  visible: { 
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: "easeOut"
    }
  }
}

// Split into two components so useAuth can access AuthProvider
function HomeContent(): JSX.Element {
    const { user: supabaseUser } = useAuth() // Now inside AuthProvider
    const { addMiniApp } = useAddMiniApp();
    const isInFarcaster = useIsInFarcaster()
    useQuickAuth(isInFarcaster)
    useEffect(() => {
      const tryAddMiniApp = async () => {
        try {
          await addMiniApp()
        } catch (error) {
          console.error('Failed to add mini app:', error)
        }

      }

    

      tryAddMiniApp()
    }, [addMiniApp])
  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 100))
        
        if (document.readyState !== 'complete') {
          await new Promise(resolve => {
            if (document.readyState === 'complete') {
              resolve(void 0)
            } else {
              window.addEventListener('load', () => resolve(void 0), { once: true })
            }
          })
        }
        
        await sdk.actions.ready()
        console.log('Farcaster SDK initialized successfully - app fully loaded')
      } catch (error) {
        console.error('Failed to initialize Farcaster SDK:', error)
        setTimeout(async () => {
          try {
            await sdk.actions.ready()
            console.log('Farcaster SDK initialized on retry')
          } catch (retryError) {
            console.error('Farcaster SDK retry failed:', retryError)
          }
        }, 1000)
      }
    }

    initializeFarcaster()
  }, [])
  const [elements, setElements] = useState<UIElement[]>([])
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [showSmartGuides, setShowSmartGuides] = useState(true)
  const [animations, setAnimations] = useState<AnimationKeyframe[]>([])
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [duration, setDuration] = useState<number>(5)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [showImportDialog, setShowImportDialog] = useState<boolean>(false)
  const [showExportDialog, setShowExportDialog] = useState<boolean>(false)
  const [showHomeModal, setShowHomeModal] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'timeline' | 'elements' | 'properties' | 'functions'>('timeline')
  const [ignoreCrashes, setIgnoreCrashes] = useState<boolean>(false)
  const [autoSave, setAutoSave] = useState<boolean>(true)
  const [functionAnimations, setFunctionAnimations] = useState<FunctionAnimation[]>([])
  const [editingKeyframe, setEditingKeyframe] = useState<string | null>(null)
  const [isEditingMode, setIsEditingMode] = useState<boolean>(false)
  const [editingFunction, setEditingFunction] = useState<{ elementId: string; functionId: string; animationId: string } | null>(null)
  const [project, setProject] = useState<Project>({
    name: 'Untitled Project',
    elements: [],
    animations: [],
    currentTime: 0,
    duration: 5
  })
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    includeComments: true,
    minify: false,
    sprSettings: {
      dampingRatio: 0.8,
      undampedFrequency: 15
    },
    targetVersion: 'Luau',
    animationType: 'loop'
  })
  const [firebaseUser, setFirebaseUser] = useState<any>(null)
  const [firebaseInitialized, setFirebaseInitialized] = useState<boolean>(false)
  const [showDuplicateDebug, setShowDuplicateDebug] = useState<boolean>(false)
  const [duplicatingElementId, setDuplicatingElementId] = useState<string | null>(null)
  
  // Check sessionStorage IMMEDIATELY during initialization - before any render
  const [showIntro] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    
    const introPlayed = sessionStorage.getItem('zomex-intro-played')
    if (introPlayed) {
      return false // Already played, don't show
    }
    
    // Mark as played IMMEDIATELY
    sessionStorage.setItem('zomex-intro-played', 'true')
    return true // Show intro
  })

  // Initialize Firebase Authentication
  useEffect(() => {
    const initFirebase = async () => {
      if (typeof window === 'undefined') return
      
      try {
        const user = await initializeFirebaseAuth()
        if (user) {
          setFirebaseUser(user)
          
          // Load settings from Firestore
          const settings = await loadSettings(user.uid)
          
          // Apply loaded settings
          if (settings.projects && settings.projects.length > 0) {
            // Load the most recent project if available
            const latestProject = settings.projects[0]
            if (latestProject) {
              setElements(latestProject.elements || [])
              setAnimations(latestProject.animations || [])
              setFunctionAnimations(latestProject.functionAnimations || [])
              setDuration(latestProject.duration || 5)
              setProject({ ...project, name: latestProject.name || 'Untitled Project' })
            }
          }
          
          if (settings.exportConfig) {
            setExportConfig(settings.exportConfig)
          }
          
          setFirebaseInitialized(true)
          console.log('✅ Firebase initialized for user:', user.uid)
        }
      } catch (error) {
        console.error('❌ Firebase initialization failed:', error)
        setFirebaseInitialized(true) // Still set to true to allow app to work
      }
    }
    
    initFirebase()
  }, [])

  // Auto-save to Firebase (cloud-synced)
  useEffect(() => {
    if (!firebaseInitialized || !firebaseUser) return
    
    const saveToFirebase = async () => {
      try {
        const currentProjectData = {
          id: `project_${Date.now()}`,
          name: project.name,
          elements,
          animations,
          functionAnimations,
          duration,
          timestamp: Date.now()
        }
        
        // Save current state to Firebase
        await saveSettings(firebaseUser.uid, {
          projects: [currentProjectData],
          exportConfig,
          themes: [], // Will be populated from HomeModal
          customElements: [], // Will be populated from HomeModal
          lastModified: Date.now()
        })
        
        console.log('💾 Auto-saved to Firebase')
      } catch (error) {
        console.error('❌ Auto-save failed:', error)
      }
    }
    
    // Debounce auto-save (save 2 seconds after last change)
    const timeoutId = setTimeout(saveToFirebase, 2000)
    return () => clearTimeout(timeoutId)
  }, [elements, animations, functionAnimations, project, duration, exportConfig, firebaseUser, firebaseInitialized])

  // Load project on mount is now handled by Firebase initialization above
  // This useEffect is no longer needed but kept as a fallback for localStorage migration

  const addElement = (type: UIElement['type']): void => {
    // Use default viewport size for consistent positioning
    const viewportWidth = 320  // Default mobile width
    const viewportHeight = 568  // Default mobile height
    
    // Calculate center position for new elements
    const centerX = viewportWidth / 2
    const centerY = viewportHeight / 2
    const elementWidth = 100
    const elementHeight = 50
    
    // Position element in center
    const pixelX = centerX - (elementWidth / 2)
    const pixelY = centerY - (elementHeight / 2)
    
    // Convert to UDim2 - IMPORTANT: Keep pixel and UDim2 in sync!
    const udim2X = { Scale: pixelX / viewportWidth, Offset: 0 }
    const udim2Y = { Scale: pixelY / viewportHeight, Offset: 0 }
    const udim2Width = { Scale: elementWidth / viewportWidth, Offset: 0 }
    const udim2Height = { Scale: elementHeight / viewportHeight, Offset: 0 }
    
    const newElement: UIElement = {
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${type}_${elements.length + 1}`,
      type,
      parent: undefined,  // New elements are created at root level
      // Pixel coordinates - derived from UDim2 to stay in sync
      position: { x: pixelX, y: pixelY },
      size: { width: elementWidth, height: elementHeight },
      properties: {
        // UDim2 coordinates - source of truth for export
        Position: { X: udim2X, Y: udim2Y },
        Size: { X: udim2Width, Y: udim2Height },
        BackgroundColor3: { R: 0.2, G: 0.4, B: 0.8 },
        BackgroundTransparency: 0,
        BorderSizePixel: 1,
        BorderColor3: { R: 0, G: 0, B: 0 },
        Visible: true,
        ZIndex: 1,
        ClipsDescendants: false,
        AnchorPoint: { X: 0, Y: 0 },
        ...(type === 'TextLabel' || type === 'TextButton' || type === 'TextBox' ? {
          Text: 'Sample Text',
          TextColor3: { R: 1, G: 1, B: 1 },
          TextSize: 14,
          Font: 'SourceSans',
          TextXAlignment: 'Center',
          TextYAlignment: 'Center'
        } : {}),
        ...(type === 'ImageLabel' || type === 'ImageButton' ? {
          Image: '',
          ImageColor3: { R: 1, G: 1, B: 1 },
          ImageTransparency: 0,
          ScaleType: 'Stretch'
        } : {}),
        ...(type === 'ScrollingFrame' ? {
          CanvasSize: { X: { Scale: 0, Offset: 0 }, Y: { Scale: 2, Offset: 0 } },
          ScrollBarThickness: 12
        } : {})
      },
      children: [],
      visible: true,
      locked: false
    }
    
    console.log('🆕 NEW ELEMENT CREATED:', {
      id: newElement.id,
      name: newElement.name,
      type: newElement.type,
      parent: newElement.parent,
      parentExplicit: newElement.parent === undefined ? 'UNDEFINED' : newElement.parent,
      hasParentField: 'parent' in newElement,
      position: { x: pixelX, y: pixelY },
      size: { width: elementWidth, height: elementHeight },
      currentElementsCount: elements.length,
      newArrayLength: elements.length + 1
    })
    
    console.log('📝 COMPLETE NEW ELEMENT OBJECT:', JSON.stringify(newElement, (key, value) => {
      // Show undefined values explicitly
      if (value === undefined && key === 'parent') return 'UNDEFINED'
      return value
    }, 2))
    
    setElements(prev => {
      const newArray = [...prev, newElement]
      console.log('🔄 ELEMENTS STATE UPDATE (addElement):', {
        before: prev.length,
        after: newArray.length,
        beforeIds: prev.map(el => el.id),
        afterIds: newArray.map(el => el.id),
        newElementId: newElement.id
      })
      return newArray
    })
    setSelectedElement(newElement.id)
    setActiveTab('properties')
  }

  const updateElement = (id: string, updates: Partial<UIElement>): void => {
    console.log('🔄 updateElement called:', { id, updates })
    setElements(prevElements => {
      const elementIndex = prevElements.findIndex(el => el.id === id)
      if (elementIndex === -1) {
        console.warn('⚠️ Element not found:', id)
        return prevElements
      }
      
      const currentElement = prevElements[elementIndex]
      
      // Handle both property updates and direct element updates
      const updatedElement = {
        ...currentElement,
        ...updates,
        // If updates contains properties, merge them properly
        ...(updates.properties ? {
          properties: { ...currentElement.properties, ...updates.properties }
        } : {})
      }
      
      console.log('🔄 updateElement result:', {
        elementName: updatedElement.name,
        before: currentElement,
        after: updatedElement,
        hasParent: !!updatedElement.parent && updatedElement.parent !== 'script.Parent',
        parentName: updatedElement.parent,
        positionChanged: JSON.stringify(currentElement.position) !== JSON.stringify(updatedElement.position),
        sizeChanged: JSON.stringify(currentElement.size) !== JSON.stringify(updatedElement.size)
      })
      
      // Create new array with updated element - force new reference
      const newElements = [...prevElements]
      newElements[elementIndex] = updatedElement
      
      return newElements
    })
  }

  const updateElementProperties = (id: string, properties: Partial<UIElement['properties']>): void => {
    console.log('🔄 updateElementProperties called:', { id, properties })
    setElements(prevElements => {
      const elementIndex = prevElements.findIndex(el => el.id === id)
      if (elementIndex === -1) {
        console.warn('⚠️ Element not found:', id)
        return prevElements
      }
      
      const currentElement = prevElements[elementIndex]
      const updatedElement = {
        ...currentElement,
        properties: { ...currentElement.properties, ...properties }
      }
      
      console.log('🔄 updateElementProperties result:', {
        elementName: updatedElement.name,
        hasParent: !!updatedElement.parent && updatedElement.parent !== 'script.Parent',
        parentName: updatedElement.parent,
        before: currentElement.properties,
        after: updatedElement.properties
      })
      
      // Create new array with updated element
      const newElements = [...prevElements]
      newElements[elementIndex] = updatedElement
      
      return newElements
    })
  }

  const deleteElement = (id: string): void => {
    setElements(elements.filter(el => el.id !== id))
    setAnimations(animations.filter(anim => anim.elementId !== id))
    setFunctionAnimations(functionAnimations.filter(func => func.elementId !== id))
    if (selectedElement === id) {
      setSelectedElement(null)
    }
  }

  // NEW: Duplicate with debug modes
  const duplicateElementWithMode = (id: string, mode: DuplicateMode): void => {
    console.log('🎯 DUPLICATE START:', { id, mode, timestamp: Date.now() })
    
    try {
      const source = elements.find(el => el.id === id)
      if (!source) {
        console.error('❌ Source element not found:', id)
        throw new Error(`Element with id ${id} not found`)
      }

      console.log('✅ Source element found:', source)

      // Generate unique IDs with timestamp and random
      const timestamp = Date.now()
      const random = Math.floor(Math.random() * 999999)
      const newId = `dup_${timestamp}_${random}`
      
      console.log('🆔 Generated new ID:', newId)

      // Base element data - different per mode
      let newElement: UIElement
      let newKeyframes: AnimationKeyframe[] = []
      let newFunctions: FunctionAnimation[] = []

      // MODE-SPECIFIC LOGIC
      switch (mode) {
        case 'normal':
          console.log('🔵 MODE: Normal duplicate')
          newElement = {
            id: newId,
            name: `${source.name}_copy`,
            type: source.type,
            parent: source.parent,
            children: [],
            position: {
              x: (source.position?.x || 0) + 10,
              y: (source.position?.y || 0) + 10
            },
            size: { ...source.size },
            properties: JSON.parse(JSON.stringify(source.properties)),
            visible: true,
            locked: false
          }
          
          // Include keyframes
          newKeyframes = animations
            .filter(a => a.elementId === id)
            .map((k, idx) => ({
              ...JSON.parse(JSON.stringify(k)),
              id: `kf_${timestamp}_${random}_${idx}`,
              elementId: newId
            }))
          
          // Include function animations
          newFunctions = functionAnimations
            .filter(f => f.elementId === id)
            .map((func, idx) => ({
              ...JSON.parse(JSON.stringify(func)),
              id: `fn_${timestamp}_${random}_${idx}`,
              elementId: newId
            }))
          break

        case 'no-parent':
          console.log('🟣 MODE: No parent (root level)')
          newElement = {
            id: newId,
            name: `${source.name}_noparent`,
            type: source.type,
            parent: undefined, // FORCE no parent
            children: [],
            position: {
              x: (source.position?.x || 0) + 10,
              y: (source.position?.y || 0) + 10
            },
            size: { ...source.size },
            properties: JSON.parse(JSON.stringify(source.properties)),
            visible: true,
            locked: false
          }
          
          newKeyframes = animations
            .filter(a => a.elementId === id)
            .map((k, idx) => ({
              ...JSON.parse(JSON.stringify(k)),
              id: `kf_${timestamp}_${random}_${idx}`,
              elementId: newId
            }))
          
          newFunctions = functionAnimations
            .filter(f => f.elementId === id)
            .map((func, idx) => ({
              ...JSON.parse(JSON.stringify(func)),
              id: `fn_${timestamp}_${random}_${idx}`,
              elementId: newId
            }))
          break

        case 'no-keyframes':
          console.log('🟢 MODE: No keyframes')
          newElement = {
            id: newId,
            name: `${source.name}_nokf`,
            type: source.type,
            parent: source.parent,  // Inherit parent from source
            children: [],
            position: {
              x: (source.position?.x || 0) + 10,
              y: (source.position?.y || 0) + 10
            },
            size: { ...source.size },
            properties: JSON.parse(JSON.stringify(source.properties)),
            visible: true,
            locked: false
          }
          // No keyframes
          newKeyframes = []
          // Include functions
          newFunctions = functionAnimations
            .filter(f => f.elementId === id)
            .map((func, idx) => ({
              ...JSON.parse(JSON.stringify(func)),
              id: `fn_${timestamp}_${random}_${idx}`,
              elementId: newId
            }))
          break

        case 'no-events':
          console.log('🟡 MODE: No events')
          newElement = {
            id: newId,
            name: `${source.name}_noevt`,
            type: source.type,
            parent: source.parent,  // Inherit parent from source
            children: [],
            position: {
              x: (source.position?.x || 0) + 10,
              y: (source.position?.y || 0) + 10
            },
            size: { ...source.size },
            properties: JSON.parse(JSON.stringify(source.properties)),
            visible: true,
            locked: false
          }
          // Include keyframes
          newKeyframes = animations
            .filter(a => a.elementId === id)
            .map((k, idx) => ({
              ...JSON.parse(JSON.stringify(k)),
              id: `kf_${timestamp}_${random}_${idx}`,
              elementId: newId
            }))
          // No functions
          newFunctions = []
          break

        case 'clean-slate':
          console.log('🔴 MODE: Clean slate')
          newElement = {
            id: newId,
            name: `${source.name}_clean`,
            type: source.type,
            parent: source.parent,  // Inherit parent from source
            children: [],
            position: {
              x: (source.position?.x || 0) + 10,
              y: (source.position?.y || 0) + 10
            },
            size: { ...source.size },
            properties: JSON.parse(JSON.stringify(source.properties)),
            visible: true,
            locked: false
          }
          // Nothing else
          newKeyframes = []
          newFunctions = []
          break

        case 'deep-clone':
          console.log('🟦 MODE: Deep clone')
          const deepClone = JSON.parse(JSON.stringify(source))
          newElement = {
            ...deepClone,
            id: newId,
            name: `${source.name}_clone`,
            parent: source.parent,  // Inherit parent from source
            children: [],
            position: {
              x: (source.position?.x || 0) + 10,
              y: (source.position?.y || 0) + 10
            }
          }
          
          newKeyframes = animations
            .filter(a => a.elementId === id)
            .map((k, idx) => ({
              ...JSON.parse(JSON.stringify(k)),
              id: `kf_${timestamp}_${random}_${idx}`,
              elementId: newId
            }))
          
          newFunctions = functionAnimations
            .filter(f => f.elementId === id)
            .map((func, idx) => ({
              ...JSON.parse(JSON.stringify(func)),
              id: `fn_${timestamp}_${random}_${idx}`,
              elementId: newId
            }))
          break

        case 'with-delay':
          console.log('🟠 MODE: With delay')
          newElement = {
            id: newId,
            name: `${source.name}_delay`,
            type: source.type,
            parent: source.parent,  // Inherit parent from source
            children: [],
            position: {
              x: (source.position?.x || 0) + 10,
              y: (source.position?.y || 0) + 10
            },
            size: { ...source.size },
            properties: JSON.parse(JSON.stringify(source.properties)),
            visible: true,
            locked: false
          }
          
          newKeyframes = animations
            .filter(a => a.elementId === id)
            .map((k, idx) => ({
              ...JSON.parse(JSON.stringify(k)),
              id: `kf_${timestamp}_${random}_${idx}`,
              elementId: newId
            }))
          
          newFunctions = functionAnimations
            .filter(f => f.elementId === id)
            .map((func, idx) => ({
              ...JSON.parse(JSON.stringify(func)),
              id: `fn_${timestamp}_${random}_${idx}`,
              elementId: newId
            }))
          
          // Add with delay
          console.log('⏱️ Adding element...')
          setElements(prev => {
            console.log('📦 Element state update:', prev.length, '->', prev.length + 1)
            return [...prev, newElement]
          })
          
          setTimeout(() => {
            console.log('⏱️ Adding keyframes...')
            if (newKeyframes.length > 0) {
              setAnimations(prev => [...prev, ...newKeyframes])
            }
          }, 100)
          
          setTimeout(() => {
            console.log('⏱️ Adding functions...')
            if (newFunctions.length > 0) {
              setFunctionAnimations(prev => [...prev, ...newFunctions])
            }
          }, 200)
          
          setTimeout(() => {
            console.log('⏱️ Selecting element...')
            setSelectedElement(newId)
            setActiveTab('properties')
          }, 300)
          
          console.log('✅ DUPLICATE COMPLETE (with delays)')
          return // Early return for delay mode

        default:
          throw new Error(`Unknown duplicate mode: ${mode}`)
      }

      console.log('📦 New element prepared:', newElement)
      console.log('🎬 New keyframes:', newKeyframes.length)
      console.log('⚡ New functions:', newFunctions.length)
      console.log('🔍 PARENT FIELD DEBUG:', {
        hasParentField: 'parent' in newElement,
        parentValue: newElement.parent,
        parentExplicit: newElement.parent === undefined ? 'UNDEFINED' : newElement.parent,
        sourceParent: source.parent,
        sourceParentExplicit: source.parent === undefined ? 'UNDEFINED' : source.parent
      })
      console.log('📝 COMPLETE DUPLICATED ELEMENT:', JSON.stringify(newElement, (key, value) => {
        // Show undefined values explicitly
        if (value === undefined && key === 'parent') return 'UNDEFINED'
        return value
      }, 2))

      // ATOMIC STATE UPDATE - ALL AT ONCE
      console.log('💾 Applying state updates...')
      
      setElements(prev => {
        const updated = [...prev, newElement]
        console.log('🔄 ELEMENTS STATE UPDATE (duplicate):', {
          before: prev.length,
          after: updated.length,
          beforeIds: prev.map(el => ({ id: el.id, name: el.name, parent: el.parent })),
          afterIds: updated.map(el => ({ id: el.id, name: el.name, parent: el.parent })),
          sourceId: id,
          newId: newElement.id,
          sourceParent: source.parent,
          newParent: newElement.parent
        })
        return updated
      })
      
      if (newKeyframes.length > 0) {
        setAnimations(prev => {
          const updated = [...prev, ...newKeyframes]
          console.log('✅ Animations updated:', prev.length, '->', updated.length)
          return updated
        })
      }
      
      if (newFunctions.length > 0) {
        setFunctionAnimations(prev => {
          const updated = [...prev, ...newFunctions]
          console.log('✅ Functions updated:', prev.length, '->', updated.length)
          return updated
        })
      }
      
      setSelectedElement(newId)
      setActiveTab('properties')
      
      console.log('✅ DUPLICATE COMPLETE:', newId)
    } catch (error) {
      console.error('❌ DUPLICATE FAILED:', error)
      throw error // Re-throw to be caught by error boundary
    }
  }

  // Legacy duplicate function (calls new function with normal mode)
  const duplicateElement = (id: string): void => {
    duplicateElementWithMode(id, 'normal')  // Changed from 'no-parent' to 'normal' to inherit parent
  }

  const addKeyframe = (elementId: string, time: number, properties: Record<string, any>, sprSettings?: { dampingRatio: number; undampedFrequency: number }): void => {
    const newKeyframe: AnimationKeyframe = {
      id: `keyframe_${Date.now()}`,
      elementId,
      time,
      properties,
      easing: 'linear',
      ...(sprSettings && { sprSettings })
    }
    setAnimations([...animations, newKeyframe])
  }

  const updateKeyframe = (id: string, updates: Partial<AnimationKeyframe>): void => {
    setAnimations(animations.map(kf => 
      kf.id === id ? { ...kf, ...updates } : kf
    ))
  }

  const deleteKeyframe = (id: string): void => {
    setAnimations(animations.filter(kf => kf.id !== id))
  }

  const toggleElementVisibility = (id: string): void => {
    setElements(elements.map(el => 
      el.id === id ? { ...el, visible: el.visible !== false } : el
    ))
  }

  const toggleElementLock = (id: string): void => {
    setElements(elements.map(el => 
      el.id === id ? { ...el, locked: !el.locked } : el
    ))
  }

  const moveElementToFront = (id: string): void => {
    const maxZIndex = Math.max(...elements.map(el => el.properties.ZIndex || 1))
    updateElementProperties(id, { ZIndex: maxZIndex + 1 })
  }

  const handleImport = (importedProject: Project): void => {
    setProject(importedProject)
    setElements(importedProject.elements)
    setAnimations(importedProject.animations)
    setCurrentTime(importedProject.currentTime)
    setDuration(importedProject.duration)
    setShowImportDialog(false)
  }

  const handleLoadProject = (loadedProject: any): void => {
    setElements(loadedProject.elements)
    setAnimations(loadedProject.animations)
    setFunctionAnimations(loadedProject.functionAnimations)
    setDuration(loadedProject.duration)
    setProject({ ...project, name: loadedProject.name })
  }

  const handleCreateNewProject = (): void => {
    setElements([])
    setAnimations([])
    setFunctionAnimations([])
    setDuration(5)
    setCurrentTime(0)
    setSelectedElement(null)
    setProject({ ...project, name: 'Untitled Project' })
  }

  const handleImportCustomElement = (customElement: any): void => {
    if (!customElement?.element) return

    const src = customElement.element
    
    // Brand new ID
    const newId = `elem_${Date.now()}_${Math.floor(Math.random() * 999999)}`
    
    // Center positioning
    const w = src.size?.width || 100
    const h = src.size?.height || 50
    const x = 160 - (w / 2)
    const y = 284 - (h / 2)
    
    // Build completely fresh element - NO parent relationship
    const fresh: UIElement = {
      id: newId,
      name: `${src.name}_imported`,
      type: src.type,
      parent: undefined,
      children: [],
      position: { x, y },
      size: { width: w, height: h },
      properties: {
        ...JSON.parse(JSON.stringify(src.properties)),
        Position: {
          X: { Scale: x / 320, Offset: 0 },
          Y: { Scale: y / 568, Offset: 0 }
        },
        Size: {
          X: { Scale: w / 320, Offset: 0 },
          Y: { Scale: h / 568, Offset: 0 }
        }
      },
      visible: true,
      locked: false
    }

    // Clone keyframes if included
    const freshKeyframes: AnimationKeyframe[] = []
    if (customElement.includeKeyframes && Array.isArray(customElement.keyframes)) {
      customElement.keyframes.forEach((k: AnimationKeyframe) => {
        freshKeyframes.push({
          ...JSON.parse(JSON.stringify(k)),
          id: `kf_${Date.now()}_${Math.floor(Math.random() * 999999)}`,
          elementId: newId
        })
      })
    }

    // Clone function animations if included
    const freshFuncs: FunctionAnimation[] = []
    if (customElement.includeEvents && Array.isArray(customElement.events)) {
      customElement.events.forEach((func: FunctionAnimation) => {
        freshFuncs.push({
          ...JSON.parse(JSON.stringify(func)),
          id: `fn_${Date.now()}_${Math.floor(Math.random() * 999999)}`,
          elementId: newId,
          keyframes: (func.keyframes || []).map((k: AnimationKeyframe) => ({
            ...JSON.parse(JSON.stringify(k)),
            id: `kf_${Date.now()}_${Math.floor(Math.random() * 999999)}`,
            elementId: newId
          }))
        })
      })
    }

    // Single batch update
    setElements(prev => [...prev, fresh])
    if (freshKeyframes.length > 0) setAnimations(prev => [...prev, ...freshKeyframes])
    if (freshFuncs.length > 0) setFunctionAnimations(prev => [...prev, ...freshFuncs])
    
    setSelectedElement(newId)
    setActiveTab('properties')
  }

  // Function Animation Management
  const addFunctionAnimation = (animation: FunctionAnimation): void => {
    setFunctionAnimations([...functionAnimations, animation])
  }

  const updateFunctionAnimation = (id: string, updates: Partial<FunctionAnimation>): void => {
    setFunctionAnimations(functionAnimations.map(anim => 
      anim.id === id ? { ...anim, ...updates } : anim
    ))
  }

  const deleteFunctionAnimation = (id: string): void => {
    setFunctionAnimations(functionAnimations.filter(anim => anim.id !== id))
  }

  // Function Keyframe Management
  const updateFunctionKeyframe = (animationId: string, keyframeId: string, updates: Partial<AnimationKeyframe>): void => {
    setFunctionAnimations(functionAnimations.map(anim => {
      if (anim.id === animationId) {
        return {
          ...anim,
          keyframes: anim.keyframes.map(kf => 
            kf.id === keyframeId ? { ...kf, ...updates } : kf
          )
        }
      }
      return anim
    }))
  }

  // Function Editing Management
  const handleEditFunction = (elementId: string, functionId: string, animationId: string): void => {
    setEditingFunction({ elementId, functionId, animationId })
    setActiveTab('timeline')
    setIsEditingMode(true) // Enable edit mode when editing functions
  }

  // Exit function editing mode
  const handleExitFunctionEditing = (): void => {
    setEditingFunction(null)
    setIsEditingMode(false)
    setEditingKeyframe(null)
  }

  const [canvasBackground, setCanvasBackground] = useState<string>('#1a1a1a')

  return (
      <ErrorBoundary ignoreCrashes={ignoreCrashes}>
        <motion.div 
          className="h-screen bg-[#0A0A0A] text-white flex flex-col overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
        >
      {/* Header with enhanced animation */}
      <motion.div variants={itemVariants}>
        <Header 
          onImport={() => setShowImportDialog(true)}
          onExport={() => setShowExportDialog(true)}
          projectName={project.name}
          onProjectNameChange={(name) => setProject({ ...project, name })}
          onHome={() => setShowHomeModal(true)}
        />
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Canvas */}
        <motion.div 
          variants={itemVariants} 
          className="flex-1 min-h-0"
        >
          <FlatCanvas
            elements={elements}
            animations={animations}
            currentTime={currentTime}
            selectedElement={selectedElement}
            onSelectElement={setSelectedElement}
            onUpdateElement={(id, updates) => {
              console.log('🎯 Canvas onUpdateElement called:', { id, updates })
              // Always use updateElement for consistent state updates
              updateElement(id, updates)
            }}
            onUpdateKeyframe={updateKeyframe}
            isPlaying={isPlaying}
            exportConfig={exportConfig}
            duration={duration}
            editingFunction={editingFunction}
            functionAnimations={functionAnimations}
            onUpdateFunctionKeyframe={updateFunctionKeyframe}
            editingKeyframe={editingKeyframe}
            isEditingMode={isEditingMode}
          />
        </motion.div>

        {/* Tab Panel */}
        <motion.div 
          variants={itemVariants}
          className="h-80 lg:h-full lg:w-96 border-t lg:border-t-0 lg:border-l border-gray-800 bg-[#0F0F0F] relative z-[5] shadow-sm"
        >
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="h-full flex flex-col">
            {/* Tab Headers */}
            <TabsList className="grid w-full grid-cols-4 bg-[#0A0A0A] border-b border-gray-800 rounded-none">
              <TabsTrigger 
                value="timeline" 
                className="data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white data-[state=active]:shadow-sm gap-2 text-xs text-gray-400 hover:text-white"
              >
                <Clock className="w-3 h-3" />
                <span className="hidden sm:inline">Timeline</span>
              </TabsTrigger>
              <TabsTrigger 
                value="elements" 
                className="data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white data-[state=active]:shadow-sm gap-2 text-xs text-gray-400 hover:text-white"
              >
                <Layers className="w-3 h-3" />
                <span className="hidden sm:inline">Elements</span>
              </TabsTrigger>
              <TabsTrigger 
                value="properties" 
                className="data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white data-[state=active]:shadow-sm gap-2 text-xs text-gray-400 hover:text-white"
              >
                <Settings className="w-3 h-3" />
                <span className="hidden sm:inline">Properties</span>
              </TabsTrigger>
              <TabsTrigger 
                value="functions" 
                className="data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white data-[state=active]:shadow-sm gap-2 text-xs text-gray-400 hover:text-white"
              >
                <Zap className="w-3 h-3" />
                <span className="hidden sm:inline">Functions</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab Content with Animations */}
            <div className="flex-1 overflow-hidden">
              <TabsContent value="timeline" className="h-full m-0">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="h-full"
                >
                  <Timeline
                    animations={animations}
                    elements={elements}
                    currentTime={currentTime}
                    duration={duration}
                    isPlaying={isPlaying}
                    selectedElement={selectedElement}
                    onTimeChange={setCurrentTime}
                    onDurationChange={setDuration}
                    onPlayToggle={() => setIsPlaying(!isPlaying)}
                    onAddKeyframe={addKeyframe}
                    onUpdateKeyframe={updateKeyframe}
                    onDeleteKeyframe={deleteKeyframe}
                    onSelectElement={setSelectedElement}
                    editingKeyframe={editingKeyframe}
                    setEditingKeyframe={setEditingKeyframe}
                    isEditingMode={isEditingMode}
                    setIsEditingMode={setIsEditingMode}
                    editingFunction={editingFunction}
                    setEditingFunction={setEditingFunction}
                    onExitFunctionEditing={handleExitFunctionEditing}
                    functionAnimations={functionAnimations}
                    setFunctionAnimations={setFunctionAnimations}
                  />
                </motion.div>
              </TabsContent>

              <TabsContent value="elements" className="h-full m-0">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="h-full"
                >
                  <Elements
                    elements={elements}
                    selectedElement={selectedElement}
                    onSelectElement={setSelectedElement}
                    onAddElement={addElement}
                    onDeleteElement={deleteElement}
                    onDuplicateElement={duplicateElement}
                    onUpdateElement={updateElement}
                    onToggleVisibility={toggleElementVisibility}
                    onToggleLock={toggleElementLock}
                    onDelete={deleteElement}
                    onMoveToFront={moveElementToFront}
                  />
                </motion.div>
              </TabsContent>

              <TabsContent value="properties" className="h-full m-0">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="h-full"
                >
                  <Properties
                    selectedElement={selectedElement}
                    elements={elements}
                    onUpdateElement={updateElementProperties}
                    onUpdateElementDirect={updateElement}
                    editingKeyframe={editingKeyframe}
                    animations={animations}
                    onUpdateKeyframe={updateKeyframe}
                    editingFunction={editingFunction}
                    functionAnimations={functionAnimations}
                    onUpdateFunctionKeyframe={updateFunctionKeyframe}
                    onDuplicateElement={duplicateElement}
                    onDeleteElement={deleteElement}
                    onSaveAsCustomElement={async (element: UIElement, includeChildren: boolean, includeEffects: boolean, includeKeyframes: boolean, includeEvents: boolean) => {
                      await handleSaveCustomElement(
                        element,
                        includeChildren,
                        includeEffects,
                        includeKeyframes,
                        includeEvents,
                        animations,
                        functionAnimations,
                        supabaseUser
                      )
                    }}
                  />
                </motion.div>
              </TabsContent>

              <TabsContent value="functions" className="h-full m-0">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="h-full"
                >
                  <Functions
                    selectedElement={selectedElement}
                    elements={elements}
                    functionAnimations={functionAnimations}
                    onUpdateElement={updateElement}
                    onAddFunctionAnimation={addFunctionAnimation}
                    onUpdateFunctionAnimation={updateFunctionAnimation}
                    onDeleteFunctionAnimation={deleteFunctionAnimation}
                    onEditFunction={handleEditFunction}
                  />
                </motion.div>
              </TabsContent>


            </div>
          </Tabs>
        </motion.div>
      </div>

      {/* Smart Warnings - Floating notifications */}
      <SmartWarnings
        elements={elements}
        selectedElement={selectedElement}
      />



      {/* Dialogs */}
      {showImportDialog && (
        <ImportDialog
          open={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          onImport={handleImport}
        />
      )}

      {showExportDialog && (
        <ExportDialog
          open={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          project={{
            ...project,
            elements,
            animations,
            functionAnimations,
            currentTime,
            duration,
            canvasWidth: 1024,
            canvasHeight: 768,
            orientation: 'landscape'
          }}
          exportConfig={exportConfig}
          onExportConfigChange={setExportConfig}
        />
      )}

      {/* Home Modal */}
      {showHomeModal && (
        <HomeModal
          open={showHomeModal}
          onClose={() => setShowHomeModal(false)}
          currentProject={{
            elements,
            animations,
            functionAnimations,
            duration
          }}
          onLoadProject={handleLoadProject}
          onCreateNewProject={handleCreateNewProject}
          onImportCustomElement={handleImportCustomElement}
          ignoreCrashes={ignoreCrashes}
          onIgnoreCrashesChange={setIgnoreCrashes}
          autoSave={autoSave}
          onAutoSaveChange={setAutoSave}
        />
      )}

      {/* Loading Animation Overlay - Only shows once per session */}
      {showIntro && (
        <motion.div
          className="fixed inset-0 bg-black z-50 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1, delay: 1.5 }}
          onAnimationComplete={() => {
            const overlay = document.querySelector('[data-loading-overlay]')
            if (overlay) overlay.remove()
          }}
          data-loading-overlay
        >
        <motion.div
          className="text-center"
          variants={textVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="flex items-center gap-3 mb-4"
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 1, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Sparkles className="w-8 h-8 text-white" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] bg-clip-text text-transparent">
              Zomex•UIX
            </h1>
          </motion.div>
          <motion.p
            className="text-gray-400 text-lg"
            variants={textVariants}
          >
            Roblox UI Animation Studio
          </motion.p>
        </motion.div>
        </motion.div>
      )}

      {/* Duplicate Debug Menu */}
      <DuplicateDebugMenu
        open={showDuplicateDebug}
        onClose={() => {
          setShowDuplicateDebug(false)
          setDuplicatingElementId(null)
        }}
        elementName={duplicatingElementId ? (elements.find(el => el.id === duplicatingElementId)?.name || 'Unknown') : ''}
        onDuplicate={(mode) => {
          if (duplicatingElementId) {
            duplicateElementWithMode(duplicatingElementId, mode)
          }
        }}
      />
        </motion.div>
      </ErrorBoundary>
  )
}

// Wrapper component that provides AuthProvider
export default function HomePage(): JSX.Element {
  return (
    <AuthProvider>
      <HomeContent />
    </AuthProvider>
  )
}