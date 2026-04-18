'use client'

import { Button } from "./ui/button"
import { Label } from "./ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import type { SelectProps } from "@radix-ui/react-select"

interface SelectSortByProps {
  onValueChange: SelectProps["onValueChange"]
  values: { value: string; label: string }[]
  defaultValue: string
  value: string
  onOrderClick: () => void
  order: "asc" | "desc"
}

export default function SelectSortBy({
  onValueChange,
  values,
  defaultValue,
  value,
  onOrderClick,
  order,
}: SelectSortByProps) {
  return (
    <div className="flex flex-row gap-2">
      <Label>Sort by</Label>
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
      <Button onClick={onOrderClick}>
        {order === "asc" ? "Ascending" : "Descending"}
      </Button>
    </div>
  )
}
