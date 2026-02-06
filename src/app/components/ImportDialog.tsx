'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, FileText, Code } from 'lucide-react'
import type { RobloxElement, AnimationKeyframe, Project } from '../../types/roblox'

interface ImportDialogProps {
  onClose: () => void
  onImport: (data: { elements: RobloxElement[]; keyframes?: AnimationKeyframe[]; project?: Partial<Project> }) => void
}

export default function ImportDialog({ onClose, onImport }: ImportDialogProps): JSX.Element {
  const [importType, setImportType] = useState<'json' | 'lua'>('json')
  const [importData, setImportData] = useState<string>('')
  const [error, setError] = useState<string>('')

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setImportData(content)
      
      // Auto-detect file type
      if (file.name.endsWith('.lua') || file.name.endsWith('.luau')) {
        setImportType('lua')
      } else {
        setImportType('json')
      }
    }
    reader.readAsText(file)
  }

  const parseJsonData = (data: string): { elements: RobloxElement[]; keyframes?: AnimationKeyframe[]; project?: Partial<Project> } => {
    try {
      const parsed = JSON.parse(data)
      
      // Handle different JSON formats
      if (parsed.elements && Array.isArray(parsed.elements)) {
        // Zomex UIX format
        return {
          elements: parsed.elements,
          keyframes: parsed.keyframes || [],
          project: parsed.project || {}
        }
      } else if (Array.isArray(parsed)) {
        // Simple elements array
        return { elements: parsed }
      } else {
        throw new Error('Invalid JSON format')
      }
    } catch (err) {
      throw new Error('Invalid JSON: ' + (err as Error).message)
    }
  }

  const parseLuaData = (data: string): { elements: RobloxElement[] } => {
    // Basic Lua parsing for Roblox UI structures
    const elements: RobloxElement[] = []
    
    try {
      // Look for Frame, TextLabel, etc. patterns
      const frameMatches = data.match(/local\s+(\w+)\s*=\s*Instance\.new\s*\(\s*[\"'](\w+)[\"']\s*\)/g)
      
      if (frameMatches) {
        frameMatches.forEach((match, index) => {
          const nameMatch = match.match(/local\s+(\w+)/)
          const typeMatch = match.match(/[\"'](\w+)[\"']/)
          
          if (nameMatch && typeMatch) {
            const name = nameMatch[1]
            const type = typeMatch[1] as RobloxElement['type']
            
            // Create basic element
            const element: RobloxElement = {
              id: `imported_${Date.now()}_${index}`,
              name,
              type,
              properties: {
                Position: { X: { Scale: 0.1, Offset: 0 }, Y: { Scale: 0.1, Offset: 0 } },
                Size: { X: { Scale: 0.2, Offset: 0 }, Y: { Scale: 0.1, Offset: 0 } },
                BackgroundColor3: { R: 1, G: 1, B: 1 },
                BackgroundTransparency: 0,
                BorderSizePixel: 1,
                BorderColor3: { R: 0, G: 0, B: 0 },
                Visible: true,
                ZIndex: 1,
                ClipsDescendants: false,
                AnchorPoint: { X: 0, Y: 0 }
              },
              children: []
            }
            
            // Try to extract properties from the Lua code
            const propertyRegex = new RegExp(`${name}\\.(\\w+)\\s*=\\s*([^\\n]+)`, 'g')
            let propertyMatch
            
            while ((propertyMatch = propertyRegex.exec(data)) !== null) {
              const propName = propertyMatch[1]
              const propValue = propertyMatch[2].trim()
              
              // Parse common properties
              if (propName === 'Text' && propValue.includes('\"')) {
                element.properties.Text = propValue.replace(/[\"']/g, '')
              } else if (propName === 'Position' && propValue.includes('UDim2')) {
                // Basic UDim2 parsing
                const udim2Match = propValue.match(/UDim2\.new\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/)
                if (udim2Match) {
                  element.properties.Position = {
                    X: { Scale: parseFloat(udim2Match[1]), Offset: parseFloat(udim2Match[2]) },
                    Y: { Scale: parseFloat(udim2Match[3]), Offset: parseFloat(udim2Match[4]) }
                  }
                }
              } else if (propName === 'Size' && propValue.includes('UDim2')) {
                const udim2Match = propValue.match(/UDim2\.new\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/)
                if (udim2Match) {
                  element.properties.Size = {
                    X: { Scale: parseFloat(udim2Match[1]), Offset: parseFloat(udim2Match[2]) },
                    Y: { Scale: parseFloat(udim2Match[3]), Offset: parseFloat(udim2Match[4]) }
                  }
                }
              }
            }
            
            elements.push(element)
          }
        })
      }
      
      if (elements.length === 0) {
        throw new Error('No valid Roblox UI elements found in Lua code')
      }
      
      return { elements }
    } catch (err) {
      throw new Error('Failed to parse Lua: ' + (err as Error).message)
    }
  }

  const handleImport = (): void => {
    if (!importData.trim()) {
      setError('Please enter or upload data to import')
      return
    }

    try {
      setError('')
      
      let result: { elements: RobloxElement[]; keyframes?: AnimationKeyframe[]; project?: Partial<Project> }
      
      if (importType === 'json') {
        result = parseJsonData(importData)
      } else {
        result = parseLuaData(importData)
      }
      
      onImport(result)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-gray-900 rounded-lg border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg sm:text-xl font-semibold text-white">Import Project</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Import Type Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white">Import Format</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setImportType('json')}
                  className={`flex-1 p-3 rounded-lg border transition-colors ${
                    importType === 'json'
                      ? 'border-purple-400 bg-purple-900/20 text-white'
                      : 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <FileText className="w-5 h-5 mx-auto mb-2" />
                  <div className="text-sm font-medium">.zuix.json</div>
                  <div className="text-xs text-gray-400">Zomex UIX format</div>
                </button>
                <button
                  onClick={() => setImportType('lua')}
                  className={`flex-1 p-3 rounded-lg border transition-colors ${
                    importType === 'lua'
                      ? 'border-purple-400 bg-purple-900/20 text-white'
                      : 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Code className="w-5 h-5 mx-auto mb-2" />
                  <div className="text-sm font-medium">.lua/.luau</div>
                  <div className="text-xs text-gray-400">Roblox Lua code</div>
                </button>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white">Upload File</label>
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept={importType === 'json' ? '.json,.zuix' : '.lua,.luau,.txt'}
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <div className="text-sm text-gray-300">
                    Click to upload {importType === 'json' ? 'JSON' : 'Lua'} file
                  </div>
                  <div className="text-xs text-gray-500">
                    or drag and drop here
                  </div>
                </label>
              </div>
            </div>

            {/* Manual Input */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white">
                Or paste {importType === 'json' ? 'JSON' : 'Lua'} code
              </label>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder={
                  importType === 'json'
                    ? '{\n  "elements": [...],\n  "keyframes": [...]\n}'
                    : 'local frame = Instance.new("Frame")\nframe.Size = UDim2.new(0, 200, 0, 100)\n...'
                }
                className="w-full h-48 sm:h-64 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm font-mono resize-none focus:outline-none focus:border-purple-400"
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
                <div className="text-sm text-red-400">{error}</div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6 border-t border-gray-800 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!importData.trim()}
              className="px-4 py-2 text-sm bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] text-black rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}