<script setup>
import { ref, onMounted } from 'vue'
import SidePanel from './SidePanel.vue'
import ScenesPanel from './ScenesPanel.vue'
import EditorPanel from './EditorPanel.vue' 
import ChoicesPanel from './ChoicesPanel.vue'
import { useProjectStore } from '../stores/projectStore'

const store = useProjectStore()
const emit = defineEmits(['go-to-menu'])
const showSavedToast = ref(false)

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
      <h1>{{ store.meta?.gameName || 'Janusz Editor' }}</h1>
      <div class="toolbar"></div>
      <div class="project-path">{{ store.projectPath }}</div>
    </header>

    <div v-if="store.meta" class="main-grid">
      <SidePanel />
      <ScenesPanel />
      <EditorPanel />
      <ChoicesPanel />
    </div>

    <!-- DOLNY PASEK: ZAPISZ + MENU -->
    <div class="bottom-bar">
      <button @click="saveProject" class="save-btn">💾 Zapisz projekt</button>
      <button @click="emit('go-to-menu')" class="menu-btn">📁 Menu</button>
    </div>

    <!-- TOAST -->
    <transition name="toast">
      <div v-if="showSavedToast" class="toast-saved">
        ✓ Zapisano
      </div>
    </transition>
  </div>
</template>

<style scoped>
.editor {
  color: #fff;
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}
.main-grid {
  display: grid;
  grid-template-columns: 200px 250px 1fr 350px;
  gap: 1px;
  background: rgba(22, 163, 74, 0.2);
  flex: 1;
  overflow: hidden;
  min-height: 0;
  padding-bottom: 60px;
}
.top-bar {
  padding: 12px 20px;
  border-bottom: 2px solid #16a34a;
  background: rgba(30, 41, 59, 0.85);
  flex-shrink: 0;
}
.top-bar h1 {
  margin: 0 0 8px 0;
  font-size: 20px;
  text-shadow: 0 0 10px rgba(74, 222, 128, 0.3);
}
.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  height: 0px;
}
.project-path {
  font-size: 11px;
  color: #4ade80;
  margin-top: 6px;
  font-family: monospace;
  opacity: 0.7;
}
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(15, 23, 42, 0.95);
  border-top: 2px solid #16a34a;
  padding: 12px 24px;
  display: flex;
  justify-content: flex-start;
  gap: 12px;
  z-index: 100;
  backdrop-filter: blur(8px);
}
.save-btn {
  background: #16a34a;
  border: none;
  color: white;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}
.save-btn:hover {
  background: #22c55e;
  box-shadow: 0 0 15px rgba(34, 197, 94, 0.4);
  transform: translateY(-1px);
}
.menu-btn {
  background: rgba(30, 41, 59, 0.95);
  border: 1px solid #334155;
  color: white;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}
.menu-btn:hover {
  background: #334155;
  border-color: #16a34a;
  transform: translateY(-1px);
}
.save-btn:active, .menu-btn:active {
  transform: translateY(0);
}
.toast-saved {
  position: fixed;
  bottom: 80px;
  right: 24px;
  background: #16a34a;
  color: white;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 600;
  box-shadow: 0 4px 20px rgba(34, 197, 94, 0.5);
  z-index: 200;
}
.toast-enter-active, .toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>