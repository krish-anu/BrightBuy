import { Link } from "react-router-dom";
import { Package, ShieldCheck, Truck, Store, CreditCard, Smartphone } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-white">
      {/* Hero Section */}
      <div className="bg-primary text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-5xl font-bold mb-4">About BrightBuy</h1>
          <p className="text-xl text-primary/30 max-w-2xl">
            Your trusted partner for consumer electronics and toys across Texas
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Story Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 text-foreground">Our Story</h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-4">
            Founded in the heart of Texas, BrightBuy started as a small retail chain with a big vision: 
            to make quality electronics and toys accessible to every Texan family. What began as a handful 
            of physical stores has now evolved into a comprehensive online platform, bringing our 
            carefully curated selection directly to your doorstep.
          </p>
          <p className="text-muted-foreground text-lg leading-relaxed">
            We understand that online shopping needs to be more than just convenient—it needs to be 
            reliable. That's why we've built our platform from the ground up with real-time inventory 
            tracking, transparent pricing, and a commitment to delivering exactly what you order, 
            when you need it.
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-start gap-4 mb-4">
            <ShieldCheck className="w-10 h-10 text-primary flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-3xl font-bold mb-4 text-foreground">Our Mission</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                To provide a trustworthy online shopping experience with accurate inventory, fair pricing, 
                and dependable delivery across Texas. We prioritize inventory reliability and smooth order 
                processing so our customers can rely on BrightBuy for both everyday essentials and special 
                purchases. Every product listed on our site is backed by real warehouse stock—no 
                overselling, no surprises.
              </p>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <Smartphone className="w-10 h-10 text-primary flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-3xl font-bold text-foreground">What We Sell</h2>
            </div>
          </div>
          <p className="text-muted-foreground text-lg leading-relaxed mb-6">
            Our carefully curated catalogue spans two core categories, each selected for quality 
            and value:
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-primary/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-foreground mb-3">Consumer Electronics</h3>
              <p className="text-muted-foreground">
                From the latest smartphones and tablets to premium audio devices, smartwatches, 
                and essential accessories. Each product features multiple variants—different colors, 
                storage capacities, or specifications—so you can find exactly what fits your lifestyle.
              </p>
            </div>
            <div className="bg-primary/5 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-foreground mb-3">Toys & Games</h3>
              <p className="text-muted-foreground">
                A thoughtfully selected range of toys for all ages, from educational games to 
                entertainment favorites. We focus on quality brands that bring joy while standing 
                the test of time.
              </p>
            </div>
          </div>
        </div>

        {/* How We Work Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold mb-8 text-foreground">How We Work</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex flex-col items-start">
              <div className="bg-primary/10 rounded-full p-3 mb-4">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Smart Inventory</h3>
              <p className="text-muted-foreground">
                Central warehouse stock managed with unique SKUs and variant-level quantities. 
                Every item is tracked in real-time to ensure accuracy.
              </p>
            </div>

            <div className="flex flex-col items-start">
              <div className="bg-primary/10 rounded-full p-3 mb-4">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Secure Checkout</h3>
              <p className="text-muted-foreground">
                Only registered customers can complete checkout and place orders. Your account 
                keeps your information safe and order history organized.
              </p>
            </div>

            <div className="flex flex-col items-start">
              <div className="bg-primary/10 rounded-full p-3 mb-4">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Atomic Operations</h3>
              <p className="text-muted-foreground">
                Inventory is validated and decremented atomically at checkout to prevent 
                overselling and ensure stock accuracy.
              </p>
            </div>

            <div className="flex flex-col items-start">
              <div className="bg-primary/10 rounded-full p-3 mb-4">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Flexible Delivery</h3>
              <p className="text-muted-foreground">
                Choose between Standard Delivery to your doorstep or Store Pickup for 
                convenient collection at your nearest location.
              </p>
            </div>

            <div className="flex flex-col items-start">
              <div className="bg-primary/10 rounded-full p-3 mb-4">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Payment Options</h3>
              <p className="text-muted-foreground">
                Pay securely with your card online or choose Cash on Delivery for added 
                convenience and peace of mind.
              </p>
            </div>

            <div className="flex flex-col items-start">
              <div className="bg-primary/10 rounded-full p-3 mb-4">
                <Store className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Texas-Wide Service</h3>
              <p className="text-muted-foreground">
                Proudly serving customers across the Lone Star State with reliable shipping 
                and multiple pickup locations.
              </p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 text-foreground">Our Commitment</h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">100%</div>
              <div className="text-foreground font-medium">Accurate Inventory</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-foreground font-medium">Online Shopping</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">Texas</div>
              <div className="text-foreground font-medium">Local Expertise</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Ready to Shop?</h2>
          <p className="text-muted-foreground mb-6">
            Explore our collection and experience the BrightBuy difference today.
          </p>
          <Link
            to="/shop"
            className="inline-block bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:opacity-95 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}