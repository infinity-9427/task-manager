"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { z } from "zod";
import { authService } from "@/services";

const registerSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be less than 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string()
    .email("Please enter a valid email address"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  confirmPassword: z.string(),
  firstName: z.string()
    .min(2, "First name must be at least 2 characters")
    .optional(),
  lastName: z.string()
    .min(2, "Last name must be at least 2 characters")
    .optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterFormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string>("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field-specific error when user types
    if (errors[name as keyof RegisterFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    
    // Clear API error when user types
    if (apiError) {
      setApiError("");
    }
  };

  const validateForm = (): boolean => {
    try {
      registerSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<RegisterFormData> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof RegisterFormData] = err.message;
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
      await authService.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
      });
      
      // Registration successful, redirect to login
      router.push("/login?registered=true");
    } catch (error) {
      console.error("Registration failed:", error);
      setApiError(
        error instanceof Error 
          ? error.message 
          : "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 select-none">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 select-none">
          Create your account
        </h2>
        <p className="text-gray-600 select-none">
          Join us and start managing your tasks efficiently
        </p>
      </div>

      {/* Register Form */}
      <form onSubmit={handleSubmit} className="space-y-6 select-none">
        {/* API Error */}
        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {apiError}
          </div>
        )}

        {/* Name Fields Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2 cursor-pointer select-none">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder:text-gray-400 select-text ${
              errors.firstName 
                ? "border-red-300 bg-red-50" 
                : "border-gray-300 hover:border-gray-400 bg-white"
            }`}
              placeholder="John"
              disabled={isLoading}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2 cursor-pointer select-none">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder:text-gray-400 select-text ${
              errors.lastName 
                ? "border-red-300 bg-red-50" 
                : "border-gray-300 hover:border-gray-400 bg-white"
            }`}
              placeholder="Doe"
              disabled={isLoading}
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Username Field */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2 cursor-pointer select-none">
            Username <span className="text-red-500">*</span>
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
            placeholder="johndoe"
            disabled={isLoading}
            required
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-600">{errors.username}</p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 cursor-pointer select-none">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder:text-gray-400 select-text ${
              errors.email 
                ? "border-red-300 bg-red-50" 
                : "border-gray-300 hover:border-gray-400 bg-white"
            }`}
            placeholder="john@example.com"
            disabled={isLoading}
            required
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 cursor-pointer select-none">
            Password <span className="text-red-500">*</span>
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
              placeholder="Create a strong password"
              disabled={isLoading}
              required
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
          <p className="mt-1 text-xs text-gray-500">
            Must contain at least one uppercase letter, one lowercase letter, and one number
          </p>
        </div>

        {/* Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2 cursor-pointer select-none">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder:text-gray-400 select-text ${
                errors.confirmPassword 
                  ? "border-red-300 bg-red-50" 
                  : "border-gray-300 hover:border-gray-400 bg-white"
              }`}
              placeholder="Confirm your password"
              disabled={isLoading}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-md hover:bg-gray-100 transition-colors"
              disabled={isLoading}
            >
              <Image
                src={showConfirmPassword ? "/eye.svg" : "/eye-off.svg"}
                alt={showConfirmPassword ? "Hide password" : "Show password"}
                width={20}
                height={20}
                className="text-gray-500"
              />
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
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
              Creating account...
            </div>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      {/* Footer Links */}
      <div className="mt-8 text-center space-y-4">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <Link 
            href="/login" 
            className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
          >
            Sign in here
          </Link>
        </p>
        
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
          <Link href="#" className="hover:text-gray-600 transition-colors">
            Terms of Service
          </Link>
          <span>•</span>
          <Link href="#" className="hover:text-gray-600 transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
