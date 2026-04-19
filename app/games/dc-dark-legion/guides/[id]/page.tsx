import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import { notFound } from 'next/navigation'

const guidesDir = path.join(process.cwd(), 'src/dcdl/guides')

function getGuideFiles() {
  return fs.readdirSync(guidesDir).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))
}

export function generateStaticParams() {
  return getGuideFiles().map((f) => ({ id: f.replace(/\.(mdx|md)$/, '') }))
}

function stripAstroSyntax(raw: string): string {
  return raw
    .split('\n')
    .filter((line) => {
      if (line.includes('from "astro:assets"') || line.includes("from 'astro:assets'")) return false
      if (/^import\s+\w+\s+from\s+["']/.test(line)) return false
      return true
    })
    .join('\n')
    .replace(/<Image\s[^/]*/g, (match) => {
      // Convert <Image src={varName} ... /> to <img src="/dcdl/guides/Infographics/..." />
      const srcMatch = match.match(/src=\{(\w+)\}/)
      const altMatch = match.match(/alt="([^"]*)"/)
      if (srcMatch) {
        const alt = altMatch ? altMatch[1] : ''
        return `<img src="/dcdl/guides/Infographics/${srcMatch[1]}" alt="${alt}" style="max-width:100%;height:auto"`
      }
      return match
    })
    .replace(/<Image\s/g, '<img ')
}

async function renderMarkdown(content: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify)
    .process(content)
  return String(result)
}

export default async function GuideDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const files = getGuideFiles()
  const file = files.find((f) => f.replace(/\.(mdx|md)$/, '') === id)
  if (!file) return notFound()

  const raw = fs.readFileSync(path.join(guidesDir, file), 'utf8')
  const { data, content: rawContent } = matter(raw)
  const cleaned = stripAstroSyntax(rawContent)
  const html = await renderMarkdown(cleaned)

  return (
    <main>
      <div className="container" style={{ maxWidth: '900px', paddingTop: '2rem', paddingBottom: '4rem' }}>
        {data.title && <h1>{data.title}</h1>}
        {data.pubDate && (
          <p style={{ color: '#999', marginBottom: '2rem' }}>
            Published: {String(data.pubDate).slice(0, 10)}
          </p>
        )}
        <article
          style={{ lineHeight: '1.8' }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <a
          href="/games/dc-dark-legion/guides"
          style={{ color: 'var(--gold)', marginTop: '2rem', display: 'inline-block' }}
        >
          ← Back to Guides
        </a>
      </div>
    </main>
  )
}
