import { useEffect, useState } from 'react'
import { initTheme } from '../stores/themeStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const init = async () => {
      await initTheme()
      setIsReady(true)
    }
    init()
  }, [])

  if (!isReady) {
    return <div className="min-h-screen bg-[hsl(var(--background))]" />
  }

  return <>{children}</>
}
