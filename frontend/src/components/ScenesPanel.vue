<script setup lang="ts">
import { useProjectStore } from '../stores/projectStore'

const store = useProjectStore()

function goToScene(sceneId: string) {
  store.selectScene(sceneId) // użyj akcji ze store'a
}

function addScene() {
  const sceneName = prompt('ID nowej sceny:', 'nowa_scena')
  if (!sceneName) return
  
  // Sprawdź czy ID już istnieje
  const exists = store.currentDayScenes.some(s => s.Id === sceneName)
  if (exists) {
    alert(`Scena "${sceneName}" już istnieje w tym dniu!`)
    return
  }
  
  // UŻYJ AKCJI ZE STORE'A - nie pushuj ręcznie
  store.addSceneToCurrentDay(sceneName)
}

function deleteScene(sceneId: string) {
  // UŻYJ AKCJI ZE STORE'A - nie splice'uj ręcznie
  store.deleteScene(sceneId)
}
</script>

<template>
  <aside class="scenes-panel">
    <div class="panel-header">
      <h3>Sceny [{{ store.currentDayScenes.length }}]</h3>
      <span class="day-badge">{{ store.currentDay }}</span>
    </div>
    
    <button @click="addScene" class="btn-add">+ Scena</button>

    <div
      v-for="scene in store.currentDayScenes"
      :key="scene.Id"
      :class="['scene-item', { active: scene.Id === store.currentSceneId }]"
      @click="goToScene(scene.Id)"
    >
      <div class="scene-id">{{ scene.Id }}</div>
      <div class="scene-title">{{ scene.SceneTitle || '(bez tytułu)' }}</div>
      <div v-if="scene.IsEndDay" class="end-badge">KONIEC DNIA</div>
      <button @click.stop="deleteScene(scene.Id)" class="btn-delete-mini">✕</button>
    </div>
  </aside>
</template>

<style scoped>
.scenes-panel {
  background: rgba(10, 22, 40, 0.75);
  padding: 16px;
  overflow-y: auto;
  border: 1px solid rgba(51, 65, 85, 0.3);
  display: flex;
  flex-direction: column;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.scenes-panel h3 {
  margin: 0;
  color: #4ade80;
  font-size: 14px;
}
.day-badge {
  font-size: 11px;
  font-family: monospace;
  color: #94a3b8;
  background: rgba(51, 65, 85, 0.5);
  padding: 2px 6px;
  border-radius: 3px;
}
.btn-add {
  padding: 4px 10px;
  background: #16a34a;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 12px;
  margin-bottom: 12px;
  width: 100%;
}
.btn-add:hover { background: #22c55e; }
.scene-item {
  padding: 10px;
  background: rgba(30, 41, 59, 0.8);
  margin-bottom: 6px;
  cursor: pointer;
  border-left: 3px solid transparent;
  position: relative;
  transition: all 0.2s;
}
.scene-item:hover {
  background: rgba(51, 65, 85, 0.9);
  border-left-color: #4ade80;
}
.scene-item.active {
  background: rgba(22, 163, 74, 0.8);
  border-left-color: #4ade80;
}
.scene-id {
  font-family: monospace;
  font-size: 11px;
  color: #94a3b8;
}
.scene-title {
  font-size: 13px;
  margin-top: 2px;
  color: #fff;
  padding-right: 20px;
}
.end-badge {
  font-size: 9px;
  color: #fbbf24;
  margin-top: 4px;
  font-weight: bold;
}
.btn-delete-mini {
  position: absolute;
  right: 6px;
  top: 6px;
  background: #dc2626;
  border: none;
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}
.scene-item:hover .btn-delete-mini {
  opacity: 1;
}
</style>