<script setup>
import { computed } from 'vue'
import { useProjectStore } from '../stores/projectStore'

const store = useProjectStore()

function getAssetUrl(assetName) {
  if (!store.projectPath ||!assetName) return ''
  const fullPath = `${store.projectPath}/Assets/${assetName}`.replace(/\\/g, '/')
  return `/abs/${fullPath}`
}

const bgUrl = computed(() => getAssetUrl(store.currentScene?.Background))
</script>

<template>
  <div class="scene-preview" v-if="store.currentScene">
    <div class="preview-stage" :style="{ backgroundImage: bgUrl? `url(${bgUrl})` : 'none' }">
      <div v-if="!bgUrl" class="no-bg">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        <span>Brak tła</span>
      </div>
      
      <div class="preview-text">
        <h2>{{ store.currentScene.SceneTitle }}</h2>
        <p>{{ store.currentScene.Text }}</p>
      </div>

      <!-- USUNIĘTE: preview-choices -->
      <!-- Zostawiamy tylko czysty podgląd sceny -->
      
    </div>
  </div>
  <div v-else class="no-scene">
    Wybierz scenę z listy
  </div>
</template>

<style scoped>
.scene-preview {
  background: var(--panel);
  border-radius: 8px;
  overflow: hidden;
  height: 100%;
}
.preview-stage {
  position: relative;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-color: #000;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 24px;
}
.preview-stage::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 70%);
}
.no-bg {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-dim);
  gap: 12px;
}
.preview-text {
  position: relative;
  z-index: 1;
}
.preview-text h2 {
  color: var(--accent);
  font-size: 14px;
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.preview-text p {
  color: #fff;
  font-size: 16px;
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
}
.no-scene {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-dim);
}
</style>