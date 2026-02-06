'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DeveloperExportModal } from '@/components/DeveloperExportModal'
import { AuthModal } from '@/components/AuthModal'
import { useAuth } from '@/hooks/useAuth'
import { 
  Upload, 
  Download, 
  Edit3,
  Check,
  X,
  Home,
  User,
  LogOut
} from 'lucide-react'

import type { UIElement } from '@/types/roblox'

interface HeaderProps {
  onImport: () => void
  onExport: () => void
  projectName: string
  onProjectNameChange: (name: string) => void
  onHome: () => void
}

export function Header({
  onImport,
  onExport,
  projectName,
  onProjectNameChange,
  onHome
}: HeaderProps): JSX.Element {
  const [isEditingName, setIsEditingName] = useState<boolean>(false)
  const [tempName, setTempName] = useState<string>(projectName)
  const [showDeveloperExport, setShowDeveloperExport] = useState<boolean>(false)
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false)
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false)
  const { user, profile, signOut, setProfile } = useAuth()

  const handleNameEdit = () => {
    setTempName(projectName)
    setIsEditingName(true)
  }

  const handleNameSave = () => {
    onProjectNameChange(tempName.trim() || 'Untitled Project')
    setIsEditingName(false)
  }

  const handleNameCancel = () => {
    setTempName(projectName)
    setIsEditingName(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave()
    } else if (e.key === 'Escape') {
      handleNameCancel()
    }
  }

  return (
    <motion.header
      className="h-16 bg-[#0A0A0A] border-b border-gray-800 flex items-center px-4 sm:px-6 gap-4 flex-shrink-0 relative z-10"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
    >
      {/* Logo */}
      <motion.button
        className="flex items-center gap-2 sm:gap-3 flex-shrink-0 cursor-pointer group"
        onClick={() => setShowDeveloperExport(true)}
        title="dalley. - Click for Developer Export"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* dalley. Logo */}
        <motion.img 
          src="https://i.ibb.co/whwgDG4d/dalley-logo.png" 
          alt="dalley. logo" 
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-contain"
          whileHover={{ rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        />
        <h1 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
          dalley.
        </h1>
      </motion.button>

      {/* Project Name */}
      <div className="flex-1 min-w-0 max-w-md">
        {isEditingName ? (
          <motion.div
            className="flex items-center gap-2"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Input
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={handleNameSave}
              className="bg-[#1A1A1A] border-gray-700 text-white text-sm h-10 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
              placeholder="Project name..."
              autoFocus
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNameSave}
              className="text-green-400 hover:text-green-300 hover:bg-gray-800 p-2 h-10 w-10 rounded-lg"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNameCancel}
              className="text-red-400 hover:text-red-300 hover:bg-gray-800 p-2 h-10 w-10 rounded-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          </motion.div>
        ) : (
          <motion.button
            onClick={handleNameEdit}
            className="flex items-center gap-2 text-left hover:bg-gray-800 rounded-lg px-4 py-2 transition-all group w-full"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <span className="text-white font-semibold truncate text-base" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
              {projectName}
            </span>
            <Edit3 className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </motion.button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Home Button */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onHome}
            className="text-gray-300 hover:text-white hover:bg-gray-800 gap-2 px-3 sm:px-4 py-2 h-10 rounded-lg text-xs sm:text-sm font-medium"
            style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
            title="Home - Projects, Themes & Elements"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Button>
        </motion.div>

        {/* Profile Button */}
        {user && profile ? (
          <div className="relative">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="text-gray-300 hover:text-white hover:bg-gray-800 gap-2 px-3 sm:px-4 py-2 h-10 rounded-lg text-xs sm:text-sm font-medium"
                style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
                title={`Signed in as ${profile.username}`}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#fff0f5] to-[#ffd1db] flex items-center justify-center">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.username} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-black" />
                  )}
                </div>
                <span className="hidden sm:inline">{profile.username}</span>
              </Button>
            </motion.div>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-12 bg-[#0F0F0F] border border-gray-800 rounded-lg shadow-xl p-2 min-w-[180px]"
                style={{ fontFamily: 'Outfit, system-ui, sans-serif', zIndex: 99999 }}
              >
                <div className="px-3 py-2 border-b border-gray-800 mb-2">
                  <p className="text-white text-sm font-semibold">{profile.username}</p>
                  {profile.full_name && (
                    <p className="text-gray-400 text-xs">{profile.full_name}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    signOut()
                    setShowProfileMenu(false)
                  }}
                  className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-gray-800 gap-2 px-3 py-2 h-9 rounded-lg text-xs"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </motion.div>
            )}
          </div>
        ) : (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAuthModal(true)}
              className="text-gray-300 hover:text-white hover:bg-gray-800 gap-2 px-3 sm:px-4 py-2 h-10 rounded-lg text-xs sm:text-sm font-medium"
              style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
              title="Sign In / Sign Up"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Sign In</span>
            </Button>
          </motion.div>
        )}

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onImport}
            className="text-gray-300 hover:text-white hover:bg-gray-800 gap-2 px-3 sm:px-4 py-2 h-10 rounded-lg text-xs sm:text-sm font-medium"
            style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={onExport}
            className="bg-brand-gradient text-black hover:opacity-90 gap-2 px-4 sm:px-5 py-2 h-10 rounded-lg text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </motion.div>
      </div>

      {/* Developer Export Modal */}
      <DeveloperExportModal
        open={showDeveloperExport}
        onClose={() => setShowDeveloperExport(false)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={(profile) => {
          setProfile(profile)
          setShowAuthModal(false)
        }}
      />
    </motion.header>
  )
}
