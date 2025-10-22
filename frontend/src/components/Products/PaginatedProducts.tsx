import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import SingleSelect from "@/components/ui/SingleSelect";
import ProductCard from "@/components/Products/ProductCard";
import { getProductsPaginatedFrontend, getBrands, getAttributes } from "@/services/product.services";
import { getAllCategories } from "@/services/category.services";
import type Product from "@/types/Product";

type CategoryOption = { id: number; name: string; parentId?: number | null };
type BrandOption = { id: number | null; name: string };
type AttrOption = { id: number; name: string };

export default function PaginatedProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [parentCategoryId, setParentCategoryId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedAttrValues, setSelectedAttrValues] = useState<Record<string, Set<string>>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [globalBrands, setGlobalBrands] = useState<BrandOption[]>([]);
  const [attributes, setAttributes] = useState<AttrOption[]>([]);

  // Sync local search state from URL (e.g., when navigating from Navbar to /shop?search=...)
  useEffect(() => {
    const s = searchParams.get('search') || '';
    // Only update if different to avoid unnecessary renders
    setSearch((prev) => (prev !== s ? s : prev));
    // Reset to first page when query changes via URL
    setPage(1);
  }, [searchParams]);

  // Load categories once
  useEffect(() => {
    (async () => {
      try {
        const res = await getAllCategories();
        const raw = Array.isArray(res?.data) ? res.data : [];
        const mapped = raw.map((c: any) => ({
          id: Number(c?.id ?? c?.categoryId),
          name: String(c?.name ?? c?.categoryName ?? ''),
          parentId: (c?.parentId == null && c?.parentID == null)
            ? null
            : Number(c?.parentId ?? c?.parentID)
        })) as CategoryOption[];
        const filtered = mapped.filter((c) => Number.isFinite(c.id) && c.name.trim().length > 0);
        // Deduplicate by id
        const seen = new Set<number>();
        const unique: CategoryOption[] = [];
        for (const c of filtered) {
          if (!seen.has(c.id)) { seen.add(c.id); unique.push(c); }
        }
        setCategories(unique);
      } catch (e) {
        console.warn("Failed to load categories", e);
      }
    })();
  }, []);

  // Load brands and attributes once
  useEffect(() => {
    (async () => {
      try {
        const [brandList, attrList] = await Promise.all([getBrands(), getAttributes()]);
        const brandOpts: BrandOption[] = (brandList || [])
          .map((b: any) => ({ id: Number.isFinite(Number(b?.id)) ? Number(b.id) : null, name: String(b?.name || "") }))
          .filter((b) => b.name.trim().length > 0)
          .sort((a, b) => a.name.localeCompare(b.name));
  setBrands(brandOpts);
  setGlobalBrands(brandOpts);

        const attrOpts: AttrOption[] = (attrList || [])
          .map((a: any) => ({ id: Number(a?.id), name: String(a?.name || "") }))
          .filter((a) => Number.isFinite(a.id) && a.name.trim().length > 0)
          .sort((a, b) => a.name.localeCompare(b.name));
        setAttributes(attrOpts);
      } catch (err) {
        console.warn("Failed to load brands/attributes", err);
      }
    })();
  }, []);

  // Fetch paginated products on filter/page changes
  useEffect(() => {
    (async () => {
    setLoading(true);
      setError(null);
      try {
  const res = await getProductsPaginatedFrontend(page, limit, categoryId ?? undefined, parentCategoryId ?? undefined, (search || '').trim() || undefined);
        let raw = res?.data || [];

        // Derive available brands for the selected category (or parent). Use the unfiltered raw results.
        try {
          const brandSet = new Set<string>();
          for (const r of raw) {
            const b = (r?.productBrand || r?.brand || '').toString().trim();
            if (b) brandSet.add(b);
          }
          const derivedBrandOpts: BrandOption[] = Array.from(brandSet)
            .sort((a, b) => a.localeCompare(b))
            .map((name) => ({ id: null, name }));
          if (categoryId || parentCategoryId) {
            // Only override brands when a category scope is applied
            // Avoid redundant state updates (which can cause loops)
            const equal = brands.length === derivedBrandOpts.length && brands.every((b, i) => b.name === derivedBrandOpts[i].name);
            if (!equal) setBrands(derivedBrandOpts);
            // prune selected brands that are no longer available
            setSelectedBrands((prev) => {
              const filtered = prev.filter((n) => brandSet.has(n));
              if (filtered.length !== prev.length) return filtered;
              // deep-equality check ignoring order
              const prevSet = new Set(prev);
              for (const n of filtered) { if (!prevSet.has(n)) return filtered; }
              return prev; // no change -> avoid re-render loop
            });
          } else {
            // No category filter -> restore global brand list
            if (globalBrands.length > 0) {
              const equal = brands.length === globalBrands.length && brands.every((b, i) => b.name === globalBrands[i].name);
              if (!equal) setBrands(globalBrands);
            }
          }
        } catch {}

        // Apply brand filter on raw rows
        if (selectedBrands.length > 0) {
          const set = new Set(selectedBrands.map((s) => s.toLowerCase()));
          raw = raw.filter((r: any) => {
            const brand = String(r.productBrand || r.brand || "").toLowerCase();
            return brand && set.has(brand);
          });
        }

        // Apply attribute filters on raw rows
        const hasAttrFilters = Object.values(selectedAttrValues).some((s) => s && s.size > 0);
        if (hasAttrFilters) {
          raw = raw.filter((r: any) => {
            let attrs: any[] = [];
            if (Array.isArray(r.attributes)) attrs = r.attributes;
            else if (typeof r.attributes === "string") {
              try { attrs = JSON.parse(r.attributes); } catch { attrs = []; }
            }
            const pairSet = new Set(attrs.map((a: any) => `${String(a?.attributeName || "")}::${String(a?.attributeValue || "")}`));
            for (const [attrName, values] of Object.entries(selectedAttrValues)) {
              if (!values || values.size === 0) continue;
              const ok = Array.from(values).some((val) => pairSet.has(`${attrName}::${val}`));
              if (!ok) return false;
            }
            return true;
          });
        }

        // Normalize backend rows (product-centric) into our Product shape expected by ProductCard
        const normalized: Product[] = raw.map((r: any) => {
          // Categories may come as JSON string or array
          let categoriesArr: any[] = [];
          const rawCats = r.Categories ?? r.categories ?? [];
          if (Array.isArray(rawCats)) categoriesArr = rawCats;
          else if (typeof rawCats === 'string') {
            try { categoriesArr = JSON.parse(rawCats); } catch { categoriesArr = []; }
          }

          // Parse attributes for representative variant if present
          let attrArr: any[] = [];
          const rawAttrs = r.attributes ?? [];
          if (Array.isArray(rawAttrs)) attrArr = rawAttrs;
          else if (typeof rawAttrs === 'string') {
            try { attrArr = JSON.parse(rawAttrs); } catch { attrArr = []; }
          }

          const firstVariant = {
            id: String(r.variantId ?? r.ProductVariants?.[0]?.id ?? ''),
            sku: String(r.SKU ?? r.ProductVariants?.[0]?.SKU ?? ''),
            price: Number(r.price ?? r.ProductVariants?.[0]?.price ?? 0),
            imageUrl: r.imageURL ?? r.imageUrl ?? r.ProductVariants?.[0]?.imageUrl,
            stockQnt: Number(r.stockQnt ?? r.ProductVariants?.[0]?.stockQnt ?? 0),
            attributes: (attrArr || []).map((a: any) => ({
              attributeID: String(a?.attributeId ?? a?.attributeID ?? ''),
              attributeName: String(a?.attributeName ?? ''),
              attributeValue: String(a?.attributeValue ?? ''),
            })) as { attributeID: string; attributeName: string; attributeValue: string }[],
          };

          const product: Product = {
            id: String(r.productId ?? r.id ?? ''),
            name: String(r.productName ?? r.name ?? ''),
            description: String(r.productDescription ?? r.description ?? ''),
            category: categoriesArr?.[0]?.name ? String(categoriesArr[0].name) : '',
            ProductVariants: [firstVariant],
          } as Product;
          return product;
        });

  // Backend now paginates by product; use normalized rows directly
  let data: Product[] = normalized;
        // Client-side price filters (search is now server-side but keep a lightweight fallback if needed)
        const min = Number(priceMin);
        const max = Number(priceMax);
        const hasMin = !isNaN(min) && priceMin !== "";
        const hasMax = !isNaN(max) && priceMax !== "";
        if (hasMin || hasMax) {
          data = data.filter((p) => {
            const price = p.ProductVariants?.[0]?.price ?? 0;
            if (hasMin && price < min) return false;
            if (hasMax && price > max) return false;
            return true;
          });
        }
        setRows(data);
        setTotalPages(res?.pagination?.totalPages || 1);
        setTotalCount(res?.pagination?.totalCount || data.length);
      } catch (e: any) {
        setError(e?.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    })();
  }, [page, limit, categoryId, parentCategoryId, search, priceMin, priceMax, selectedBrands, selectedAttrValues]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Sidebar Filters */}
        <Card className="p-4 md:col-span-3 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search products..."
              value={search}
              onChange={(e) => {
                const v = e.target.value;
                setPage(1);
                setSearch(v);
                // reflect in URL for shareable links and to keep Navbar in sync
                const next = new URLSearchParams(searchParams);
                if (v.trim()) next.set('search', v); else next.delete('search');
                setSearchParams(next, { replace: true });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <SingleSelect options={categories}
              value={categoryId ?? parentCategoryId}
              onChange={(v) => {
                setPage(1);
                const picked = categories.find(c => c.id === v);
                if (!picked) { setCategoryId(null); setParentCategoryId(null); return; }
                if (picked.parentId && picked.parentId !== 0) {
                  // child category selected
                  setCategoryId(picked.id);
                  setParentCategoryId(null);
                } else {
                  // parent selected
                  setParentCategoryId(picked.id);
                  setCategoryId(null);
                }
              }}
              placeholder="All categories" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="min">Min Price</Label>
              <Input id="min" type="number" inputMode="numeric" placeholder="0" value={priceMin} onChange={(e) => { setPage(1); setPriceMin(e.target.value); }} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max">Max Price</Label>
              <Input id="max" type="number" inputMode="numeric" placeholder="1000" value={priceMax} onChange={(e) => { setPage(1); setPriceMax(e.target.value); }} />
            </div>
          </div>
          {/* Brand list */}
          <div className="space-y-2">
            <Label>Brand</Label>
            <div className="max-h-56 overflow-auto pr-1 space-y-2">
              {brands.length === 0 ? (
                <div className="text-sm text-muted-foreground">No brands</div>
              ) : (
                brands.map((b, idx) => {
                  const id = `brand-${idx}`;
                  const checked = selectedBrands.includes(b.name);
                  return (
                    <label key={`${b.name}-${idx}`} htmlFor={id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox id={id} checked={checked} onCheckedChange={(val) => {
                        setPage(1);
                        setSelectedBrands((prev) => {
                          const set = new Set(prev);
                          const isChecked = val === true;
                          if (isChecked) set.add(b.name); else set.delete(b.name);
                          return Array.from(set);
                        });
                      }} />
                      <span className="text-sm">{b.name}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Attributes checklists */}
          <div className="space-y-3">
            <Label>Attributes</Label>
            {attributes.length === 0 ? (
              <div className="text-sm text-muted-foreground">No attributes</div>
            ) : (
              attributes.map((a) => (
                <AttributeValueChecklist
                  key={`attr-${a.id}`}
                  attrName={a.name}
                  rows={rows}
                  selectedAttrValues={selectedAttrValues}
                  setSelectedAttrValues={(updater) => {
                    setPage(1);
                    setSelectedAttrValues(updater as any);
                  }}
                />
              ))
            )}
          </div>
        </Card>

        {/* Results area */}
        <div className="md:col-span-9 space-y-4">
          {loading ? (
            <div className="p-6 text-center">Loading products...</div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">{error}</div>
          ) : rows.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">No products match your filters.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {rows.map((p, idx) => (
                <ProductCard key={`prod-${p.id ?? 'noid'}-${idx}`} product={p} />
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            {(() => {
              const start = totalCount === 0 ? 0 : (page - 1) * limit + 1;
              const end = totalCount === 0 ? 0 : (page - 1) * limit + rows.length;
              return (
                <div className="text-sm text-muted-foreground">
                  Showing {start}		{start !== end ? `– ${end}` : ''} of {totalCount} results
                  <span className="ml-2 opacity-70">(Page {page} of {totalPages})</span>
                </div>
              );
            })()}
            <div className="flex items-center gap-2">
              <Button variant="outline" disabled={!canPrev} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
              <Button variant="default" disabled={!canNext} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to render attribute values checklist derived from rows
function AttributeValueChecklist({ attrName, rows, selectedAttrValues, setSelectedAttrValues }:{ attrName: string; rows: Product[]; selectedAttrValues: Record<string, Set<string>>; setSelectedAttrValues: (updater: Record<string, Set<string>> | ((prev: Record<string, Set<string>>) => Record<string, Set<string>>)) => void }) {
  const values = Array.from(
    new Set(
      (rows || [])
        .flatMap((p: any) => (p?.ProductVariants?.[0]?.attributes || [])
          .filter((a: any) => a && a.attributeName === attrName && a.attributeValue)
          .map((a: any) => String(a.attributeValue)))
    )
  ).sort((a, b) => a.localeCompare(b));
  if (values.length === 0) return null;
  const selected = selectedAttrValues[attrName] || new Set<string>();
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium">{attrName}</div>
      <div className="max-h-40 overflow-auto pr-1 space-y-1">
        {values.map((val, idx) => {
          const id = `${attrName}-${idx}`;
          const isChecked = selected.has(val);
          return (
            <label key={`${attrName}-${val}-${idx}`} htmlFor={id} className="flex items-center gap-2 cursor-pointer">
              <Checkbox id={id} checked={isChecked} onCheckedChange={(v) => {
                setSelectedAttrValues((prev) => {
                  const copy: Record<string, Set<string>> = { ...prev };
                  const set = new Set(copy[attrName] ? Array.from(copy[attrName]) : []);
                  const isChecked = v === true;
                  if (isChecked) set.add(val); else set.delete(val);
                  copy[attrName] = set;
                  return copy;
                });
              }} />
              <span className="text-sm">{val}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
