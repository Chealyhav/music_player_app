<template>
  <div class="inline-flex items-center gap-2.5 select-none">
    <div
      class="relative flex-shrink-0 flex items-center justify-center transition-transform hover:scale-105"
      :style="{ width: `${size}px`, height: `${size}px` }"
    >
      <svg
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="w-full h-full drop-shadow-md"
      >
        <defs>
          <!-- Base background gradient -->
          <radialGradient :id="'logo-bg-' + uid" cx="50%" cy="30%" r="80%">
            <stop offset="0%" stop-color="#181d2c" />
            <stop offset="65%" stop-color="#0c1017" />
            <stop offset="100%" stop-color="#07090e" />
          </radialGradient>

          <!-- Outer glowing border gradient with brand color system -->
          <linearGradient :id="'logo-neon-' + uid" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f43f5e" />
            <stop offset="35%" stop-color="#fb7185" />
            <stop offset="70%" stop-color="#818cf8" />
            <stop offset="100%" stop-color="#06b6d4" />
          </linearGradient>

          <!-- Wave gradients -->
          <linearGradient :id="'logo-wave-rose-' + uid" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#e11d48" />
            <stop offset="50%" stop-color="#f43f5e" />
            <stop offset="100%" stop-color="#a855f7" />
          </linearGradient>

          <linearGradient :id="'logo-wave-cyan-' + uid" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#4f46e5" />
            <stop offset="60%" stop-color="#0284c7" />
            <stop offset="100%" stop-color="#06b6d4" />
          </linearGradient>

          <!-- Soundbars -->
          <linearGradient :id="'logo-bars-left-' + uid" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#e11d48" />
            <stop offset="100%" stop-color="#fb7185" />
          </linearGradient>
          <linearGradient :id="'logo-bars-right-' + uid" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0284c7" />
            <stop offset="100%" stop-color="#38bdf8" />
          </linearGradient>

          <!-- Gear Metallic -->
          <linearGradient :id="'logo-gear-' + uid" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="60%" stop-color="#e2e8f0" />
            <stop offset="100%" stop-color="#cbd5e1" />
          </linearGradient>

          <!-- Slider Badge -->
          <linearGradient :id="'logo-badge-' + uid" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f43f5e" />
            <stop offset="50%" stop-color="#d946ef" />
            <stop offset="100%" stop-color="#6366f1" />
          </linearGradient>

          <filter :id="'logo-shadow-' + uid" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000000" flood-opacity="0.5" />
          </filter>
        </defs>

        <!-- Squircle Base Frame -->
        <rect
          x="28"
          y="28"
          width="456"
          height="456"
          rx="105"
          :fill="'url(#logo-bg-' + uid + ')'"
          :stroke="'url(#logo-neon-' + uid + ')'"
          stroke-width="14"
        />

        <!-- Left Equalizer Soundbars -->
        <g opacity="0.95">
          <rect x="52" y="220" width="14" height="60" rx="7" :fill="'url(#logo-bars-left-' + uid + ')'" />
          <rect x="74" y="190" width="14" height="95" rx="7" :fill="'url(#logo-bars-left-' + uid + ')'" />
          <rect x="96" y="165" width="14" height="130" rx="7" :fill="'url(#logo-bars-left-' + uid + ')'" />
        </g>

        <!-- Right Equalizer Soundbars -->
        <g opacity="0.95">
          <rect x="402" y="170" width="14" height="125" rx="7" :fill="'url(#logo-bars-right-' + uid + ')'" />
          <rect x="424" y="195" width="14" height="90" rx="7" :fill="'url(#logo-bars-right-' + uid + ')'" />
          <rect x="446" y="225" width="14" height="55" rx="7" :fill="'url(#logo-bars-right-' + uid + ')'" />
        </g>

        <!-- Audio Ribbon Waves at bottom -->
        <path
          d="M 28 375 C 130 395, 200 350, 310 330 C 390 315, 435 345, 484 320 L 484 430 C 465 462, 430 484, 380 484 L 132 484 C 82 484, 47 462, 28 430 Z"
          :fill="'url(#logo-wave-cyan-' + uid + ')'"
          opacity="0.45"
        />
        <path
          d="M 28 400 C 105 370, 180 422, 275 412 C 370 402, 435 455, 484 430 L 484 435 C 465 465, 430 484, 380 484 L 132 484 C 82 484, 47 465, 28 435 Z"
          :fill="'url(#logo-wave-rose-' + uid + ')'"
          opacity="0.75"
        />

        <!-- Central High-Tech Gear -->
        <g :filter="'url(#logo-shadow-' + uid + ')'">
          <path
            d="
            M 256 100
            L 272 100 A 10 10 0 0 1 282 107 L 290 128 A 10 10 0 0 0 299 133 L 322 128 A 10 10 0 0 1 333 133 L 344 148 A 10 10 0 0 1 343 160 L 333 179 A 10 10 0 0 0 336 190 L 354 205 A 10 10 0 0 1 359 217 L 359 237 A 10 10 0 0 1 354 249 L 336 264 A 10 10 0 0 0 333 275 L 343 294 A 10 10 0 0 1 344 306 L 333 321 A 10 10 0 0 1 322 326 L 299 321 A 10 10 0 0 0 290 326 L 282 347 A 10 10 0 0 1 272 354 L 240 354 A 10 10 0 0 1 230 347 L 222 326 A 10 10 0 0 0 213 321 L 190 326 A 10 10 0 0 1 179 321 L 168 306 A 10 10 0 0 1 169 294 L 179 275 A 10 10 0 0 0 176 264 L 158 249 A 10 10 0 0 1 153 237 L 153 217 A 10 10 0 0 1 158 205 L 176 190 A 10 10 0 0 0 179 179 L 169 160 A 10 10 0 0 1 168 148 L 179 133 A 10 10 0 0 1 190 128 L 213 133 A 10 10 0 0 0 222 128 L 230 107 A 10 10 0 0 1 240 100 Z"
            :fill="'url(#logo-gear-' + uid + ')'"
            stroke="#ffffff"
            stroke-width="3"
          />
          <!-- Gear Inner Hole -->
          <circle cx="256" cy="227" r="74" fill="#0f141f" stroke="#cbd5e1" stroke-width="4" />
        </g>

        <!-- Musical Note In Center of Gear -->
        <g :fill="'url(#logo-gear-' + uid + ')'">
          <path d="M 276 170 L 298 163 C 304 161, 308 165, 308 171 L 308 238 C 308 240, 306 242, 304 243 C 298 245, 288 246, 280 248 C 267 251, 256 260, 256 272 C 256 284, 267 292, 281 292 C 296 292, 308 281, 308 266 L 308 200 L 276 208 Z" />
          <ellipse cx="277" cy="272" rx="22" ry="17" transform="rotate(-15 277 272)" />
        </g>

        <!-- Bottom-Right Circular Equalizer Slider Controls Badge -->
        <g :filter="'url(#logo-shadow-' + uid + ')'">
          <circle cx="360" cy="330" r="66" :fill="'url(#logo-badge-' + uid + ')'" stroke="#ffffff" stroke-width="4" />
          <line x1="326" y1="308" x2="394" y2="308" stroke="#ffffff" stroke-width="6" stroke-linecap="round" />
          <circle cx="374" cy="308" r="8.5" fill="#ffffff" />
          <line x1="326" y1="330" x2="394" y2="330" stroke="#ffffff" stroke-width="6" stroke-linecap="round" />
          <circle cx="348" cy="330" r="8.5" fill="#ffffff" />
          <line x1="326" y1="352" x2="394" y2="352" stroke="#ffffff" stroke-width="6" stroke-linecap="round" />
          <circle cx="372" cy="352" r="8.5" fill="#ffffff" />
        </g>
      </svg>
    </div>

    <!-- Optional Brand Name Text: SOMLENG -->
    <div v-if="showText" class="flex flex-col">
      <div class="flex items-center gap-1.5">
        <span
          class="font-black tracking-wider uppercase bg-gradient-to-r from-white via-rose-100 to-rose-400 bg-clip-text text-transparent"
          :class="textSize"
        >
          {{ appName }}
        </span>
        <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-brand-500/20 text-brand-400 border border-brand-500/30 uppercase tracking-widest">
          PRO
        </span>
      </div>
      <span class="text-[10px] text-slate-400 font-medium tracking-tight -mt-0.5">
        Sound & Music Player
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    size?: number
    showText?: boolean
    textSize?: string
  }>(),
  {
    size: 38,
    showText: false,
    textSize: 'text-lg'
  }
)
const appName = useRuntimeConfig().public.appName || 'SOMLENG'

// Generate unique ID to prevent SVG defs collision when multiple instances exist
const uid = computed(() => Math.random().toString(36).substring(2, 9))
</script>
