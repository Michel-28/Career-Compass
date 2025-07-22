
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/icons";
import { Eye, EyeOff, GraduationCap } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/dashboard");
  };

  return (
    <div className="w-full min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left Panel */}
      <div className="flex flex-col items-center justify-center p-6 lg:p-8 bg-gradient-to-b from-purple-50 via-white to-white">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Welcome to Career Compass</h1>
            <p className="mt-2 text-gray-600">Transform your hiring process with AI-powered intelligence</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter your email" required className="bg-white" />
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="#" className="text-sm font-medium text-blue-600 hover:underline">
                        Forgot password?
                    </Link>
                </div>
                <div className="relative">
                    <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                    className="bg-white pr-10"
                    />
                    <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
                    >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                </div>
            </div>
            <Button type="submit" className="w-full text-lg h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold">
              Sign In
            </Button>
          </form>

          <p className="text-center text-gray-600">
            Don't have an account?{" "}
            <Link href="/signup" className="font-semibold text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>

          <div className="p-6 rounded-lg bg-blue-50 border-2 border-orange-400">
             <div className="flex items-center gap-3">
                <GraduationCap className="h-6 w-6 text-orange-500" />
                <h3 className="text-lg font-bold text-gray-800">343+ Students and Counting!</h3>
             </div>
             <p className="mt-2 text-gray-600">
                Students from various colleges are actively using our platform to enhance their skills, gain confidence, and ace their interviews.
             </p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="hidden md:flex flex-col justify-center p-12 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="max-w-lg mx-auto">
            <h2 className="text-4xl font-bold">Why Choose Career Compass?</h2>
            <p className="mt-4 text-lg opacity-90">Our AI-powered platform offers comprehensive interview preparation tools to help you succeed.</p>

            <div className="mt-10 space-y-6">
                <div>
                    <h3 className="font-bold text-xl">AI-Powered Mock Interviews</h3>
                    <p className="mt-1 opacity-90">Experience realistic, role-specific simulations.</p>
                </div>
                 <div>
                    <h3 className="font-bold text-xl">Comprehensive Feedback</h3>
                    <p className="mt-1 opacity-90">Get detailed performance reports with strengths & weaknesses.</p>
                </div>
                 <div>
                    <h3 className="font-bold text-xl">Flexible Scheduling</h3>
                    <p className="mt-1 opacity-90">Book mock interviews at your convenience, 24/7 availability.</p>
                </div>
                 <div>
                    <h3 className="font-bold text-xl">Performance Analytics</h3>
                    <p className="mt-1 opacity-90">Track progress with detailed insights.</p>
                </div>
                 <div>
                    <h3 className="font-bold text-xl">Institutional Insights</h3>
                    <p className="mt-1 opacity-90">Colleges can monitor student performance.</p>
                </div>
                <div>
                    <h3 className="font-bold text-xl">Instant Results</h3>
                    <p className="mt-1 opacity-90">Get immediate feedback after each session.</p>
                </div>
            </div>

            <div className="mt-12">
                <h3 className="text-2xl font-bold">Testimonials</h3>
                <div className="mt-4 p-6 rounded-xl bg-white/20 backdrop-blur-sm">
                    <p className="italic">"Thanks to Career Compass, I felt much more confident during my actual interviews. The platform's analytics helped me identify and improve my weak areas."</p>
                    <p className="mt-4 font-bold">Rahul Verma</p>
                    <p className="text-sm opacity-90">Recent Graduate</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
