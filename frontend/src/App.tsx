import { BrowserRouter } from "react-router-dom";
import AppRoutes from "@/routes/AppRoutes";
import { OrderProvider } from "../contexts/OrderContext";

function App() {
  return (
    <BrowserRouter>
      <OrderProvider>
        <AppRoutes />
      </OrderProvider>
    </BrowserRouter>
  );
}

export default App;
