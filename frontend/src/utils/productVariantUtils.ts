import type { Variant } from "@/types/ProductDetail";

export function getUniqueAttributes(variants: Variant[]): string[] {
  const attributeNames = new Set<string>();
  variants.forEach((variant) => {
    variant.attributes.forEach((attr) => {
      attributeNames.add(attr.attributeName);
    });
  });
  return Array.from(attributeNames);
}

export function getAttributeValues(
  attributeNames: Set<string>,
  variants: Variant[],
): Record<string, string[]> {
  const attributeValues: Record<string, Set<string>> = {};
  attributeNames.forEach((name) => {
    attributeValues[name] = new Set<string>();
    variants.forEach((variant) => {
      variant.attributes.forEach((attr) => {
        if (attr.attributeName === name) {
          attributeValues[name].add(attr.attributeValue);
        }
      });
    });
  });
  // Convert sets to arrays
  const result: Record<string, string[]> = {};
  Object.keys(attributeValues).forEach((name) => {
    result[name] = Array.from(attributeValues[name]);
  });
  return result;
}

export function findByOptions(
  variants: Variant[],
  selectedOptions: Record<string, string>,
): Variant | undefined {
  if (Object.keys(selectedOptions).length === 0) return undefined;

  for (const variant of variants) {
    const match = variant.attributes.every(
      (attr) => selectedOptions[attr.attributeName] === attr.attributeValue,
    );
    if (match) return variant;
  }
  return undefined;
}

export function getInitialOptions(variants: Variant[]): Record<string, string> {
  const initialOptions: Record<string, string> = {};
  if (variants.length > 0) {
    variants[0].attributes.forEach((attr) => {
      initialOptions[attr.attributeName] = attr.attributeValue;
    });
  }
  return initialOptions;
}

export function checkStock(variant: Variant | undefined): string {
  if (!variant) return "not-available";
  else if (variant.stockQnt > 10) return "in-stock";
  else if (variant.stockQnt > 0) return "low-stock";
  else return "out-of-stock";
}
