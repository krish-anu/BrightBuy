import { useAuth } from "../../../contexts/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

export default function CartGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated()) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <ShoppingCart className="h-16 w-16 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold">Please Log In to Continue Shopping</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            To access your cart and continue shopping, please log in to your account or create a new one.
          </p>
          <div className="space-x-4">
            <Button asChild variant="default">
              <Link to="/login">Log In</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/signup">Create Account</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}