import { OrderItemRow, type OrderItem } from "./OrderItemRow";

export function OrderItemsSection({ items }: { items: OrderItem[] }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl md:text-2xl font-bold">Your Order</h2>
      <div className="flex flex-col gap-4">
        {items.map((it) => (
          <OrderItemRow key={it.id} item={it} />
        ))}
      </div>
    </section>
  );
}
