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

    <!-- DOLNY PANEL - INDUSTRIAL STALOWY -->
    <div class="bottom-bar">
      <button @click="saveProject" class="btn-footer save">
        <span class="icon">💾</span>
        <span>Zapisz projekt</span>
      </button>
      <button @click="emit('go-to-menu')" class="btn-footer menu">
        <span class="icon">📁</span>
        <span>Menu</span>
      </button>
      <button @click="showTutorial = true" class="btn-footer tutorial">
        <span class="icon">📖</span>
        <span>Pokaż Tutorial</span>
      </button>
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
  --accent: #00FF94; /* zostawiamy tylko dla akcji */
  --accent-dim: rgba(0, 255, 148, 0.1);
  --text: #E6EDF3;
  --text-dim: #7D8590;
  --text-dimmer: #484F58;
  --danger: #F85149;
  /* DODANE - STALOWE ODCIENIE */
  --steel: #94a3b8;
  --steel-dim: #64748b;
  --steel-bright: #cbd5e1;
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
  grid-template-columns: 280px 280px minmax(400px, 1fr) 380px;
  gap: 12px;
  padding: 12px;
  flex: 1;
  overflow: hidden;
  min-height: 0;
  padding-bottom: 72px;
  min-width: 1376px;
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
  min-width: 0;
}

.panel > * {
  min-height: 0;
  min-width: 0;
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

/* INDUSTRIAL BOTTOM BAR - STALOWY */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border-top: 2px solid #0f1419;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 -4px 12px rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  flex-shrink: 0;
  z-index: 100;
}

.btn-footer {
  height: 40px;
  padding: 0 20px;
  background: linear-gradient(180deg, #2d3748 0%, #1a202c 100%);
  border: 1px solid #4a5568;
  border-top-color: #718096;
  color: #cbd5e0;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.1s;
  box-shadow: 0 3px 0 #0f1419, inset 0 1px 0 rgba(255,255,255,0.1);
  text-shadow: 0 -1px 0 rgba(0,0,0,0.8);
}

.btn-footer:hover {
  background: linear-gradient(180deg, #4a5568 0%, #2d3748 100%);
  border-color: #718096;
  color: #fff;
}

.btn-footer:active {
  transform: translateY(3px);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
}

.btn-footer .icon {
  font-size: 16px;
  filter: drop-shadow(0 -1px 0 rgba(0,0,0,0.8));
}

/* ZAPISZ - tylko ten zostaje zielony */
.btn-footer.save:hover {
  border-color: var(--accent);
  box-shadow: 0 3px 0 #0f1419, 0 0 12px rgba(0, 255, 148, 0.3);
}

/* MENU - stalowy zamiast pomarańczowego */
.btn-footer.menu:hover {
  border-color: var(--steel-bright);
  box-shadow: 0 3px 0 #0f1419, 0 0 12px rgba(203, 213, 225, 0.3);
}

/* TUTORIAL - stalowy zamiast fioletu */
.btn-footer.tutorial:hover {
  border-color: var(--steel-bright);
  box-shadow: 0 3px 0 #0f1419, 0 0 12px rgba(203, 213, 225, 0.3);
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
  border: 2px solid var(--steel);
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

/* GLOBALNE OVERRIDE - STALOWY ZAMIAST ZIELONEGO */
:deep(h3),
:deep(h4) {
  color: var(--steel) !important;
}

:deep(input:focus),
:deep(textarea:focus),
:deep(select:focus) {
  outline: none;
  border-color: var(--steel-bright) !important;
  box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.1) !important;
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

/* ZIELONY ZOSTAJE TYLKO DLA AKCJI */
:deep(.btn-add),
:deep(.btn-mini) {
  background: var(--accent) !important;
  color: #0D1117 !important;
}

:deep(.day-item.active),
:deep(.scene-item.active) {
  background: rgba(0, 255, 148, 0.15) !important;
  border-left-color: var(--accent) !important;
}
</style>