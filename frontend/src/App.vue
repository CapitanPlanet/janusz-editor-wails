<script setup lang="ts">
import { computed } from 'vue'
import { useProjectStore } from './stores/projectStore'
import LauncherView from './components/LauncherView.vue'
import EditorView from './components/EditorView.vue'

const projectStore = useProjectStore()

// Jak projectPath jest ustawiony, to znaczy że mamy projekt
const isProjectLoaded = computed(() =>!!projectStore.projectPath)
</script>

<template>
  <LauncherView v-if="!isProjectLoaded" />
  <EditorView v-else />
</template>

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background: #0D1117;
}

* {
  box-sizing: border-box;
}

::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: #161B22;
}

::-webkit-scrollbar-thumb {
  background: #30363D;
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: #484F58;
}
</style>