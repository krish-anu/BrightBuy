import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export type BillItem = {
  id: string | number | null;
  name: string;
  unitPrice: number;
  quantity: number;
};

function money(n: number) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
  } catch {
    return `$ ${n.toFixed(2)}`;
  }
}

export function BillSummary({
  title = "Order Summary",
  items,
  shippingMethod,
  paymentMethod,
  deliveryAddressText,
  paymentStatus,
  subtotal,
  shipping,
  discount,
  total,
  onNext,
  nextLabel,
}: {
  title?: string;
  items: BillItem[];
  shippingMethod: string;
  paymentMethod: string;
  deliveryAddressText?: string;
  paymentStatus?: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  onNext?: () => void;
  nextLabel?: string;
}) {
  const statusTone = (paymentStatus || "").toLowerCase().includes("paid")
    ? "success"
    : (paymentStatus || "").toLowerCase().includes("due") || (paymentStatus || "").toLowerCase().includes("pending")
    ? "warning"
    : undefined;
  const statusClass = statusTone === "success"
    ? "bg-green-100 text-green-700 border-green-200"
    : statusTone === "warning"
    ? "bg-yellow-100 text-yellow-800 border-yellow-200"
    : "bg-muted text-foreground/80 border-muted";
  return (
    <div className="w-full bg-background border rounded-md shadow-sm p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">Please review your order details before proceeding.</p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <div>{new Date().toLocaleDateString()}</div>
        </div>
      </div>

      <Separator />

      {/* Items table */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border rounded-md overflow-hidden">
            <thead>
              <tr className="text-muted-foreground border-b bg-muted/40">
                <th className="text-left py-2 px-3">Product</th>
                <th className="text-right py-2 px-3">Qty</th>
                <th className="text-right py-2 px-3">Unit</th>
                <th className="text-right py-2 px-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={`${it.id}`} className={`border-b last:border-b-0 ${idx % 2 === 1 ? 'bg-muted/10' : ''}`}>
                  <td className="py-3 px-3 pr-2 break-words">{it.name}</td>
                  <td className="py-3 px-3 text-right">{it.quantity}</td>
                  <td className="py-3 px-3 text-right">{money(it.unitPrice)}</td>
                  <td className="py-3 px-3 text-right font-medium">{money(it.unitPrice * it.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Meta */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Shipping Method</h3>
          <p className="text-sm text-muted-foreground capitalize">{shippingMethod}</p>
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Payment Method</h3>
          <p className="text-sm text-muted-foreground uppercase">{paymentMethod}</p>
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Delivery Address</h3>
          <p className="text-sm text-muted-foreground">
            {shippingMethod?.toLowerCase() !== "standard" ? (
              <>Store Pickup</>
            ) : deliveryAddressText ? (
              <>{deliveryAddressText}</>
            ) : (
              <>Not selected</>
            )}
          </p>
        </div>
        {paymentStatus ? (
          <div className="space-y-1 md:col-span-3">
            <h3 className="text-sm font-semibold">Payment Status</h3>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-medium ${statusClass}`}>
              {paymentStatus}
            </span>
          </div>
        ) : null}
      </div>

      <Separator />

      {/* Totals */}
      <div className="w-full md:w-1/2 ml-auto space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{money(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span>{money(shipping)}</span>
        </div>
        {/* <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Discount</span>
          <span>{money(discount)}</span>
        </div> */}
        <Separator className="my-2" />
        <div className="flex justify-between text-base font-bold">
          <span>Total</span>
          <span>{money(total)}</span>
        </div>
      </div>

      {/* Action */}
      {onNext && nextLabel ? (
        <div className="flex justify-end">
          <Button className="h-12 text-lg" onClick={onNext}>{nextLabel}</Button>
        </div>
      ) : null}
    </div>
  );
}
