import { supabase } from './supabase'
import type { UIElement, AnimationKeyframe, FunctionAnimation } from '@/types/roblox'

export interface SavedProject {
  id: string
  user_id: string
  name: string
  description?: string
  data: {
    elements: UIElement[]
    animations: AnimationKeyframe[]
    functionAnimations: FunctionAnimation[]
    duration: number
  }
  thumbnail_url?: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface ColorTheme {
  id: string
  user_id: string
  name: string
  description?: string
  colors: {
    colors: Array<{ name: string; hex: string }>
    gradients: Array<{
      name: string
      rotation: number
      keypoints: Array<{ time: number; hex: string }>
    }>
  }
  is_public: boolean
  created_at: string
}

export interface CustomElement {
  id: string
  user_id: string
  name: string
  description?: string
  element_data: {
    element: UIElement
    includeChildren: boolean
    includeEffects: boolean
    includeKeyframes: boolean
    includeEvents: boolean
    keyframes?: AnimationKeyframe[]
    events?: FunctionAnimation[]
  }
  is_public: boolean
  created_at: string
}

// Projects
export async function saveProject(
  userId: string,
  name: string,
  description: string | undefined,
  elements: UIElement[],
  animations: AnimationKeyframe[],
  functionAnimations: FunctionAnimation[],
  duration: number,
  thumbnailUrl?: string
): Promise<SavedProject | null> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        name,
        description,
        data: {
          elements,
          animations,
          functionAnimations,
          duration
        },
        thumbnail_url: thumbnailUrl,
        is_public: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving project:', error)
      return null
    }

    return data as SavedProject
  } catch (error) {
    console.error('Error saving project:', error)
    return null
  }
}

export async function loadProjects(userId: string): Promise<SavedProject[]> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading projects:', error)
      return []
    }

    return (data as SavedProject[]) || []
  } catch (error) {
    console.error('Error loading projects:', error)
    return []
  }
}

export async function deleteProject(userId: string, projectId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting project:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting project:', error)
    return false
  }
}

// Themes
export async function saveTheme(
  userId: string,
  name: string,
  colors: Array<{ name: string; hex: string }>,
  gradients: Array<{
    name: string
    rotation: number
    keypoints: Array<{ time: number; hex: string }>
  }>
): Promise<ColorTheme | null> {
  try {
    const { data, error } = await supabase
      .from('themes')
      .insert({
        user_id: userId,
        name,
        colors: {
          colors,
          gradients
        },
        is_public: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving theme:', error)
      return null
    }

    return data as ColorTheme
  } catch (error) {
    console.error('Error saving theme:', error)
    return null
  }
}

export async function loadThemes(userId: string): Promise<ColorTheme[]> {
  try {
    const { data, error } = await supabase
      .from('themes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading themes:', error)
      return []
    }

    return (data as ColorTheme[]) || []
  } catch (error) {
    console.error('Error loading themes:', error)
    return []
  }
}

export async function deleteTheme(userId: string, themeId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('themes')
      .delete()
      .eq('id', themeId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting theme:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting theme:', error)
    return false
  }
}

// Custom Elements
export async function saveCustomElement(
  userId: string,
  name: string,
  element: UIElement,
  includeChildren: boolean,
  includeEffects: boolean,
  includeKeyframes: boolean,
  includeEvents: boolean,
  keyframes?: AnimationKeyframe[],
  events?: FunctionAnimation[]
): Promise<CustomElement | null> {
  try {
    const { data, error } = await supabase
      .from('custom_elements')
      .insert({
        user_id: userId,
        name,
        element_data: {
          element,
          includeChildren,
          includeEffects,
          includeKeyframes,
          includeEvents,
          keyframes,
          events
        },
        is_public: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving custom element:', error)
      return null
    }

    return data as CustomElement
  } catch (error) {
    console.error('Error saving custom element:', error)
    return null
  }
}

export async function loadCustomElements(userId: string): Promise<CustomElement[]> {
  try {
    const { data, error } = await supabase
      .from('custom_elements')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading custom elements:', error)
      return []
    }

    return (data as CustomElement[]) || []
  } catch (error) {
    console.error('Error loading custom elements:', error)
    return []
  }
}

export async function deleteCustomElement(userId: string, elementId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('custom_elements')
      .delete()
      .eq('id', elementId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting custom element:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting custom element:', error)
    return false
  }
}
