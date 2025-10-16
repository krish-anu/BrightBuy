import type { Address } from "@/types/Address"
import { Field, FieldContent, FieldGroup, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"

export function AddressEditForm({
  value,
  isLastDefault,
  onChange,
  onCancel,
  onSubmit,
}: {
  value: Address
  isLastDefault: boolean
  onChange: (next: Address) => void
  onCancel: () => void
  onSubmit: () => void
}) {
  const a = value
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
              <label htmlFor="address" className="text-sm font-medium">
                Address
              </label>
              <Input id="address" value={a.address} onChange={(e) => onChange({ ...a, address: e.target.value })} />
            </FieldContent>
          </Field>
          <Field>
            <FieldContent>
              <label htmlFor="city" className="text-sm font-medium">
                City
              </label>
              <Input id="city" value={a.city} onChange={(e) => onChange({ ...a, city: e.target.value })} />
            </FieldContent>
          </Field>
          <Field>
            <FieldContent>
              <label htmlFor="zip" className="text-sm font-medium">
                ZIP
              </label>
              <Input id="zip" value={a.zip} onChange={(e) => onChange({ ...a, zip: e.target.value })} />
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
