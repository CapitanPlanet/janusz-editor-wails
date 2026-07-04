<script setup lang="ts">
import { ref } from 'vue'
import LauncherView from './components/LauncherView.vue'
import EditorView from './components/EditorView.vue'

const currentView = ref<'launcher' | 'editor'>('launcher')

function goToEditor() {
  currentView.value = 'editor'
}

function goToMenu() {
  currentView.value = 'launcher'
}
</script>

<template>
  <LauncherView v-if="currentView === 'launcher'" @project-loaded="goToEditor" />
  <EditorView v-else @go-to-menu="goToMenu" />
</template>

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0a1628;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

* {
  box-sizing: border-box;
}
</style>