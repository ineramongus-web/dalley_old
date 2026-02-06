'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Settings as SettingsIcon, Shield, Zap, Save } from 'lucide-react'

interface SettingsProps {
  ignoreCrashes: boolean
  onIgnoreCrashesChange: (value: boolean) => void
  autoSave: boolean
  onAutoSaveChange: (value: boolean) => void
}

export function Settings({
  ignoreCrashes,
  onIgnoreCrashesChange,
  autoSave,
  onAutoSaveChange
}: SettingsProps): JSX.Element {
  return (
    <div className="h-full bg-gray-900 text-white overflow-y-auto">
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-700">
          <SettingsIcon className="w-6 h-6 text-white" />
          <div>
            <h2 className="text-xl font-bold">Settings</h2>
            <p className="text-sm text-gray-400">Configure app behavior and debugging options</p>
          </div>
        </div>

        {/* Crash Handling Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-semibold">Error & Crash Handling</h3>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 space-y-4">
            {/* Ignore Crashes Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="ignore-crashes" className="text-sm font-medium text-white">
                  Ignore App Crashes
                </Label>
                <p className="text-xs text-gray-400">
                  Continue session even when errors occur. Errors will be logged but won't reload the app.
                </p>
              </div>
              <Switch
                id="ignore-crashes"
                checked={ignoreCrashes}
                onCheckedChange={onIgnoreCrashesChange}
              />
            </div>

            {/* Warning Message */}
            {ignoreCrashes && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-xs text-yellow-300">
                  ⚠️ Crash handling is enabled. Errors will be caught and logged but the app will continue running. This may cause unexpected behavior.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Performance Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold">Performance</h3>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 space-y-4">
            {/* Auto Save Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="auto-save" className="text-sm font-medium text-white">
                  Auto Save to Firebase
                </Label>
                <p className="text-xs text-gray-400">
                  Automatically save your project to Firebase every 30 seconds
                </p>
              </div>
              <Switch
                id="auto-save"
                checked={autoSave}
                onCheckedChange={onAutoSaveChange}
              />
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-300 mb-2">💡 Tips</h4>
          <ul className="text-xs text-gray-300 space-y-2 list-disc list-inside">
            <li>Enable crash handling when debugging to continue working through errors</li>
            <li>Check browser console (F12) for detailed error logs</li>
            <li>Auto-save helps prevent data loss but may slow down with many elements</li>
            <li>Settings are saved to localStorage and persist across sessions</li>
          </ul>
        </div>

        {/* Reset Button */}
        <div className="pt-4 border-t border-gray-700">
          <Button
            onClick={() => {
              if (confirm('Reset all settings to default?')) {
                onIgnoreCrashesChange(false)
                onAutoSaveChange(true)
              }
            }}
            variant="outline"
            className="w-full"
          >
            Reset to Defaults
          </Button>
        </div>
      </div>
    </div>
  )
}
