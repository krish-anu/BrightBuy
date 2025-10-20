import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ArrowRight, Star, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";

type Featured = { id: string; name: string; price: number; category: string; image: string };

const MOCK_FEATURED: Featured[] = [
  { id: "1", name: "Noise-Canceling Headphones", price: 12999, category: "Electronics", image: "https://images.unsplash.com/photo-1518443895914-6df75f4b2c50?q=80&w=1200&auto=format&fit=crop" },
  { id: "2", name: "Smart Watch Series X", price: 8999, category: "Electronics", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1200&auto=format&fit=crop" },
  { id: "3", name: "Minimalist Chair", price: 15999, category: "Home", image: "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=1200&auto=format&fit=crop" },
  { id: "4", name: "Running Sneakers", price: 11999, category: "Fashion", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop" },
  { id: "5", name: "Ceramic Mug Set", price: 2999, category: "Home", image: "https://images.unsplash.com/photo-1492683962492-deef9943b38f?q=80&w=1200&auto=format&fit=crop" },
  { id: "6", name: "Bluetooth Speaker", price: 6499, category: "Electronics", image: "https://images.unsplash.com/photo-1518441902110-9185f0b9f3cf?q=80&w=1200&auto=format&fit=crop" },
];

export default function HomePage() {
  // Future-friendly filter (e.g., filter by category like "Electronics")
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const categories = useMemo(() => {
    const set = new Set(MOCK_FEATURED.map((p) => p.category));
    return ["all", ...Array.from(set)];
  }, []);

  const filtered = useMemo(() => {
    if (selectedFilter === "all") return MOCK_FEATURED.slice(0, 4);
    return MOCK_FEATURED.filter((p) => p.category === selectedFilter).slice(0, 4);
  }, [selectedFilter]);

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
                  <Link to="/products">
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
            <Link to="/products">View all</Link>
          </Button>
        </div>

        <div className="mb-6">
          <ToggleGroup type="single" value={selectedFilter} onValueChange={(v) => v && setSelectedFilter(v)} className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <ToggleGroupItem key={c} value={c} className="data-[state=on]:bg-indigo-600 data-[state=on]:text-white">
                {c}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <Card key={p.id} className="group overflow-hidden">
              <AspectRatio ratio={4 / 3}>
                <img src={p.image} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
              </AspectRatio>
              <div className="p-4">
                <div className="text-xs text-gray-500">{p.category}</div>
                <div className="mt-1 line-clamp-2 font-medium text-gray-900">{p.name}</div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-indigo-700 font-semibold">Rs. {(p.price).toLocaleString()}</div>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/product/${p.id}`}>View</Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <h2 className="mb-6 text-xl sm:text-2xl font-semibold">Shop by category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: "Electronics", emoji: "📱" },
              { name: "Home", emoji: "🏠" },
              { name: "Fashion", emoji: "👗" },
              { name: "Beauty", emoji: "💄" },
              { name: "Sports", emoji: "🏃" },
              { name: "Gadgets", emoji: "🔌" },
            ].map((c) => (
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
