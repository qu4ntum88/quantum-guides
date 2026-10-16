import TakeBody from '@/src/dcdl/components/TakeBody'
import { getUnitNote, type NotesGame } from '../notes'

/** "Quantum's Take" card on a Godforge / Invokers / Void Hunters unit page. Renders nothing until there is a take or a flag. */
export default function QuantumTake({ game, id }: { game: NotesGame; id: string }) {
  const note = getUnitNote(game, id)
  if (!note.take && !note.p2w && !note.isNew) return null
  return (
    <section className="w-card w-take" style={{ '--gold': 'var(--w-accent)' } as React.CSSProperties}>
      <h2>
        Quantum&apos;s Take
        {note.isNew && <span className="w-flag w-flag--new">New</span>}
        {note.p2w && <span className="w-flag w-flag--p2w">P2W</span>}
      </h2>
      {note.p2w && <p className="w-muted">Pay to win: realistically needs spending to get or build.</p>}
      {note.take && <TakeBody text={note.take} />}
    </section>
  )
}
