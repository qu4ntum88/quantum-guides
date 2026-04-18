'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import type { SelectProps } from "@radix-ui/react-select"

interface SelectFilterByProps {
  onValueChange: SelectProps["onValueChange"]
  defaultValue: string
  value: string
  values: { value: string; label: string }[]
}

export default function SelectFilterBy({
  onValueChange,
  defaultValue,
  value,
  values,
}: SelectFilterByProps) {
  return (
    <Select onValueChange={onValueChange} defaultValue={defaultValue} value={value}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {values.map((v) => (
          <SelectItem key={v.value} value={v.value}>
            {v.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
