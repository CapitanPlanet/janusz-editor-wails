<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useProjectStore } from '../stores/projectStore'
import { SelectImageFile, ImportAsset, GetImageBase64 } from '../../wailsjs/go/main/App'

const store = useProjectStore()
const cache = ref<Record<string,string>>({})

const stats = ['Cebula','Wstyd','Portfel','Reputacja'] as const
const ops = [
  { value: 'gte', label: '≥ większe lub równe' },
  { value: 'lte', label: '≤ mniejsze lub równe' },
  { value: 'gt', label: '> większe niż' },
  { value: 'lt', label: '< mniejsze niż' },
  { value: 'eq', label: '= równe' },
] as const

const shortName = (p: string) => p.replace('images/av_','').replace('images\\av_','')

async function loadThumbs(force = false) {
  if(!store.projectPath) return
  for(const a of store.avatarAssets) {
    if(force ||!cache.value[a]) {
      try { cache.value[a] = await GetImageBase64(store.projectPath, a) } catch {}
    }
  }
}
function close() { store.ui.showAvatarEditor = false }
async function importAvatar() {
  const file = await SelectImageFile()
  if(!file ||!store.projectPath) return
  await ImportAsset(file, store.projectPath, 'av')
  await new Promise(r => setTimeout(r, 150))
  await store.loadAssets()
  await loadThumbs(true)
  if(!store.avatarSystem.default && store.avatarAssets.length) {
    store.setDefaultAvatar(store.avatarAssets[0])
  }
}
function getIfObj(rule: any) { return rule?.if || rule?.when || {} }
function getFirstStat(rule: any) { return Object.keys(getIfObj(rule))[0] || 'Cebula' }
function getFirstOp(rule: any) {
  const cond = getIfObj(rule)[getFirstStat(rule)]
  if(!cond) return 'gte'
  return Object.keys(cond)[0] || 'gte'
}
function getFirstVal(rule: any) { return getIfObj(rule)[getFirstStat(rule)]?.[getFirstOp(rule)]?? 50 }
function updateWhen(rule: any, stat: string, op: string, val: number) { rule.if = { [stat]: { [op]: val } } }

onMounted(() => loadThumbs(true))
watch(() => store.avatarAssets.length, () => loadThumbs(true))
watch(() => store.ui.showAvatarEditor, v => { if(v) loadThumbs(true) })
</script>

<template>
  <div v-if="store.ui.showAvatarEditor" class="overlay" @click.self="close">
    <div class="modal">
      <header>
        <h2>🧠 SYSTEM JANUSZA</h2>
        <button @click="close" class="btn-close">✕</button>
      </header>

      <!-- DEFAULT -->
      <div class="section">
        <div class="head">
          <label>Domyślny avatar ({{ store.avatarAssets.length }})</label>
          <button @click="importAvatar" class="btn-sm">+ AVATAR</button>
        </div>
        <div class="avatar-window big">
          <div v-for="av in store.avatarAssets" :key="av" :class="['av-tile', { active: av === store.avatarSystem.default }]" @click="store.setDefaultAvatar(av)" :title="shortName(av)">
            <img :src="cache[av]" />
            <span>{{ shortName(av).slice(0,12) }}</span>
          </div>
          <div v-if="!store.avatarAssets.length" class="empty">Brak avatarów - kliknij + AVATAR</div>
        </div>
      </div>

      <!-- REGUŁY -->
      <div class="section">
        <div class="head">
          <label>Reguły - pierwsza spełniona wygrywa</label>
          <button @click="store.addAvatarRule()" class="btn-add">+ Reguła</button>
        </div>

        <div v-for="rule in store.sortedAvatarRules" :key="rule.id" class="rule-block">
          <div class="rule-top">
            <span class="if">JEŚLI</span>
            <select :value="getFirstStat(rule)" @change="updateWhen(rule, ($event.target as HTMLSelectElement).value, getFirstOp(rule), getFirstVal(rule))">
              <option v-for="s in stats" :key="s" :value="s">{{ s }}</option>
            </select>
            <select :value="getFirstOp(rule)" @change="updateWhen(rule, getFirstStat(rule), ($event.target as HTMLSelectElement).value, getFirstVal(rule))" class="op-select">
              <option v-for="o in ops" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
            <input type="number" :value="getFirstVal(rule)" @input="updateWhen(rule, getFirstStat(rule), getFirstOp(rule), Number(($event.target as HTMLInputElement).value))" class="num" />
            <div class="prio-wrap"><span>PRIO</span><input type="number" v-model.number="rule.priority" class="prio" /></div>
            <button @click="store.deleteAvatarRule(rule.id)" class="btn-del">✕</button>
          </div>

          <label class="small-label">TO UŻYJ:</label>
          <div class="avatar-window">
            <div v-for="av in store.avatarAssets" :key="av" :class="['av-tile small', { active: av === rule.use }]" @click="rule.use = av" :title="shortName(av)">
              <img :src="cache[av]" />
            </div>
          </div>
        </div>
      </div>

      <footer>
        <small>Przykład: JEŚLI Wstyd ≥ 70 → wkurzony Janusz</small>
        <button @click="close" class="btn-save">ZAMKNIJ</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 500; backdrop-filter: blur(4px); }
.modal { width: 980px; max-width: 95vw; max-height: 90vh; overflow-y: auto; background: #0D1117; border: 1px solid #30363D; border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 16px; }
header { display: flex; justify-content: space-between; } header h2 { margin: 0; color: #00FF94; }
.btn-close { width: 30px; height: 30px; background: #dc2626; color: white; border: 0; border-radius: 50%; cursor: pointer; }
.section { display: flex; flex-direction: column; gap: 8px; }
.head { display: flex; justify-content: space-between; align-items: center; }
.small-label { font-size: 9px; color: #7D8590; margin-top: 4px; }

/* TO JEST TO OKIENKO O KTÓRE PYTAŁEŚ */
.avatar-window {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
  gap: 8px;
  max-height: 120px; /* ograniczona wysokość */
  overflow-y: auto;
  padding: 8px;
  background: #161B22;
  border: 1px solid #21262D;
  border-radius: 6px;
}
.avatar-window.big {
  max-height: 180px;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
}
.av-tile {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 4px; border-radius: 6px; border: 2px solid transparent;
  cursor: pointer; background: #0D1117; transition: all 0.1s;
}
.av-tile:hover { border-color: #30363D; }
.av-tile.active { border-color: #00FF94; background: rgba(0,255,148,0.1); }
.av-tile img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 4px; }
.av-tile span { font-size: 8px; color: #7D8590; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
.av-tile.small { padding: 2px; }.av-tile.small img { width: 48px; height: 48px; }

select, input { background: #161B22; border: 1px solid #30363D; color: #E6EDF3; border-radius: 4px; padding: 6px 8px; font-size: 12px; }
.op-select { min-width: 180px; }
.rule-block { background: #161B22; border: 1px solid #21262D; border-radius: 8px; padding: 8px; display: flex; flex-direction: column; gap: 6px; }
.rule-top { display: flex; gap: 6px; align-items: center; }
.if { font-size: 10px; color: #7D8590; font-weight: 700; }
.num { width: 70px; }.prio { width: 50px; }
.prio-wrap { display: flex; align-items: center; gap: 4px; font-size: 9px; color: #7D8590; margin-left: auto; }
.btn-sm,.btn-add,.btn-save { background: #21262D; border: 1px solid #30363D; color: #E6EDF3; border-radius: 4px; padding: 6px 10px; cursor: pointer; }
.btn-add { background: #00FF94; color: #0D1117; font-weight: 700; }.btn-save { margin-left: auto; background: #00FF94; color: #0D1117; font-weight: 700; }
.btn-del { width: 22px; height: 22px; background: #dc2626; color: white; border: 0; border-radius: 4px; cursor: pointer; }
.empty { grid-column: 1/-1; padding: 16px; text-align: center; color: #484F58; font-size: 12px; }
footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #21262D; padding-top: 12px; }
</style>