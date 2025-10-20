import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SingleSelect from "@/components/ui/SingleSelect";
import ProductCard from "@/components/Products/ProductCard";
import { getProductsPaginatedFrontend } from "@/services/product.services";
import { getAllCategories } from "@/services/category.services";
import type Product from "@/types/Product";

type CategoryOption = { id: number; name: string };

export default function PaginatedProducts() {
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [categories, setCategories] = useState<CategoryOption[]>([]);

  // Load categories once
  useEffect(() => {
    (async () => {
      try {
        const res = await getAllCategories();
        const raw = Array.isArray(res?.data) ? res.data : [];
        const mapped = raw.map((c: any) => ({
          id: Number(c?.id ?? c?.categoryId),
          name: String(c?.name ?? c?.categoryName ?? ''),
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

  // Fetch paginated products on filter/page changes
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
  const res = await getProductsPaginatedFrontend(page, limit, categoryId ?? undefined);
        const raw = res?.data || [];

        // Normalize backend rows (variant-centric) into our Product shape expected by ProductCard
        const normalized: Product[] = raw.map((r: any) => {
          // Categories may come as JSON string or array
          let categoriesArr: any[] = [];
          const rawCats = r.Categories ?? r.categories ?? [];
          if (Array.isArray(rawCats)) categoriesArr = rawCats;
          else if (typeof rawCats === 'string') {
            try { categoriesArr = JSON.parse(rawCats); } catch { categoriesArr = []; }
          }

          const firstVariant = {
            id: String(r.variantId ?? r.ProductVariants?.[0]?.id ?? ''),
            sku: String(r.SKU ?? r.ProductVariants?.[0]?.SKU ?? ''),
            price: Number(r.price ?? r.ProductVariants?.[0]?.price ?? 0),
            imageUrl: r.imageURL ?? r.imageUrl ?? r.ProductVariants?.[0]?.imageUrl,
            stockQnt: Number(r.stockQnt ?? r.ProductVariants?.[0]?.stockQnt ?? 0),
            attributes: [] as { attributeID: string; attributeName: string; attributeValue: string }[],
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
        // Client-side search & price filters
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          data = data.filter((p) => p.name.toLowerCase().includes(q));
        }
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
  }, [page, limit, categoryId, search, priceMin, priceMax]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input id="search" placeholder="Search products..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <SingleSelect options={categories} value={categoryId} onChange={(v) => { setPage(1); setCategoryId(v); }} placeholder="All categories" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="min">Min Price</Label>
            <Input id="min" type="number" inputMode="numeric" placeholder="0" value={priceMin} onChange={(e) => { setPage(1); setPriceMin(e.target.value); }} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max">Max Price</Label>
            <Input id="max" type="number" inputMode="numeric" placeholder="1000" value={priceMax} onChange={(e) => { setPage(1); setPriceMax(e.target.value); }} />
          </div>
        </div>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="p-6 text-center">Loading products...</div>
      ) : error ? (
        <div className="p-6 text-center text-red-600">{error}</div>
      ) : rows.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground">No products match your filters.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {rows.map((p, idx) => (
            <ProductCard key={`prod-${p.id ?? 'noid'}-${idx}`} product={p} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-sm text-muted-foreground">Page {page} of {totalPages} • {totalCount} results</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={!canPrev} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
          <Button variant="default" disabled={!canNext} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}
