import { useCallback } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

export const useAddMiniApp = () => {
  const addMiniApp = useCallback(async () => {
    try {
      const result = await sdk.actions.addMiniApp()
      return result
    } catch (error) {
      // Silently fail - this is expected when not in Farcaster context
      console.log('Add mini app skipped:', error instanceof Error ? error.message : 'Not in Farcaster context')
      return null
    }
  }, [])

  return { addMiniApp }
}
