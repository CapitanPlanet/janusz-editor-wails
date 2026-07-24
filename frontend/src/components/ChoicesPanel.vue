<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useProjectStore } from '../stores/projectStore'

const store = useProjectStore()
const scene = computed(() => store.currentScene)
const sceneIds = computed(() => store.sceneIdsInCurrentDay)
const backgrounds = computed(() => store.backgroundAssets)
const reactions = computed(() => store.reactionAssets)

function updateScene(field: string, value: any) {
  store.updateCurrentScene(field, value)
}

onMounted(() => {
  scene.value?.Choices?.forEach((c: any) => {
    if (!c.id) c.id = crypto.randomUUID()
  })
})

function addChoice() {
  if (!scene.value) return
  if (!scene.value.Choices) scene.value.Choices = []
  scene.value.Choices.push({
    id: crypto.randomUUID(),
    Text: 'Nowy wybór',
    Next: scene.value.Id,
    Cebula: 0,
    Wstyd: 0,
    Portfel: 0,
    Reputacja: 0,
    ReactionText: '',
    ReactionImage: '',
    SoundFile: ''
  })
}

function deleteChoice(index: number) {
  scene.value?.Choices?.splice(index, 1)
}
</script>

<template>
  <div v-if="scene" class="choices-panel">
    <div class="panel-content">
      <h3>Edycja: {{ scene.Id }}</h3>
      
      <div class="field">
        <label>Tytuł sceny</label>
        <input :value="scene.SceneTitle" @input="updateScene('SceneTitle', ($event.target as HTMLInputElement).value)" placeholder="Nazwa wyświetlana w grze" />
      </div>

      <div class="field">
        <label>Tło</label>
        <select :value="scene.Background" @change="updateScene('Background', ($event.target as HTMLSelectElement).value)">
          <option value="">— Brak —</option>
          <option v-for="bg in backgrounds" :key="bg" :value="bg">{{ bg.replace('images/','') }}</option>
        </select>
      </div>

      <div class="field">
        <label>Tekst sceny</label>
        <textarea :value="scene.Text" @input="updateScene('Text', ($event.target as HTMLTextAreaElement).value)" rows="5" placeholder="Co widzi gracz..."></textarea>
      </div>

      <div class="choices-header">
        <h4>WYBORY [{{ scene.Choices?.length || 0 }}]</h4>
        <button @click="addChoice" class="btn-add">+ Wybór</button>
      </div>

      <div class="choices-list">
        <div v-for="(choice, idx) in scene.Choices || []" :key="choice.id" class="choice-card">
          <div class="choice-top">
            <input v-model="choice.Text" placeholder="Tekst wyboru" class="choice-input" />
            <button @click="deleteChoice(idx)" class="btn-delete">✕</button>
          </div>
          
          <div class="row-2">
            <div class="inline-field">
              <span>Przejdź do:</span>
              <select v-model="choice.Next">
                <option v-for="id in sceneIds" :key="id" :value="id">{{ id }}</option>
              </select>
            </div>
            <div class="inline-field">
              <span>Reakcja:</span>
              <select v-model="choice.ReactionImage">
                <option value="">— Brak —</option>
                <option v-for="re in reactions" :key="re" :value="re">{{ re.replace('images/','') }}</option>
              </select>
            </div>
          </div>

          <div class="stats-title">Statystyki</div>
          <div class="stats-grid">
            <div class="stat"><label>Cebula</label><input v-model.number="choice.Cebula" type="number" /></div>
            <div class="stat"><label>Wstyd</label><input v-model.number="choice.Wstyd" type="number" /></div>
            <div class="stat"><label>Portfel</label><input v-model.number="choice.Portfel" type="number" /></div>
            <div class="stat"><label>Reputacja</label><input v-model.number="choice.Reputacja" type="number" /></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="empty">Wybierz scenę</div>
</template>

<style scoped>
.choices-panel{background:#0D1117;height:100%;display:flex;flex-direction:column;min-height:0;width:100%;box-sizing:border-box}
.panel-content{padding:16px;overflow-y:auto;overflow-x:hidden;flex:1;min-height:0;display:flex;flex-direction:column;gap:12px;box-sizing:border-box}
.choices-panel h3{margin:0;color:#00FF94;font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:1px;opacity:.9}
.field{display:flex;flex-direction:column;gap:6px}
.field label{font-size:10px;color:#7D8590;text-transform:uppercase;letter-spacing:.6px;font-weight:700}
.field input,.field select,.field textarea{width:100%;box-sizing:border-box;padding:8px 10px;background:#161B22;border:1px solid #21262D;color:#E6EDF3;font-size:12px;border-radius:6px}
.field input:focus,.field select:focus,.field textarea:focus{outline:none;border-color:#00FF94}
.field textarea{resize:vertical;line-height:1.5;min-height:80px}

/* FIX - tu było ucinanie */
.choices-header{
  width:100%;
  box-sizing:border-box;
  display:flex;
  flex-direction:row;
  justify-content:space-between;
  align-items:center;
  gap:12px;
  min-height:38px;
  padding:0;
  padding-top:14px;
  margin-top:10px;
  border-top:1px solid #21262D;
  background:transparent;
  position:static;
}
.choices-header h4{margin:0;color:#E6EDF3;font-size:11px;letter-spacing:1px;line-height:1;white-space:nowrap}
.btn-add{flex:0 0 auto;height:30px;padding:0 14px;background:#00FF94;border:0;color:#000;font-size:12px;font-weight:800;border-radius:6px;cursor:pointer;white-space:nowrap}
.btn-add:hover{filter:brightness(1.1)}

.choices-list{display:flex;flex-direction:column;gap:10px;width:100%;box-sizing:border-box}
.choice-card{background:#161B22;border:1px solid #21262D;border-radius:8px;padding:10px;display:flex;flex-direction:column;gap:10px;box-sizing:border-box;width:100%}
.choice-top{display:flex;gap:8px;align-items:center;width:100%}
.choice-input{flex:1;min-width:0;height:34px;padding:0 10px;background:#0D1117;border:1px solid #2A313C;color:#fff;font-size:12px;border-radius:6px;box-sizing:border-box}
.choice-input:focus{outline:none;border-color:#00FF94}
.btn-delete{width:34px;height:34px;flex:0 0 34px;background:#2A1215;border:1px solid #3A1A20;color:#FF8A9B;border-radius:6px;cursor:pointer;font-size:14px;font-weight:700}
.btn-delete:hover{background:#3A1A20;color:#fff}
.row-2{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%}
.inline-field{display:flex;align-items:center;gap:8px;background:#0D1117;border:1px solid #21262D;border-radius:6px;padding:0 8px;height:34px;box-sizing:border-box;min-width:0}
.inline-field span{font-size:10px;color:#7D8590;white-space:nowrap;flex:0 0 auto}
.inline-field select{flex:1;min-width:0;background:transparent;border:0;color:#E6EDF3;font-size:11px;font-family:monospace;outline:none;padding:0}
.stats-title{font-size:9px;color:#7D8590;text-transform:uppercase;letter-spacing:1px;margin-top:2px}
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;width:100%}
.stat{display:flex;flex-direction:column;gap:4px;min-width:0}
.stat label{font-size:10px;color:#7D8590;text-align:center}
.stat input{width:100%;box-sizing:border-box;height:32px;background:#0D1117;border:1px solid #21262D;color:#E6EDF3;font-size:12px;border-radius:6px;text-align:center}
.stat input:focus{outline:none;border-color:#00FF94}
.empty{padding:60px 20px;text-align:center;color:#484F58;font-size:12px}
@media(max-width:600px){
  .row-2{grid-template-columns:1fr}
  .stats-grid{grid-template-columns:1fr 1fr}
}
</style>