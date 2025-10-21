import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ArrowRight, Star, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import ProductCard from "@/components/Products/ProductCard";

type FeaturedProduct = {
  id: string;
  name: string;
  category: string;
  ProductVariants: { price: number; imageUrl: string }[];
};

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

// Seed-aligned featured products (names, categories, prices, image URLs)
const MOCK_FEATURED: FeaturedProduct[] = [
  {
    id: "1",
    name: "Galaxy S25 Ultra",
    category: "Mobiles & Tablets",
    ProductVariants: [{ price: 1299.99, imageUrl: "https://brightbuy.s3.ap-south-1.amazonaws.com/variant/1/1760940242661_siad2d.webp" }],
  },
  {
    id: "2",
    name: "iPhone 17 Pro",
    category: "Mobiles & Tablets",
    ProductVariants: [{ price: 1199.99, imageUrl: "https://brightbuy.s3.ap-south-1.amazonaws.com/variant/2/1760940489537_bjbgli.webp" }],
  },
  {
    id: "5",
    name: 'MacBook Air M3 15"',
    category: "Laptops & Computers",
    ProductVariants: [{ price: 1299.99, imageUrl: "https://brightbuy.s3.ap-south-1.amazonaws.com/variant/5/1760940821857_gg3h4m.jpg" }],
  },
  {
    id: "9",
    name: "Sony WH-1000XM6",
    category: "Audio Devices",
    ProductVariants: [{ price: 399.99, imageUrl: "https://brightbuy.s3.ap-south-1.amazonaws.com/variant/9/1760941493798_g662u6.webp" }],
  },
  {
    id: "10",
    name: "AirPods Pro 3",
    category: "Audio Devices",
    ProductVariants: [{ price: 299.99, imageUrl: "https://brightbuy.s3.ap-south-1.amazonaws.com/variant/10/1760941633317_qt1eku.jpg" }],
  },
  {
    id: "13",
    name: "Sony A7R V",
    category: "Cameras & Photography",
    ProductVariants: [{ price: 3499.99, imageUrl: "https://brightbuy.s3.ap-south-1.amazonaws.com/variant/13/1760941478026_kriqd7.webp" }],
  },
  {
    id: "21",
    name: "Apple Watch Series 10",
    category: "Wearables & Smart Devices",
    ProductVariants: [{ price: 399.99, imageUrl: "https://brightbuy.s3.ap-south-1.amazonaws.com/variant/21/1760881042787_erevfv.webp" }],
  },
  {
    id: "25",
    name: "Anker 737 Power Bank",
    category: "Power & Charging",
    ProductVariants: [{ price: 119.99, imageUrl: "https://brightbuy.s3.ap-south-1.amazonaws.com/variant/29/1760939513076_489ne7.webp" }],
  },
  {
    id: "29",
    name: "Philips Series 9000",
    category: "Personal Care & Health",
    ProductVariants: [{ price: 299.99, imageUrl: "https://brightbuy.s3.ap-south-1.amazonaws.com/variant/37/1760941186269_kx3sxo.jpg" }],
  },
  {
    id: "34",
    name: "Ring Spotlight Cam",
    category: "Security & Safety",
    ProductVariants: [{ price: 199.99, imageUrl: "https://brightbuy.s3.ap-south-1.amazonaws.com/variant/50/1760941284778_7uenw8.jpg" }],
  },
  {
    id: "37",
    name: "Sphero Mini",
    category: "Toys & Gadgets",
    ProductVariants: [{ price: 49.99, imageUrl: "https://brightbuy.s3.ap-south-1.amazonaws.com/variant/59/1760941515433_4ywtgz.webp" }],
  },
];

// Add a flat product type that ProductCard can consume
type CardProduct = Omit<FeaturedProduct, "ProductVariants"> & {
  price: number;
  imageUrl: string;
};

export default function HomePage() {
  // Future-friendly filter (e.g., filter by category like "Mobiles & Tablets")
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const categories = useMemo(() => ["all", ...CATEGORY_ITEMS.map((c) => c.name)], []);

  const filtered = useMemo(() => {
    if (selectedFilter === "all") return MOCK_FEATURED.slice(0, 4);
    return MOCK_FEATURED.filter((p) => p.category === selectedFilter).slice(0, 4);
  }, [selectedFilter]);

  // Adapt products to a flat shape expected by ProductCard
  const featuredForCard = useMemo<CardProduct[]>(
    () =>
      filtered.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.ProductVariants?.[0]?.price ?? 0,
        imageUrl: p.ProductVariants?.[0]?.imageUrl ?? "",
      })),
    [filtered]
  );

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
          {featuredForCard.map((p) => (
            <ProductCard key={p.id} product={p} />
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
