import Login from "@/pages/Authpage/login"  
import { Routes, Route } from "react-router-dom";  
import HomePage  from "@/pages/User/HomePage";
import ProductsPage from "@/pages/User/ProductsPage";
import Layout from "@/components/Layout/Layout";
import CartPage from "@/pages/User/CartPage";
import UserSignup from "@/pages/Authpage/UserSignup";

export default function AppRoutes(){
  return (
      <Routes>  
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/signup" element={<UserSignup />} />
        </Route>
      </Routes>
  );
}