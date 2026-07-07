<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SidePanel from './SidePanel.vue'
import ScenesPanel from './ScenesPanel.vue'
import ScenePreview from './ScenePreview.vue'
import ChoicesPanel from './ChoicesPanel.vue'
import { useProjectStore } from '../stores/projectStore'
import tutorialBg from '../assets/tutorial_bg.jpg'

const store = useProjectStore()
const emit = defineEmits(['go-to-menu'])
const showSavedToast = ref(false)
const showTutorial = ref(false)

onMounted(() => {
  console.log('[EDITOR] Mounted, meta:', store.meta?.gameName)
})

async function saveProject() {
  try {
    await store.saveProject()
    showSavedToast.value = true
    setTimeout(() => {
      showSavedToast.value = false
    }, 2000)
  } catch (e) {
    alert('Błąd zapisu: ' + e)
  }
}
</script>

<template>
  <div class="editor">
    <header class="top-bar">
      <div class="top-bar-left">
        <h1>{{ store.meta?.gameName || 'HTFFY Editor' }}</h1>
        <div class="project-path">{{ store.projectPath }}</div>
      </div>
    </header>

    <div v-if="store.meta" class="main-grid">
      <SidePanel class="panel" />
      <ScenesPanel class="panel" />
      <ScenePreview class="panel panel-preview" />
      <ChoicesPanel class="panel" />
    </div>
    
    <div v-else class="loading">
      Ładowanie projektu...
    </div>

    <div class="bottom-bar">
      <button @click="saveProject" class="btn btn-primary">💾 Zapisz projekt</button>
      <button @click="emit('go-to-menu')" class="btn btn-secondary">📁 Menu</button>
      <button @click="showTutorial = true" class="btn btn-help">📖 Pokaż Tutorial</button>
    </div>

    <transition name="toast">
      <div v-if="showSavedToast" class="toast-saved">
        ✓ Zapisano
      </div>
    </transition>

    <div v-if="showTutorial" class="modal-overlay" @click.self="showTutorial = false">
      <div class="modal-content tutorial-content">
        <button class="close-btn" @click="showTutorial = false">✕</button>
        <img :src="tutorialBg" alt="Instrukcja" class="tutorial-img" />
      </div>
    </div>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  --bg: #0D1117;
  --panel: #161B22;
  --card: #21262D;
  --input: #21262D;
  --border: #30363D;
  --border-hover: #484F58;
  --accent: #00FF94;
  --accent-dim: rgba(0, 255, 148, 0.1);
  --text: #E6EDF3;
  --text-dim: #7D8590;
  --text-dimmer: #484F58;
  --danger: #F85149;
}

* {
  box-sizing: border-box;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

body {
  background: var(--bg);
  margin: 0;
  color: var(--text);
  overflow-x: hidden;
}
</style>

<style scoped>
.editor {
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  background: var(--bg);
}

.main-grid {
  display: grid;
  grid-template-columns: 220px 280px minmax(400px, 1fr) 380px;
  gap: 12px;
  padding: 12px;
  flex: 1;
  overflow: hidden;
  min-height: 0;
  padding-bottom: 72px;
  min-width: 1316px;
}

.top-bar {
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--panel);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.top-bar h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}

.project-path {
  font-size: 11px;
  color: var(--text-dim);
  font-family: 'SF Mono', 'Consolas', monospace;
  margin-top: 2px;
}

.panel {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* TO JEST KLUCZ - POZWALA DZIECIOM SIĘ SCROLLOWAĆ */
.panel > * {
  min-height: 0;
}

.panel-preview {
  background: var(--bg);
}

.loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dim);
  font-size: 14px;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--panel);
  border-top: 1px solid var(--border);
  padding: 12px 20px;
  display: flex;
  justify-content: flex-start;
  gap: 8px;
  z-index: 100;
  backdrop-filter: blur(12px);
}

.btn {
  border: none;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  background: var(--accent);
  color: #0D1117;
}

.btn-primary:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--card);
  color: var(--text);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  background: var(--input);
  border-color: var(--border-hover);
}

.btn-help {
  background: #7c3aed;
  color: #fff;
  border: 1px solid #8b5cf6;
}

.btn-help:hover {
  background: #8b5cf6;
  transform: translateY(-1px);
}

.btn:active {
  transform: translateY(0);
}

.toast-saved {
  position: fixed;
  bottom: 80px;
  right: 20px;
  background: var(--card);
  border: 1px solid var(--accent);
  color: var(--accent);
  padding: 10px 16px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 13px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: 200;
}

.toast-enter-active, .toast-leave-active {
  transition: all 0.2s ease;
}

.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  backdrop-filter: blur(8px);
}

.modal-content {
  background: #0d1117;
  border-radius: 8px;
  border: 2px solid #16a34a;
  max-width: 95vw;
  max-height: 95vh;
  overflow: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
}

.tutorial-content {
  position: relative;
  padding: 0;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: #dc2626;
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  z-index: 10;
  font-weight: 700;
}

.close-btn:hover {
  background: #ef4444;
  transform: scale(1.1);
}

.tutorial-img {
  width: 100%;
  height: auto;
  display: block;
}

:deep(input),
:deep(textarea),
:deep(select) {
  background: var(--input);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 13px;
  transition: all 0.15s ease;
  width: 100%;
}

:deep(input:focus),
:deep(textarea:focus),
:deep(select:focus) {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-dim);
}

:deep(label) {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  display: block;
}

:deep(h3) {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin: 0 0 12px 0;
  padding: 0 4px;
}
</style>