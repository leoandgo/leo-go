'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { useLanguage } from '@/lib/LanguageContext'
import { Language } from '@/lib/translations'

// SVG flag components for cross-platform support
const FrenchFlag = () => (
  <svg viewBox="0 0 512 512" className="w-6 h-6 sm:w-7 sm:h-7 rounded-full">
    <rect width="170.67" height="512" fill="#002654" />
    <rect x="170.67" width="170.67" height="512" fill="#fff" />
    <rect x="341.33" width="170.67" height="512" fill="#ce1126" />
  </svg>
)

const BritishFlag = () => (
  <svg viewBox="0 0 60 30" className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover">
    <clipPath id="s"><path d="M0,0 v30 h60 v-30 z" /></clipPath>
    <clipPath id="t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" /></clipPath>
    <g clipPath="url(#s)">
      <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4" />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </g>
  </svg>
)

export default function Header() {
  const { language, setLanguage, t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const languages: { code: Language; label: string; Flag: React.FC }[] = [
    { code: 'fr', label: 'Français', Flag: FrenchFlag },
    { code: 'en', label: 'English', Flag: BritishFlag },
  ]

  const currentLang = languages.find(l => l.code === language) || languages[0]
  const CurrentFlag = currentLang.Flag

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="py-3 sm:py-4" style={{ backgroundColor: '#22AF8C' }}>
      <div className="max-w-6xl mx-auto px-3 sm:px-4 flex items-center justify-between">
        {/* Logo */}
        <a href="https://www.leoandgo.com" target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
          <Image
            src="/logo.png"
            alt="Leo&Go"
            width={140}
            height={50}
            className="h-8 sm:h-12 w-auto object-contain"
            priority
          />
        </a>

        {/* Language Dropdown - Flag Circle */}
        <div className="relative flex-shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 overflow-hidden"
            aria-label="Select language"
          >
            <CurrentFlag />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 overflow-hidden min-w-[140px]">
              {languages.map((lang) => {
                const LangFlag = lang.Flag
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code)
                      setIsOpen(false)
                    }}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors ${language === lang.code ? 'bg-green-50' : ''
                      }`}
                  >
                    <LangFlag />
                    <span className="font-medium text-gray-700 text-sm">{lang.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
