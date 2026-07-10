import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { notProd } from '@/src/lib/adminGuard'

const GUIDES_DIR = path.join(process.cwd(), 'src/dcdl/guides')

type CalloutType = 'TIP' | 'NOTE' | 'WARNING' | 'IMPORTANT' | 'F2P'
type Block =
  | { type: 'subheading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'image'; src: string; alt: string; alignment: 'left' | 'right' | 'full' }
  | { type: 'callout'; calloutType: CalloutType; text: string }
  | { type: 'clearfloat' }

interface GenerateOptions {
  title: string
  author: string
  pubDate: string
  description: string
  intro: string
  blocks: Block[]
  coverImage?: string
  tags?: string
  eventType?: string
  eventDates?: string
  recommendedFor?: string
  keyRewards?: string
}

function generateMdx(opts: GenerateOptions): string {
  const {
    title, author, pubDate, description, intro, blocks, coverImage,
    tags, eventType, eventDates, recommendedFor, keyRewards,
  } = opts

  const tagList = tags
    ? tags.split(',').map((t) => t.trim()).filter(Boolean)
    : null
  const rewardList = keyRewards
    ? keyRewards.split(',').map((r) => r.trim()).filter(Boolean)
    : null

  const fmLines = [
    '---',
    `title: "${title.replace(/"/g, '\\"')}"`,
    author ? `author: "${author.replace(/"/g, '\\"')}"` : null,
    pubDate ? `pubDate: ${pubDate}` : null,
    description ? `description: "${description.replace(/"/g, '\\"')}"` : null,
    coverImage ? `coverImage: "${coverImage}"` : null,
    tagList?.length ? `tags: [${tagList.map((t) => `"${t}"`).join(', ')}]` : null,
    eventType ? `event_type: "${eventType.replace(/"/g, '\\"')}"` : null,
    eventDates ? `event_dates: "${eventDates.replace(/"/g, '\\"')}"` : null,
    recommendedFor ? `recommended_for: "${recommendedFor.replace(/"/g, '\\"')}"` : null,
    rewardList?.length ? `key_rewards: [${rewardList.map((r) => `"${r}"`).join(', ')}]` : null,
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
    } else if (block.type === 'callout') {
      const lines = block.text.split('\n').map((l) => `> ${l}`).join('\n')
      parts.push(`> [!${block.calloutType}]\n${lines}`)
    } else if (block.type === 'clearfloat') {
      parts.push('<div style="clear:both;"></div>')
    }
  }

  return fmLines + '\n\n' + parts.join('\n\n')
}

// Reverse of generateMdx: turn a guide body back into the form's block model.
// The first leading prose chunk becomes the intro; everything else becomes blocks.
function parseBody(body: string): { intro: string; blocks: Block[] } {
  // Split on blank lines — matches the `\n\n` join used by generateMdx. Callout
  // blockquotes have no internal blank line, so each stays a single part.
  const parts = body.trim().split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)

  let intro = ''
  const blocks: Block[] = []

  parts.forEach((part) => {
    if (part.startsWith('## ')) {
      blocks.push({ type: 'subheading', text: part.slice(3).trim() })
    } else if (part.startsWith('<div') && part.includes('clear:both')) {
      blocks.push({ type: 'clearfloat' })
    } else if (part.startsWith('<img')) {
      const src = part.match(/src="([^"]*)"/)?.[1] ?? ''
      const alt = part.match(/alt="([^"]*)"/)?.[1] ?? ''
      const alignment: 'left' | 'right' | 'full' =
        /float:\s*left/.test(part) ? 'left' : /float:\s*right/.test(part) ? 'right' : 'full'
      blocks.push({ type: 'image', src, alt, alignment })
    } else if (part.startsWith('> [!')) {
      const calloutType = (part.match(/\[!(TIP|NOTE|WARNING|IMPORTANT|F2P)\]/)?.[1] ?? 'TIP') as CalloutType
      const text = part
        .split('\n')
        .slice(1) // drop the `> [!TYPE]` marker line
        .map((l) => l.replace(/^>\s?/, ''))
        .join('\n')
        .trim()
      blocks.push({ type: 'callout', calloutType, text })
    } else {
      // Plain prose. The first one becomes the intro; the rest are paragraph blocks.
      if (!intro && blocks.length === 0) intro = part
      else blocks.push({ type: 'paragraph', text: part })
    }
  })

  return { intro, blocks }
}

export async function GET(req: NextRequest) {
  const guard = notProd()
  if (guard) return guard
  const filename = req.nextUrl.searchParams.get('filename')

  // Single-guide fetch: return full parsed content for editing in the admin form.
  if (filename) {
    const slug = filename.replace(/[^a-zA-Z0-9_.-]/g, '')
    const filePath = path.join(GUIDES_DIR, slug)
    if (!filePath.startsWith(GUIDES_DIR) || !fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 })
    }
    const raw = fs.readFileSync(filePath, 'utf8')
    const { data, content } = matter(raw)
    const { intro, blocks } = parseBody(content)
    return NextResponse.json({
      filename: slug,
      title: data.title ?? '',
      author: data.author ?? '',
      pubDate: data.pubDate ? String(data.pubDate) : '',
      description: data.description ?? '',
      coverImage: data.coverImage ?? '',
      tags: Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags ?? ''),
      eventType: data.event_type ?? '',
      eventDates: data.event_dates ?? '',
      recommendedFor: data.recommended_for ?? '',
      keyRewards: Array.isArray(data.key_rewards) ? data.key_rewards.join(', ') : (data.key_rewards ?? ''),
      intro,
      blocks,
    })
  }

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
  const guard = notProd()
  if (guard) return guard
  const body = await req.json()
  const {
    filename, title, author, pubDate, description, intro, blocks, coverImage,
    tags, eventType, eventDates, recommendedFor, keyRewards,
  } = body

  if (!filename || !title) return NextResponse.json({ error: 'filename and title are required' }, { status: 400 })

  const slug = filename.replace(/[^a-zA-Z0-9_-]/g, '')
  if (!slug) return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })

  const mdx = generateMdx({
    title, author: author ?? '', pubDate: pubDate ?? '', description: description ?? '',
    intro: intro ?? '', blocks: blocks ?? [], coverImage,
    tags, eventType, eventDates, recommendedFor, keyRewards,
  })
  fs.writeFileSync(path.join(GUIDES_DIR, slug + '.mdx'), mdx, 'utf8')

  return NextResponse.json({ success: true, filename: slug + '.mdx' })
}
