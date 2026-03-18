import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export interface Config {
  timerDuration: number
}

interface ConfigContextType {
  config: Config
  updateConfig: (newConfig: Partial<Config>) => void
  resetConfig: () => void
}

const defaultConfig: Config = {
  timerDuration: 120,
}

const CONFIG_STORAGE_KEY = 'redactle-config'

const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Config>(() => {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY)
    if (stored) {
      try {
        return { ...defaultConfig, ...JSON.parse(stored), timerDuration: defaultConfig.timerDuration }
      } catch {
        return defaultConfig
      }
    }
    return defaultConfig
  })

  useEffect(() => {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config))
  }, [config])

  const updateConfig = () => {
    // Timer is now fixed at 120 seconds, ignore any update attempts
    // This ensures the timer cannot be changed
  }

  const resetConfig = () => {
    setConfig(defaultConfig)
  }

  return (
    <ConfigContext.Provider value={{ config, updateConfig, resetConfig }}>
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig() {
  const context = useContext(ConfigContext)
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider')
  }
  return context
}
