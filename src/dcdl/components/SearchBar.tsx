'use client'

import { Input } from "./ui/input"

interface SearchBarProps {
  placeholder?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  style?: React.CSSProperties
}

export default function SearchBar({ placeholder, onChange, style }: SearchBarProps) {
  return (
    <Input
      type="text"
      placeholder={placeholder}
      onChange={onChange}
      style={style}
      className="max-w-4xl rounded bg-slate-900/20"
    />
  )
}
