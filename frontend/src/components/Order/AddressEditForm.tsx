import type { Address } from "@/types/Address"
import type { City } from "@/services/city.services"
import { Field, FieldContent, FieldGroup, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function AddressEditForm({
  value,
  isLastDefault,
  cities = [],
  onChange,
  onCancel,
  onSubmit,
}: {
  value: Address
  isLastDefault: boolean
  cities?: City[]
  onChange: (next: Address) => void
  onCancel: () => void
  onSubmit: () => void
}) {
  const a = value
  const [line1, setLine1] = useState("")
  const [line2, setLine2] = useState("")

  useEffect(() => {
    if (!a?.address) {
      setLine1("")
      setLine2("")
      return
    }
    const parts = String(a.address).split(",").map((p) => p.trim()).filter(Boolean)
    setLine1(parts[0] || "")
    setLine2(parts.slice(1).join(", ") || "")
  }, [a?.address])

  const commitAddressChange = (newPartial: Partial<Address> = {}) => {
    const combinedAddress = [newPartial.address ?? `${line1}${line2 ? `, ${line2}` : ""}`].filter(Boolean)[0]
    onChange({ ...a, ...newPartial, address: combinedAddress })
  }
  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <FieldSet>
        <FieldGroup>
          <Field>
            <FieldContent>
              <label htmlFor="name" className="text-sm font-medium">
                Full Name
              </label>
              <Input id="name" value={a.name} onChange={(e) => onChange({ ...a, name: e.target.value })} />
            </FieldContent>
          </Field>
          <Field>
            <FieldContent>
              <label htmlFor="phone" className="text-sm font-medium">
                Phone
              </label>
              <Input id="phone" value={a.phone} onChange={(e) => onChange({ ...a, phone: e.target.value })} />
            </FieldContent>
          </Field>
          <Field>
            <FieldContent>
              <label htmlFor="address-line1" className="text-sm font-medium">
                Address Line 1
              </label>
              <Input
                id="address-line1"
                value={line1}
                onChange={(e) => {
                  const v = e.target.value
                  setLine1(v)
                  // pass the new combined address so we don't rely on state which updates asynchronously
                  commitAddressChange({ address: `${v}${line2 ? `, ${line2}` : ""}` })
                }}
              />

              <label htmlFor="address-line2" className="text-sm font-medium mt-2 block">
                Address Line 2
              </label>
              <Input
                id="address-line2"
                value={line2}
                onChange={(e) => {
                  const v = e.target.value
                  setLine2(v)
                  // include the updated line2 when committing
                  commitAddressChange({ address: `${line1}${v ? `, ${v}` : ""}` })
                }}
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldContent>
              <label htmlFor="city" className="text-sm font-medium">
                City
              </label>
              {cities.length ? (
                <select
                  id="city"
                  className="mt-1 block w-full border rounded p-2 bg-background"
                  value={a.cityId ?? ""}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : undefined
                    const name = id ? cities.find((c) => c.id === id)?.name || "" : ""
                    commitAddressChange({ city: name, cityId: id })
                  }}
                >
                  <option value="">Select a city</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <Input id="city" value={a.city} onChange={(e) => commitAddressChange({ city: e.target.value })} />
              )}
            </FieldContent>
          </Field>
          <Field>
            <FieldContent>
              <label htmlFor="zip" className="text-sm font-medium">
                ZIP
              </label>
              <Input id="zip" value={a.zip} onChange={(e) => commitAddressChange({ zip: e.target.value })} />
            </FieldContent>
          </Field>
          <Field>
            <FieldContent>
              <label htmlFor="set-default" className="text-sm font-medium">
                Set as Default Address
              </label>
              <Switch
                id="set-default"
                checked={a.isDefault || false}
                disabled={isLastDefault}
                onCheckedChange={(checked: boolean) => {
                  if (!checked && isLastDefault) return
                  onChange({ ...a, isDefault: checked })
                }}
              >
                <span className="sr-only">Toggle default address</span>
              </Switch>
              {isLastDefault && (
                <p className="text-xs text-muted-foreground mt-1">
                  At least one default address is required. Set another address as default first.
                </p>
              )}
            </FieldContent>
          </Field>
          <Field orientation="horizontal">
            <Button type="button" variant="order_outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="order" className="bg-primary">
              Submit
            </Button>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  )
}
