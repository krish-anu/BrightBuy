import type { Address } from "@/types/Address"
import { RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function AddressRow({
  address,
  onEdit,
}: {
  address: Address
  onEdit: (addr: Address) => void
}) {
  const a = address
  return (
    <div className="grid grid-cols-1 md:grid-cols-8 items-center rounded-2xl p-4 bg-muted/0 border-1 gap-4 ">
      <div className="md:col-span-6 flex flex-row items-center">
        <RadioGroupItem
          value={a.id}
          id={a.id}
          className="hover:cursor-pointer bg-background data-[state=checked]:bg-primary/50 size-5 border-primary"
        />
        <label htmlFor={a.id} className="flex flex-col md:px-6 px-4 text-left gap-0 hover:cursor-pointer">
          <span className="font-bold md:text-xl text-lg ">
            {a.name}
            <span className="font-normal text-muted-foreground pl-4 md:text-md text-sm">{a.phone}</span>
          </span>
          <p className="text-muted-foreground">{a.address}</p>
          <p className="text-muted-foreground">{a.city}</p>
          <p className="text-muted-foreground">{a.zip}</p>
          {a.isDefault && (
            <Badge variant="outline" className="col-span-2 mt-2 flex flex-col justify-between text-secondary border-secondary">
              Default
            </Badge>
          )}
        </label>
      </div>
      <div className=" md:col-span-2 flex flex-col justify-between">
        <Button
          variant="order_outline"
          size="sm"
          className="border-muted-foreground text-primary hover:text-background shadow-none "
          onClick={() => onEdit(a)}
        >
          Edit
        </Button>
      </div>
    </div>
  )
}
