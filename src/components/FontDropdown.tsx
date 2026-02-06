'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'

interface FontDropdownProps {
  value: string
  onChange: (value: string) => void
}

interface FontOption {
  value: string
  label: string
  fontFamily: string
}

const fontOptions: FontOption[] = [
  { value: 'Legacy', label: 'Legacy', fontFamily: 'Times New Roman, serif' },
  { value: 'Arial', label: 'Arial (deprecated → Arimo)', fontFamily: 'Arial, sans-serif' },
  { value: 'ArialBold', label: 'Arial Bold (deprecated → Arimo Bold)', fontFamily: 'Arial, sans-serif' },
  { value: 'SourceSans', label: 'Source Sans', fontFamily: 'Source Sans Pro, sans-serif' },
  { value: 'SourceSansBold', label: 'Source Sans Bold', fontFamily: 'Source Sans Pro, sans-serif' },
  { value: 'SourceSansLight', label: 'Source Sans Light', fontFamily: 'Source Sans Pro, sans-serif' },
  { value: 'SourceSansItalic', label: 'Source Sans Italic', fontFamily: 'Source Sans Pro, sans-serif' },
  { value: 'SourceSansSemibold', label: 'Source Sans Semibold', fontFamily: 'Source Sans Pro, sans-serif' },
  { value: 'Bodoni', label: 'Bodoni', fontFamily: 'Bodoni, serif' },
  { value: 'Garamond', label: 'Garamond', fontFamily: 'Garamond, serif' },
  { value: 'Cartoon', label: 'Cartoon', fontFamily: 'Comic Sans MS, cursive' },
  { value: 'Code', label: 'Code', fontFamily: 'Courier New, monospace' },
  { value: 'Highway', label: 'Highway', fontFamily: 'Impact, sans-serif' },
  { value: 'SciFi', label: 'SciFi', fontFamily: 'Orbitron, sans-serif' },
  { value: 'Arcade', label: 'Arcade', fontFamily: 'Press Start 2P, cursive' },
  { value: 'Fantasy', label: 'Fantasy', fontFamily: 'Papyrus, fantasy' },
  { value: 'Antique', label: 'Antique', fontFamily: 'Georgia, serif' },
  { value: 'Gotham', label: 'Gotham', fontFamily: 'Gotham, sans-serif' },
  { value: 'GothamSemibold', label: 'Gotham Semibold', fontFamily: 'Gotham, sans-serif' },
  { value: 'GothamBold', label: 'Gotham Bold', fontFamily: 'Gotham, sans-serif' },
  { value: 'GothamBlack', label: 'Gotham Black', fontFamily: 'Gotham, sans-serif' },
  { value: 'AmaticSC', label: 'Amatic SC', fontFamily: 'Amatic SC, cursive' },
  { value: 'Bangers', label: 'Bangers', fontFamily: 'Bangers, cursive' },
  { value: 'Creepster', label: 'Creepster', fontFamily: 'Creepster, cursive' },
  { value: 'DenkOne', label: 'Denk One', fontFamily: 'Denk One, sans-serif' },
  { value: 'Fondamento', label: 'Fondamento', fontFamily: 'Fondamento, serif' },
  { value: 'FredokaOne', label: 'Fredoka One', fontFamily: 'Fredoka One, cursive' },
  { value: 'GrenzeGotisch', label: 'Grenze Gotisch', fontFamily: 'Grenze Gotisch, serif' },
  { value: 'IndieFlower', label: 'Indie Flower', fontFamily: 'Indie Flower, cursive' },
  { value: 'JosefinSans', label: 'Josefin Sans', fontFamily: 'Josefin Sans, sans-serif' },
  { value: 'Jura', label: 'Jura', fontFamily: 'Jura, sans-serif' },
  { value: 'Kalam', label: 'Kalam', fontFamily: 'Kalam, cursive' },
  { value: 'LuckiestGuy', label: 'Luckiest Guy', fontFamily: 'Luckiest Guy, cursive' },
  { value: 'Merriweather', label: 'Merriweather', fontFamily: 'Merriweather, serif' },
  { value: 'Michroma', label: 'Michroma', fontFamily: 'Michroma, sans-serif' },
  { value: 'Nunito', label: 'Nunito', fontFamily: 'Nunito, sans-serif' },
  { value: 'Oswald', label: 'Oswald', fontFamily: 'Oswald, sans-serif' },
  { value: 'PatrickHand', label: 'Patrick Hand', fontFamily: 'Patrick Hand, cursive' },
  { value: 'PermanentMarker', label: 'Permanent Marker', fontFamily: 'Permanent Marker, cursive' },
  { value: 'Roboto', label: 'Roboto', fontFamily: 'Roboto, sans-serif' },
  { value: 'RobotoCondensed', label: 'Roboto Condensed', fontFamily: 'Roboto Condensed, sans-serif' },
  { value: 'RobotoMono', label: 'Roboto Mono', fontFamily: 'Roboto Mono, monospace' },
  { value: 'Sarpanch', label: 'Sarpanch', fontFamily: 'Sarpanch, sans-serif' },
  { value: 'SpecialElite', label: 'Special Elite', fontFamily: 'Special Elite, cursive' },
  { value: 'TitilliumWeb', label: 'Titillium Web', fontFamily: 'Titillium Web, sans-serif' },
  { value: 'Ubuntu', label: 'Ubuntu', fontFamily: 'Ubuntu, sans-serif' },
  { value: 'BuilderSans', label: 'Builder Sans', fontFamily: 'system-ui, sans-serif' },
  { value: 'BuilderSansMedium', label: 'Builder Sans Medium', fontFamily: 'system-ui, sans-serif' },
  { value: 'BuilderSansBold', label: 'Builder Sans Bold', fontFamily: 'system-ui, sans-serif' },
  { value: 'BuilderSansExtraBold', label: 'Builder Sans Extra Bold', fontFamily: 'system-ui, sans-serif' },
  { value: 'Arimo', label: 'Arimo', fontFamily: 'Arimo, sans-serif' },
  { value: 'ArimoBold', label: 'Arimo Bold', fontFamily: 'Arimo, sans-serif' },
]

export function FontDropdown({ value, onChange }: FontDropdownProps): JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedFont = fontOptions.find(font => font.value === value) || fontOptions[3] // Default to SourceSans

  const filteredFonts = fontOptions.filter(font =>
    font.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={dropdownRef} className="relative">
      {/* Dropdown Button */}
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm flex items-center justify-between hover:bg-gray-650 transition-colors"
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        data-font-dropdown
      >
        <span data-font-dropdown style={{ ['--preview-font' as any]: selectedFont.fontFamily, fontFamily: selectedFont.fontFamily }}>{selectedFont.label}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl overflow-hidden"
            style={{ maxHeight: '300px' }}
          >
            {/* Search Input */}
            <div className="p-2 border-b border-gray-600 sticky top-0 bg-gray-800 z-10">
              <input
                type="text"
                placeholder="Search fonts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-gray-500"
                autoFocus
              />
            </div>

            {/* Font List */}
            <div className="overflow-y-auto" style={{ maxHeight: '250px' }}>
              {filteredFonts.length > 0 ? (
                filteredFonts.map((font) => (
                  <motion.button
                    key={font.value}
                    type="button"
                    onClick={() => {
                      onChange(font.value)
                      setIsOpen(false)
                      setSearchTerm('')
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-gray-700 transition-colors ${
                      font.value === value ? 'bg-gray-700/50' : ''
                    }`}
                    style={{ ['--preview-font' as any]: font.fontFamily, fontFamily: font.fontFamily }}
                    whileHover={{ x: 2 }}
                    data-font-dropdown
                  >
                    <span className="text-white text-sm" data-font-dropdown>{font.label}</span>
                    {font.value === value && (
                      <Check className="w-4 h-4 text-green-400" />
                    )}
                  </motion.button>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-gray-400 text-sm">
                  No fonts found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
