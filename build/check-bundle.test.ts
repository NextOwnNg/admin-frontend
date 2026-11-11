import { describe, expect, it } from 'vitest'
import { initialScripts } from './check-bundle.ts'

const html = `<!doctype html><html><head>
<script type="module" crossorigin src="/assets/index-A.js"></script>
<link rel="modulepreload" crossorigin href="/assets/react-B.js">
<link rel="stylesheet" crossorigin href="/assets/index.css">
</head><body><div id="root"></div></body></html>`

describe('bundle budget (design §5)', () => {
  it('lists the entry and its preloads', () => {
    expect(initialScripts(html)).toEqual(['assets/index-A.js', 'assets/react-B.js'])
  })

  it('ignores lazy chunks', () => {
    expect(initialScripts(html)).not.toContain('assets/DashboardPage-C.js')
    expect(initialScripts(`${html}<script>import('/assets/DashboardPage-C.js')</script>`)).toEqual([
      'assets/index-A.js',
      'assets/react-B.js',
    ])
  })
})
