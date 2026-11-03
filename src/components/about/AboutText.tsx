import { Bolded } from '@/components/ui/Bolded'
import type { About } from '@/seo/about'

/**
 * What a puzzle's page says of it (seo/about.ts), whole, under its name: in
 * a dialog (AboutDialog) and on the page written for the search engines
 * (seo/PageBody.tsx, where the name is the page's title, `h1`). The hook
 * above its methods heads them as the name heads the rest.
 */
export function AboutText({ about, Title = 'h2' }: { about: About; Title?: 'h1' | 'h2' }) {
  return (
    <div className="flex flex-col gap-3">
      <Title className={HEADING}>{about.name}</Title>
      {about.about && (
        <p className={TEXT}>
          <Bolded text={about.about} />
        </p>
      )}
      {about.methodsTitle && <h3 className={`mt-2 ${HEADING}`}>{about.methodsTitle}</h3>}
      <p className={TEXT}>
        <Bolded text={about.methods} />
      </p>
    </div>
  )
}

const HEADING = 'text-base font-bold text-white'
const TEXT = 'text-sm leading-relaxed text-slate-300'
