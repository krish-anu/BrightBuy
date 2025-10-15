import { Input } from "@/components/ui/input";
import { ShoppingCart, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "../../../contexts/AuthContext";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="bg-accent/40 backdrop-blur-xs border-b border-b-accent-foreground/20 sticky top-0 z-50 shadow-lg/20">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-4 h-16 items-center">
        {/* Logo */}
  return (
    <div className="bg-accent/40 backdrop-blur-xs border-b border-b-accent-foreground/20 sticky top-0 z-50 shadow-lg/20">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-4 h-16 items-center">
        <div className="col-span-2 md:col-span-1">
          <Link to="/">
            <span className="text-2xl md:text-3xl font-bold text-primary m-4 md:px-8">
              BrightBuy
            </span>
          </Link>
        </div>
        {/* Search bar hidden on small screens, visible on md+ */}
        <div className="md:col-span-2 hidden md:flex items-center ">
          <Input
            type="text"
            placeholder="Search Products here..."
            className="h-10 rounded-l-md rounded-r-none border-r-0  focus-visible:ring-0 "
          />
          <Button
            type="submit"
            className="h-10 rounded-l-none rounded-r-md px-3 bg-ring "
          >
            <Search className="h-5 w-5 text-accent" />
          </Button>
        </div>
        <div className="ml-auto flex flex-row items-center space-x-4 col-span-2 md:col-span-1 sm:justify-end">
          <Link
            to="/cart"
            className="flex items-center gap-2 text-muted-foreground hover:text-accent-foreground"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="hidden md:block text-lg font-medium">Cart</span>
          </Link>
          <Separator orientation="vertical" />
          <Link
            to="/login"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <User className="h-5 w-5" />
            <span className="hidden md:block text-lg font-medium">Login</span>
          </Link>
        </div>
      </div>

      {/* search bar for small screens */}
      <div className="flex md:hidden max-w-7xl mx-auto px-4 pb-2">
        <Input
          type="text"
          placeholder="Search Products here..."
          className="h-10 rounded-l-md rounded-r-none border-r-0 focus-visible:ring-0 flex-1"
        />
        <Button
          type="submit"
          className="h-10 rounded-l-none rounded-r-md px-3 bg-ring "
        >
          <Search className="h-5 w-5 text-accent" />
        </Button>
      </div>
    </div>
  );
}
