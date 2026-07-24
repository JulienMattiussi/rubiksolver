import { useEffect } from 'react'
import { Controls } from './components/Controls'
import { useI18n } from './i18n/i18nStore'
import { Scene } from './three/Scene'

export default function App() {
  const locale = useI18n((s) => s.locale)
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return (
    <main className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0">
        <Scene />
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-end justify-center p-3 sm:items-start sm:justify-end sm:p-5">
        <div className="pointer-events-auto max-h-full w-full max-w-sm overflow-auto sm:w-auto">
          <Controls />
        </div>
      </div>
    </main>
  )
}
