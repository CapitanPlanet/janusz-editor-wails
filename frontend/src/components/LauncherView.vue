<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { SelectFolder, CreateProject, AddRecentProject, GetRecentProjects, GetDefaultProjectPath } from '../../wailsjs/go/main/App'
import { useProjectStore } from '../stores/projectStore'

const store = useProjectStore()

const recentProjects = ref<string[]>([])
const showNewProjectModal = ref(false)
const newProjectName = ref('')
const selectedFolder = ref('')
const isCreating = ref(false)

async function loadRecentProjects() {
  try {
    recentProjects.value = await GetRecentProjects()
  } catch (e) {
    console.error('Błąd ładowania ostatnich:', e)
    recentProjects.value = []
  }
}

async function openProjectDialog() {
  try {
    const selected = await SelectFolder()
    if (selected) {
      await AddRecentProject(selected)
      await store.loadProjectFromPath(selected)
    }
  } catch (e) {
    alert('Błąd otwierania: ' + e)
  }
}

async function pickFolder() {
  try {
    const folder = await SelectFolder()
    if (folder) {
      selectedFolder.value = folder
    }
  } catch (e) {
    console.error(e)
  }
}

async function createProject() {
  if (!newProjectName.value.trim()) {
    alert('Wpisz nazwę projektu')
    return
  }
  if (!selectedFolder.value) {
    alert('Wybierz folder docelowy')
    return
  }

  isCreating.value = true

  try {
    const fullPath = `${selectedFolder.value}/${newProjectName.value}`
    await CreateProject(fullPath, newProjectName.value)
    await AddRecentProject(fullPath)
    await store.loadProjectFromPath(fullPath)
    
    showNewProjectModal.value = false
    newProjectName.value = ''
    selectedFolder.value = ''
    
    await loadRecentProjects()

  } catch (e: any) {
    console.error('Błąd tworzenia:', e)
    alert('Błąd tworzenia: ' + (e.message || e.toString()))
  } finally {
    isCreating.value = false
  }
}

async function openNewProjectModal() {
  selectedFolder.value = await GetDefaultProjectPath()
  newProjectName.value = ''
  showNewProjectModal.value = true
}

async function openRecent(path: string) {
  try {
    await store.loadProjectFromPath(path)
    await AddRecentProject(path)
  } catch (e) {
    alert('Nie można otworzyć projektu: ' + e)
    await loadRecentProjects()
  }
}

onMounted(loadRecentProjects)
</script>

<template>
  <div class="launcher">
    <div class="launcher-content">
      <img
        src="/Assets/Backgrounds/janusz_menu_header.png"
        alt="Janusz Menu Header"
        class="menu-header"
      />
      <h1>Edytor Janusza V2.0</h1>
      
      <div class="launcher-buttons">
        <button @click="openNewProjectModal" class="btn-primary">+ Nowy Projekt</button>
        <button @click="openProjectDialog" class="btn-secondary">📂 Otwórz Projekt</button>
      </div>

      <div v-if="recentProjects.length" class="recent">
        <h3>OSTATNIE PROJEKTY</h3>
        <div
          v-for="p in recentProjects"
          :key="p"
          @click="openRecent(p)"
          class="recent-item"
        >
          📁 {{ p.split('\\').pop() || p.split('/').pop() }}
          <span class="recent-path">{{ p }}</span>
        </div>
      </div>
    </div>
  </div>

  <div v-if="showNewProjectModal" class="modal" @click.self="showNewProjectModal = false">
    <div class="modal-content">
      <h3>Nowy projekt Janusza</h3>

      <div class="form-group">
        <label>Nazwa projektu:</label>
        <input
          v-model="newProjectName"
          placeholder="MojaSuperGra"
          @keyup.enter="createProject"
          @keyup.esc="showNewProjectModal = false"
          autofocus
        />
      </div>

      <div class="form-group">
        <label>Lokalizacja:</label>
        <div class="folder-picker">
          <input :value="selectedFolder" type="text" readonly placeholder="Kliknij Przeglądaj..." />
          <button @click="pickFolder">Przeglądaj...</button>
        </div>
        <small v-if="selectedFolder && newProjectName" class="hint">
          Utworzony zostanie: {{ selectedFolder }}/{{ newProjectName }}
        </small>
      </div>

      <div class="modal-buttons">
        <button @click="createProject" :disabled="isCreating ||!newProjectName.trim()" class="btn-primary">
          {{ isCreating? 'Tworzenie...' : 'Stwórz' }}
        </button>
        <button @click="showNewProjectModal = false" class="btn-cancel">Anuluj</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.launcher {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  background: 
    linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)),
    url('/assets/bg.png') center/cover no-repeat;
}
.launcher h1 {
  color: #4ade80;
  font-size: 28px;
  margin: 0 0 40px 0;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.9);
  font-weight: 600;
  letter-spacing: 0.5px;
}

.launcher-content {
  text-align: center;
  position: relative;
  z-index: 1;
}

.menu-header {
  width: 120px;
  height: auto;
  margin-bottom: 32px;
  border-radius: 4px;
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.4);
}

.launcher-buttons {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 280px;
  margin: 0 auto;
}

.launcher-buttons button {
  padding: 14px 24px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
  border-radius: 2px;
  text-transform: none;
  letter-spacing: 0;
}

.btn-primary {
  background: #16a34a;
  color: #fff;
  box-shadow: none;
}

.btn-primary:hover {
  background: #22c55e;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background: #1e293b;
  color: #e2e8f0;
  border: 1px solid #334155;
}

.btn-secondary:hover {
  background: #334155;
  border-color: #4ade80;
  transform: none;
  box-shadow: none;
}

.recent {
  margin-top: 40px;
  padding-top: 0;
  border-top: none;
}

.recent h3 {
  color: #94a3b8;
  font-size: 13px;
  margin: 0 0 12px 0;
  letter-spacing: 0.5px;
  font-weight: 400;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

.recent-item {
  padding: 10px 16px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 2px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.15s;
  color: #cbd5e1;
  font-size: 13px;
  text-align: left;
  width: 280px;
  margin-left: auto;
  margin-right: auto;
}

.recent-item:hover {
  background: #334155;
  border-color: #4ade80;
  color: #e2e8f0;
  transform: none;
}

.recent-path {
  display: block;
  font-size: 10px;
  color: #64748b;
  font-family: monospace;
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: #1e293b;
  padding: 28px;
  border-radius: 4px;
  border: 1px solid #16a34a;
  min-width: 500px;
  max-width: 90%;
}

.modal-content h3 {
  margin: 0 0 20px 0;
  color: #4ade80;
  font-size: 20px;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group input {
  width: 100%;
  padding: 12px;
  background: #0a1628;
  border: 1px solid #334155;
  color: #fff;
  font-size: 14px;
  border-radius: 2px;
}

.form-group input:focus {
  outline: none;
  border-color: #16a34a;
}

.folder-picker {
  display: flex;
  gap: 8px;
}

.folder-picker input {
  flex: 1;
  margin: 0;
}

.folder-picker button {
  padding: 12px 18px;
  background: #334155;
  border: 1px solid #475569;
  color: white;
  border-radius: 2px;
  cursor: pointer;
  white-space: nowrap;
  font-weight: 600;
}

.folder-picker button:hover {
  background: #475569;
}

.hint {
  display: block;
  margin-top: 6px;
  color: #64748b;
  font-size: 11px;
  text-align: left;
  font-family: monospace;
}

.modal-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 24px;
}

.modal-buttons button {
  padding: 10px 24px;
  cursor: pointer;
  border: none;
  border-radius: 2px;
  font-weight: 600;
  font-size: 14px;
}

.btn-cancel {
  background: #334155;
  color: #cbd5e1;
}

.btn-cancel:hover {
  background: #475569;
}
</style>