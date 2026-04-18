import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { notFound } from 'next/navigation'

const guidesDir = path.join(process.cwd(), 'src/dcdl/guides')

function getGuideFiles() {
  return fs.readdirSync(guidesDir).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))
}

export function generateStaticParams() {
  return getGuideFiles().map((f) => ({ id: f.replace(/\.(mdx|md)$/, '') }))
}

function processContent(raw: string): { content: string; scope: Record<string, string> } {
  const lines = raw.split('\n')
  const scope: Record<string, string> = {}
  const processed: string[] = []
  let inFrontmatter = false
  let frontmatterDone = false
  let frontmatterCount = 0

  for (const line of lines) {
    if (line.trim() === '---') {
      frontmatterCount++
      if (frontmatterCount <= 2) {
        processed.push(line)
        if (frontmatterCount === 2) frontmatterDone = true
        continue
      }
    }

    // Skip Astro-specific imports
    if (line.includes('from "astro:assets"') || line.includes("from 'astro:assets'")) {
      continue
    }

    // Extract local image imports and map them to public paths
    const imgImport = line.match(/^import\s+(\w+)\s+from\s+["']\.\/Infographics\/([^"']+)["']/)
    if (imgImport) {
      const [, varName, filename] = imgImport
      scope[varName] = `/dcdl/guides/Infographics/${filename}`
      continue
    }

    processed.push(line)
  }

  return { content: processed.join('\n'), scope }
}

function GuideImage({ src, alt, width, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const resolvedSrc = typeof src === 'string' ? src : String(src ?? '')
  return (
    <img
      src={resolvedSrc}
      alt={alt ?? ''}
      style={{ maxWidth: width ? `${width}px` : '100%', height: 'auto' }}
      {...props}
    />
  )
}

export default function GuideDetailPage({ params }: { params: { id: string } }) {
  const files = getGuideFiles()
  const file = files.find((f) => f.replace(/\.(mdx|md)$/, '') === params.id)
  if (!file) return notFound()

  const raw = fs.readFileSync(path.join(guidesDir, file), 'utf8')
  const { data, content: rawContent } = matter(raw)
  const { content, scope } = processContent(rawContent)

  return (
    <main>
      <div className="container" style={{ maxWidth: '900px', paddingTop: '2rem', paddingBottom: '4rem' }}>
        {data.title && <h1>{data.title}</h1>}
        {data.pubDate && <p style={{ color: '#999', marginBottom: '2rem' }}>Published: {String(data.pubDate).slice(0, 10)}</p>}
        <article style={{ lineHeight: '1.8' }}>
          <MDXRemote
            source={content}
            components={{ Image: GuideImage as React.ElementType }}
            options={{ scope }}
          />
        </article>
        <a href="/games/dc-dark-legion/guides" style={{ color: 'var(--gold)', marginTop: '2rem', display: 'inline-block' }}>← Back to Guides</a>
      </div>
    </main>
  )
}
