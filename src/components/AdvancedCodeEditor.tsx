'use client'

import { useState, useRef, useEffect } from 'react'
import type * as Monaco from 'monaco-editor'
import Editor, { type OnMount } from '@monaco-editor/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Replace,
  CaseSensitive,
  Regex,
  WholeWord,
  ListOrdered,
  Copy,
  Check,
  Save,
  Zap,
  Code2
} from 'lucide-react'

interface AdvancedCodeEditorProps {
  content: string
  onChange: (content: string) => void
  language?: string
  hasUnsavedChanges?: boolean
  onSave?: () => void
  isSaving?: boolean
  originalContent?: string
  fileName?: string
}

// Auto-detect language from file extension
const detectLanguage = (fileName?: string): string => {
  if (!fileName) return 'typescript'
  
  const ext = fileName.split('.').pop()?.toLowerCase()
  
  const languageMap: Record<string, string> = {
    'ts': 'typescript',
    'tsx': 'typescript',
    'js': 'javascript',
    'jsx': 'javascript',
    'json': 'json',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',
    'md': 'markdown',
    'py': 'python',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'swift': 'swift',
    'kt': 'kotlin',
    'sql': 'sql',
    'yaml': 'yaml',
    'yml': 'yaml',
    'xml': 'xml',
    'sh': 'shell',
    'bash': 'shell',
    'ps1': 'powershell',
    'r': 'r',
    'dart': 'dart',
    'vue': 'html',
    'svelte': 'html'
  }
  
  return languageMap[ext || ''] || 'plaintext'
}

export function AdvancedCodeEditor({ 
  content, 
  onChange, 
  language,
  hasUnsavedChanges = false,
  onSave,
  isSaving = false,
  originalContent,
  fileName
}: AdvancedCodeEditorProps): JSX.Element {
  const [showSearch, setShowSearch] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [replaceQuery, setReplaceQuery] = useState<string>('')
  const [caseSensitive, setCaseSensitive] = useState<boolean>(false)
  const [useRegex, setUseRegex] = useState<boolean>(false)
  const [wholeWord, setWholeWord] = useState<boolean>(false)
  const [currentMatch, setCurrentMatch] = useState<number>(0)
  const [totalMatches, setTotalMatches] = useState<number>(0)
  const [showGoToLine, setShowGoToLine] = useState<boolean>(false)
  const [goToLineNumber, setGoToLineNumber] = useState<string>('')
  const [copiedContent, setCopiedContent] = useState<boolean>(false)
  
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof Monaco | null>(null)

  // Auto-detect language from filename if provided
  const detectedLanguage = language || detectLanguage(fileName)

  // Handle editor mount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Configure editor for better UX
    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: 12,
      lineNumbers: 'on',
      roundedSelection: true,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: 'off',
      suggest: {
        showMethods: true,
        showFunctions: true,
        showConstructors: true,
        showFields: true,
        showVariables: true,
        showClasses: true,
        showStructs: true,
        showInterfaces: true,
        showModules: true,
        showProperties: true,
        showEvents: true,
        showOperators: true,
        showUnits: true,
        showValues: true,
        showConstants: true,
        showEnums: true,
        showEnumMembers: true,
        showKeywords: true,
        showWords: true,
        showColors: true,
        showFiles: true,
        showReferences: true,
        showFolders: true,
        showTypeParameters: true,
        showSnippets: true,
      },
      quickSuggestions: {
        other: true,
        comments: false,
        strings: true
      },
      parameterHints: {
        enabled: true
      },
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: 'on',
      tabCompletion: 'on',
      wordBasedSuggestions: 'matchingDocuments',
      formatOnType: true,
      formatOnPaste: true,
      autoClosingBrackets: 'always',
      autoClosingQuotes: 'always',
      autoSurround: 'languageDefined',
      bracketPairColorization: {
        enabled: true
      }
    })

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSave && hasUnsavedChanges) {
        onSave()
      }
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      setShowSearch(true)
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG, () => {
      setShowGoToLine(true)
    })
  }

  // Handle editor value change
  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '')
  }

  // Find matches in content
  const findMatches = (): number[] => {
    if (!searchQuery || !editorRef.current || !monacoRef.current) return []

    const model = editorRef.current.getModel()
    if (!model) return []

    const matches = model.findMatches(
      searchQuery,
      false,
      useRegex,
      caseSensitive,
      wholeWord ? searchQuery : null,
      true
    )

    return matches.map(match => model.getOffsetAt(match.range.getStartPosition()))
  }

  // Update matches when search changes
  useEffect(() => {
    const matches = findMatches()
    setTotalMatches(matches.length)
    if (matches.length > 0 && currentMatch >= matches.length) {
      setCurrentMatch(0)
    }
  }, [searchQuery, content, caseSensitive, useRegex, wholeWord])

  // Navigate to next match
  const goToNextMatch = () => {
    if (!editorRef.current || !monacoRef.current) return

    const model = editorRef.current.getModel()
    if (!model) return

    const matches = model.findMatches(
      searchQuery,
      false,
      useRegex,
      caseSensitive,
      wholeWord ? searchQuery : null,
      true
    )

    if (matches.length === 0) return

    const nextIndex = (currentMatch + 1) % matches.length
    setCurrentMatch(nextIndex)
    
    const match = matches[nextIndex]
    editorRef.current.setSelection(match.range)
    editorRef.current.revealLineInCenter(match.range.startLineNumber)
  }

  // Navigate to previous match
  const goToPreviousMatch = () => {
    if (!editorRef.current || !monacoRef.current) return

    const model = editorRef.current.getModel()
    if (!model) return

    const matches = model.findMatches(
      searchQuery,
      false,
      useRegex,
      caseSensitive,
      wholeWord ? searchQuery : null,
      true
    )

    if (matches.length === 0) return

    const prevIndex = currentMatch === 0 ? matches.length - 1 : currentMatch - 1
    setCurrentMatch(prevIndex)
    
    const match = matches[prevIndex]
    editorRef.current.setSelection(match.range)
    editorRef.current.revealLineInCenter(match.range.startLineNumber)
  }

  // Replace current match
  const replaceCurrentMatch = () => {
    if (!editorRef.current || !monacoRef.current) return

    const model = editorRef.current.getModel()
    if (!model) return

    const matches = model.findMatches(
      searchQuery,
      false,
      useRegex,
      caseSensitive,
      wholeWord ? searchQuery : null,
      true
    )

    if (matches.length === 0) return

    const match = matches[currentMatch]
    editorRef.current.executeEdits('replace', [{
      range: match.range,
      text: replaceQuery
    }])
  }

  // Replace all matches
  const replaceAllMatches = () => {
    if (!editorRef.current || !monacoRef.current || !searchQuery) return

    const model = editorRef.current.getModel()
    if (!model) return

    const matches = model.findMatches(
      searchQuery,
      false,
      useRegex,
      caseSensitive,
      wholeWord ? searchQuery : null,
      true
    )

    if (matches.length === 0) return

    const edits = matches.map(match => ({
      range: match.range,
      text: replaceQuery
    }))

    editorRef.current.executeEdits('replace-all', edits)
  }

  // Go to specific line
  const goToLine = () => {
    const lineNum = parseInt(goToLineNumber)
    if (isNaN(lineNum) || lineNum < 1 || !editorRef.current) return

    editorRef.current.revealLineInCenter(lineNum)
    editorRef.current.setPosition({ lineNumber: lineNum, column: 1 })
    editorRef.current.focus()
    
    setShowGoToLine(false)
    setGoToLineNumber('')
  }

  // Copy all content
  const copyAllContent = () => {
    navigator.clipboard.writeText(content)
    setCopiedContent(true)
    setTimeout(() => setCopiedContent(false), 2000)
  }

  // Select all content
  const selectAllContent = () => {
    if (editorRef.current) {
      const model = editorRef.current.getModel()
      if (model) {
        const fullRange = model.getFullModelRange()
        editorRef.current.setSelection(fullRange)
        editorRef.current.focus()
      }
    }
  }

  const lines = content.split('\n')

  return (
    <div className="flex flex-col h-full relative bg-gray-950">
      {/* Toolbar */}
      <div className="border-b border-gray-700 bg-gray-900 p-2 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 flex-wrap">
          <Button
            variant={showSearch ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
            className="h-8 px-2 md:px-3"
            title="Search in file (Ctrl+F)"
          >
            <Search className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden md:inline ml-1 text-xs">Find</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={copyAllContent}
            className="h-8 px-2 md:px-3"
            title="Copy all content to clipboard"
          >
            {copiedContent ? (
              <>
                <Check className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                <span className="hidden md:inline ml-1 text-xs text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden md:inline ml-1 text-xs">Copy</span>
              </>
            )}
          </Button>

          <Button
            variant={showGoToLine ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setShowGoToLine(!showGoToLine)}
            className="h-8 px-2 md:px-3"
            title="Go to line (Ctrl+G)"
          >
            <ListOrdered className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden md:inline ml-1 text-xs">Go to</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={selectAllContent}
            className="h-8 px-2 md:px-3 hidden md:flex"
            title="Select all text"
          >
            <span className="text-xs">Select All</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-800 border border-gray-700">
            <Code2 className="w-3 h-3 text-blue-400" />
            <span className="text-[10px] md:text-xs text-gray-400 font-mono">
              {detectedLanguage}
            </span>
          </div>
          <span className="text-xs text-gray-500 hidden md:inline">
            {lines.length} lines
          </span>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="border-b border-gray-700 bg-gray-900 p-2 space-y-2 z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 flex-1 min-w-[200px]">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find..."
                  className="pl-7 bg-gray-800 border-gray-600 text-white text-xs h-8"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.shiftKey ? goToPreviousMatch() : goToNextMatch()
                    }
                  }}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPreviousMatch}
                disabled={totalMatches === 0}
                className="h-8 px-2"
                title="Previous match (Shift+Enter)"
              >
                <ChevronUp className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNextMatch}
                disabled={totalMatches === 0}
                className="h-8 px-2"
                title="Next match (Enter)"
              >
                <ChevronDown className="w-3 h-3" />
              </Button>
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {totalMatches > 0 ? `${currentMatch + 1}/${totalMatches}` : 'No results'}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant={caseSensitive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCaseSensitive(!caseSensitive)}
                className="h-8 px-2"
                title="Match case"
              >
                <CaseSensitive className="w-3 h-3" />
              </Button>
              <Button
                variant={wholeWord ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setWholeWord(!wholeWord)}
                className="h-8 px-2"
                title="Match whole word"
              >
                <WholeWord className="w-3 h-3" />
              </Button>
              <Button
                variant={useRegex ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setUseRegex(!useRegex)}
                className="h-8 px-2"
                title="Use regular expression"
              >
                <Regex className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSearch(false)}
                className="h-8 px-2"
                title="Close search"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Replace className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
              <Input
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                placeholder="Replace..."
                className="pl-7 bg-gray-800 border-gray-600 text-white text-xs h-8"
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={replaceCurrentMatch}
              disabled={totalMatches === 0}
              className="h-8 text-xs"
              title="Replace current match"
            >
              Replace
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={replaceAllMatches}
              disabled={totalMatches === 0}
              className="h-8 text-xs"
              title="Replace all matches"
            >
              All
            </Button>
          </div>
        </div>
      )}

      {/* Go to Line */}
      {showGoToLine && (
        <div className="border-b border-gray-700 bg-gray-900 p-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <ListOrdered className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
              <Input
                value={goToLineNumber}
                onChange={(e) => setGoToLineNumber(e.target.value)}
                placeholder={`Line number (1-${lines.length})`}
                className="pl-7 bg-gray-800 border-gray-600 text-white text-xs h-8"
                type="number"
                min="1"
                max={lines.length}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    goToLine()
                  }
                }}
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={goToLine}
              className="h-8 text-xs"
              title="Jump to line"
            >
              Go
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGoToLine(false)}
              className="h-8 px-2"
              title="Close go to line"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={detectedLanguage}
          value={content}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            readOnly: false,
            domReadOnly: false
          }}
        />
      </div>

      {/* Floating Save Button - Top Right */}
      <AnimatePresence>
        {hasUnsavedChanges && onSave && (
          <motion.div
            className="absolute top-4 right-4 z-20"
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.8 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <motion.div
              animate={{ 
                boxShadow: [
                  '0 0 20px rgba(34, 197, 94, 0.3)',
                  '0 0 30px rgba(34, 197, 94, 0.5)',
                  '0 0 20px rgba(34, 197, 94, 0.3)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="rounded-lg"
            >
              <Button
                onClick={onSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-xl gap-2 px-4 py-6 text-sm font-bold border-2 border-green-400/30"
                title="Save changes and sync to project (Ctrl+S)"
              >
                {isSaving ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Save className="w-5 h-5" />
                    </motion.div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>Save & Sync</span>
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Hint */}
      {!showSearch && !showGoToLine && !hasUnsavedChanges && (
        <div className="absolute bottom-2 right-2 text-[9px] md:text-[10px] text-gray-600 bg-gray-900/80 px-2 py-1 rounded hidden md:block">
          Ctrl+F: Search | Ctrl+G: Go to line | Ctrl+S: Save | Tab/Enter: Autocomplete
        </div>
      )}
    </div>
  )
}
