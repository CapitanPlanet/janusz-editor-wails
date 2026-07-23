<script setup>
import { useProjectStore } from '../stores/projectStore'
const store = useProjectStore()

function addRule() {
  store.avatarSystem.rules.push({
    use: store.avatarAssets[0] || '',
    if: { stat: 'Cebula', op: 'gte', value: 50 },
    priority: 10
  })
}
</script>

<template>
  <div v-if="store.ui.showAvatarEditor" class="modal-overlay">
    <div class="modal">
      <h2>SYSTEM AVATARÓW - jak Janusz się zmienia</h2>

      <label>Domyślny avatar (gdy nic nie pasuje):</label>
      <select v-model="store.avatarSystem.default">
        <option v-for="av in store.avatarAssets" :key="av" :value="av">{{ av }}</option>
      </select>

      <div v-for="(rule, i) in store.avatarSystem.rules" :key="i" class="rule-row">
        <img :src="store.getAssetUrl(rule.use)" width="40" />
        <select v-model="rule.use">
          <option v-for="av in store.avatarAssets" :key="av" :value="av">{{ av.replace('images/av_','') }}</option>
        </select>
        <span>JEŚLI</span>
        <select v-model="rule.if.stat">
          <option>Cebula</option><option>Wstyd</option><option>Portfel</option><option>Reputacja</option>
        </select>
        <select v-model="rule.if.op"><option>gte</option><option>lte</option></select>
        <input type="number" v-model.number="rule.if.value" />
        <input type="number" v-model.number="rule.priority" title="priorytet" />
        <button @click="store.avatarSystem.rules.splice(i,1)">✕</button>
      </div>

      <button @click="addRule">+ Dodaj regułę</button>
      <button @click="store.ui.showAvatarEditor = false" class="btn-save">ZAMKNIJ</button>
    </div>
  </div>
</template>