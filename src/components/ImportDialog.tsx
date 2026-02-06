'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  FileText, 
  Code, 
  AlertCircle, 
  CheckCircle,
  X,
  Download
} from 'lucide-react'
import type { Project, UIElement, ZuixFile, AnimFile, LuaImportData } from '@/types/roblox'

interface ImportDialogProps {
  open: boolean
  onClose: () => void
  onImport: (project: Project) => void
}

export function ImportDialog({ open, onClose, onImport }: ImportDialogProps): JSX.Element {
  const [importedData, setImportedData] = useState<Project | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [previewContent, setPreviewContent] = useState<string>('')

  // Parse .anim.json file (custom format)
  const parseAnimFile = (content: string): Project => {
    try {
      const data: AnimFile = JSON.parse(content)
      
      return {
        name: data.name || 'Imported Project',
        elements: data.elements,
        animations: data.animations,
        currentTime: 0,
        duration: data.duration || 5
      }
    } catch (err) {
      throw new Error(`Failed to parse .anim.json file: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  // Parse .zuix.json file
  const parseZuixFile = (content: string): Project => {
    try {
      const data: ZuixFile = JSON.parse(content)
      
      // Convert ZuixFile format to Project format
      const elements: UIElement[] = data.elements.map(zuixElement => ({
        id: zuixElement.id,
        name: zuixElement.name,
        type: zuixElement.type as any,
        properties: {
          Position: {
            X: { Scale: zuixElement.position.x / (data.canvasResolution?.width || 1024), Offset: 0 },
            Y: { Scale: zuixElement.position.y / (data.canvasResolution?.height || 768), Offset: 0 }
          },
          Size: {
            X: { Scale: zuixElement.size.width / (data.canvasResolution?.width || 1024), Offset: 0 },
            Y: { Scale: zuixElement.size.height / (data.canvasResolution?.height || 768), Offset: 0 }
          },
          BackgroundColor3: hexToColor3(zuixElement.properties.backgroundColor),
          BackgroundTransparency: zuixElement.properties.transparency,
          BorderColor3: hexToColor3(zuixElement.properties.borderColor),
          BorderSizePixel: zuixElement.properties.borderSizePixel,
          Visible: zuixElement.properties.visible,
          ZIndex: zuixElement.properties.zIndex,
          ClipsDescendants: zuixElement.properties.clipDescendants,
          AnchorPoint: {
            X: zuixElement.properties.anchorPoint.x,
            Y: zuixElement.properties.anchorPoint.y
          },
          ...(zuixElement.properties.text ? {
            Text: zuixElement.properties.text,
            TextColor3: hexToColor3(zuixElement.properties.textColor),
            TextSize: zuixElement.properties.fontSize,
            TextScaled: zuixElement.properties.textScaled,
            TextXAlignment: zuixElement.properties.textXAlignment as any,
            TextYAlignment: zuixElement.properties.textYAlignment as any
          } : {}),
          ...(zuixElement.properties.image ? {
            Image: zuixElement.properties.image,
            ImageColor3: hexToColor3(zuixElement.properties.imageColor),
            ImageTransparency: zuixElement.properties.imageTransparency,
            ScaleType: zuixElement.properties.scaleType as any
          } : {}),
          ...(zuixElement.properties.cornerRadius > 0 ? {
            UICorner: {
              CornerRadius: { Scale: 0, Offset: zuixElement.properties.cornerRadius }
            }
          } : {})
        },
        children: [],
        visible: zuixElement.properties.visible,
        locked: false
      }))

      return {
        name: data.name || 'Imported Project',
        elements,
        animations: [],
        currentTime: 0,
        duration: 5
      }
    } catch (err) {
      throw new Error(`Failed to parse .zuix.json file: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  // Helper function to convert hex color to Color3
  const hexToColor3 = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      R: parseInt(result[1], 16) / 255,
      G: parseInt(result[2], 16) / 255,
      B: parseInt(result[3], 16) / 255
    } : { R: 1, G: 1, B: 1 }
  }

  // Parse .lua file (basic Roblox UI structure)
  const parseLuaFile = (content: string): Project => {
    try {
      // This is a simplified Lua parser for Roblox UI structures
      // In a real implementation, you'd want a more robust parser
      const elements: UIElement[] = []
      const lines = content.split('\n')
      
      let currentElement: Partial<UIElement> | null = null
      let elementCounter = 0

      for (const line of lines) {
        const trimmed = line.trim()
        
        // Detect element creation (e.g., local frame = Instance.new("Frame"))
        const instanceMatch = trimmed.match(/local\s+(\w+)\s*=\s*Instance\.new\("(\w+)"\)/)
        if (instanceMatch) {
          if (currentElement) {
            elements.push(currentElement as UIElement)
          }
          
          currentElement = {
            id: `imported_${elementCounter++}`,
            name: instanceMatch[1],
            type: instanceMatch[2] as any,
            properties: {},
            children: [],
            visible: true,
            locked: false
          }
        }
        
        // Parse properties (e.g., frame.Size = UDim2.new(0, 200, 0, 100))
        const propertyMatch = trimmed.match(/(\w+)\.(\w+)\s*=\s*(.+)/)
        if (propertyMatch && currentElement) {
          const [, , propName, propValue] = propertyMatch
          
          // Parse UDim2 values
          const udim2Match = propValue.match(/UDim2\.new\(([^)]+)\)/)
          if (udim2Match) {
            const values = udim2Match[1].split(',').map(v => parseFloat(v.trim()))
            if (values.length === 4) {
              currentElement.properties![propName] = {
                X: { Scale: values[0], Offset: values[1] },
                Y: { Scale: values[2], Offset: values[3] }
              }
            }
          }
          
          // Parse Color3 values
          const color3Match = propValue.match(/Color3\.new\(([^)]+)\)/)
          if (color3Match) {
            const values = color3Match[1].split(',').map(v => parseFloat(v.trim()))
            if (values.length === 3) {
              currentElement.properties![propName] = {
                R: values[0],
                G: values[1],
                B: values[2]
              }
            }
          }
          
          // Parse string values
          const stringMatch = propValue.match(/^"([^"]*)"$/)
          if (stringMatch) {
            currentElement.properties![propName] = stringMatch[1]
          }
          
          // Parse number values
          const numberMatch = propValue.match(/^(\d+(?:\.\d+)?)$/)
          if (numberMatch) {
            currentElement.properties![propName] = parseFloat(numberMatch[1])
          }
        }
      }
      
      // Add the last element
      if (currentElement) {
        elements.push(currentElement as UIElement)
      }

      return {
        name: 'Imported Lua Project',
        elements,
        animations: [],
        currentTime: 0,
        duration: 5
      }
    } catch (err) {
      throw new Error(`Failed to parse .lua file: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setIsLoading(true)
    setError(null)
    setImportedData(null)

    try {
      const content = await file.text()
      setPreviewContent(content)

      let project: Project

      if (file.name.endsWith('.anim.json')) {
        project = parseAnimFile(content)
      } else if (file.name.endsWith('.zuix.json')) {
        project = parseZuixFile(content)
      } else if (file.name.endsWith('.lua')) {
        project = parseLuaFile(content)
      } else {
        throw new Error('Unsupported file format. Please use .anim.json, .zuix.json or .lua files.')
      }

      setImportedData(project)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.anim.json', '.zuix.json'],
      'text/plain': ['.lua'],
      'application/octet-stream': ['.lua']
    },
    multiple: false
  })

  const handleImport = (): void => {
    if (importedData) {
      onImport(importedData)
    }
  }

  const handleClose = (): void => {
    setImportedData(null)
    setError(null)
    setPreviewContent('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Roblox UI
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="upload" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#fff0f5] data-[state=active]:to-[#ff669e] data-[state=active]:text-black">
              Upload File
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!previewContent}>
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            {/* File Drop Zone */}
            <motion.div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                         ${isDragActive ? 'border-[#e2d4ff] bg-[#e2d4ff]/10' : 'border-gray-600 hover:border-gray-500'}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <input {...getInputProps()} />
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="space-y-4"
              >
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-black" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    {isDragActive ? 'Drop your file here' : 'Upload Roblox UI File'}
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Drag and drop your .anim.json, .zuix.json or .lua file, or click to browse
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      .anim.json
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      .zuix.json
                    </div>
                    <div className="flex items-center gap-1">
                      <Code className="w-4 h-4" />
                      .lua
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Loading State */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center py-4"
                >
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#e2d4ff]"></div>
                  <p className="text-gray-400 mt-2">Processing file...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Alert className="border-red-600 bg-red-900/20">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-300">
                      {error}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Display */}
            <AnimatePresence>
              {importedData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <Alert className="border-green-600 bg-green-900/20">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-green-300">
                      File imported successfully! Found {importedData.elements.length} UI element{importedData.elements.length !== 1 ? 's' : ''}.
                    </AlertDescription>
                  </Alert>

                  <div className="bg-gray-800 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-2">Project Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Name:</span>
                        <span className="text-white ml-2">{importedData.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Elements:</span>
                        <span className="text-white ml-2">{importedData.elements.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Animations:</span>
                        <span className="text-white ml-2">{importedData.animations.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Duration:</span>
                        <span className="text-white ml-2">{importedData.duration}s</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleImport}
                      className="bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] text-black hover:from-[#ff669e] hover:to-[#ff4080] gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Import Project
                    </Button>
                    <Button variant="outline" onClick={handleClose}>
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="bg-gray-800 rounded-lg">
              <div className="p-3 border-b border-gray-700">
                <h4 className="font-medium text-white">File Content Preview</h4>
              </div>
              <ScrollArea className="h-96">
                <pre className="p-4 text-sm text-gray-300 font-mono whitespace-pre-wrap">
                  {previewContent}
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}