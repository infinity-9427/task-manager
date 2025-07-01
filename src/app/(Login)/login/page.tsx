"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { z } from "zod";
import { useAuth } from "@/app/context/AuthContext";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithCredentials } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  useEffect(() => {
    // Show success message if redirected from registration
    if (searchParams.get('registered') === 'true') {
      setSuccessMessage("Account created successfully! Please sign in with your credentials.");
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field-specific error when user types
    if (errors[name as keyof LoginFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    
    // Clear API error when user types
    if (apiError) {
      setApiError("");
    }
    
    // Clear success message when user types
    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const validateForm = (): boolean => {
    try {
      loginSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<LoginFormData> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof LoginFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setApiError("");

    try {
      // Use the loginWithCredentials function from AuthContext which handles the API call
      await loginWithCredentials(formData.username, formData.password);
      router.push("/");
    } catch (error) {
      console.error("Login failed:", error);
      setApiError(
        error instanceof Error 
          ? error.message 
          : "Login failed. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 select-none">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 leading-tight tracking-wide select-none">
          Welcome back
        </h2>
        <p className="text-gray-600 select-none">
          Sign in to your account to continue
        </p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-6 select-none">
        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-sm">
            {successMessage}
          </div>
        )}

        {/* API Error */}
        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {apiError}
          </div>
        )}

        {/* Username Field */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2 cursor-pointer select-none">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder:text-gray-400 select-text ${
              errors.username 
                ? "border-red-300 bg-red-50" 
                : "border-gray-300 hover:border-gray-400 bg-white"
            }`}
            placeholder="Enter your username"
            disabled={isLoading}
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-600">{errors.username}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 cursor-pointer select-none">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder:text-gray-400 select-text ${
                errors.password 
                  ? "border-red-300 bg-red-50" 
                  : "border-gray-300 hover:border-gray-400 bg-white"
              }`}
              placeholder="Enter your password"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-md hover:bg-gray-100 transition-colors"
              disabled={isLoading}
            >
              <Image
                src={showPassword ? "/eye.svg" : "/eye-off.svg"}
                alt={showPassword ? "Hide password" : "Show password"}
                width={20}
                height={20}
                className="text-gray-500"
              />
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Signing in...
            </div>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      {/* Footer Links */}
      <div className="mt-8 text-center space-y-4">
        <p className="text-sm text-gray-600">
          Don't have an account?{" "}
          <Link 
            href="/register" 
            className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
          >
            Create one here
          </Link>
        </p>
        
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
          <Link href="#" className="hover:text-gray-600 transition-colors">
            Forgot password?
          </Link>
          <span>•</span>
          <Link href="#" className="hover:text-gray-600 transition-colors">
            Need help?
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
