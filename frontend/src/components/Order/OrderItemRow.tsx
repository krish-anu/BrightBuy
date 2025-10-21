export interface OrderItem {
  id: string | number| null;
  name: string;
  image: string;
  attributesText: string;
  unitPrice: number;
  quantity: number;
}

export function OrderItemRow({ item }: { item: OrderItem }) {
  return (
    <div className="grid grid-cols-10 gap-4 border rounded-md p-4 bg-background">
      <div className="md:col-span-6 col-span-10 flex gap-4">
        <div className="aspect-square w-24 h-24 shrink-0">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover rounded-md"
          />
        </div>
        <div className="flex flex-col justify-between">
          <div>
            <h2 className="font-semibold text-lg leading-snug line-clamp-2">
              {item.name}
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 text-pretty break-word whitespace-normal">
              {item.attributesText}
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col md:items-center justify-between md:col-span-2 col-span-5">
        <div>
          <p className="font-medium text-base md:text-lg">
            $ {item.unitPrice.toFixed(2)}
          </p>
          <p className="text-s text-muted-foreground">x {item.quantity}</p>
        </div>
      </div>
      <div className="flex flex-col justify-between md:col-span-2 col-span-5 text-right pr-2">
        <p className="font-bold text-base md:text-lg">
          $ {(item.unitPrice * item.quantity).toFixed(2)}
        </p>
      </div>
    </div>
  );
}
