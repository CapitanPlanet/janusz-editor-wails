<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProjectStore } from '../stores/projectStore'
import { SelectImageFile, ImportAsset, GetImageBase64 } from '../../wailsjs/go/main/App'

const store = useProjectStore()
const cache = ref<Record<string,string>>({})

const stats = ['Cebula','Wstyd','Portfel','Reputacja'] as const
const ops = ['gte','lte','gt','lt','eq'] as const

async function loadThumbs() {
  for(const a of store.avatarAssets) {
    if(!cache.value[a]) {
      try { cache.value[a] = await GetImageBase64(store.projectPath!, a) } catch {}
    }
  }
}

function close() { store.ui.showAvatarEditor = false }

async function importAvatar() {
  const file = await SelectImageFile()
  if(!file ||!store.projectPath) return
  await ImportAsset(file, store.projectPath, 'av')
  await store.loadAssets()
  await loadThumbs()
}

// helpery do edycji `when: { Cebula: { gte: 50 } }`
function getFirstStat(rule: any) { return Object.keys(rule.when)[0] || 'Cebula' }
function getFirstOp(rule: any) {
  const stat = getFirstStat(rule)
  const cond = rule.when[stat]
  return cond? Object.keys(cond)[0] : 'gte'
}
function getFirstVal(rule: any) {
  const stat = getFirstStat(rule)
  const cond = rule.when[stat]
  const op = getFirstOp(rule)
  return cond? cond[op] : 0
}
function updateWhen(rule: any, stat: string, op: string, val: number) {
  rule.when = { [stat]: { [op]: val } }
}

onMounted(loadThumbs)
</script>

<template>
  <div v-if="store.ui.showAvatarEditor" class="overlay" @click.self="close">
    <div class="modal">
      <header>
        <h2>🧠 SYSTEM JANUSZA</h2>
        <button @click="close" class="btn-close">✕</button>
      </header>

      <div class="section">
        <label>Domyślny avatar (gdy żadna reguła nie pasuje):</label>
        <div class="row">
          <img v-if="cache[store.avatarSystem.default]" :src="cache[store.avatarSystem.default]" class="thumb big" />
          <select :value="store.avatarSystem.default" @change="store.setDefaultAvatar(($event.target as any).value)">
            <option v-for="av in store.avatarAssets" :key="av" :value="av">{{ av.replace('images/av_','') }}</option>
          </select>
          <button @click="importAvatar" class="btn-sm">+ Importuj AVATAR</button>
        </div>
      </div>

      <div class="section">
        <div class="head">
          <label>Reguły (od najwyższego priorytetu):</label>
          <button @click="store.addAvatarRule()" class="btn-add">+ Dodaj regułę</button>
        </div>

        <div v-for="rule in store.sortedAvatarRules" :key="rule.id" class="rule">
          <img v-if="cache[rule.use]" :src="cache[rule.use]" class="thumb" />
          <select :value="rule.use" @change="rule.use = ($event.target as any).value">
            <option v-for="av in store.avatarAssets" :key="av" :value="av">{{ av.replace('images/av_','') }}</option>
          </select>

          <span class="if">JEŚLI</span>
          <select :value="getFirstStat(rule)" @change="updateWhen(rule, ($event.target as any).value, getFirstOp(rule), getFirstVal(rule))">
            <option v-for="s in stats" :key="s">{{ s }}</option>
          </select>

          <select :value="getFirstOp(rule)" @change="updateWhen(rule, getFirstStat(rule), ($event.target as any).value, getFirstVal(rule))">
            <option v-for="o in ops" :key="o">{{ o }}</option>
          </select>

          <input type="number" :value="getFirstVal(rule)" @input="updateWhen(rule, getFirstStat(rule), getFirstOp(rule), Number(($event.target as any).value))" class="num" />

          <input type="number" v-model.number="rule.priority" class="prio" title="priorytet" />
          <button @click="store.deleteAvatarRule(rule.id)" class="btn-del">✕</button>
        </div>

        <div v-if="!store.avatarSystem.rules.length" class="empty">
          Brak reguł. Janusz zawsze będzie w domyślnym stroju.<br/>Kliknij + Dodaj regułę np. <code>Cebula gte 50 -> av_janusz_happy.png</code>
        </div>
      </div>

      <footer>
        <small>Silnik: sprawdza reguły od najwyższego priorytetu w dół. Pierwsza spełniona wygrywa.</small>
        <button @click="close" class="btn-save">ZAPISZ I ZAMKNIJ</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 500; backdrop-filter: blur(4px); }
.modal { width: 900px; max-width: 95vw; max-height: 90vh; overflow-y: auto; background: #0D1117; border: 1px solid #30363D; border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 16px; }
header { display: flex; justify-content: space-between; align-items: center; }
header h2 { margin: 0; font-size: 16px; color: #00FF94; }
.btn-close { width: 30px; height: 30px; background: #dc2626; color: white; border: 0; border-radius: 50%; cursor: pointer; }
.section { display: flex; flex-direction: column; gap: 8px; }
.section label { font-size: 11px; font-weight: 700; color: #7D8590; text-transform: uppercase; }
.row { display: flex; gap: 8px; align-items: center; }
.thumb { width: 36px; height: 36px; object-fit: cover; border-radius: 4px; border: 1px solid #30363D; }
.thumb.big { width: 48px; height: 48px; }
select, input { background: #161B22; border: 1px solid #30363D; color: #E6EDF3; border-radius: 4px; padding: 6px 8px; font-size: 12px; }
.rule { display: flex; gap: 6px; align-items: center; background: #161B22; padding: 8px; border-radius: 6px; }
.if { font-size: 10px; color: #7D8590; font-weight: 700; }
.num { width: 70px; }.prio { width: 60px; }
.btn-sm,.btn-add,.btn-save { background: #21262D; border: 1px solid #30363D; color: #E6EDF3; border-radius: 4px; padding: 6px 10px; cursor: pointer; font-size: 12px; }
.btn-add { background: #00FF94; color: #0D1117; font-weight: 700; }
.btn-save { margin-left: auto; background: #00FF94; color: #0D1117; font-weight: 700; padding: 8px 16px; }
.btn-del { width: 22px; height: 22px; background: #dc2626; color: white; border: 0; border-radius: 4px; cursor: pointer; }
.empty { padding: 16px; background: #161B22; border-radius: 6px; font-size: 12px; color: #484F58; text-align: center; }
footer { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #21262D; padding-top: 12px; }
.head { display: flex; justify-content: space-between; align-items: center; }
</style>