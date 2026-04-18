import { getMementos } from '@/src/dcdl/lib/data'
import MementoGrid from '@/src/dcdl/components/MementosGrid'

export default function MementosPage() {
  const mementos = getMementos()

  return (
    <main>
      <section
        style={{
          backgroundImage: "url('/images/site/Quantum Purple Background.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '3rem 0',
        }}
      >
        <div className="container">
          <h1>DC: Dark Legion — Mementos</h1>
          <p style={{ color: '#cccccc' }}>
            A complete list of Mementos. Sort by rarity, collection, or availability — click to flip for description!
          </p>
        </div>
      </section>
      <section style={{ padding: '2rem 0' }}>
        <div className="container">
          <div className="flex flex-col items-center justify-start gap-12 px-4 py-4 text-white">
            <MementoGrid mementos={mementos} />
          </div>
        </div>
      </section>
    </main>
  )
}
