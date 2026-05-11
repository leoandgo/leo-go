'use client'

import { Instagram, Facebook, Linkedin } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer style={{ backgroundColor: '#22AF8C' }}>
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Links Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Informations */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">{t('information')}</h3>
            <ul className="space-y-2">
              <li>
                <a href="https://www.leoandgo.com/politique-de-confidentialit%C3%A9" target="_blank" rel="noopener noreferrer" className="text-white/90 hover:text-white hover:underline">
                  {t('privacyPolicy')}
                </a>
              </li>
              <li>
                <a href="https://www.leoandgo.com/mention-l%C3%A9gale" target="_blank" rel="noopener noreferrer" className="text-white/90 hover:text-white hover:underline">
                  {t('legalNotice')}
                </a>
              </li>
              <li>
                <a href="https://www.leoandgo.com/conditions-g%C3%A9n%C3%A9rales-d-utilisation" target="_blank" rel="noopener noreferrer" className="text-white/90 hover:text-white hover:underline">
                  {t('termsOfUse')}
                </a>
              </li>
              <li>
                <a href="https://www.leoandgo.com/frais-forfaitaires" target="_blank" rel="noopener noreferrer" className="text-white/90 hover:text-white hover:underline">
                  {t('applicableFees')}
                </a>
              </li>
              <li>
                <a href="https://www.leoandgo.com/faq" target="_blank" rel="noopener noreferrer" className="text-white/90 hover:text-white hover:underline">
                  {t('faq')}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">{t('contact')}</h3>
            <ul className="space-y-2">
              <li>
                <a href="mailto:bonjour@leoandgo.com" className="text-white/90 hover:text-white hover:underline">
                  bonjour@leoandgo.com
                </a>
              </li>
              <li>
                <a href="https://www.leoandgo.com/contact" target="_blank" rel="noopener noreferrer" className="text-white/90 hover:text-white hover:underline">
                  {t('contactForm')}
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">{t('followUs')}</h3>
            <div className="flex gap-4 mb-4">
              <a
                href="https://www.instagram.com/leoandgo_lyon/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://www.facebook.com/leoandgofrance/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://www.linkedin.com/company/leo-go/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
              <a
                href="https://www.tiktok.com/@leoandgo"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                aria-label="TikTok"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
            </div>
            {/* App Store Badges - Below social icons */}
            <div className="flex gap-3">
              <a
                href="https://apps.apple.com/fr/app/leo-go/id1573751084"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-105"
              >
                <img
                  src="/app-store-badge.avif"
                  alt="Download on the App Store"
                  className="h-9"
                />
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.vulog.leo.and.go"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-105"
              >
                <img
                  src="/google-play-badge.jpg"
                  alt="Get it on Google Play"
                  className="h-9"
                />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="border-t border-white/20 py-4">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-white/80 text-sm">
            {new Date().getFullYear()} {t('allRightsReserved')}.{' '}
            <a
              href="https://www.leoandgo.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white"
            >
              www.leoandgo.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
