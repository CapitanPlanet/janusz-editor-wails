<script setup>
import { ref, onMounted, watch } from 'vue'
import { useProjectStore } from '../stores/projectStore'
import { SelectImageFile, ImportAsset, ListAssets, GetImageBase64, DeleteAsset, DeleteDay } from '../../wailsjs/go/main/App'

const store = useProjectStore()
const assets = ref([])
const assetCache = ref({})

async function refreshAssets() {
  if (!store.projectPath) {
    assets.value = []
    assetCache.value = {}
    return
  }
  try {
    const list = await ListAssets(store.projectPath)
    assets.value = list || []
    for (const asset of assets.value) {
      if (!assetCache.value[asset]) {
        const b64 = await GetImageBase64(store.projectPath, asset)
        assetCache.value[asset] = b64
      }
    }
  } catch (e) {
    console.warn('[SIDEPANEL] Błąd ładowania assetów:', e)
    assets.value = []
  }
}

function getAssetUrl(relPath) {
  return assetCache.value[relPath] || ''
}

async function importAsset(type) {
  if (!store.projectPath) {
    alert('Najpierw otwórz lub stwórz projekt')
    return
  }
  const filePath = await SelectImageFile()
  if (!filePath) return
  try {
    const relPath = await ImportAsset(filePath, store.projectPath, type)
    await refreshAssets()
    await store.loadAssets()
  } catch (e) {
    console.error('[SIDEPANEL] Błąd importu:', e)
    alert(`Błąd importu: ${e}`)
  }
}

async function deleteAsset(asset) {
  if (!store.projectPath) return
  if (!confirm(`Na pewno usunąć ${asset.replace('images/', '')}?`)) return
  try {
    await DeleteAsset(store.projectPath, asset)
    delete assetCache.value[asset]
    await refreshAssets()
    await store.loadAssets()
  } catch (e) {
    console.error('[SIDEPANEL] Błąd usuwania:', e)
    alert(`Błąd usuwania: ${e}`)
  }
}

function selectDay(day) {
  store.currentDay = day
  store.currentSceneId = store.days[day]?.[0]?.Id || null
}

function addDay() {
  const dayName = prompt('Nazwa nowego dnia:', `day${Object.keys(store.days).length + 1}`)
  if (!dayName) return
  if (store.days[dayName]) {
    alert('Dzień o tej nazwie już istnieje')
    return
  }
  store.addDay(dayName)
}

async function deleteDay(day) {
  if (!store.projectPath) return
  if (Object.keys(store.days).length <= 1) {
    alert('Nie możesz usunąć ostatniego dnia!')
    return
  }
  if (!confirm(`Na pewno usunąć dzień "${day}"?\nWszystkie sceny w tym dniu przepadną na zawsze!`)) return
  try {
    await DeleteDay(store.projectPath, day)
    delete store.days[day]
    if (store.currentDay === day) {
      const firstDay = Object.keys(store.days)[0] || null
      store.currentDay = firstDay
      store.currentSceneId = firstDay? store.days[firstDay]?.[0]?.Id : null
    }
    await store.loadProjectFromPath(store.projectPath)
  } catch (e) {
    console.error('[SIDEPANEL] Błąd usuwania dnia:', e)
    alert(`Błąd usuwania dnia: ${e}`)
  }
}

onMounted(() => {
  refreshAssets()
})

watch(() => store.projectPath, () => {
  refreshAssets()
})
</script>

<template>
  <aside v-if="store.meta" class="side-panel">
    <div class="panel-section">
      <h3>PROJEKT JANUSZA</h3>
      <div class="project-name">{{ store.meta?.gameName || 'Brak' }}</div>
    </div>

    <div class="panel-section">
      <div class="section-header">
        <h4>ASSETY</h4>
      </div>
      <div class="asset-buttons">
        <button @click="importAsset('bg')" class="btn-asset bg">
          <span>+ Tło</span>
        </button>
        <button @click="importAsset('re')" class="btn-asset re">
          <span>+ Reakcja</span>
        </button>
        <button @click="importAsset('av')" class="btn-asset av">
          <span>+ Avatar</span>
        </button>
      </div>
      <div class="asset-count">
        Zaimportowano: {{ assets.length }} plików
      </div>

      <div v-if="assets.length" class="asset-list">
        <div 
          v-for="asset in assets" 
          :key="asset" 
          class="asset-item"
          :title="asset"
        >
          <img :src="getAssetUrl(asset)" :alt="asset" />
          <span>{{ asset.replace('images/', '') }}</span>
          <button @click.stop="deleteAsset(asset)" class="btn-delete" title="Usuń">✕</button>
        </div>
      </div>
    </div>

    <div class="panel-section">
      <div class="section-header">
        <h4>DNI [{{ store.dayFileList.length }}]</h4>
        <button @click="addDay" class="btn-mini">+</button>
      </div>
      
      <div
        v-for="day in store.dayFileList"
        :key="day"
        :class="['day-item', { active: day === store.currentDay }]"
        @click="selectDay(day)"
      >
        <span class="day-icon">📁</span>
        <span class="day-name">{{ day }}</span>
        <span class="scene-count">{{ store.days[day]?.length || 0 }}</span>
        <button @click.stop="deleteDay(day)" class="btn-delete" title="Usuń dzień">✕</button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.side-panel {
  background: rgba(10, 22, 40, 0.85);
  border-right: 1px solid rgba(51, 65, 85, 0.3);
  padding: 16px;
  overflow-y: auto;
  overflow-x: hidden;
  width: 280px;
  min-width: 280px;
  max-width: 280px;
  flex-shrink: 0;
  flex-grow: 0;
  height: 100%;
  box-sizing: border-box;
  display: block;
}

.asset-buttons {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.btn-asset {
  width: 100%;
  height: 40px;
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
  display: grid;
  place-items: center;
  transition: all 0.1s;
  box-sizing: border-box;
  box-shadow: 0 3px 0 #0f1419, inset 0 1px 0 rgba(255,255,255,0.1);
}

.btn-asset:hover {
  background: linear-gradient(180deg, #4a5568 0%, #2d3748 100%);
  border-color: #718096;
  color: #fff;
}

.btn-asset:active {
  transform: translateY(3px);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
}

.btn-asset span {
  text-shadow: 0 -1px 0 rgba(0,0,0,0.8);
}

.asset-count {
  font-size: 11px;
  color: #64748b;
  text-align: center;
  margin-bottom: 8px;
}

.asset-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
  box-sizing: border-box;
}
.asset-list::-webkit-scrollbar { width: 6px; }
.asset-list::-webkit-scrollbar-track { background: rgba(30, 41, 59, 0.4); border-radius: 3px; }
.asset-list::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }

.asset-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  background: rgba(30, 41, 59, 0.6);
  border-radius: 4px;
  font-size: 11px;
  color: #94a3b8;
  position: relative;
  min-width: 0;
  box-sizing: border-box;
}
.asset-item img {
  width: 32px;
  height: 32px;
  object-fit: cover;
  border-radius: 3px;
  flex-shrink: 0;
  border: 1px solid #334155;
}
.asset-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: monospace;
  flex: 1;
  min-width: 0;
}
.btn-delete {
  width: 20px;
  height: 20px;
  padding: 0;
  background: #dc2626;
  border: 1px solid #ef4444;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  border-radius: 3px;
  flex-shrink: 0;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-delete:hover {
  background: #ef4444;
  transform: scale(1.2);
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.8);
}

.panel-section {
  margin-bottom: 24px;
  min-width: 0;
}
.side-panel h3 {
  margin: 0 0 8px 0;
  color: #4ade80;
  font-size: 14px;
}
.project-name {
  font-size: 12px;
  color: #94a3b8;
  font-family: monospace;
  word-break: break-all;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.section-header h4 {
  margin: 0;
  color: #4ade80;
  font-size: 13px;
}
.btn-mini {
  padding: 2px 8px;
  background: #16a34a;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  border-radius: 3px;
}
.btn-mini:hover { background: #22c55e; }
.day-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(30, 41, 59, 0.6);
  margin-bottom: 4px;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: all 0.2s;
  border-radius: 3px;
  position: relative;
  min-width: 0;
  box-sizing: border-box;
}
.day-item:hover {
  background: rgba(51, 65, 85, 0.8);
  border-left-color: #4ade80;
}
.day-item.active {
  background: rgba(22, 163, 74, 0.6);
  border-left-color: #4ade80;
}
.day-icon {
  font-size: 14px;
  flex-shrink: 0;
}
.day-name {
  flex: 1;
  font-size: 13px;
  font-family: monospace;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.scene-count {
  font-size: 11px;
  color: #94a3b8;
  background: rgba(0,0,0,0.3);
  padding: 2px 6px;
  border-radius: 10px;
  flex-shrink: 0;
}
</style>