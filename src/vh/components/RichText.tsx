import type { StatusEffect } from './StatusEffectBox'
import StatusEffectTooltip from './StatusEffectTooltip'

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default function RichText({ text, effects }: { text: string; effects: StatusEffect[] }) {
  if (!effects.length || !text) return <>{text}</>

  const sorted = [...effects].sort((a, b) => b.name.length - a.name.length)
  const pattern = sorted.map((e) => escapeRegex(e.name)).join('|')
  // Whole words only, so "Will" doesn't light up inside "Willpower" or "Weak" inside "Weakness".
  const regex = new RegExp(`(?<![A-Za-z])(${pattern})(?![A-Za-z])`, 'g')
  const effectMap = new Map(effects.map((e) => [e.name, e]))

  const parts = text.split(regex)

  return (
    <>
      {parts.map((part, i) => {
        const effect = effectMap.get(part)
        if (effect) {
          return (
            <StatusEffectTooltip
              key={i}
              name={effect.name}
              image={effect.image}
              description={effect.description}
            />
          )
        }
        return part || null
      })}
    </>
  )
}
