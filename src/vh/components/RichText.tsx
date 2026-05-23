import type { StatusEffect } from './StatusEffectBox'
import StatusEffectTooltip from './StatusEffectTooltip'

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default function RichText({ text, effects }: { text: string; effects: StatusEffect[] }) {
  if (!effects.length || !text) return <>{text}</>

  const sorted = [...effects].sort((a, b) => b.name.length - a.name.length)
  const pattern = sorted.map((e) => escapeRegex(e.name)).join('|')
  const regex = new RegExp(`(${pattern})`, 'g')
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
