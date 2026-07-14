<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useProjectStore } from '../stores/projectStore'

const store = useProjectStore()

const scene = computed(() => store.currentScene)
const sceneIds = computed(() => store.sceneIdsInCurrentDay)
const backgrounds = computed(() => store.backgroundAssets)
const reactions = computed(() => store.reactionAssets) // DODANE

function updateScene(field: string, value: any) {
  store.updateCurrentScene(field, value)
}

onMounted(() => {
  if (scene.value?.Choices) {
    scene.value.Choices.forEach((c: any) => {
      if (!c.id) c.id = crypto.randomUUID()
    })
  }
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
    ReactionImage: '', // Będzie trzymać relPath np. "images/re_robotDevil.webp"
    SoundFile: ''
  })
}

function deleteChoice(index: number) {
  scene.value.Choices.splice(index, 1)
}
</script>

<template>
  <div v-if="scene" class="choices-panel">
    <div class="panel-content">
      <h3>Edycja: {{ scene.Id }}</h3>
      
      <div class="field">
        <label>Tytuł sceny</label>
        <input 
          :value="scene.SceneTitle" 
          @input="updateScene('SceneTitle', $event.target.value)"
          placeholder="Nazwa wyświetlana w grze"
        />
      </div>

      <div class="field">
        <label>Tło</label>
        <select 
          :value="scene.Background" 
          @change="updateScene('Background', $event.target.value)"
        >
          <option value="">— Brak —</option>
          <option v-for="bg in backgrounds" :key="bg" :value="bg">
            {{ bg.replace('images/', '') }}
          </option>
        </select>
      </div>

      <div class="field">
        <label>Tekst sceny</label>
        <textarea 
          :value="scene.Text" 
          @input="updateScene('Text', $event.target.value)"
          rows="5"
          placeholder="Co widzi gracz..."
        ></textarea>
      </div>

      <div class="choices-header">
        <h4>Wybory [{{ scene.Choices?.length || 0 }}]</h4>
        <button @click="addChoice" class="btn-add">+ Wybór</button>
      </div>

      <div class="choices-list">
        <div 
          v-for="(choice, idx) in scene.Choices || []" 
          :key="choice.id" 
          class="choice-card"
        >
          <div class="choice-header">
            <input 
              v-model="choice.Text" 
              placeholder="Tekst wyboru"
              class="choice-input"
            />
            <button @click="deleteChoice(idx)" class="btn-delete">×</button>
          </div>
          
          <div class="choice-next">
            <span>Przejdź do:</span>
            <select v-model="choice.Next">
              <option v-for="id in sceneIds" :key="id" :value="id">
                {{ id }}
              </option>
            </select>
          </div>

          <!-- DODANE: REAKCJA -->
          <div class="choice-reaction">
            <span>Reakcja:</span>
            <select v-model="choice.ReactionImage">
              <option value="">— Brak —</option>
              <option v-for="re in reactions" :key="re" :value="re">
                {{ re.replace('images/', '') }}
              </option>
            </select>
          </div>

          <div class="stats-title">Statystyki</div>
          <div class="stats-grid">
            <div class="stat">
              <label>Cebula</label>
              <input v-model.number="choice.Cebula" type="number" />
            </div>
            <div class="stat">
              <label>Wstyd</label>
              <input v-model.number="choice.Wstyd" type="number" />
            </div>
            <div class="stat">
              <label>Portfel</label>
              <input v-model.number="choice.Portfel" type="number" />
            </div>
            <div class="stat">
              <label>Reputacja</label>
              <input v-model.number="choice.Reputacja" type="number" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div v-else class="empty">
    Wybierz scenę
  </div>
</template>

<style scoped>
.choices-panel {
  background: #0f172a;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.panel-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.choices-panel h3 {
  margin: 0 0 20px 0;
  color: #4ade80;
  font-size: 13px;
  font-family: monospace;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.field {
  margin-bottom: 16px;
}
.field label {
  display: block;
  font-size: 11px;
  color: #64748b;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.field input, 
.field select, 
.field textarea {
  width: 100%;
  padding: 8px 10px;
  background: #1e293b;
  border: 1px solid #334155;
  color: #e2e8f0;
  font-size: 13px;
  border-radius: 4px;
  box-sizing: border-box;
}
.field input:focus, 
.field select:focus, 
.field textarea:focus {
  outline: none;
  border-color: #4ade80;
}
.field textarea {
  resize: vertical;
  font-family: inherit;
  line-height: 1.5;
}
.choices-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 24px 0 12px 0;
  padding-top: 16px;
  border-top: 1px solid #1e293b;
  position: sticky;
  top: 0;
  background: #0f172a;
  z-index: 10;
  padding-bottom: 12px;
}
.choices-header h4 {
  margin: 0;
  color: #4ade80;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.btn-add {
  padding: 6px 14px;
  background: #16a34a;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 12px;
  border-radius: 4px;
  font-weight: 600;
}
.btn-add:hover { 
  background: #22c55e; 
}

.choices-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.choice-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 14px;
  box-sizing: border-box;
}
.choice-header {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.choice-input {
  flex: 1;
  min-width: 0;
  padding: 8px 10px;
  background: #0f172a;
  border: 1px solid #334155;
  color: #fff;
  font-size: 13px;
  border-radius: 4px;
  box-sizing: border-box;
}
.choice-input:focus {
  outline: none;
  border-color: #4ade80;
}
.btn-delete {
  flex-shrink: 0;
  padding: 0 12px;
  background: #7f1d1d;
  border: 1px solid #991b1b;
  color: #fca5a5;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  border-radius: 4px;
  font-weight: bold;
}
.btn-delete:hover {
  background: #991b1b;
  color: #fff;
}
.choice-next {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid #334155;
}
.choice-next span {
  font-size: 12px;
  color: #94a3b8;
  min-width: 70px;
  flex-shrink: 0;
}
.choice-next select {
  flex: 1;
  min-width: 0;
  padding: 6px 8px;
  background: #0f172a;
  border: 1px solid #334155;
  color: #e2e8f0;
  font-size: 12px;
  border-radius: 4px;
  font-family: monospace;
  box-sizing: border-box;
}

/* DODANE: STYL DLA REAKCJI */
.choice-reaction {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid #334155;
}
.choice-reaction span {
  font-size: 12px;
  color: #94a3b8;
  min-width: 70px;
  flex-shrink: 0;
}
.choice-reaction select {
  flex: 1;
  min-width: 0;
  padding: 6px 8px;
  background: #0f172a;
  border: 1px solid #334155;
  color: #e2e8f0;
  font-size: 12px;
  border-radius: 4px;
  font-family: monospace;
  box-sizing: border-box;
}
.choice-reaction select:focus {
  outline: none;
  border-color: #f59e0b;
}

.stats-title {
  font-size: 10px;
  color: #64748b;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  width: 100%;
}
.stat {
  min-width: 0;
}
.stat label {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  margin-bottom: 4px;
}
.stat input {
  width: 100%;
  padding: 6px 8px;
  background: #0f172a;
  border: 1px solid #334155;
  color: #e2e8f0;
  font-size: 13px;
  border-radius: 4px;
  text-align: center;
  box-sizing: border-box;
}
.stat input:focus {
  outline: none;
  border-color: #4ade80;
}
.empty {
  padding: 60px 20px;
  text-align: center;
  color: #475569;
  font-size: 14px;
}
</style>