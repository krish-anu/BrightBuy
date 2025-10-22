import { BrowserRouter } from "react-router-dom";
import AppRoutes from "@/routes/AppRoutes";
import { CartProvider } from "../contexts/CartContext";
import { OrderProvider } from "../contexts/OrderContext";
import { AuthProvider } from "../contexts/AuthContext";
import { RoleProvider } from "../contexts/RoleContext";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RoleProvider>
          <OrderProvider>
            <CartProvider>
              <AppRoutes />
            </CartProvider>
          </OrderProvider>
        </RoleProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
