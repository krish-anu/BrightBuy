import React, { useState } from "react";
import * as LucideIcons from "lucide-react";
import axiosInstance from '../../axiosConfig';
import { useNavigate } from 'react-router-dom';

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

const UserSignup: React.FC = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Determine if this signup is for admin creation (show role dropdown)
  const isAdminSignup = typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('admin') === 'true' || window.location.pathname.toLowerCase().includes('/admin'));
  const [role, setRole] = useState<string>(isAdminSignup ? 'Admin' : 'Customer');

  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Call backend register endpoint
    (async () => {
      try {
        const payload: any = { name, email, password, role };
        const res = await axiosInstance.post('/api/auth/register', payload);
        if (res.status === 201) {
          // redirect to login page; carry admin query if present
          const loginUrl = isAdminSignup ? '/login?admin=true' : '/login';
          navigate(loginUrl);
        } else {
          setError(res.data?.message || 'Registration failed');
        }
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Registration failed';
        setError(String(msg));
      }
    })();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-blue-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {/* Logo + Title */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center text-white shadow-md">
            <IconComponent iconName="UserPlus" size={28} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-900">
          Create Account
        </h2>
        <p className="mt-1 text-center text-gray-500 text-sm">
          Join <span className="font-semibold">BrightBuy</span> today and start
          shopping
        </p>

        {/* Form */}
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Full Name
            </label>
            <div className="relative mt-1">
              <input
                id="name"
                type="text"
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IconComponent iconName="User" size={18} />
              </div>
            </div>
          </div>

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

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Confirm Password
            </label>
            <div className="relative mt-1">
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                className="w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IconComponent iconName="Lock" size={18} />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600 flex items-center gap-2">
              <IconComponent iconName="AlertCircle" size={18} />
              {error}
            </div>
          )}

          {/* Role selection for admin signup */}
          {isAdminSignup && (
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="Admin">Admin</option>
                <option value="SuperAdmin">SuperAdmin</option>
                <option value="WarehouseStaff">WarehouseStaff</option>
                <option value="DeliveryStaff">DeliveryStaff</option>
              </select>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full flex justify-center items-center gap-2 py-2 px-4 text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary/90 focus:ring-2 focus:ring-offset-1 focus:ring-primary"
          >
            <IconComponent iconName="UserCheck" size={18} />
            Sign Up
          </button>
        </form>

        {/* Login link */}
        <p className="mt-5 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a
            href="/userlogin"
            className="text-primary hover:underline font-medium"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
};

export default UserSignup;
