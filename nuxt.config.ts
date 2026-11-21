// https://nuxt.com/docs/api/configuration/nuxt-config
const appName = process.env.APP_NAME || 'SOMLENG'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  ssr: false, // Client-side SPA mode for continuous audio playback, SQLite wasm, and YouTube iframe API
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],
  runtimeConfig: {
    public: {
      appName: process.env.APP_NAME || 'SOMLENG',
      youtubeApiKey: process.env.YOUTUBE_API_KEY || ''
    }
  },
  app: {
    head: {
      title: `${appName} • Music Player`,
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' },
        { name: 'theme-color', content: '#07090e' },
        { name: 'color-scheme', content: 'dark' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: appName },
        { name: 'application-name', content: appName },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'description', content: `${appName} - Mobile-first music player with a local SQLite track library` }
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'alternate icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap' }
      ]
    }
  },
  css: [
    '~/assets/css/main.css'
  ]
})
