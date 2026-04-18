'use client'

import { Input } from "./ui/input"

interface SearchBarProps {
  placeholder?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function SearchBar({ placeholder, onChange }: SearchBarProps) {
  return (
    <Input
      type="text"
      placeholder={placeholder}
      onChange={onChange}
      className="max-w-4xl rounded bg-slate-900/20"
    />
  )
}
