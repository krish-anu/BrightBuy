import Login from "./pages/Authpage/login"  
import {Navbar} from "@/components/Header/Navbar";
function App(){
  return (
    <div className="bg-accent min-h-screen">
      <Navbar />
      <Login />
      <Login />
      <Login />
    </div>
  );
}


export default App;