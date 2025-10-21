import type { Address } from "@/types/Address"
import { RadioGroup } from "@/components/ui/radio-group"
import { AddressRow } from "./AddressRow"

export function AddressList({
  addresses,
  value,
  onChange,
  onEdit,
}: {
  addresses: Address[]
  value: string
  onChange: (val: string) => void
  onEdit: (addr: Address) => void
}) {
  return (
    <div className="max-h-[350px] overflow-y-auto">
      <RadioGroup className="flex flex-col gap-4 mt-4" value={value} onValueChange={onChange}>
        {addresses.map((a) => (
          <AddressRow key={a.id} address={a} onEdit={onEdit} />
        ))}
      </RadioGroup>
    </div>
  )
}
