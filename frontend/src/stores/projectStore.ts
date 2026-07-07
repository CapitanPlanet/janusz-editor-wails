import { defineStore } from 'pinia'
import { 
  CreateProject, 
  ReadJSON, 
  WriteJSON,
  SelectFolder,
  ListFiles 
} from '../../wailsjs/go/main/App'

interface Choice {
  id?: string // <-- DODANE TYLKO TO
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
      images: [] as string[],
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

    availableBackgrounds: (state) => state.assets.images,
    availableSounds: (state) => state.assets.sounds
  },

  actions: {
    // DODANE: zapewnia ID dla wyborów
    ensureChoiceIds(scene: Scene) {
      if (scene?.Choices) {
        scene.Choices.forEach((c: Choice) => {
          if (!c.id) c.id = crypto.randomUUID()
        })
      }
    },

    async createProjectAtPath(fullProjectPath: string, gameName: string) {
      try {
        await CreateProject(fullProjectPath, gameName)
        await this.loadProjectFromPath(fullProjectPath)
        await this.scanAssets()
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
        
        // DODANE: nadaj ID wszystkim wyborom przy ładowaniu
        day1Data.forEach((scene: Scene) => this.ensureChoiceIds(scene))
        
        this.days = {
          day1: day1Data
        }

        this.currentDay = this.meta.startDay || 'day1'
        this.currentSceneId = this.meta.startScene || this.days[this.currentDay]?.[0]?.Id || null

        await this.scanAssets()
        console.log('[STORE] Załadowano projekt:', this.meta.gameName)
        console.log('[STORE] Dni:', Object.keys(this.days))

      } catch (e) {
        console.error('[STORE] Błąd ładowania projektu:', e)
        this.projectPath = null
        throw e
      }
    },

async scanAssets() {
  if (!this.projectPath) return
  try {
    // DODAJEMY || [] JAKO FALLBACK
    const imagesJpg = (await ListFiles(`${this.projectPath}/Assets/images`, '.jpg')) || []
    const imagesPng = (await ListFiles(`${this.projectPath}/Assets/images`, '.png')) || []
    this.assets.images = [...imagesJpg, ...imagesPng]
    
    const soundsMp3 = (await ListFiles(`${this.projectPath}/Assets/sounds`, '.mp3')) || []
    const soundsWav = (await ListFiles(`${this.projectPath}/Assets/sounds`, '.wav')) || []
    this.assets.sounds = [...soundsMp3, ...soundsWav]
    
    console.log('[STORE] Zeskanowano teł:', this.assets.images)
    console.log('[STORE] Zeskanowano dźwięków:', this.assets.sounds)
  } catch (e) {
    console.error('[STORE] Błąd skanowania assetów:', e)
    this.assets.images = []
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

        // ZMIANA: usuwamy id przed zapisem do pliku
        const daysToSave = {} as Record<string, Scene[]>
        for (const dayFile of Object.keys(this.days)) {
          daysToSave[dayFile] = this.days[dayFile].map((scene: Scene) => ({
           ...scene,
            Choices: scene.Choices?.map((c: Choice) => {
              const { id,...rest } = c // wywalamy id
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
      this.assets = { images: [], sounds: [] }
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
      
      // DODANE: nowe ID dla wyborów w kopii
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