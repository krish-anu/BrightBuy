
import {Link} from "react-router-dom";
import { Separator } from "@/components/ui/separator";

export default function Footer(){
    return(
        <footer className="bg-foreground mt-10 text-muted shadow-2xl">
            <div className="max-w-7xl grid md:grid-cols-5 sm:grid-cols-2 items-center mx-auto px-4 gap-8 py-10 ">
                <div className="md:col-span-2">
                    <span className="text-2xl font-bold text-secondary">BrightBuy</span>
                    <p className="text-md mt-2">Your one-stop shop for electronics, fashion, and home essentials.</p>
                </div>
                <div>
                    <span className="text-lg font-medium">Links</span>
                    <ul className="mt-2 space-y-1">
                        <li>
                            <Link to="/" className="text-muted-foreground hover:text-background">Home</Link>
                        </li>
                        <li>
                            <Link to="/about" className="text-muted-foreground hover:text-background">About Us</Link>
                        </li>
                        <li>
                            <Link to="/contact" className="text-muted-foreground hover:text-background">Contact</Link>
                        </li>
                    </ul>
                </div>
                <div>
                    <span className="text-lg font-medium">Top Selling Categories</span>
                    <ul className="mt-2 space-y-1">
                        <li>
                            <Link to="/category/electronics" className="text-muted-foreground hover:text-background">Electronics</Link>
                        </li>
                        <li>
                            <Link to="/category/fashion" className="text-muted-foreground hover:text-background">Toys</Link>
                        </li>
                        <li>
                            <Link to="/category/home" className="text-muted-foreground hover:text-background">Home Essentials</Link>
                        </li>
                    </ul>
                </div>
                <div>
                    <span className="text-lg font-medium">Follow Us</span>
                    <ul className="mt-2 space-y-1">
                        <li>
                            <Link to="/social/facebook" className="text-muted-foreground hover:text-background">Facebook</Link>
                        </li>
                        <li>
                            <Link to="/social/twitter" className="text-muted-foreground hover:text-background">Twitter</Link>
                        </li>
                        <li>
                            <Link to="/social/instagram" className="text-muted-foreground hover:text-background">Instagram</Link>
                        </li>
                    </ul>
                </div>
            </div>
            <Separator  className="bg-muted-foreground/20" />
            <div className="text-center text-sm text-muted-foreground py-4">
                <p>© 2025 BrightBuy. All rights reserved.</p>
            </div>
        </footer>
    )
}