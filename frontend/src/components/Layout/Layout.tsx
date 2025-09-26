import { Navbar } from "../Header/Navbar";
import Footer from "../Footer/Footer";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 my-8 mx-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
