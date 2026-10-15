/** The share preview's card (1200x630), in the home page's colors: the
 *  name, the number of puzzles, a tagline and twelve puzzle drawings. */

const TEXT = {
  fr: {
    kicker: 'Casse-tête 3D · solveur pédagogique',
    tagline:
      'Manipulez, saisissez votre puzzle et apprenez à le résoudre pas à pas, avec de vraies méthodes.',
    chips: ['Saisie 3D', 'Guide des coups', 'Méthodes par étapes'],
  },
  en: {
    kicker: '3D twisty puzzles · step-by-step solver',
    tagline:
      'Turn them, enter your own puzzle and learn to solve it step by step, with real methods.',
    chips: ['3D input', 'Move guide', 'Step-by-step methods'],
  },
}

/** Background, text and ring of each chip: the home page's features. */
const CHIP_COLORS = [
  ['rgba(14,165,233,.15)', '#7dd3fc', 'rgba(56,189,248,.35)'],
  ['rgba(139,92,246,.15)', '#c4b5fd', 'rgba(167,139,250,.35)'],
  ['rgba(245,158,11,.15)', '#fcd34d', 'rgba(251,191,36,.35)'],
] as const

const STYLE = `
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;background:#0b1222;color:#e2e8f0;position:relative;
  font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}
.glow{position:absolute;border-radius:50%;filter:blur(90px)}
.wrap{position:relative;display:flex;height:100%;padding:64px 56px 64px 72px;gap:40px;align-items:center}
.left{flex:1 1 0;display:flex;flex-direction:column;gap:22px}
.brand{display:flex;align-items:center;gap:20px}
.brand svg{width:84px;height:84px;filter:drop-shadow(0 10px 30px rgba(56,189,248,.25))}
h1{font-size:72px;font-weight:800;letter-spacing:-1.5px;line-height:1;
  background:linear-gradient(90deg,#7dd3fc,#fff 45%,#c4b5fd);-webkit-background-clip:text;color:transparent}
.kicker{font-size:17px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#fbbf24}
.count{font-size:30px;font-weight:700;color:#fff}
.count b{font-size:64px;font-weight:900;color:#fcd34d;margin-right:10px;vertical-align:-6px}
.tag{font-size:25px;line-height:1.4;color:#cbd5e1;max-width:560px}
.chips{display:flex;gap:10px;flex-wrap:wrap}
.chip{font-size:17px;font-weight:600;padding:8px 16px;border-radius:999px}
.grid{display:grid;grid-template-columns:repeat(4,108px);gap:12px;flex:none}
.cell{height:108px;border-radius:20px;background:rgba(15,23,42,.7);border:1px solid rgba(71,85,105,.55);
  display:flex;align-items:center;justify-content:center;box-shadow:0 10px 25px rgba(0,0,0,.25)}
.cell svg{width:88px;height:76px}
`

/** The card's page: `icons` are the puzzles' SVG drawings, `logo` the favicon. */
export function shareCard(lang: 'fr' | 'en', count: number, icons: string[], logo: string) {
  const t = TEXT[lang]
  const chips = t.chips
    .map((chip, i) => {
      const [bg, color, ring] = CHIP_COLORS[i] ?? CHIP_COLORS[0]
      return `<span class="chip" style="background:${bg};color:${color};box-shadow:inset 0 0 0 1px ${ring}">${chip}</span>`
    })
    .join('')
  return `<!doctype html><html><head><meta charset="utf-8"><style>${STYLE}</style></head><body>
<div class="glow" style="width:520px;height:520px;left:-120px;top:-160px;background:rgba(14,165,233,.18)"></div>
<div class="glow" style="width:560px;height:560px;right:-140px;bottom:-220px;background:rgba(139,92,246,.2)"></div>
<div class="wrap">
  <div class="left">
    <div class="kicker">${t.kicker}</div>
    <div class="brand">${logo}<h1>Rubik Solver</h1></div>
    <div class="count"><b>${count}</b>puzzles</div>
    <div class="tag">${t.tagline}</div>
    <div class="chips">${chips}</div>
  </div>
  <div class="grid">${icons.map((svg) => `<div class="cell">${svg}</div>`).join('')}</div>
</div></body></html>`
}
