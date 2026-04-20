import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const GUIDES_DIR = path.join(process.cwd(), 'src/dcdl/guides')

type Block =
  | { type: 'subheading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'image'; src: string; alt: string; alignment: 'left' | 'right' | 'full' }
  | { type: 'clearfloat' }

function generateMdx(
  title: string, author: string, pubDate: string, description: string, intro: string, blocks: Block[]
): string {
  const fm = [
    '---',
    `title: "${title.replace(/"/g, '\\"')}"`,
    author ? `author: "${author.replace(/"/g, '\\"')}"` : null,
    pubDate ? `pubDate: ${pubDate}` : null,
    description ? `description: "${description.replace(/"/g, '\\"')}"` : null,
    '---',
  ].filter(Boolean).join('\n')

  const parts: string[] = []
  if (intro) parts.push(intro)

  for (const block of blocks) {
    if (block.type === 'subheading') {
      parts.push(`## ${block.text}`)
    } else if (block.type === 'paragraph') {
      parts.push(block.text)
    } else if (block.type === 'image') {
      if (block.alignment === 'full') {
        parts.push(`<img src="${block.src}" alt="${block.alt ?? ''}" style="display:block;width:100%;height:auto;margin-bottom:1.5rem;" />`)
      } else {
        const float = block.alignment
        const margin = float === 'left' ? 'margin-right:1.5rem;' : 'margin-left:1.5rem;'
        parts.push(`<img src="${block.src}" alt="${block.alt ?? ''}" style="float:${float};${margin}margin-bottom:1rem;width:40%;height:auto;" />`)
      }
    } else if (block.type === 'clearfloat') {
      parts.push('<div style="clear:both;"></div>')
    }
  }

  return fm + '\n\n' + parts.join('\n\n')
}

export async function GET() {
  try {
    const files = fs.readdirSync(GUIDES_DIR).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))
    const guides = files.map((filename) => {
      const raw = fs.readFileSync(path.join(GUIDES_DIR, filename), 'utf8')
      const { data } = matter(raw)
      return { filename, title: data.title ?? filename, pubDate: data.pubDate ?? null, author: data.author ?? null }
    }).sort((a, b) => ((b.pubDate ?? '') > (a.pubDate ?? '') ? 1 : -1))
    return NextResponse.json(guides)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { filename, title, author, pubDate, description, intro, blocks } = body

  if (!filename || !title) return NextResponse.json({ error: 'filename and title are required' }, { status: 400 })

  const slug = filename.replace(/[^a-zA-Z0-9_-]/g, '')
  if (!slug) return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })

  const mdx = generateMdx(title, author ?? '', pubDate ?? '', description ?? '', intro ?? '', blocks ?? [])
  fs.writeFileSync(path.join(GUIDES_DIR, slug + '.mdx'), mdx, 'utf8')

  return NextResponse.json({ success: true, filename: slug + '.mdx' })
}
