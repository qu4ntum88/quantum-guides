import { WorldGuideArticle, worldGuideMetadata, worldGuideParams } from '@/src/qgg/components/WorldGuidePage'

// CMS guides with game = 'godforge' (written in the Site Admin or the Studio).
// Guides published after the deploy render on demand.
export const revalidate = 60

export const generateStaticParams = () => worldGuideParams('godforge')

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return worldGuideMetadata('godforge', (await params).id)
}

export default async function GodforgeGuidePage({ params }: { params: Promise<{ id: string }> }) {
  return <WorldGuideArticle game="godforge" id={(await params).id} />
}
