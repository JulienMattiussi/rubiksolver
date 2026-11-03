// Writes each page of the built site (dist/) as its own file, from the
// built index.html: one per language and puzzle, and the sitemap. What each
// page says is src/seo/pages.tsx, loaded through Vite (aliases, TSX).
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { createServer } from 'vite'

const DIST = 'dist'

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
})
try {
  const { prerender, sitemap } = await vite.ssrLoadModule('/src/seo/pages.tsx')
  const template = await readFile(join(DIST, 'index.html'), 'utf8')
  const pages = prerender(template)
  for (const { file, html } of pages) {
    await mkdir(dirname(join(DIST, file)), { recursive: true })
    await writeFile(join(DIST, file), html)
  }
  await writeFile(join(DIST, 'sitemap.xml'), sitemap())
  console.log(`prerendered ${pages.length} pages and the sitemap`)
} finally {
  await vite.close()
}
