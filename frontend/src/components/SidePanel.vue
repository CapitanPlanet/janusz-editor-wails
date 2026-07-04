<script setup>
import { useProjectStore } from '../stores/projectStore'

const store = useProjectStore()

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
</script>

<template>
  <aside class="side-panel">
    <div class="panel-section">
      <h3>PROJEKT JANUSZA</h3>
      <div class="project-name">{{ store.meta?.gameName || 'Brak' }}</div>
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
}
.panel-section {
  margin-bottom: 24px;
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
}
.btn-mini:hover {
  background: #22c55e;
}
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
}
.day-name {
  flex: 1;
  font-size: 13px;
  font-family: monospace;
  color: #fff;
}
.scene-count {
  font-size: 11px;
  color: #94a3b8;
  background: rgba(0,0,0,0.3);
  padding: 2px 6px;
  border-radius: 10px;
}
</style>