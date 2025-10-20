import { BrowserRouter } from "react-router-dom";
import AppRoutes from "@/routes/AppRoutes";
import { CartProvider } from "../contexts/CartContext";
import { OrderProvider } from "../contexts/OrderContext";

function App() {
  return (
    <BrowserRouter>
      <OrderProvider>
        <CartProvider>
        <AppRoutes />
      
        </CartProvider>
      </OrderProvider>
    </BrowserRouter>
  );
}

export default App;
