
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Home,
  LogOut,
  User,
  Settings,
  Sun,
  Sparkles,
  BarChart2,
  BookUser,
  Crown
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icons } from "@/components/icons";

const NexvoLogo = () => (
    <svg width="110" height="28" viewBox="0 0 110 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="20" fontFamily="Arial, sans-serif" fontSize="24" fill="#312E81" fontWeight="bold">NEXVO</text>
        <circle cx="80" cy="14" r="6" fill="#6366F1"/>
        <circle cx="80" cy="14" r="2" fill="white"/>
        <path d="M77 11L76 10" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M83 11L84 10" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round"/>
        <text x="88" y="20" fontFamily="Arial, sans-serif" fontSize="24" fill="#312E81" fontWeight="bold">.ai</text>
    </svg>
)

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/analytics", label: "Analytics", icon: BarChart2 },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/subscriptions", label: "Subscriptions", icon: Crown },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-white px-4 md:px-6 z-50">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <NexvoLogo />
        </Link>
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6 ml-10">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href="#" // Changed to # as these pages don't exist
              className={`transition-colors hover:text-gray-900 ${
                pathname === link.href ? "text-gray-900 font-semibold" : "text-gray-500"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4 justify-end">
            <Button className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500 font-semibold">
                <Sparkles className="mr-2 h-4 w-4"/>
                Upgrade to Pro
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full text-gray-500 hover:text-gray-900">
                <Sun className="h-5 w-5" />
            </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                     <Avatar className="h-8 w-8">
                        <AvatarImage src="https://placehold.co/40x40" alt="User" data-ai-hint="user avatar" />
                        <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
               <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <Link href="/login">
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 bg-gray-50/50">
        {children}
      </main>
    </div>
  );
}
