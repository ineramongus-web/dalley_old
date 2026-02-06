import type { UIElement, AnimationKeyframe, FunctionAnimation } from '@/types/roblox'
import { saveCustomElement } from '@/lib/supabase-service'
import type { User } from '@supabase/supabase-js'

export async function handleSaveCustomElement(
  element: UIElement,
  includeChildren: boolean,
  includeEffects: boolean,
  includeKeyframes: boolean,
  includeEvents: boolean,
  animations: AnimationKeyframe[],
  functionAnimations: FunctionAnimation[],
  supabaseUser: User | null
): Promise<void> {
  // Get element's keyframes if includeKeyframes is true
  const elementKeyframes = includeKeyframes 
    ? animations.filter(anim => anim.elementId === element.id)
    : []
  
  // Get element's function animations (events) if includeEvents is true
  const elementEvents = includeEvents
    ? functionAnimations.filter(func => func.elementId === element.id)
    : []
  
  // Save to Supabase if user is authenticated, otherwise localStorage
  if (supabaseUser?.id) {
    try {
      console.log('💾 Saving custom element to Supabase...', {
        userId: supabaseUser.id,
        elementName: element.name,
        includeKeyframes,
        includeEvents,
        keyframesCount: elementKeyframes.length,
        eventsCount: elementEvents.length
      })

      const saved = await saveCustomElement(
        supabaseUser.id,
        element.name,
        element,
        includeChildren,
        includeEffects,
        includeKeyframes,
        includeEvents,
        elementKeyframes,
        elementEvents
      )
      
      console.log('💾 Save result:', saved)
      
      if (saved) {
        alert(`✅ Custom element "${element.name}" saved to cloud successfully!`)
      } else {
        console.error('❌ Failed to save custom element - null returned')
        alert(`❌ Failed to save custom element. Please check your connection and try again.`)
      }
    } catch (error) {
      console.error('❌ Error saving custom element:', error)
      alert(`❌ Error saving custom element: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  } else {
    // Fallback to localStorage if not authenticated
    console.log('💾 User not authenticated, saving to localStorage...')
    
    const saved = localStorage.getItem('zomex-custom-elements')
    const customElements = saved ? JSON.parse(saved) : []
    
    customElements.push({
      id: `custom-${Date.now()}`,
      name: element.name,
      element,
      includeChildren,
      includeEffects,
      includeKeyframes,
      includeEvents,
      keyframes: elementKeyframes,
      events: elementEvents,
      timestamp: Date.now()
    })
    
    localStorage.setItem('zomex-custom-elements', JSON.stringify(customElements))
    console.log('✅ Saved to localStorage:', customElements.length, 'total elements')
    alert(`✅ Custom element "${element.name}" saved locally. Sign in to save to cloud!`)
  }
}
