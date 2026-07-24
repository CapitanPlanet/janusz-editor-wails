<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useProjectStore } from '../stores/projectStore'
import { SelectImageFile, ImportAsset, GetImageBase64 } from '../../wailsjs/go/main/App'

const store = useProjectStore()
const cache = ref<Record<string,string>>({})

const stats = ['Cebula','Wstyd','Portfel','Reputacja'] as const
const ops = [
  { value: 'gte', label: '≥' },
  { value: 'lte', label: '≤' },
  { value: 'gt', label: '>' },
  { value: 'lt', label: '<' },
  { value: 'eq', label: '=' },
]

const shortName = (p: string) => p.replace('images/av_','').replace('images\\av_','').slice(0,20)

async function loadThumbs(force = false) {
  if(!store.projectPath) return
  for(const a of store.avatarAssets) {
    if(force ||!cache.value[a]) {
      try { cache.value[a] = await GetImageBase64(store.projectPath, a) } catch {}
    }
  }
}
function close() { store.saveProject(); store.ui.showAvatarEditor = false }

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
  if(!cond || typeof cond!== 'object') return 'gte'
  return Object.keys(cond)[0] || 'gte'
}
function getFirstVal(rule: any) { return getIfObj(rule)[getFirstStat(rule)]?.[getFirstOp(rule)]?? 50 }
function updateWhen(rule: any, stat: string, op: string, val: number) { rule.if = { [stat]: { [op]: Number(val)||0 } } }

onMounted(() => loadThumbs(true))
watch(() => store.avatarAssets.length, () => loadThumbs(true))
watch(() => store.ui.showAvatarEditor, v => { if(v) loadThumbs(true) })
</script>

<template>
  <div v-if="store.ui.showAvatarEditor" class="overlay" @click.self="close">
    <div class="modal">
      <header><h2>🧠 SYSTEM JANUSZA</h2><button @click="close" class="btn-close">✕</button></header>

      <div class="section highlight">
        <label>DOMYŚLNY - gdy żadna reguła nie pasuje</label>
        <div class="picker-row">
          <div class="preview-box">
            <img v-if="cache[store.avatarSystem.default]" :src="cache[store.avatarSystem.default]" />
            <span v-else>?</span>
            <small>{{ shortName(store.avatarSystem.default) }}</small>
          </div>
          <div class="avatar-window big">
            <div v-for="av in store.avatarAssets" :key="av" :class="['av-tile', { active: av === store.avatarSystem.default }]" @click="store.setDefaultAvatar(av)">
              <img :src="cache[av]" /><div v-if="av === store.avatarSystem.default" class="check">✓</div>
            </div>
          </div>
        </div>
        <button @click="importAvatar" class="btn-sm">+ IMPORT AVATARA</button>
      </div>

      <div class="section">
        <div class="head">
          <label>REGUŁY - sprawdzane od najwyższego priorytetu w dół</label>
          <button @click="store.addAvatarRule()" class="btn-add">+ Reguła</button>
        </div>

        <div v-for="rule in store.sortedAvatarRules" :key="rule.id" class="rule-block">
          <div class="rule-top">
            <span class="if">JEŚLI</span>
            <select :value="getFirstStat(rule)" @change="updateWhen(rule, ($event.target as HTMLSelectElement).value, getFirstOp(rule), getFirstVal(rule))">
              <option v-for="s in stats" :key="s" :value="s">{{ s }}</option>
            </select>
            <select :value="getFirstOp(rule)" @change="updateWhen(rule, getFirstStat(rule), ($event.target as HTMLSelectElement).value, getFirstVal(rule))">
              <option v-for="o in ops" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
            <input type="number" :value="getFirstVal(rule)" @input="updateWhen(rule, getFirstStat(rule), getFirstOp(rule), Number(($event.target as HTMLInputElement).value))" class="num" />
            <div class="prio-wrap"><span>Priorytet</span><input type="number" v-model.number="rule.priority" class="prio" /></div>
            <button @click="store.deleteAvatarRule(rule.id)" class="btn-del">✕</button>
          </div>

          <div class="avatar-window">
            <div v-for="av in store.avatarAssets" :key="av" :class="['av-tile small', { active: av === rule.use }]" @click="rule.use = av">
              <img :src="cache[av]" /><div v-if="av === rule.use" class="check small">✓</div>
            </div>
          </div>
        </div>
      </div>

      <footer>
        <button @click="close" class="btn-save">ZAMKNIJ I ZAPISZ</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;z-index:500;backdrop-filter:blur(4px)}
.modal{width:720px;max-width:92vw;max-height:90vh;overflow-y:auto;overflow-x:hidden;background:#0D1117;border:1px solid #30363D;border-radius:10px;padding:16px;display:flex;flex-direction:column;gap:16px;box-sizing:border-box}
header{display:flex;justify-content:space-between;align-items:center}header h2{margin:0;color:#00FF94;font-size:16px}
.btn-close{width:30px;height:30px;background:#dc2626;color:#fff;border:0;border-radius:50%;cursor:pointer;flex:0 0 30px}
.section{display:flex;flex-direction:column;gap:8px}.section.highlight{border:1px solid rgba(0,255,148,.25);background:rgba(0,255,148,.06);border-radius:8px;padding:10px}
.head{display:flex;justify-content:space-between;align-items:center;gap:10px}
.picker-row{display:flex;gap:12px}
.preview-box{width:72px;min-width:72px;height:72px;background:#000;border:1px solid #00FF94;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;overflow:hidden}
.preview-box img{width:100%;height:100%;object-fit:cover}.preview-box small{font-size:7px;color:#7D8590;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:68px}
.avatar-window{display:flex;flex-wrap:wrap;gap:6px;max-height:110px;overflow-y:auto;overflow-x:hidden;padding:6px;background:#161B22;border:1px solid #21262D;border-radius:6px;flex:1;align-content:flex-start}
.avatar-window.big{max-height:140px}
.av-tile{position:relative;width:48px;height:48px;flex:0 0 48px;border-radius:6px;border:2px solid transparent;cursor:pointer;background:#0D1117;overflow:hidden}
.av-tile:hover{border-color:#30363D}.av-tile.active{border-color:#00FF94;background:rgba(0,255,148,.1)}
.av-tile img{width:100%;height:100%;object-fit:cover;display:block}
.check{position:absolute;top:2px;right:2px;background:#00FF94;color:#000;font-size:10px;width:14px;height:14px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;line-height:1}
.check.small{width:12px;height:12px;font-size:8px}
.rule-block{background:#161B22;border:1px solid #21262D;border-radius:8px;padding:8px;display:flex;flex-direction:column;gap:8px;width:100%;box-sizing:border-box}

/* TU BYŁ BUG */
.rule-top{display:flex;flex-wrap:wrap;gap:8px;align-items:center;width:100%;box-sizing:border-box}
.if{font-size:10px;color:#7D8590;font-weight:700;flex:0 0 32px}
.rule-top select{height:32px;background:#0D1117;border:1px solid #30363D;color:#E6EDF3;border-radius:6px;padding:0 6px;font-size:12px;min-width:0}
.rule-top select:nth-of-type(1){flex:1 1 110px;max-width:150px}
.rule-top select:nth-of-type(2){flex:0 0 54px;width:54px}
.num{flex:0 0 56px;width:56px;height:32px;background:#0D1117;border:1px solid #30363D;color:#E6EDF3;border-radius:6px;padding:0 6px;font-size:12px;text-align:center}
.prio-wrap{display:flex;align-items:center;gap:6px;font-size:11px;color:#7D8590;flex:0 0 auto;margin-left:auto;white-space:nowrap}
.prio{width:46px;height:32px;background:#0D1117;border:1px solid #30363D;color:#E6EDF3;border-radius:6px;padding:0 6px;font-size:12px;text-align:center}
.btn-sm,.btn-add,.btn-save{background:#21262D;border:1px solid #30363D;color:#E6EDF3;border-radius:6px;padding:6px 10px;cursor:pointer;font-size:11px}
.btn-add,.btn-save{background:#00FF94;color:#0D1117;font-weight:700}
.btn-del{width:26px;height:26px;flex:0 0 26px;background:#2A1215;color:#FF7A90;border:1px solid #3A1A20;border-radius:6px;cursor:pointer}
footer{display:flex;justify-content:flex-end;border-top:1px solid #21262D;padding-top:12px}
</style>