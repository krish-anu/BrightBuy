import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

export default function Footer() {
  return (
    <footer className="bg-foreground mt-10 text-muted shadow-2xl">
      <div className="max-w-7xl grid md:grid-cols-4 sm:grid-cols-2 items-start mx-auto px-4 gap-8 py-10">
        <div>
          <span className="text-2xl font-bold text-secondary">BrightBuy</span>
          <p className="text-md mt-2">
            Your one-stop shop for electronics and home essentials.
          </p>
        </div>
        <div>
          <span className="text-lg font-medium">Quick Links</span>
          <ul className="mt-2 space-y-1">
            <li>
              <Link
                to="/"
                className="text-muted-foreground hover:text-background"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/about"
                className="text-muted-foreground hover:text-background"
              >
                About Us
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <span className="text-lg font-medium">Contact Us</span>
          <ul className="mt-2 space-y-1">
            <li>
              <span className="text-background">+1 (555) 123-4567</span>
            </li>
            <li>
              <span className="text-background">support@brightbuy.com</span>
            </li>
          </ul>
        </div>
        <div>
          <span className="text-lg font-medium">Social Media</span>
          <ul className="mt-2 space-y-1">
            <li>
              <Link
                to="/social/facebook"
                className="text-muted-foreground hover:text-background"
              >
                Facebook
              </Link>
            </li>
            <li>
              <Link
                to="/social/twitter"
                className="text-muted-foreground hover:text-background"
              >
                Twitter
              </Link>
            </li>
            <li>
              <Link
                to="/social/instagram"
                className="text-muted-foreground hover:text-background"
              >
                Instagram
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <Separator className="bg-muted-foreground/20" />
      <div className="text-center text-sm text-muted-foreground py-4">
        <p>© 2025 BrightBuy. All rights reserved.</p>
      </div>
    </footer>
  );
}
