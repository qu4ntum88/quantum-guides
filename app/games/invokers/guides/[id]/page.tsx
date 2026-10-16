import { WorldGuideArticle, worldGuideMetadata, worldGuideParams } from '@/src/qgg/components/WorldGuidePage'

// CMS guides with game = 'invokers' (written in the Site Admin or the Studio).
// Guides published after the deploy render on demand.
export const revalidate = 60

export const generateStaticParams = () => worldGuideParams('invokers')

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return worldGuideMetadata('invokers', (await params).id)
}

export default async function InvokersGuidePage({ params }: { params: Promise<{ id: string }> }) {
  return <WorldGuideArticle game="invokers" id={(await params).id} />
}
