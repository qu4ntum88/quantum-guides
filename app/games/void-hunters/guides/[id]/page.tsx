import { WorldGuideArticle, worldGuideMetadata, worldGuideParams } from '@/src/qgg/components/WorldGuidePage'

// CMS guides with game = 'voidhunters' (written in the Site Admin or the Studio).
// Guides published after the deploy render on demand.
export const revalidate = 60

export const generateStaticParams = () => worldGuideParams('voidhunters')

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return worldGuideMetadata('voidhunters', (await params).id)
}

export default async function VoidHuntersGuidePage({ params }: { params: Promise<{ id: string }> }) {
  return <WorldGuideArticle game="voidhunters" id={(await params).id} />
}
