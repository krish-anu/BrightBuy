import { OrderItemRow, type OrderItem } from "@/components/Order/OrderItemRow";

export function OrderItemsSection({ items }: { items: OrderItem[] }) {
  return (
    <section className="flex flex-col gap-4  rounded-md">
      <h2 className="text-xl md:text-2xl font-bold">Your Order</h2>
      <div className="flex flex-col gap-4">
        {items.map((it) => (
          <OrderItemRow key={it.id} item={it} />
        ))}
      </div>
    </section>
  );
}
