import React from "react";
import { Input } from "@/components/ui/input";
import { ShoppingCart, User, Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { useCart } from "../../../contexts/CartContext";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "../../../contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function CartBadge() {
  const { itemsCount } = useCart();
  
  if (itemsCount === 0) return null;
  
  return (
    <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
      {itemsCount}
    </Badge>
  );
}

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { refresh } = useCart();
  const [query, setQuery] = React.useState("");

  // Hide cart badge in auth pages to avoid showing stale counts
  const isAuthRoute = React.useMemo(() => {
    const p = location.pathname.toLowerCase();
    return p.startsWith('/login') || p.startsWith('/signup') || p.startsWith('/admin/login') || p.startsWith('/admin/signup');
  }, [location.pathname]);

  // Refresh cart badge on route changes
  React.useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  // Populate search box from URL if present (so it's consistent when landing on /shop?search=...)
  React.useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const s = sp.get('search') || '';
    setQuery(s);
  }, [location.search]);

  // Live search: debounce typing and navigate/update the shop page
  React.useEffect(() => {
    const q = query.trim();
    const targetPath = '/shop';
    const targetSearch = q ? `?search=${encodeURIComponent(q)}` : '';
    const isAlreadyTarget = location.pathname === targetPath && (location.search || '') === targetSearch;
    if (isAlreadyTarget) return;

    const handle = setTimeout(() => {
      if (location.pathname.startsWith('/shop')) {
        navigate({ pathname: targetPath, search: targetSearch }, { replace: true });
      } else if (q.length > 0) {
        // If not on shop, start showing results as the user types
        navigate(`${targetPath}${targetSearch}`);
      }
      // If query is empty and not on /shop, do nothing (avoid pulling users away)
    }, 300);
    return () => clearTimeout(handle);
  }, [query, navigate, location.pathname, location.search]);

  // Refresh cart when window regains focus and on storage sync events
  React.useEffect(() => {
    const onFocus = () => refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'cart_sync' || e.key === 'auth_sync') {
        refresh();
      }
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onStorage);
    };
  }, [refresh]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const submitSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = query.trim();
    if (q.length === 0) {
      // go to shop without search
      navigate('/shop');
    } else {
      const params = new URLSearchParams({ search: q });
      navigate(`/shop?${params.toString()}`);
    }
  };

  return (
    <div className="bg-accent/40 backdrop-blur-xs border-b border-b-accent-foreground/20 sticky top-0 z-50 shadow-lg/20">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-4 h-16 items-center">
        {/* Logo */}
        <div className="col-span-2 md:col-span-1">
          <Link to="/">
            <span className="text-2xl md:text-3xl font-bold text-primary m-4 md:px-8">
              BrightBuy
            </span>
          </Link>
        </div>
        {/* Search bar hidden on small screens, visible on md+ */}
        <form className="md:col-span-2 hidden md:flex items-center " onSubmit={submitSearch}>
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Products here..."
            className="h-10 rounded-l-md rounded-r-none border-r-0  focus-visible:ring-0 "
          />
          <Button
            type="submit"
            className="h-10 rounded-l-none rounded-r-md px-3 bg-ring "
            aria-label="Search"
          >
            <Search className="h-5 w-5 text-accent" />
          </Button>
        </form>
        <div className="ml-auto flex flex-row items-center space-x-4 col-span-2 md:col-span-1 sm:justify-end">
          <Link
            to="/cart"
            className="flex items-center gap-2 text-muted-foreground hover:text-accent-foreground"
          >
            <div className="relative">
              <ShoppingCart className="h-5 w-5" />
              {!isAuthRoute && <CartBadge />}
            </div>
            <span className="hidden md:block text-lg font-medium">Cart</span>
          </Link>
          <Separator orientation="vertical" />
          {isAuthenticated() ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <span className="hidden md:block text-lg font-medium">
                      {user?.name || 'Profile'}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <User className="h-5 w-5" />
              <span className="hidden md:block text-lg font-medium">Login</span>
            </Link>
          )}
        </div>
      </div>

      {/* search bar for small screens */}
      <form className="flex md:hidden max-w-7xl mx-auto px-4 pb-2" onSubmit={submitSearch}>
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Products here..."
          className="h-10 rounded-l-md rounded-r-none border-r-0 focus-visible:ring-0 flex-1"
        />
        <Button
          type="submit"
          className="h-10 rounded-l-none rounded-r-md px-3 bg-ring "
          aria-label="Search"
        >
          <Search className="h-5 w-5 text-accent" />
        </Button>
      </form>
    </div>
  );
}
