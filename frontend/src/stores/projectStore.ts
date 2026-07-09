import { defineStore } from 'pinia'
import { 
  CreateProject, 
  ReadJSON, 
  WriteJSON,
  SelectFolder,
  ListFiles,
  ListAssets // <-- DODANE
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

interface ProjectMeta {
  gameName: string
  author: string
  version: string
  engineVersion: string
  startDay: string
  startScene: string
}

export const useProjectStore = defineStore('project', {
  state: () => ({
    projectPath: null as string | null,
    meta: null as ProjectMeta | null,
    days: {} as Record<string, Scene[]>,
    currentDay: 'day1' as string,
    currentSceneId: null as string | null,
    assets: {
      all: [] as string[], // <-- DODANE: wszystkie assety z GameImages
      images: [] as string[], // zostawiam dla kompatybilności
      sounds: [] as string[]
    },
    saveStatus: ''
  }),

  getters: {
    isProjectLoaded: (state) =>!!state.projectPath,
    
    currentDayScenes: (state) => {
      return state.days[state.currentDay] || []
    },

    currentScene: (state) => {
      const scenes = state.days[state.currentDay] || []
      return scenes.find((s: Scene) => s.Id === state.currentSceneId) || null
    },

    sceneIdsInCurrentDay: (state) => {
      const scenes = state.days[state.currentDay] || []
      return scenes.map((s: Scene) => s.Id)
    },

    dayFileList: (state) => Object.keys(state.days),

    // ZMIENIONE: teraz filtrujemy po prefixach
    backgroundAssets: (state) => state.assets.all.filter(a => a.startsWith('images/bg_')),
    reactionAssets: (state) => state.assets.all.filter(a => a.startsWith('images/re_')),
    avatarAssets: (state) => state.assets.all.filter(a => a.startsWith('images/av_')),
    
    // stare gettery zostawiam żeby nic nie wybuchło
    availableBackgrounds: (state) => state.assets.all.filter(a => a.startsWith('images/bg_')),
    availableSounds: (state) => state.assets.sounds
  },

  actions: {
    ensureChoiceIds(scene: Scene) {
      if (scene?.Choices) {
        scene.Choices.forEach((c: Choice) => {
          if (!c.id) c.id = crypto.randomUUID()
        })
      }
    },

    // NOWA AKCJA: ładuje assety z GameImages przez Go
    async loadAssets() {
      if (!this.projectPath) {
        this.assets.all = []
        this.assets.images = []
        return
      }
      try {
        const list = await ListAssets(this.projectPath)
        this.assets.all = list || []
        this.assets.images = list || [] // wsteczna kompatybilność
        console.log('[STORE] Załadowano assety:', this.assets.all.length)
      } catch (e) {
        console.error('[STORE] Błąd ładowania assetów:', e)
        this.assets.all = []
        this.assets.images = []
      }
    },

    async createProjectAtPath(fullProjectPath: string, gameName: string) {
      try {
        await CreateProject(fullProjectPath, gameName)
        await this.loadProjectFromPath(fullProjectPath)
        await this.loadAssets() // <-- DODANE
        console.log('[STORE] Utworzono nowy projekt:', fullProjectPath)
        return fullProjectPath
      } catch (e) {
        console.error('[STORE] Błąd tworzenia projektu:', e)
        throw e
      }
    },

    async loadProjectFromPath(path: string) {
      this.projectPath = path

      try {
        const metaRaw = await ReadJSON(`${path}/project.janproj`)
        this.meta = JSON.parse(metaRaw)

        const day1Raw = await ReadJSON(`${path}/Data/day1.json`)
        const day1Data = JSON.parse(day1Raw)
        
        day1Data.forEach((scene: Scene) => this.ensureChoiceIds(scene))
        
        this.days = {
          day1: day1Data
        }

        this.currentDay = this.meta.startDay || 'day1'
        this.currentSceneId = this.meta.startScene || this.days[this.currentDay]?.[0]?.Id || null

        await this.loadAssets() // <-- ZMIENIONE: wołamy nową akcję
        console.log('[STORE] Załadowano projekt:', this.meta.gameName)
        console.log('[STORE] Dni:', Object.keys(this.days))

      } catch (e) {
        console.error('[STORE] Błąd ładowania projektu:', e)
        this.projectPath = null
        throw e
      }
    },

    // STARA FUNKCJA: zostawiam ale już nie używamy do obrazów
    async scanAssets() {
      if (!this.projectPath) return
      try {
        // Dźwięki dalej z Assets/sounds
        const soundsMp3 = (await ListFiles(`${this.projectPath}/sounds`, '.mp3')) || []
        const soundsWav = (await ListFiles(`${this.projectPath}/sounds`, '.wav')) || []
        this.assets.sounds = [...soundsMp3,...soundsWav]
        
        console.log('[STORE] Zeskanowano dźwięków:', this.assets.sounds)
      } catch (e) {
        console.error('[STORE] Błąd skanowania dźwięków:', e)
        this.assets.sounds = []
      }
    },

    async saveProject() {
      if (!this.projectPath ||!this.meta) return
      this.saveStatus = 'Zapisywanie...'

      try {
        await WriteJSON(
          `${this.projectPath}/project.janproj`,
          JSON.stringify(this.meta, null, 2)
        )

        const daysToSave = {} as Record<string, Scene[]>
        for (const dayFile of Object.keys(this.days)) {
          daysToSave[dayFile] = this.days[dayFile].map((scene: Scene) => ({
          ...scene,
            Choices: scene.Choices?.map((c: Choice) => {
              const { id,...rest } = c
              return rest
            })
          }))
        }

        for (const dayFile of Object.keys(daysToSave)) {
          await WriteJSON(
            `${this.projectPath}/Data/${dayFile}.json`,
            JSON.stringify(daysToSave[dayFile], null, 2)
          )
        }

        this.saveStatus = 'Zapisano'
        setTimeout(() => { this.saveStatus = '' }, 2000)
      } catch (e) {
        console.error('[STORE] Błąd zapisu:', e)
        this.saveStatus = 'Błąd zapisu'
      }
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
      const newScene: Scene = {
        Id: newId,
        SceneTitle: newId,
        Background: '',
        Text: '',
        Choices: []
      }
      if (!this.days[this.currentDay]) this.days[this.currentDay] = []
      this.days[this.currentDay].push(newScene)
      this.currentSceneId = newId
    },

    duplicateScene(sceneId: string) {
      const scenes = this.days[this.currentDay]
      if (!scenes) return
      const sceneToCopy = scenes.find((s: Scene) => s.Id === sceneId)
      if (!sceneToCopy) return

      const newScene = JSON.parse(JSON.stringify(sceneToCopy))
      newScene.Id = `${sceneToCopy.Id}_copy_${Date.now()}`
      newScene.SceneTitle = `${sceneToCopy.SceneTitle || sceneId} - Kopia`
      
      this.ensureChoiceIds(newScene)

      const index = scenes.findIndex((s: Scene) => s.Id === sceneId)
      scenes.splice(index + 1, 0, newScene)
      this.currentSceneId = newScene.Id
    },

    deleteScene(sceneId: string) {
      const scenes = this.days[this.currentDay]
      if (!scenes || scenes.length <= 1) {
        alert('Nie możesz usunąć ostatniej sceny w dniu')
        return
      }
      const index = scenes.findIndex((s: Scene) => s.Id === sceneId)
      if (index > -1) {
        scenes.splice(index, 1)
        if (this.currentSceneId === sceneId) {
          this.currentSceneId = scenes[0]?.Id || null
        }
      }
    },

    updateCurrentScene(field: keyof Scene, value: any) {
      if (!this.currentScene) return
      this.currentScene[field] = value
    },

    addDay(dayId: string) {
      if (this.days[dayId]) {
        alert('Dzień o tej nazwie już istnieje')
        return
      }
      this.days[dayId] = [{
        Id: 'start',
        SceneTitle: 'Start',
        Background: '',
        Text: 'Początek dnia',
        Choices: []
      }]
      this.currentDay = dayId
      this.currentSceneId = 'start'
    }
  }
})