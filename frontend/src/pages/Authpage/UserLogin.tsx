import React, { useState } from "react";
import * as LucideIcons from "lucide-react";
import { useNavigate ,useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

interface IconComponentProps {
  iconName: keyof typeof LucideIcons;
  size?: number;
  className?: string;
}

const IconComponent: React.FC<IconComponentProps> = ({
  iconName,
  size = 20,
  className,
}) => {
  const Icon = LucideIcons[iconName] as
    | React.ComponentType<LucideIcons.LucideProps>
    | undefined;
  return Icon ? (
    <Icon size={size} className={className} />
  ) : (
    <LucideIcons.Circle size={size} />
  );
};

const UserLogin: React.FC = () => {
  const location = useLocation();
  
  const fromLocation = location.state?.from ?? { pathname: "/" };
  const fromPath =
    typeof fromLocation === "string"
      ? fromLocation
      : `${fromLocation.pathname || "/"}${fromLocation.search ?? ""}`;

  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    try {
  // If user arrived from an admin path, or is on the admin login page, request admin login
  const adminLogin: boolean = location.pathname.startsWith("/admin") || fromPath.startsWith("/admin");
      const result = await login(email, password, adminLogin);

      if (result?.success === true) {
        const returnedRole = result.user?.role || null;
  const wantsAdmin = location.pathname.startsWith("/admin") || (fromPath && fromPath.startsWith("/admin"));

        // safe return path for "payment" 
        if (fromPath.startsWith("/order/payment")) {
          navigate(fromPath, { replace: true });
          return;
        }

        // console.log('Post-login navigation:', { from: fromPath, returnedRole, wantsAdmin });
        if (returnedRole === 'SuperAdmin') {
          navigate('/admin', { replace: true });
          return;
        }
        if (returnedRole === 'Admin') {
          navigate('/admin', { replace: true });
          return;
        }
        if (returnedRole === 'WarehouseStaff') {
          navigate('/admin/inventory', { replace: true });
          return;
        }
        if (returnedRole === 'DeliveryStaff') {
          navigate('/admin/deliveries', { replace: true });
          return;
        }

        // fallback
        if (wantsAdmin) {
          navigate('/', { replace: true });
        } else {
          navigate(fromPath, { replace: true });
        }
      } else {
        setError(result?.error || "Login failed");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-blue-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {/* Logo + Title */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center text-white shadow-md">
            <IconComponent iconName="ShoppingBag" size={28} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-900">
          Welcome Back
        </h2>
        <p className="mt-1 text-center text-gray-500 text-sm">
          Login to continue shopping with{" "}
          <span className="font-semibold">BrightBuy</span>
        </p>

        {/* Admin guidance banner */}
        {location.pathname.startsWith('/admin') ? (
          <div className="mt-3 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
            Admin / Staff login — use this page to sign in to the admin dashboard.
          </div>
        ) : (
          <div className="mt-3 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
            Are you an admin or staff member? Please <Link to="/admin/login" className="font-medium underline">use the admin login page</Link> instead.
          </div>
        )}

        {/* Form */}
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <div className="relative mt-1">
              <input
                id="email"
                type="email"
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IconComponent iconName="Mail" size={18} />
              </div>
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                value={password}
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IconComponent iconName="Lock" size={18} />
              </div>
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                <IconComponent
                  iconName={showPassword ? "EyeOff" : "Eye"}
                  size={18}
                />
              </button>
            </div>
          </div>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <IconComponent iconName="AlertCircle" size={20} />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}
          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-2 py-2 px-4 text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary/90 focus:ring-2 focus:ring-offset-1 focus:ring-primary"
          >
            <IconComponent iconName="LogIn" size={18} />
            Sign In
            {isLoading && (
              <IconComponent
                iconName="Loader"
                size={18}
                className="animate-spin"
              />
            )}
          </button>
        </form>

        {/* Signup link */}

        <p className="mt-5 text-center text-sm text-gray-600">
          Don’t have an account?{" "}
          {(() => {
            // If user is on an admin path, pass admin=true to signup so role dropdown is shown
            const signupUrl = location.pathname.startsWith('/admin') ? '/signup?admin=true' : '/signup';
            return (
              <Link to={signupUrl} className="text-primary hover:underline font-medium">
                Create one
              </Link>
            );
          })()}
        </p>
      </div>
    </div>
  );
};

export default UserLogin;
