import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CircleArrowRightIcon } from "lucide-react";

interface OrderSummaryCardProps {
  subtotal: number;
  shipping: number;
  // discount?: number;
  total: number;
  onNext: () => void;
  nextLabel?: string;
  className?: string;
  showShippingRow?: boolean;
}

export function OrderSummaryCard({
  subtotal,
  shipping,
  // discount,
  total,
  onNext,
  nextLabel = "Next",
  className,
  showShippingRow = true,
}: OrderSummaryCardProps) {
  const row = (label: string, value: number, bold?: boolean) => (
    <div className="flex justify-between w-full">
      <span
        className={`text-sm md:text-base ${bold ? "font-semibold" : "text-muted-foreground"}`}
      >
        {label}
      </span>
      <span
        className={`text-sm md:text-base ${bold ? "font-bold" : "text-foreground"}`}
      >
        $ {value.toFixed(2)}
      </span>
    </div>
  );
  return (
    <aside
      className={`flex flex-col  gap-3 bg-accent rounded-md p-5 shadow-sm max-h-fit ${
        className || ""
      }`}
    >
      <h2 className="text-xl font-bold">Order Summary</h2>
      {row("Subtotal", subtotal)}
    {showShippingRow ? row("Shipping", shipping) : null}
  {/* {typeof discount === "number" ? row("Discount", discount) : null} */}
      <Separator />
      {row("Total", total, true)}
      <Button variant="order" onClick={onNext} className="mt-2 font-semibold gap-2 w-full md:w-auto h-12 text-xl">
        {nextLabel} <CircleArrowRightIcon size={32} />
      </Button>
    </aside>
  );
}
