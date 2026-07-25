import { cubeSize } from '@/lib/cube'
import { methodsFor, type MethodId } from '@/lib/solver'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { Select } from '@/components/ui/Select'

/** Method dropdown plus the selected method's description. */
export function MethodSelect({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const size = useCube((s) => cubeSize(s.cube))
  const method = useCube((s) => s.method)
  const setMethod = useCube((s) => s.setMethod)
  return (
    <div>
      <Select
        id="method"
        label={t.methodLabel}
        value={method}
        disabled={disabled}
        onChange={(value) => setMethod(value as MethodId)}
      >
        {methodsFor(size).map(({ id }) => (
          <option key={id} value={id}>
            {t.methods[id].name}
          </option>
        ))}
      </Select>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">{t.methods[method].desc}</p>
    </div>
  )
}
