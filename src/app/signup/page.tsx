
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/icons";

export default function SignupPage() {
  const router = useRouter();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd handle Firebase authentication here
    router.push("/dashboard");
  };

  return (
    <div className="w-full min-h-screen grid grid-cols-1 md:grid-cols-2">
       <div className="hidden bg-muted md:flex flex-col items-center justify-center p-10 text-center relative">
        <div className="absolute top-8 left-8 flex items-center gap-2 text-lg font-semibold">
           <Icons.logo className="h-6 w-6 text-primary" />
           <span>Career Compass</span>
        </div>
        <div className="max-w-md">
            <Image 
                src="https://placehold.co/800x600.png" 
                alt="Signup illustration" 
                width={800} 
                height={600} 
                className="rounded-lg shadow-xl"
                data-ai-hint="career success"
            />
        </div>
        <div className="mt-8 max-w-md">
            <h1 className="text-3xl font-bold tracking-tight">Join a Community of Ambitious Professionals</h1>
            <p className="text-muted-foreground mt-2">
                Create your account to start practicing and sharpening your interview skills today.
            </p>
        </div>
      </div>
       <div className="flex items-center justify-center p-6 lg:p-8">
        <Card className="w-full max-w-sm mx-auto border-0 shadow-none md:border md:shadow-sm">
          <CardHeader className="text-left">
            <CardTitle className="text-2xl font-bold tracking-tight">Create an Account</CardTitle>
            <CardDescription>Get started with your personalized interview prep.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <Button variant="outline" className="w-full" type="button">
                  <Icons.logo className="mr-2 h-4 w-4" />
                  Sign Up with Google
              </Button>
               <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                        </span>
                    </div>
                </div>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" type="text" placeholder="Your Name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="user@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required />
              </div>
              <Button type="submit" className="w-full">
                Create Account
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="underline text-primary font-medium">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
