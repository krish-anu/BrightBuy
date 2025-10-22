import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ArrowRight, Star, ShoppingBag } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import ProductCard from "@/components/Products/ProductCard";
import { getPopularProducts } from '@/services/product.services';

// Seed-aligned categories
const CATEGORY_ITEMS = [
  { name: "Mobiles & Tablets", emoji: "📱" },
  { name: "Laptops & Computers", emoji: "💻" },
  { name: "Audio Devices", emoji: "🎧" },
  { name: "Cameras & Photography", emoji: "📷" },
  { name: "Home Appliances", emoji: "🏠" },
  { name: "Wearables & Smart Devices", emoji: "⌚" },
  { name: "Power & Charging", emoji: "🔌" },
  { name: "Personal Care & Health", emoji: "🩺" },
  { name: "Security & Safety", emoji: "🛡️" },
  { name: "Toys & Gadgets", emoji: "🧩" },
];



// Add a flat product type that ProductCard can consume
// (removed unused CardProduct type)

export default function HomePage() {
  // Future-friendly filter (e.g., filter by category like "Mobiles & Tablets")
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const categories = useMemo(() => ["all", ...CATEGORY_ITEMS.map((c) => c.name)], []);

  const [featuredSource, setFeaturedSource] = useState<any[]>([]);

  useEffect(() => {

    const load = async () => {
      try {
        const rows = await getPopularProducts();
        console.log("Fea", rows);
        setFeaturedSource(rows);
      } catch (error) {
        console.error("Error loading popular products:", error);
      }
    };
    load();
    
  }, []);
        console.log("featuredSource", featuredSource);

  // normalize popular rows (no debug log)
  const normalized = useMemo(() => {
    return featuredSource.map((p) => ({
      // prefer variantId (unique per variant), fall back to productId or id
      id: p.variantId ?? p.productId ?? p.id,
      // prefer productName from backend, fall back to name
      name: p.productName ?? p.name,
      // Categories may come as JSON string or array under 'Categories' or 'categories'
      category: (() => {
        const raw = p.Categories ?? p.categories ?? p.Categories;
        if (!raw) return "";
        try {
          const arr = Array.isArray(raw) ? raw : JSON.parse(raw);
          return arr?.[0]?.name ?? "";
        } catch (_) {
          return Array.isArray(raw) ? raw?.[0]?.name ?? "" : "";
        }
      })(),
      // many popular endpoints return price as a top-level field
      price: Number(p.price ?? p.ProductVariants?.[0]?.price ?? 0),
      // many popular endpoints use imageURL (note casing) or ProductVariants
      imageUrl: p.imageURL ?? p.imageUrl ?? p.ProductVariants?.[0]?.imageUrl ?? "",
    }));
  }, [featuredSource]);

  const filtered = useMemo(() => {
    // show more featured items (up to 8) from the popular feed
    if (selectedFilter === "all") return normalized.slice(0, 8);
    return normalized.filter((p) => p.category === selectedFilter).slice(0, 8);
  }, [selectedFilter, normalized]);

  // Adapt products to a flat shape expected by ProductCard
  // const featuredForCard = useMemo<CardProduct[]>(
  //   () =>
  //     filtered.map((p) => ({
  //       id: p.id,
  //       name: p.name,
  //       category: p.category,
  //       price: p.ProductVariants?.[0]?.price ?? 0,
  //       imageUrl: p.ProductVariants?.[0]?.imageUrl ?? "",
  //     })),
  //   [filtered]
  // );

  return (
    <div className="min-w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-sm text-indigo-700 shadow-sm backdrop-blur">
                <ShoppingBag className="h-4 w-4" />
                BrightBuy • Your smart way to shop
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">
                Discover products you’ll love, at prices you’ll adore.
              </h1>
              <p className="text-base sm:text-lg text-gray-600 max-w-prose">
                Curated picks across electronics, home essentials, and fashion. Shop trending items and enjoy fast delivery.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/shop">
                    Shop now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/categories">Browse categories</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <Card className="overflow-hidden">
                <AspectRatio ratio={16 / 9}>
                  <img
                    src="https://images.unsplash.com/photo-1518773553398-650c184e0bb3?q=80&w=1600&auto=format&fit=crop"
                    alt="Hero"
                    className="h-full w-full object-cover"
                    loading="eager"
                  />
                </AspectRatio>
              </Card>
              <div className="pointer-events-none absolute -bottom-6 -left-6 hidden sm:block">
                <Card className="px-3 py-2 text-sm shadow-md">New arrivals daily ✨</Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products with simple filter */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-semibold">Featured products</h2>
          <Button asChild variant="ghost" className="text-indigo-700">
            <Link to="/shop">View all</Link>
          </Button>
        </div>

        <div className="mb-6">
          <div className="overflow-x-auto">
            <ToggleGroup
              type="single"
              value={selectedFilter}
              onValueChange={(v) => v && setSelectedFilter(v)}
              className="flex gap-2 whitespace-nowrap"
            >
              {categories.map((c) => (
                <ToggleGroupItem
                  key={c}
                  value={c}
                  aria-label={c}
                  className="shrink-0 rounded-full min-w-fit border border-indigo-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 data-[state=on]:bg-indigo-600 data-[state=on]:text-white data-[state=on]:border-indigo-600"
                >
                  {c}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p as any} />
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <h2 className="mb-6 text-xl sm:text-2xl font-semibold">Shop by category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {CATEGORY_ITEMS.map((c) => (
              <Link key={c.name} to={`/products?category=${encodeURIComponent(c.name)}`} className="focus:outline-none">
                <Card className="flex h-full items-center justify-center gap-2 px-4 py-6 text-center hover:shadow-md">
                  <span className="text-2xl" aria-hidden>
                    {c.emoji}
                  </span>
                  <span className="font-medium">{c.name}</span>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="mb-6 text-xl sm:text-2xl font-semibold">What our customers say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              name: "Anjana",
              quote: "Great prices and super fast delivery. My go-to store!",
            },
            {
              name: "Nuwan",
              quote: "Love the selection and the UI—shopping is a joy now.",
            },
            {
              name: "Dilani",
              quote: "Quality products and reliable service. Highly recommended!",
            },
          ].map((t, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-center gap-1 text-yellow-500" aria-label="5 stars">
                <Star className="h-4 w-4 fill-yellow-500" />
                <Star className="h-4 w-4 fill-yellow-500" />
                <Star className="h-4 w-4 fill-yellow-500" />
                <Star className="h-4 w-4 fill-yellow-500" />
                <Star className="h-4 w-4 fill-yellow-500" />
              </div>
              <p className="mt-3 text-gray-700">“{t.quote}”</p>
              <div className="mt-4 text-sm font-medium text-gray-900">— {t.name}</div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
