<template>
  <div
    @click="$emit('select', track)"
    class="group flex items-center gap-3.5 p-2.5 rounded-2xl cursor-pointer transition-all duration-200"
    :class="isActive ? 'bg-brand-500/15 border border-brand-500/30' : 'hover:bg-white/5 active:bg-white/10'"
  >
    <!-- Thumbnail with play status -->
    <div class="relative w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-dark-800 shadow-md">
      <img
        :src="track.thumb || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80'"
        :alt="track.title"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      <!-- Active Sound Wave Animation or Play Icon Overlay -->
      <div
        v-if="isActive"
        class="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center gap-0.5"
      >
        <span
          v-if="isPlaying"
          class="w-1 bg-brand-500 rounded-full animate-sound-bar"
          style="height: 16px; animation-delay: 0ms;"
        ></span>
        <span
          v-if="isPlaying"
          class="w-1 bg-brand-500 rounded-full animate-sound-bar"
          style="height: 22px; animation-delay: 200ms;"
        ></span>
        <span
          v-if="isPlaying"
          class="w-1 bg-brand-500 rounded-full animate-sound-bar"
          style="height: 12px; animation-delay: 400ms;"
        ></span>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          class="w-5 h-5 text-brand-500"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
      <div
        v-else
        class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          class="w-5 h-5 text-white"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>

    <!-- Track Info -->
    <div class="flex-1 min-w-0 pr-1">
      <div class="flex items-center gap-1.5">
        <h4
          class="text-sm font-semibold truncate transition-colors"
          :class="isActive ? 'text-brand-400' : 'text-slate-100 group-hover:text-white'"
        >
          {{ track.title }}
        </h4>
        <span
          v-if="isDownloaded"
          class="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5"
          title="Track details saved in SQLite"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="w-2.5 h-2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          SQL
        </span>
      </div>
      <p class="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
        <span class="truncate">{{ track.channel }}</span>
        <span v-if="track.duration" class="text-[10px] text-slate-500">• {{ track.duration }}</span>
      </p>
    </div>

    <!-- Action Buttons -->
    <div class="flex items-center gap-0.5">
      <!-- SQLite Download Button -->
      <button
        @click.stop="handleDownloadClick"
        class="p-2 rounded-full transition-all"
        :class="isDownloaded ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10' : 'text-slate-400 hover:text-white hover:bg-white/10 active:scale-90'"
        :title="isDownloaded ? 'Track details saved in SQLite' : 'Save track details to SQLite'"
      >
        <span v-if="isDownloading" class="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin inline-block"></span>
        <svg
          v-else-if="isDownloaded"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="w-4 h-4 text-emerald-400"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="w-4 h-4"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>

      <!-- Favorite / Liked Button -->
      <button
        @click.stop="$emit('toggle-favorite', track)"
        class="p-2 rounded-full text-slate-400 hover:text-brand-500 hover:bg-white/10 active:scale-90 transition-all"
        :class="{ '!text-brand-500': isFav }"
        title="Favorite"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          :fill="isFav ? 'currentColor' : 'none'"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="w-4 h-4"
        >
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      </button>

      <!-- Delete Button (optional for downloads tab) -->
      <button
        v-if="showDelete"
        @click.stop="$emit('delete', track)"
        class="p-2 rounded-full text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 active:scale-90 transition-all"
        title="Delete from SQLite"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlayerStore, type Track } from '~/stores/player'

const props = defineProps<{
  track: Track
  isActive?: boolean
  isPlaying?: boolean
  isFav?: boolean
  showDelete?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', track: Track): void
  (e: 'toggle-favorite', track: Track): void
  (e: 'delete', track: Track): void
}>()

const store = usePlayerStore()

const isDownloaded = computed(() => store.isDownloaded(props.track.id))
const isDownloading = computed(() => store.isDownloading[props.track.id])

const handleDownloadClick = () => {
  if (isDownloaded.value) {
    store.showToast(`"${props.track.title.slice(0, 25)}..." is stored in SQLite`)
  } else {
    store.downloadTrack(props.track)
  }
}
</script>
