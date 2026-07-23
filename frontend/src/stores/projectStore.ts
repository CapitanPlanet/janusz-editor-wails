import { defineStore } from 'pinia'
import {
  CreateProject,
  ReadJSON,
  WriteJSON,
  ListFiles,
  ListAssets
} from '../../wailsjs/go/main/App'

interface Choice {
  id?: string
  Text: string
  Next: string
  Cebula?: number
  Wstyd?: number
  Portfel?: number
  Reputacja?: number
  ReactionText?: string
  ReactionImage?: string
  SoundFile?: string
  FlagsSet?: string[]
  FlagsRequired?: string[]
  MinPortfel?: number | null
  KosztPortfel?: number | null
  FailText?: string
}

interface Scene {
  Id: string
  SceneTitle?: string
  Background?: string
  Text?: string
  Choices?: Choice[]
  IsEndDay?: boolean
  NextDay?: string
  [key: string]: any
}

type StatName = 'Cebula' | 'Wstyd' | 'Portfel' | 'Reputacja'
type ConditionOp = { gte?: number; lte?: number; gt?: number; lt?: number; eq?: number }

export interface AvatarRule {
  id: string
  use: string
  if: Partial<Record<StatName, ConditionOp>>
  priority: number
}

export interface AvatarSystem {
  default: string
  rules: AvatarRule[]
}

interface ProjectMeta {
  gameName: string
  author: string
  version: string
  engineVersion: string
  startDay: string
  startScene: string
  avatarSystem?: AvatarSystem
}

export const useProjectStore = defineStore('project', {
  state: () => ({
    projectPath: null as string | null,
    meta: null as ProjectMeta | null,
    days: {} as Record<string, Scene[]>,
    currentDay: 'day1' as string,
    currentSceneId: null as string | null,
    assets: {
      all: [] as string[],
      images: [] as string[],
      sounds: [] as string[]
    },
    saveStatus: '',
    ui: {
      showAvatarEditor: false
    }
  }),

  getters: {
    isProjectLoaded: (state) =>!!state.projectPath,
    currentDayScenes: (state) => state.days[state.currentDay] || [],
    currentScene: (state) => {
      const scenes = state.days[state.currentDay] || []
      return scenes.find((s: Scene) => s.Id === state.currentSceneId) || null
    },
    sceneIdsInCurrentDay: (state) => (state.days[state.currentDay] || []).map((s: Scene) => s.Id),
    dayFileList: (state) => Object.keys(state.days),

    // ASSETY - rozróżnienie po prefiksie, wszystko w jednym folderze images/
    backgroundAssets: (state) => state.assets.all.filter(a => a.includes('bg_')),
    reactionAssets: (state) => state.assets.all.filter(a => a.includes('re_')),
    avatarAssets: (state) => state.assets.all.filter(a => a.includes('av_')),

    availableBackgrounds: (state) => state.assets.all.filter(a => a.includes('bg_')),
    availableSounds: (state) => state.assets.sounds,

    avatarSystem(state): AvatarSystem {
      if (state.meta?.avatarSystem) return state.meta.avatarSystem
      return { default: state.assets.all.filter(a => a.includes('av_'))[0] || '', rules: [] }
    },
    sortedAvatarRules(state): AvatarRule[] {
      const rules = state.meta?.avatarSystem?.rules || []
      return [...rules].sort((a, b) => b.priority - a.priority)
    }
  },

  actions: {
    selectScene(sceneId: string) {
      this.currentSceneId = sceneId
    },

    ensureChoiceIds(scene: Scene) {
      scene.Choices?.forEach((c) => { if (!c.id) c.id = crypto.randomUUID() })
    },

    ensureAvatarSystem() {
      if (!this.meta) return
      if (!this.meta.avatarSystem) {
        this.meta.avatarSystem = { default: this.avatarAssets[0] || '', rules: [] }
      }
      if (!this.meta.avatarSystem.default && this.avatarAssets.length) {
        this.meta.avatarSystem.default = this.avatarAssets[0]
      }
    },

    async loadAssets() {
      if (!this.projectPath) {
        this.assets.all = []
        this.assets.images = []
        return
      }
      try {
        const list = await ListAssets(this.projectPath)
        this.assets.all = list || []
        this.assets.images = list || []
        this.ensureAvatarSystem()
      } catch (e) {
        console.error('[STORE] Błąd ładowania assetów:', e)
        this.assets.all = []
        this.assets.images = []
      }
    },

    async createProjectAtPath(fullProjectPath: string, gameName: string) {
      await CreateProject(fullProjectPath, gameName)
      await this.loadProjectFromPath(fullProjectPath)
      return fullProjectPath
    },

    async loadProjectFromPath(path: string) {
      this.projectPath = path
      try {
        const metaRaw = await ReadJSON(`${path}/project.janproj`)
        this.meta = JSON.parse(metaRaw) as ProjectMeta
        if (!this.meta.avatarSystem) {
          this.meta.avatarSystem = { default: '', rules: [] }
        }
        const day1Raw = await ReadJSON(`${path}/Data/day1.json`)
        const day1Data = JSON.parse(day1Raw) as Scene[]
        day1Data.forEach((s) => this.ensureChoiceIds(s))
        this.days = { day1: day1Data }
        this.currentDay = this.meta.startDay || 'day1'
        this.currentSceneId = this.meta.startScene || this.days[this.currentDay]?.[0]?.Id || null
        await this.loadAssets()
      } catch (e) {
        console.error('[STORE] Błąd ładowania projektu:', e)
        this.projectPath = null
        throw e
      }
    },

    async scanAssets() {
      if (!this.projectPath) return
      try {
        const mp3 = (await ListFiles(`${this.projectPath}/sounds`, '.mp3')) || []
        const wav = (await ListFiles(`${this.projectPath}/sounds`, '.wav')) || []
        this.assets.sounds = [...mp3,...wav]
      } catch {
        this.assets.sounds = []
      }
    },

    async saveProject() {
      if (!this.projectPath ||!this.meta) return
      this.saveStatus = 'Zapisywanie...'
      try {
        await WriteJSON(`${this.projectPath}/project.janproj`, JSON.stringify(this.meta, null, 2))
        for (const dayFile of Object.keys(this.days)) {
          const cleaned = this.days[dayFile].map((scene) => ({
           ...scene,
            Choices: scene.Choices?.map((c: any) => { const { id,...rest } = c; return rest })
          }))
          await WriteJSON(`${this.projectPath}/Data/${dayFile}.json`, JSON.stringify(cleaned, null, 2))
        }
        this.saveStatus = 'Zapisano'
        setTimeout(() => { this.saveStatus = '' }, 2000)
      } catch (e) {
        console.error('[STORE] Błąd zapisu:', e)
        this.saveStatus = 'Błąd zapisu'
      }
    },

    setDefaultAvatar(path: string) {
      this.ensureAvatarSystem()
      if (this.meta?.avatarSystem) this.meta.avatarSystem.default = path
    },

    addAvatarRule(imagePath?: string) {
      this.ensureAvatarSystem()
      this.meta!.avatarSystem!.rules.push({
        id: crypto.randomUUID(),
        use: imagePath || this.avatarAssets[0] || '',
        if: { Cebula: { gte: 50 } },
        priority: 50
      })
    },

    updateAvatarRule(ruleId: string, patch: Partial<AvatarRule>) {
      const rule = this.meta?.avatarSystem?.rules.find(r => r.id === ruleId)
      if (rule) Object.assign(rule, patch)
    },

    deleteAvatarRule(ruleId: string) {
      if (!this.meta?.avatarSystem) return
      this.meta.avatarSystem.rules = this.meta.avatarSystem.rules.filter(r => r.id!== ruleId)
    },

    closeProject() {
      this.projectPath = null
      this.meta = null
      this.days = {}
      this.currentDay = 'day1'
      this.currentSceneId = null
      this.assets = { all: [], images: [], sounds: [] }
    },

    addSceneToCurrentDay(sceneId?: string) {
      const newId = sceneId || `scene_${Date.now()}`
      const newScene: Scene = { Id: newId, SceneTitle: newId, Background: '', Text: '', Choices: [] }
      if (!this.days[this.currentDay]) this.days[this.currentDay] = []
      this.days[this.currentDay].push(newScene)
      this.currentSceneId = newId
    },

    duplicateScene(sceneId: string) {
      const scenes = this.days[this.currentDay]
      if (!scenes) return
      const toCopy = scenes.find(s => s.Id === sceneId)
      if (!toCopy) return
      const copy = JSON.parse(JSON.stringify(toCopy))
      copy.Id = `${toCopy.Id}_copy_${Date.now()}`
      copy.SceneTitle = `${toCopy.SceneTitle || sceneId} - Kopia`
      this.ensureChoiceIds(copy)
      scenes.splice(scenes.findIndex(s => s.Id === sceneId) + 1, 0, copy)
      this.currentSceneId = copy.Id
    },

    deleteScene(sceneId: string) {
      const scenes = this.days[this.currentDay]
      if (!scenes || scenes.length <= 1) { alert('Nie możesz usunąć ostatniej sceny'); return }
      const idx = scenes.findIndex(s => s.Id === sceneId)
      if (idx > -1) {
        scenes.splice(idx, 1)
        if (this.currentSceneId === sceneId) this.currentSceneId = scenes[0]?.Id || null
      }
    },

    updateCurrentScene(field: keyof Scene, value: any) {
      if (!this.currentScene) return
      ;(this.currentScene as any)[field] = value
    },

    addDay(dayId: string) {
      if (this.days[dayId]) { alert('Dzień już istnieje'); return }
      this.days[dayId] = [{ Id: 'start', SceneTitle: 'Start', Background: '', Text: 'Początek dnia', Choices: [] }]
      this.currentDay = dayId
      this.currentSceneId = 'start'
    }
  }
})