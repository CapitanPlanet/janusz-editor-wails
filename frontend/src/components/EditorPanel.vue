<script setup>
import { computed } from 'vue'
import { useProjectStore } from '../stores/projectStore'

const store = useProjectStore()

// W Wails po prostu składasz path. Assets serwuje runtime.
function getAssetUrl(assetName) {
  if (!store.projectPath || !assetName) return '/assets/placeholders/no_bg.jpg'
  // Wails ogarnia ścieżki absolutne przez asset server
  // Format: /abs/C:/path/to/project/Assets/images/nazwa.jpg
  const fullPath = `${store.projectPath}/Assets/images/${assetName}.jpg`.replace(/\\/g, '/')
  return `/abs/${fullPath}`
}

// Lista teł z folderu - na razie mock, dorobimy ListFiles w Go
const availableBackgrounds = computed(() => {
  return store.assets.images.map(img => img.replace('images/', '').replace('.jpg', '').replace('.png', ''))
})
</script>

<template>
  <main class="editor-panel">
    <div v-if="store.currentScene">
      <div class="bg-preview">
        <img
          v-if="store.currentScene.Background"
          :src="getAssetUrl(store.currentScene.Background)"
          alt="tło"
        />
        <div v-else class="no-bg">Brak tła</div>
        <div class="bg-label">{{ store.currentScene.Background || 'brak' }}</div>
      </div>

      <div class="scene-form">
        <div class="form-row">
          <label>ID Sceny:</label>
          <input v-model="store.currentScene.Id" />
        </div>
        <div class="form-row">
          <label>Tytuł sceny:</label>
          <input v-model="store.currentScene.SceneTitle" />
        </div>
        <div class="form-row">
          <label>Tło:</label>
          <select v-model="store.currentScene.Background">
            <option value="">Brak</option>
            <option
              v-for="bg in availableBackgrounds"
              :key="bg"
              :value="bg"
            >
              {{ bg }}
            </option>
          </select>
        </div>
        <div class="form-row">
          <label>Tekst sceny:</label>
          <textarea v-model="store.currentScene.Text" rows="8"></textarea>
        </div>
      </div>
    </div>
    <div v-else class="no-scene">
      Wybierz scenę z lewej
    </div>
  </main>
</template>

<style scoped>
.editor-panel {
  background: rgba(10, 22, 40, 0.75);
  padding: 16px;
  overflow-y: auto;
  border: 1px solid rgba(51, 65, 85, 0.3);
}
.bg-preview {
  position: relative;
  width: 100%;
  background: #000;
  border: 2px solid #334155;
  margin-bottom: 16px;
}
.bg-preview img {
  width: 100%;
  height: auto;
  display: block;
}
.bg-label {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0,0,0,0.8);
  color: #4ade80;
  padding: 4px 8px;
  font-size: 11px;
  font-family: monospace;
}
.no-bg {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #64748b;
  font-style: italic;
}
.scene-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.form-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.form-row label {
  color: #4ade80;
  font-size: 12px;
  font-weight: bold;
}
.form-row input,
.form-row select,
.form-row textarea {
  background: rgba(30, 41, 59, 0.95);
  border: 1px solid #334155;
  color: #fff;
  padding: 8px;
  font-family: inherit;
}
.form-row input:focus,
.form-row select:focus,
.form-row textarea:focus {
  outline: none;
  border-color: #16a34a;
  box-shadow: 0 0 5px rgba(22, 163, 74, 0.3);
}
.no-scene {
  color: #64748b;
  text-align: center;
  padding: 40px;
  font-style: italic;
}
</style>