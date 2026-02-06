'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AdvancedCodeEditor } from '@/components/AdvancedCodeEditor'
import { 
  X, 
  Download, 
  Upload,
  FileCode, 
  Folder, 
  ChevronRight, 
  ChevronDown,
  Search,
  RefreshCw,
  Smartphone,
  Monitor,
  Zap,
  Save
} from 'lucide-react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

interface DeveloperExportModalProps {
  open: boolean
  onClose: () => void
}

interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  content?: string
  children?: FileNode[]
}

export function DeveloperExportModal({ open, onClose }: DeveloperExportModalProps): JSX.Element | null {
  const [files, setFiles] = useState<FileNode[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [downloadProgress, setDownloadProgress] = useState<number>(0)
  const [isDownloading, setIsDownloading] = useState<boolean>(false)
  const [mobileView, setMobileView] = useState<'files' | 'editor'>('files')
  
  // Editor state
  const [editedContent, setEditedContent] = useState<string>('')
  const [originalContent, setOriginalContent] = useState<string>('')
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false)
  const [searchInContent, setSearchInContent] = useState<boolean>(false)
  
  // Zip upload state
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ path: string; content: string }>>([])
  const [showSaveChanges, setShowSaveChanges] = useState<boolean>(false)
  const [isSavingAll, setIsSavingAll] = useState<boolean>(false)
  const [saveAllSuccess, setSaveAllSuccess] = useState<boolean>(false)

  // Detect mobile
  const [isMobile, setIsMobile] = useState<boolean>(false)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fetch all project files
  useEffect(() => {
    if (!open) return

    const fetchProjectFiles = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/project-files')
        if (!response.ok) {
          throw new Error('Failed to fetch project files')
        }
        
        const data = await response.json()
        setFiles(buildFileTree(data.files))
        
        // Auto-expand src folder
        setExpandedFolders(new Set(['src']))
      } catch (error) {
        console.error('Error fetching project files:', error)
        setFiles(createMockFileTree())
        setExpandedFolders(new Set(['src']))
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjectFiles()
  }, [open])

  // Build file tree from flat list
  const buildFileTree = (fileList: Array<{ path: string; content: string }>): FileNode[] => {
    const root: Record<string, FileNode> = {}

    fileList.forEach(({ path, content }) => {
      const parts = path.split('/')
      let current = root

      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = {
            name: part,
            path: parts.slice(0, index + 1).join('/'),
            type: index === parts.length - 1 ? 'file' : 'directory',
            content: index === parts.length - 1 ? content : undefined,
            children: index === parts.length - 1 ? undefined : {}
          }
        }
        
        if (index < parts.length - 1) {
          current = current[part].children as Record<string, FileNode>
        }
      })
    })

    const convertToArray = (obj: Record<string, FileNode>): FileNode[] => {
      return Object.values(obj).map(node => ({
        ...node,
        children: node.children ? convertToArray(node.children as Record<string, FileNode>) : undefined
      }))
    }

    return convertToArray(root)
  }

  // Create mock file tree for fallback
  const createMockFileTree = (): FileNode[] => {
    return [
      {
        name: 'src',
        path: 'src',
        type: 'directory',
        children: [
          {
            name: 'app',
            path: 'src/app',
            type: 'directory',
            children: [
              { name: 'page.tsx', path: 'src/app/page.tsx', type: 'file', content: '// Main page component' },
              { name: 'layout.tsx', path: 'src/app/layout.tsx', type: 'file', content: '// Layout component' }
            ]
          }
        ]
      }
    ]
  }

  // Toggle folder expansion
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }

  // Get file content
  const getFileContent = (path: string): string => {
    const findFile = (nodes: FileNode[]): FileNode | null => {
      for (const node of nodes) {
        if (node.path === path && node.type === 'file') {
          return node
        }
        if (node.children) {
          const found = findFile(node.children)
          if (found) return found
        }
      }
      return null
    }

    const file = findFile(files)
    return file?.content || '// Content not available'
  }

  // Search in file content
  const searchInFileContent = (nodes: FileNode[], query: string): FileNode[] => {
    if (!query) return nodes

    return nodes.reduce<FileNode[]>((acc, node) => {
      if (node.type === 'file') {
        const matchesName = node.name.toLowerCase().includes(query.toLowerCase())
        const matchesContent = searchInContent && node.content?.toLowerCase().includes(query.toLowerCase())
        
        if (matchesName || matchesContent) {
          acc.push(node)
        }
      } else if (node.children) {
        const filteredChildren = searchInFileContent(node.children, query)
        if (filteredChildren.length > 0) {
          acc.push({ ...node, children: filteredChildren })
        }
      }
      return acc
    }, [])
  }

  // Select file
  const selectFile = (path: string) => {
    setSelectedFile(path)
    const content = getFileContent(path)
    setEditedContent(content)
    setOriginalContent(content)
    if (isMobile) setMobileView('editor')
  }

  // Check if file has unsaved changes
  const hasUnsavedChanges = selectedFile !== null && editedContent !== originalContent

  // Save file changes - SYNCS TO ACTUAL O'HARA PROJECT
  const saveFileChanges = async () => {
    if (!selectedFile || !hasUnsavedChanges) return
    
    setIsSaving(true)
    setSaveSuccess(false)
    
    try {
      const response = await fetch('/api/project-files/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: selectedFile,
          content: editedContent
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to save file')
      }
      
      // Update local state
      const updateFileContent = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
          if (node.path === selectedFile && node.type === 'file') {
            return { ...node, content: editedContent }
          }
          if (node.children) {
            return { ...node, children: updateFileContent(node.children) }
          }
          return node
        })
      }
      
      setFiles(updateFileContent(files))
      setOriginalContent(editedContent)
      setSaveSuccess(true)
      
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving file:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Reload files
  const reloadFiles = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/project-files')
      if (!response.ok) throw new Error('Failed to reload files')
      
      const data = await response.json()
      setFiles(buildFileTree(data.files))
      
      // Refresh selected file content
      if (selectedFile) {
        const newContent = getFileContent(selectedFile)
        setEditedContent(newContent)
        setOriginalContent(newContent)
      }
    } catch (error) {
      console.error('Error reloading files:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Upload ZIP and extract files
  const handleZipUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.zip')) {
      alert('Please upload a valid ZIP file')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadedFiles([])

    try {
      const zip = new JSZip()
      const contents = await zip.loadAsync(file)
      
      const extractedFiles: Array<{ path: string; content: string }> = []
      const fileEntries = Object.keys(contents.files)
      const totalFiles = fileEntries.length

      for (let i = 0; i < fileEntries.length; i++) {
        const relativePath = fileEntries[i]
        const zipEntry = contents.files[relativePath]

        if (!zipEntry.dir) {
          try {
            const content = await zipEntry.async('string')
            extractedFiles.push({
              path: relativePath,
              content
            })
            setUploadProgress(((i + 1) / totalFiles) * 100)
          } catch (err) {
            console.warn(`Failed to extract ${relativePath}:`, err)
          }
        }
      }

      console.log(`✅ Extracted ${extractedFiles.length} files from ZIP`)
      
      // MERGE extracted files with existing files (don't replace!)
      setUploadedFiles(extractedFiles)
      
      // First, collect all existing files
      const existingFiles: Array<{ path: string; content: string }> = []
      const collectFiles = (nodes: FileNode[]) => {
        nodes.forEach(node => {
          if (node.type === 'file' && node.content) {
            existingFiles.push({ path: node.path, content: node.content })
          }
          if (node.children) {
            collectFiles(node.children)
          }
        })
      }
      collectFiles(files)
      
      // Merge: extracted files take priority over existing files with same path
      const mergedFilesMap = new Map<string, { path: string; content: string }>()
      
      // Add existing files first
      existingFiles.forEach(file => {
        mergedFilesMap.set(file.path, file)
      })
      
      // Add/override with extracted files
      extractedFiles.forEach(file => {
        mergedFilesMap.set(file.path, file)
      })
      
      const mergedFiles = Array.from(mergedFilesMap.values())
      
      console.log(`🔄 Merged: ${existingFiles.length} existing + ${extractedFiles.length} new = ${mergedFiles.length} total files`)
      
      // Build tree with merged files
      setFiles(buildFileTree(mergedFiles))
      setShowSaveChanges(true)
      
      // Auto-expand src folder
      setExpandedFolders(new Set(['src']))

    } catch (error) {
      console.error('Error processing ZIP file:', error)
      alert('Failed to process ZIP file. Please try again.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      // Reset file input
      event.target.value = ''
    }
  }

  // Save all uploaded files to project
  const saveAllChanges = async () => {
    if (uploadedFiles.length === 0) return

    setIsSavingAll(true)
    setSaveAllSuccess(false)

    try {
      let successCount = 0
      let failCount = 0

      for (const file of uploadedFiles) {
        try {
          const response = await fetch('/api/project-files/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: file.path,
              content: file.content
            })
          })

          if (response.ok) {
            successCount++
          } else {
            failCount++
            console.error(`Failed to save ${file.path}`)
          }
        } catch (err) {
          failCount++
          console.error(`Error saving ${file.path}:`, err)
        }
      }

      console.log(`✅ Saved ${successCount} files, ${failCount} failed`)

      if (successCount > 0) {
        setSaveAllSuccess(true)
        setShowSaveChanges(false)
        
        // Reload files to show updated content
        await reloadFiles()
        
        setTimeout(() => setSaveAllSuccess(false), 5000)
      }

      if (failCount > 0) {
        alert(`Warning: ${failCount} file(s) failed to save. Check console for details.`)
      }

    } catch (error) {
      console.error('Error saving files:', error)
      alert('Failed to save files. Please try again.')
    } finally {
      setIsSavingAll(false)
    }
  }

  // Download all files as ZIP
  const downloadAsZip = async () => {
    setIsDownloading(true)
    setDownloadProgress(0)

    const zip = new JSZip()
    const allFiles: Array<{ path: string; content: string }> = []

    const collectFiles = (nodes: FileNode[]) => {
      nodes.forEach(node => {
        if (node.type === 'file' && node.content) {
          allFiles.push({ path: node.path, content: node.content })
        }
        if (node.children) {
          collectFiles(node.children)
        }
      })
    }

    collectFiles(files)

    const totalFiles = allFiles.length
    for (let i = 0; i < allFiles.length; i++) {
      const file = allFiles[i]
      zip.file(file.path, file.content)
      setDownloadProgress(((i + 1) / totalFiles) * 100)
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    saveAs(blob, 'zomex-uix-project.zip')
    
    setIsDownloading(false)
    setDownloadProgress(0)
  }

  // Render file tree
  const renderFileTree = (nodes: FileNode[], depth: number = 0) => {
    return nodes.map(node => (
      <div key={node.path}>
        {node.type === 'directory' ? (
          <div>
            <button
              onClick={() => toggleFolder(node.path)}
              className={`flex items-center gap-2 px-2 py-1.5 hover:bg-gray-700 rounded text-sm w-full text-left transition-colors ${
                selectedFile === node.path ? 'bg-gray-700' : ''
              }`}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
              {expandedFolders.has(node.path) ? (
                <ChevronDown className="w-4 h-4 text-blue-400 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-blue-400 flex-shrink-0" />
              )}
              <Folder className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span className="text-white truncate">{node.name}</span>
            </button>
            {expandedFolders.has(node.path) && node.children && (
              <div>
                {renderFileTree(node.children, depth + 1)}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => selectFile(node.path)}
            className={`flex items-center gap-2 px-2 py-1.5 hover:bg-gray-700 rounded text-sm w-full text-left transition-colors ${
              selectedFile === node.path ? 'bg-blue-900/50 border-l-2 border-blue-400' : ''
            }`}
            style={{ paddingLeft: `${depth * 12 + 24}px` }}
          >
            <FileCode className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span className="text-gray-300 truncate">{node.name}</span>
          </button>
        )}
      </div>
    ))
  }

  if (!open) return null

  const filteredFiles = searchInFileContent(files, searchQuery)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-0 md:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-gray-900 rounded-none md:rounded-lg w-full h-full md:max-w-[95vw] md:h-[95vh] flex flex-col border-0 md:border border-gray-700 shadow-2xl overflow-hidden"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-900/95 backdrop-blur">
              <div className="flex-1 min-w-0">
                <h2 className="text-base md:text-xl font-bold text-white truncate flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-green-400" />
                  Developer Export
                  {saveSuccess && (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Synced!
                    </span>
                  )}
                </h2>
                <p className="text-xs text-gray-400 hidden md:block">
                  Always-on code editor with real-time sync
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                {isMobile && (
                  <>
                    <Button
                      variant={mobileView === 'files' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setMobileView('files')}
                      className="h-8 px-2"
                      title="View files"
                    >
                      <Folder className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={mobileView === 'editor' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setMobileView('editor')}
                      disabled={!selectedFile}
                      className="h-8 px-2"
                      title="View editor"
                    >
                      <FileCode className="w-4 h-4" />
                    </Button>
                  </>
                )}
                <Button
                  onClick={reloadFiles}
                  variant="ghost"
                  size="sm"
                  disabled={isLoading}
                  className="text-gray-400 hover:text-white h-8 px-2"
                  title="Reload files from project"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                
                {/* Hidden file input for ZIP upload */}
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleZipUpload}
                  style={{ display: 'none' }}
                  id="zip-upload-input"
                />
                
                {/* Upload ZIP button */}
                <Button
                  onClick={() => document.getElementById('zip-upload-input')?.click()}
                  disabled={isUploading}
                  size="sm"
                  variant="ghost"
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 gap-1 text-xs h-8 px-3"
                  title="Upload ZIP file to load into app"
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">{isUploading ? `${Math.round(uploadProgress)}%` : 'Upload'}</span>
                </Button>
                
                <Button
                  onClick={downloadAsZip}
                  disabled={isDownloading}
                  size="sm"
                  className="bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] text-black hover:from-[#e2d4ff] hover:to-[#d1c4e9] gap-1 text-xs h-8 px-3"
                  title="Download all files as ZIP"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">{isDownloading ? `${Math.round(downloadProgress)}%` : 'ZIP'}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-400 hover:text-white h-8 px-2"
                  title="Close developer export"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Save Changes Button - BRIGHT GREEN AT TOP - MOBILE OPTIMIZED */}
            {showSaveChanges && !isUploading && (
              <motion.div 
                className="p-4 border-b-2 border-green-500 bg-gradient-to-r from-green-900/40 to-green-800/40 backdrop-blur-sm"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 max-w-4xl mx-auto">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center w-12 h-12 md:w-10 md:h-10 rounded-full bg-green-500/30 flex-shrink-0 animate-pulse">
                      <Upload className="w-6 h-6 md:w-5 md:h-5 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-base md:text-sm font-bold text-green-300">
                        {uploadedFiles.length} file(s) ready to sync
                      </p>
                      <p className="text-xs md:text-xs text-green-400/80">
                        Click Save Changes to sync to project
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={saveAllChanges}
                    disabled={isSavingAll}
                    size="lg"
                    className="bg-gradient-to-r from-green-500 to-green-400 text-white hover:from-green-600 hover:to-green-500 gap-2 h-14 md:h-11 text-lg md:text-base font-bold shadow-2xl shadow-green-500/50 border-2 border-green-400 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    <Save className="w-6 h-6 md:w-5 md:h-5" />
                    {isSavingAll ? 'Syncing Files...' : 'Save Changes'}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* File Tree Sidebar */}
              <div className={`${isMobile ? (mobileView === 'files' ? 'flex' : 'hidden') : 'flex'} w-full md:w-64 lg:w-80 border-r border-gray-700 flex-col bg-gray-900/50`}>
                {/* Search */}
                <div className="p-3 border-b border-gray-700 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search files..."
                      className="pl-9 bg-gray-800 border-gray-600 text-white text-sm h-9"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={searchInContent}
                      onChange={(e) => setSearchInContent(e.target.checked)}
                      className="rounded bg-gray-800 border-gray-600"
                    />
                    <span>Search in file content</span>
                  </label>
                </div>

                {/* File List */}
                <ScrollArea className="flex-1">
                  <div className="p-2">
                    {isLoading ? (
                      <div className="text-center text-gray-400 py-8">
                        <div className="animate-spin w-8 h-8 border-2 border-gray-600 border-t-white rounded-full mx-auto mb-2" />
                        <span className="text-sm">Loading files...</span>
                      </div>
                    ) : filteredFiles.length === 0 ? (
                      <div className="text-center text-gray-400 py-8 text-sm">
                        No files found
                      </div>
                    ) : (
                      renderFileTree(filteredFiles)
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* File Content Editor */}
              <div className={`${isMobile ? (mobileView === 'editor' ? 'flex' : 'hidden') : 'flex'} flex-1 flex-col bg-gray-950`}>
                {selectedFile ? (
                  <>
                    {/* File Header */}
                    <div className="flex items-center justify-between p-2 md:p-3 border-b border-gray-700 bg-gray-900/50 backdrop-blur gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileCode className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span className="text-white font-medium text-xs md:text-sm truncate">{selectedFile}</span>
                        {hasUnsavedChanges && (
                          <span className="text-xs text-yellow-400 flex-shrink-0">●</span>
                        )}
                      </div>
                    </div>

                    {/* Success Message */}
                    <AnimatePresence>
                      {saveSuccess && (
                        <motion.div 
                          className="p-3 bg-green-900/20 border-b border-green-900/50 flex items-center gap-2"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <Zap className="w-4 h-4 text-green-400 flex-shrink-0 animate-pulse" />
                          <span className="text-green-400 text-sm font-medium">
                            ✅ Changes synced to project!
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Advanced Code Editor - Always Editable */}
                    <div className="flex-1 overflow-hidden">
                      <AdvancedCodeEditor
                        content={editedContent}
                        onChange={setEditedContent}
                        fileName={selectedFile}
                        hasUnsavedChanges={hasUnsavedChanges}
                        onSave={saveFileChanges}
                        isSaving={isSaving}
                        originalContent={originalContent}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <FileCode className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p className="text-base mb-2">Select a file to edit</p>
                      <p className="text-sm text-gray-500">Editor is always ready - changes sync instantly</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="p-3 border-t border-gray-700 bg-blue-900/20">
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-300"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-center text-sm text-blue-400 mt-2">
                  Extracting files... {Math.round(uploadProgress)}%
                </p>
              </div>
            )}



            {/* Save All Success Message */}
            <AnimatePresence>
              {saveAllSuccess && (
                <motion.div 
                  className="p-3 border-t border-gray-700 bg-green-900/20 flex items-center justify-center gap-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Zap className="w-5 h-5 text-green-400 animate-pulse" />
                  <span className="text-green-400 text-sm font-medium">
                    ✅ All files synced to project successfully! Modu can now see your changes.
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Download Progress Bar */}
            {isDownloading && (
              <div className="p-3 border-t border-gray-700 bg-gray-900/50">
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#fff0f5] to-[#ffd1db]"
                    initial={{ width: 0 }}
                    animate={{ width: `${downloadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-center text-sm text-gray-400 mt-2">
                  Preparing download... {Math.round(downloadProgress)}%
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
