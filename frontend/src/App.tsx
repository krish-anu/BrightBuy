import Login from "./pages/Authpage/login"  
import {Navbar} from "@/components/Header/Navbar";
import Footer from "@/components/Footer/Footer";
function App(){
  return (
    <div className="min-h-screen">
      <Navbar />
      <Login />
      <Login />
      <Login />

      <Footer />
    </div>
  );
}


export default App;