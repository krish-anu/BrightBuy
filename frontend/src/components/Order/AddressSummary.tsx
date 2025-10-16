import type { Address } from "@/types/Address"

export function AddressSummary({ address }: { address: Address | undefined }) {
  if (!address) return null
  return (
    <div className="min-h-fit w-full flex flex-col md:text-lg text-md text-foreground">
      <span className="font-bold md:text-xl text-lg pb-2">
        {address.name}
        <span className="font-normal text-muted-foreground pl-4 md:text-lg text-md"> {address.phone} </span>
      </span>
      <p className="text-muted-foreground">{address.address}</p>
      <p className="text-muted-foreground">{address.city}</p>
      <p className="text-muted-foreground">{address.zip}</p>
    </div>
  )
}
