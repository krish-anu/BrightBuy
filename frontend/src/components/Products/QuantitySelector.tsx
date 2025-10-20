import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCallback, useMemo, useState } from "react";

type QuantitySelectorProps = {
  value?: number; // controlled value
  defaultValue?: number; // uncontrolled initial value
  min?: number; // minimum allowed, default 1
  max?: number; // maximum allowed (e.g., available stock)
  disabled?: boolean;
  onChange?: (qty: number) => void; // emits clamped value to parent
  className?: string;
};

export default function QuantitySelector({
  value,
  defaultValue = 1,
  min = 1,
  max,
  disabled = false,
  onChange,
  className,
}: QuantitySelectorProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<number>(defaultValue);
  const current = isControlled ? (value as number) : internal;

  const effectiveMax = useMemo(() => {
    if (typeof max !== "number") return Number.POSITIVE_INFINITY;
    // Ensure max isn't below min; if it is, treat as disabled by clamping at min and disabling inc/input
    return Math.max(min, max);
  }, [max, min]);

  const clamp = useCallback(
    (n: number) => Math.max(min, Math.min(n, effectiveMax)),
    [min, effectiveMax]
  );

  const emit = useCallback(
    (n: number) => {
      const clamped = clamp(Number.isFinite(n) ? n : min);
      onChange?.(clamped);
      if (!isControlled) setInternal(clamped);
    },
    [clamp, isControlled, onChange, min]
  );

  const dec = () => emit(current - 1);
  const inc = () => emit(current + 1);
  const onInput = (raw: string) => {
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) {
      // if cleared or invalid, don't update parent yet; keep at min locally when uncontrolled
      if (!isControlled) setInternal(min);
      return;
    }
    emit(parsed);
  };

  const reachedMin = current <= min;
  const reachedMax = current >= effectiveMax;
  const actuallyDisabled = disabled || effectiveMax < min || effectiveMax === 0;

  return (
    <div className={`flex items-center space-x-2 ${className || ""}`}>
      <Button
        variant="outline"
        onClick={dec}
        disabled={actuallyDisabled || reachedMin}
        aria-label="Decrease quantity"
      >
        -
      </Button>
      <Input
        type="number"
        inputMode="numeric"
        min={min}
        max={Number.isFinite(effectiveMax) ? effectiveMax : undefined}
        value={current}
        onChange={(e) => onInput(e.target.value)}
        className="w-20 text-center"
        disabled={actuallyDisabled}
        aria-label="Quantity"
        
      />
      <Button
        variant="outline"
        onClick={inc}
        disabled={actuallyDisabled || reachedMax}
        aria-label="Increase quantity"
      >
        +
      </Button>
    </div>
  );
}
