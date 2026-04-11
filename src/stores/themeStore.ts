import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { invoke } from '@tauri-apps/api/core'

export type ThemeMode = 'light' | 'dark' | 'system'

export interface ThemeColors {
  primary: string
  primaryHover: string
}

export interface ThemeState {
  mode: ThemeMode
  resolvedMode: 'light' | 'dark'
  customColors: ThemeColors
  _hasHydrated: boolean

  setMode: (mode: ThemeMode) => void
  setCustomPrimaryColor: (hue: number) => void
  resetCustomColors: () => void
  toggleMode: () => void
  setHasHydrated: (value: boolean) => void
}

const defaultColors: ThemeColors = {
  primary: '217 91% 60%',
  primaryHover: '221 83% 53%',
}

async function getSystemTheme(): Promise<'light' | 'dark'> {
  try {
    const theme = await invoke<string>('get_system_theme')
    return theme as 'light' | 'dark'
  } catch (e) {
    console.error('Failed to get system theme from backend:', e)
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
}

async function resolveThemeMode(mode: ThemeMode): Promise<'light' | 'dark'> {
  if (mode === 'system') {
    return await getSystemTheme()
  }
  return mode
}

async function syncWindowTheme(isDark: boolean) {
  try {
    await invoke('set_window_theme', { isDark })
  } catch (e) {
    console.error('Failed to sync window theme:', e)
  }
}

async function applyTheme(mode: 'light' | 'dark', colors: ThemeColors) {
  const root = document.documentElement

  if (mode === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }

  const hue = colors.primary.split(' ')[0]
  const primaryColor = `${hue} 91% 60%`

  root.style.setProperty('--primary', primaryColor)
  root.style.setProperty('--primary-foreground', '0 0% 100%')
  root.style.setProperty('--ring', primaryColor)
  root.style.setProperty('--sidebar-primary', primaryColor)
  root.style.setProperty('--sidebar-primary-foreground', '0 0% 100%')

  await syncWindowTheme(mode === 'dark')
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      resolvedMode: 'light',
      customColors: defaultColors,
      _hasHydrated: false,

      setHasHydrated: (value: boolean) => set({ _hasHydrated: value }),

      setMode: async (mode: ThemeMode) => {
        const resolvedMode = await resolveThemeMode(mode)
        set({ mode, resolvedMode })
        await applyTheme(resolvedMode, get().customColors)
      },

      setCustomPrimaryColor: async (hue: number) => {
        const colors: ThemeColors = {
          primary: `${hue} 91% 60%`,
          primaryHover: `${hue} 83% 53%`,
        }
        set({ customColors: colors })
        await applyTheme(get().resolvedMode, colors)
      },

      resetCustomColors: async () => {
        set({ customColors: defaultColors })
        await applyTheme(get().resolvedMode, defaultColors)
      },

      toggleMode: async () => {
        const currentMode = get().mode
        let newMode: ThemeMode

        if (currentMode === 'light') {
          newMode = 'dark'
        } else if (currentMode === 'dark') {
          newMode = 'system'
        } else {
          newMode = 'light'
        }

        const resolvedMode = await resolveThemeMode(newMode)
        set({ mode: newMode, resolvedMode })
        await applyTheme(resolvedMode, get().customColors)
      },
    }),
    {
      name: 'r2nova-theme-storage',
      partialize: state => ({
        mode: state.mode,
        customColors: state.customColors,
      }),
      onRehydrateStorage: () => state => {
        if (state) {
          const resolveAndApply = async () => {
            const resolvedMode = await resolveThemeMode(state.mode)
            useThemeStore.setState({
              resolvedMode,
              _hasHydrated: true,
            })
            applyTheme(resolvedMode, state.customColors)
          }
          resolveAndApply()
        }
      },
    }
  )
)

export async function initTheme() {
  const store = useThemeStore.getState()

  if (!store._hasHydrated) {
    const resolvedMode = await resolveThemeMode(store.mode)
    await applyTheme(resolvedMode, store.customColors)
    useThemeStore.setState({ resolvedMode })
  }
}
