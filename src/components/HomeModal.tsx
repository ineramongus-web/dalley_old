'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/hooks/useAuth'
import { 
  Home,
  FolderOpen, 
  Palette, 
  Package, 
  Plus, 
  Trash2, 
  Download,
  FileText,
  Image as ImageIcon,
  Clock,
  Check,
  Copy,
  Minus,
  Settings as SettingsIcon,
  Loader2
} from 'lucide-react'
import type { UIElement, AnimationKeyframe, FunctionAnimation } from '@/types/roblox'
import * as SupabaseService from '@/lib/supabase-service'

type SavedProject = SupabaseService.SavedProject
type ColorTheme = SupabaseService.ColorTheme
type CustomElement = SupabaseService.CustomElement

interface LocalProject {
  id: string
  name: string
  description?: string
  thumbnail?: string
  elements: UIElement[]
  animations: AnimationKeyframe[]
  functionAnimations: FunctionAnimation[]
  duration: number
  timestamp: number
}

interface LocalTheme {
  id: string
  name: string
  colors: Array<{ name: string; hex: string }>
  gradients: Array<{
    name: string
    rotation: number
    keypoints: Array<{ time: number; hex: string }>
  }>
  timestamp: number
}

interface LocalCustomElement {
  id: string
  name: string
  element: UIElement
  includeChildren: boolean
  includeEffects: boolean
  includeKeyframes: boolean
  includeEvents: boolean
  keyframes?: AnimationKeyframe[]
  events?: FunctionAnimation[]
  timestamp: number
}

interface HomeModalProps {
  open: boolean
  onClose: () => void
  currentProject: {
    elements: UIElement[]
    animations: AnimationKeyframe[]
    functionAnimations: FunctionAnimation[]
    duration: number
  }
  onLoadProject: (project: LocalProject) => void
  onCreateNewProject: () => void
  onImportCustomElement: (customElement: LocalCustomElement) => void
  ignoreCrashes: boolean
  onIgnoreCrashesChange: (value: boolean) => void
  autoSave: boolean
  onAutoSaveChange: (value: boolean) => void
}

export function HomeModal({
  open,
  onClose,
  currentProject,
  onLoadProject,
  onCreateNewProject,
  onImportCustomElement,
  ignoreCrashes,
  onIgnoreCrashesChange,
  autoSave,
  onAutoSaveChange
}: HomeModalProps): JSX.Element {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'projects' | 'themes' | 'elements' | 'settings'>('projects')
  
  // Projects state
  const [projects, setProjects] = useState<SavedProject[]>([])
  const [showSaveForm, setShowSaveForm] = useState<boolean>(false)
  const [projectName, setProjectName] = useState<string>('')
  const [projectDescription, setProjectDescription] = useState<string>('')
  const [loadingProjects, setLoadingProjects] = useState<boolean>(false)
  const [savingProject, setSavingProject] = useState<boolean>(false)
  
  // Themes state
  const [themes, setThemes] = useState<ColorTheme[]>([])
  const [showThemeForm, setShowThemeForm] = useState<boolean>(false)
  const [themeName, setThemeName] = useState<string>('')
  const [themeColors, setThemeColors] = useState<Array<{ name: string; hex: string }>>([
    { name: 'Primary', hex: '#3366ff' }
  ])
  const [themeGradients, setThemeGradients] = useState<Array<{
    name: string
    rotation: number
    keypoints: Array<{ time: number; hex: string }>
  }>>([{ name: 'Gradient 1', rotation: 0, keypoints: [{ time: 0, hex: '#3366ff' }, { time: 1, hex: '#9933ff' }] }])
  const [loadingThemes, setLoadingThemes] = useState<boolean>(false)
  const [savingTheme, setSavingTheme] = useState<boolean>(false)
  
  // Custom Elements state
  const [customElements, setCustomElements] = useState<CustomElement[]>([])
  const [loadingElements, setLoadingElements] = useState<boolean>(false)

  // Load data from Supabase when user is authenticated
  useEffect(() => {
    if (user) {
      loadAllData()
    }
  }, [user])

  const loadAllData = async (): Promise<void> => {
    if (!user) return

    setLoadingProjects(true)
    setLoadingThemes(true)
    setLoadingElements(true)

    const [projectsData, themesData, elementsData] = await Promise.all([
      SupabaseService.loadProjects(user.id),
      SupabaseService.loadThemes(user.id),
      SupabaseService.loadCustomElements(user.id)
    ])

    setProjects(projectsData)
    setThemes(themesData)
    setCustomElements(elementsData)

    setLoadingProjects(false)
    setLoadingThemes(false)
    setLoadingElements(false)
  }

  // Generate thumbnail from canvas
  const generateThumbnail = (): string => {
    // Placeholder for canvas screenshot functionality
    return ''
  }

  // Save current project
  const saveCurrentProject = async (): Promise<void> => {
    if (!projectName.trim() || !user) return

    setSavingProject(true)

    const savedProject = await SupabaseService.saveProject(
      user.id,
      projectName.trim(),
      projectDescription.trim() || undefined,
      currentProject.elements,
      currentProject.animations,
      currentProject.functionAnimations,
      currentProject.duration,
      generateThumbnail()
    )

    if (savedProject) {
      setProjects([savedProject, ...projects])
      setProjectName('')
      setProjectDescription('')
      setShowSaveForm(false)
    }

    setSavingProject(false)
  }

  // Load project
  const loadProject = (project: SavedProject): void => {
    const localProject: LocalProject = {
      id: project.id,
      name: project.name,
      description: project.description,
      thumbnail: project.thumbnail_url,
      elements: project.data.elements,
      animations: project.data.animations,
      functionAnimations: project.data.functionAnimations,
      duration: project.data.duration,
      timestamp: new Date(project.created_at).getTime()
    }
    onLoadProject(localProject)
    onClose()
  }

  // Delete project
  const deleteProject = async (id: string): Promise<void> => {
    if (!user) return

    const success = await SupabaseService.deleteProject(user.id, id)
    if (success) {
      setProjects(projects.filter(p => p.id !== id))
    }
  }

  // Save color theme
  const saveColorTheme = async (): Promise<void> => {
    if (!themeName.trim() || !user) return

    setSavingTheme(true)

    const savedTheme = await SupabaseService.saveTheme(
      user.id,
      themeName.trim(),
      themeColors,
      themeGradients
    )

    if (savedTheme) {
      setThemes([savedTheme, ...themes])
      setThemeName('')
      setThemeColors([{ name: 'Primary', hex: '#3366ff' }])
      setThemeGradients([{ name: 'Gradient 1', rotation: 0, keypoints: [{ time: 0, hex: '#3366ff' }, { time: 1, hex: '#9933ff' }] }])
      setShowThemeForm(false)
    }

    setSavingTheme(false)
  }

  // Delete theme
  const deleteTheme = async (id: string): Promise<void> => {
    if (!user) return

    const success = await SupabaseService.deleteTheme(user.id, id)
    if (success) {
      setThemes(themes.filter(t => t.id !== id))
    }
  }

  // Add color to theme
  const addColorToTheme = (): void => {
    setThemeColors([...themeColors, { name: `Color ${themeColors.length + 1}`, hex: '#000000' }])
  }

  // Add gradient to theme
  const addGradientToTheme = (): void => {
    setThemeGradients([...themeGradients, { name: `Gradient ${themeGradients.length + 1}`, rotation: 0, keypoints: [{ time: 0, hex: '#000000' }, { time: 1, hex: '#ffffff' }] }])
  }

  // Delete custom element
  const deleteCustomElement = async (id: string): Promise<void> => {
    if (!user) return

    const success = await SupabaseService.deleteCustomElement(user.id, id)
    if (success) {
      setCustomElements(customElements.filter(e => e.id !== id))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Home className="w-5 h-5" />
            dalley. Home
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="projects" className="gap-2">
              <FolderOpen className="w-4 h-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="themes" className="gap-2">
              <Palette className="w-4 h-4" />
              Themes
            </TabsTrigger>
            <TabsTrigger value="elements" className="gap-2">
              <Package className="w-4 h-4" />
              Elements
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <SettingsIcon className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects" className="flex-1 mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Saved Projects</h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowSaveForm(!showSaveForm)}
                  size="sm"
                  className="bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] text-black hover:opacity-90 gap-2"
                  disabled={!user}
                  title={!user ? 'Sign in to save projects' : ''}
                >
                  <Plus className="w-4 h-4" />
                  Save Current
                </Button>
                <Button
                  onClick={() => {
                    onCreateNewProject()
                    onClose()
                  }}
                  size="sm"
                  variant="outline"
                  className="gap-2 bg-gray-800 text-white hover:bg-gray-700 border-gray-600"
                >
                  <FileText className="w-4 h-4" />
                  New Project
                </Button>
              </div>
            </div>

            {/* Save Form */}
            <AnimatePresence>
              {showSaveForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-600"
                >
                  <h4 className="font-medium mb-3">Save Current Project</h4>
                  <div className="space-y-3">
                    <div>
                      <Label>Project Name *</Label>
                      <Input
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="My Awesome UI"
                        className="bg-gray-700 border-gray-600 text-white"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveCurrentProject()
                        }}
                      />
                    </div>
                    <div>
                      <Label>Description (Optional)</Label>
                      <Textarea
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        placeholder="A beautiful UI with smooth animations..."
                        className="bg-gray-700 border-gray-600 text-white resize-none"
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={saveCurrentProject}
                        className="bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] text-black hover:opacity-90"
                        disabled={!projectName.trim() || savingProject}
                      >
                        {savingProject ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 mr-2" />
                        )}
                        {savingProject ? 'Saving...' : 'Save Project'}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowSaveForm(false)
                          setProjectName('')
                          setProjectDescription('')
                        }}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Projects List */}
            <ScrollArea className="h-[450px]">
              {!user ? (
                <div className="text-center py-16 text-gray-500">
                  <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg mb-2">Sign in to save projects</p>
                  <p className="text-sm">Your projects will be saved to the cloud</p>
                </div>
              ) : loadingProjects ? (
                <div className="text-center py-16 text-gray-500">
                  <Loader2 className="w-16 h-16 mx-auto mb-4 opacity-30 animate-spin" />
                  <p className="text-lg mb-2">Loading projects...</p>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg mb-2">No saved projects</p>
                  <p className="text-sm">Save your current project to restore it later</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.map((project) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-gray-800 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
                    >
                      {project.thumbnail && (
                        <div className="mb-3 bg-gray-700 rounded h-32 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-500" />
                        </div>
                      )}
                      <h4 className="font-medium text-white mb-1">{project.name}</h4>
                      {project.description && (
                        <p className="text-sm text-gray-400 mb-2 line-clamp-2">{project.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        <Clock className="w-3 h-3" />
                        {new Date(project.timestamp).toLocaleDateString()}
                        <span>•</span>
                        <span>{project.data.elements.length} elements</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => loadProject(project)}
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] text-black hover:from-[#ff669e] hover:to-[#ff4080]"
                        >
                          <Download className="w-3 h-3 mr-2" />
                          Load
                        </Button>
                        <Button
                          onClick={() => deleteProject(project.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Themes Tab */}
          <TabsContent value="themes" className="flex-1 mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Color & Gradient Palettes</h3>
              <Button
                onClick={() => setShowThemeForm(!showThemeForm)}
                size="sm"
                className="bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] text-black hover:opacity-90 gap-2"
                disabled={!user}
                title={!user ? 'Sign in to save themes' : ''}
              >
                <Plus className="w-4 h-4" />
                New Theme
              </Button>
            </div>

            {/* Theme Form */}
            <AnimatePresence>
              {showThemeForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-600"
                >
                  <h4 className="font-medium mb-3">Create Color Theme</h4>
                  <div className="space-y-3">
                    <div>
                      <Label>Theme Name *</Label>
                      <Input
                        value={themeName}
                        onChange={(e) => setThemeName(e.target.value)}
                        placeholder="Ocean Blue"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label>Colors</Label>
                      <div className="space-y-2">
                        {themeColors.map((color, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={color.name}
                              onChange={(e) => {
                                const newColors = [...themeColors]
                                newColors[index].name = e.target.value
                                setThemeColors(newColors)
                              }}
                              placeholder="Color name"
                              className="bg-gray-700 border-gray-600 text-white text-sm flex-1"
                            />
                            <Input
                              type="color"
                              value={color.hex}
                              onChange={(e) => {
                                const newColors = [...themeColors]
                                newColors[index].hex = e.target.value
                                setThemeColors(newColors)
                              }}
                              className="w-16 h-8 p-1 bg-gray-700 border-gray-600"
                            />
                            {themeColors.length > 1 && (
                              <Button
                                onClick={() => setThemeColors(themeColors.filter((_, i) => i !== index))}
                                size="sm"
                                variant="ghost"
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      <Button
                        onClick={addColorToTheme}
                        size="sm"
                        variant="outline"
                        className="mt-2 w-full"
                      >
                        <Plus className="w-3 h-3 mr-2" />
                        Add Color
                      </Button>
                    </div>
                    <div>
                      <Label>Gradients</Label>
                      <div className="space-y-2">
                        {themeGradients.map((gradient, index) => (
                          <div key={index} className="space-y-2 p-2 bg-gray-700/50 rounded">
                            <div className="flex gap-2 items-center">
                              <Input
                                value={gradient.name}
                                onChange={(e) => {
                                  const newGradients = [...themeGradients]
                                  newGradients[index].name = e.target.value
                                  setThemeGradients(newGradients)
                                }}
                                placeholder="Gradient name"
                                className="bg-gray-700 border-gray-600 text-white text-sm flex-1"
                              />
                              <Input
                                type="number"
                                value={gradient.rotation}
                                onChange={(e) => {
                                  const newGradients = [...themeGradients]
                                  newGradients[index].rotation = parseInt(e.target.value) || 0
                                  setThemeGradients(newGradients)
                                }}
                                placeholder="Rotation"
                                className="bg-gray-700 border-gray-600 text-white text-sm w-20"
                              />
                              {themeGradients.length > 1 && (
                                <Button
                                  onClick={() => setThemeGradients(themeGradients.filter((_, i) => i !== index))}
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-gray-400">Color Stops</Label>
                              {gradient.keypoints.map((kp, kpIndex) => (
                                <div key={kpIndex} className="flex gap-2 items-center">
                                  <Input
                                    type="number"
                                    value={kp.time}
                                    onChange={(e) => {
                                      const newGradients = [...themeGradients]
                                      newGradients[index].keypoints[kpIndex].time = parseFloat(e.target.value) || 0
                                      setThemeGradients(newGradients)
                                    }}
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    placeholder="Position"
                                    className="bg-gray-700 border-gray-600 text-white text-xs w-16"
                                  />
                                  <Input
                                    type="color"
                                    value={kp.hex}
                                    onChange={(e) => {
                                      const newGradients = [...themeGradients]
                                      newGradients[index].keypoints[kpIndex].hex = e.target.value
                                      setThemeGradients(newGradients)
                                    }}
                                    className="w-12 h-6 p-1 bg-gray-700 border-gray-600"
                                  />
                                  <Input
                                    type="text"
                                    value={kp.hex}
                                    onChange={(e) => {
                                      const newGradients = [...themeGradients]
                                      newGradients[index].keypoints[kpIndex].hex = e.target.value
                                      setThemeGradients(newGradients)
                                    }}
                                    placeholder="#000000"
                                    className="bg-gray-700 border-gray-600 text-white text-xs flex-1"
                                  />
                                  {gradient.keypoints.length > 2 && (
                                    <Button
                                      onClick={() => {
                                        const newGradients = [...themeGradients]
                                        newGradients[index].keypoints = newGradients[index].keypoints.filter((_, i) => i !== kpIndex)
                                        setThemeGradients(newGradients)
                                      }}
                                      size="sm"
                                      variant="ghost"
                                      className="text-red-400 hover:text-red-300 w-6 h-6 p-0"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                              <Button
                                onClick={() => {
                                  const newGradients = [...themeGradients]
                                  newGradients[index].keypoints.push({ time: 1, hex: '#000000' })
                                  setThemeGradients(newGradients)
                                }}
                                size="sm"
                                variant="outline"
                                className="w-full text-xs mt-1"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Add Color Stop
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button
                        onClick={addGradientToTheme}
                        size="sm"
                        variant="outline"
                        className="mt-2 w-full"
                      >
                        <Plus className="w-3 h-3 mr-2" />
                        Add Gradient
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={saveColorTheme}
                        className="bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] text-black hover:opacity-90"
                        disabled={!themeName.trim() || savingTheme}
                      >
                        {savingTheme ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 mr-2" />
                        )}
                        {savingTheme ? 'Saving...' : 'Save Theme'}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowThemeForm(false)
                          setThemeName('')
                          setThemeColors([{ name: 'Primary', hex: '#3366ff' }])
                          setThemeGradients([{ name: 'Gradient 1', rotation: 0, keypoints: [{ time: 0, hex: '#3366ff' }, { time: 1, hex: '#9933ff' }] }])
                        }}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Themes List */}
            <ScrollArea className="h-[450px]">
              {!user ? (
                <div className="text-center py-16 text-gray-500">
                  <Palette className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg mb-2">Sign in to save themes</p>
                  <p className="text-sm">Your color palettes will be saved to the cloud</p>
                </div>
              ) : loadingThemes ? (
                <div className="text-center py-16 text-gray-500">
                  <Loader2 className="w-16 h-16 mx-auto mb-4 opacity-30 animate-spin" />
                  <p className="text-lg mb-2">Loading themes...</p>
                </div>
              ) : themes.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <Palette className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg mb-2">No saved themes</p>
                  <p className="text-sm">Create color palettes to reuse across projects</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {themes.map((theme) => (
                    <motion.div
                      key={theme.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-gray-800 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-white">{theme.name}</h4>
                        <Button
                          onClick={() => deleteTheme(theme.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-6 w-6 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {theme.colors.colors.map((color, index) => (
                          <div key={index} className="text-center">
                            <div
                              className="w-full h-12 rounded border border-gray-600 mb-1"
                              style={{ backgroundColor: color.hex }}
                              title={color.name}
                            />
                            <span className="text-xs text-gray-400 truncate block">{color.name}</span>
                          </div>
                        ))}
                      </div>
                      {theme.colors.gradients && theme.colors.gradients.length > 0 && (
                        <div className="space-y-2 mb-3">
                          <Label className="text-xs text-gray-400">Gradients</Label>
                          {theme.colors.gradients.map((gradient, index) => (
                            <div key={index} className="text-center">
                              <div
                                className="w-full h-12 rounded border border-gray-600 mb-1"
                                style={{
                                  background: `linear-gradient(${gradient.rotation}deg, ${gradient.keypoints.map(kp => `${kp.hex} ${kp.time * 100}%`).join(', ')})`
                                }}
                                title={gradient.name}
                              />
                              <span className="text-xs text-gray-400 truncate block">{gradient.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {new Date(theme.created_at).toLocaleDateString()}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="flex-1 mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">App Settings</h3>
            </div>

            <ScrollArea className="h-[500px]">
              <div className="space-y-4 pr-4">
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
                  <h4 className="font-medium mb-2">Crash Handling</h4>
                  <p className="text-sm text-gray-400 mb-3">Control how the app handles errors and crashes</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm block">Ignore App Crashes</span>
                        <span className="text-xs text-gray-500">Continue working even when errors occur</span>
                      </div>
                      <Button
                        onClick={() => onIgnoreCrashesChange(!ignoreCrashes)}
                        size="sm"
                        variant={ignoreCrashes ? "default" : "outline"}
                        className={ignoreCrashes ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        {ignoreCrashes ? "Enabled" : "Disabled"}
                      </Button>
                    </div>
                    {ignoreCrashes && (
                      <p className="text-xs text-yellow-500">⚠️ Crashes will be logged to console but won't show error modal</p>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
                  <h4 className="font-medium mb-2">Firebase Settings</h4>
                  <p className="text-sm text-gray-400 mb-3">Manage cloud sync and storage</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm block">Auto Save to Cloud</span>
                        <span className="text-xs text-gray-500">Automatically sync your work to Firebase</span>
                      </div>
                      <Button
                        onClick={() => onAutoSaveChange(!autoSave)}
                        size="sm"
                        variant={autoSave ? "default" : "outline"}
                        className={autoSave ? "bg-blue-600 hover:bg-blue-700" : ""}
                      >
                        {autoSave ? "Enabled" : "Disabled"}
                      </Button>
                    </div>
                    {autoSave && (
                      <p className="text-xs text-green-500">✓ Your changes will be saved to cloud automatically</p>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
                  <h4 className="font-medium mb-2">Debug Information</h4>
                  <p className="text-sm text-gray-400 mb-3">View app information and debug tools</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Error Debug Modal</span>
                      <span className="text-xs text-green-500">✓ Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Console Logging</span>
                      <span className="text-xs text-green-500">✓ Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Custom Elements Tab */}
          <TabsContent value="elements" className="flex-1 mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Custom Elements</h3>
              <p className="text-sm text-gray-400">Save elements from Properties panel</p>
            </div>

            <ScrollArea className="h-[500px]">
              {!user ? (
                <div className="text-center py-16 text-gray-500">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg mb-2">Sign in to save custom elements</p>
                  <p className="text-sm">Your custom UI elements will be saved to the cloud</p>
                </div>
              ) : loadingElements ? (
                <div className="text-center py-16 text-gray-500">
                  <Loader2 className="w-16 h-16 mx-auto mb-4 opacity-30 animate-spin" />
                  <p className="text-lg mb-2">Loading custom elements...</p>
                </div>
              ) : customElements.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg mb-2">No custom elements</p>
                  <p className="text-sm">Save UI elements with their properties to reuse them</p>
                  <p className="text-xs mt-2 text-gray-600">Use "Save as Custom Element" in Properties panel</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customElements.map((customEl) => (
                    <motion.div
                      key={customEl.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-gray-800 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-white text-sm">{customEl.name}</h4>
                        <Button
                          onClick={() => deleteCustomElement(customEl.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-6 w-6 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400 mb-2">{customEl.element_data.element.type}</p>
                      <div className="flex gap-1 mb-3 text-xs text-gray-500 flex-wrap">
                        {customEl.element_data.includeChildren && <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">+Children</span>}
                        {customEl.element_data.includeEffects && <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">+Effects</span>}
                        {customEl.element_data.includeKeyframes && <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded">+Keyframes</span>}
                        {customEl.element_data.includeEvents && <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 rounded">+Events</span>}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        <Clock className="w-3 h-3" />
                        {new Date(customEl.created_at).toLocaleDateString()}
                      </div>
                      <Button
                        onClick={() => {
                          const localElement: LocalCustomElement = {
                            id: customEl.id,
                            name: customEl.name,
                            element: customEl.element_data.element,
                            includeChildren: customEl.element_data.includeChildren,
                            includeEffects: customEl.element_data.includeEffects,
                            includeKeyframes: customEl.element_data.includeKeyframes,
                            includeEvents: customEl.element_data.includeEvents,
                            keyframes: customEl.element_data.keyframes,
                            events: customEl.element_data.events,
                            timestamp: new Date(customEl.created_at).getTime()
                          }
                          onImportCustomElement(localElement)
                          onClose()
                        }}
                        size="sm"
                        className="w-full bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] text-black hover:opacity-90"
                      >
                        <Copy className="w-3 h-3 mr-2" />
                        Add to Canvas
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
