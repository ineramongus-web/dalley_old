'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Upload } from 'lucide-react'

interface HeaderProps {
  onImport: () => void
  onExport: () => void
  projectName: string
  onProjectNameChange: (name: string) => void
}

export default function Header({ 
  onImport, 
  onExport, 
  projectName,
  onProjectNameChange 
}: HeaderProps): JSX.Element {
  const [isEditing, setIsEditing] = useState<boolean>(false)

  return (
    <motion.header 
      className="h-12 sm:h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-2 sm:px-4 flex-shrink-0"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-black font-bold text-xs sm:text-sm">Z</span>
        </div>
        <h1 className="text-sm sm:text-xl font-bold bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] bg-clip-text text-transparent truncate">
          Zomex•UIX
        </h1>
      </div>

      <div className="flex-1 max-w-32 sm:max-w-md mx-2 sm:mx-4 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
            className="w-full px-2 sm:px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white text-center text-xs sm:text-sm focus:outline-none focus:border-purple-400"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full px-2 sm:px-3 py-1 text-center text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-xs sm:text-sm truncate"
          >
            {projectName}
          </button>
        )}
      </div>

      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
        <button
          onClick={onImport}
          className="p-1.5 sm:p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          title="Import Project"
        >
          <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={onExport}
          className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-[#fff0f5] to-[#ffd1db] text-black hover:opacity-80 transition-opacity"
          title="Export Lua Code"
        >
          <Download className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </motion.header>
  )
}