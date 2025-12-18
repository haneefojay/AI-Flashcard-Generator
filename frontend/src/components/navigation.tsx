"use client"

import { Brain, Menu, X, LogOut, User } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, user, logout, isLoading } = useAuth()

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Generate", href: "/generate" },
    ...(isAuthenticated ? [{ name: "Decks", href: "/decks" }] : []),
  ]

  const handleLogout = () => {
    logout()
    router.push("/")
    setIsMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background backdrop-blur">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">FlashAI</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-foreground",
                  pathname === item.href ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            {isLoading ? (
              <div className="h-9 w-24 bg-muted rounded-md animate-pulse" />
            ) : isAuthenticated ? (
              <>
                <Link href="/profile">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    {user?.name || "Profile"}
                  </Button>
                </Link>
                <Button onClick={handleLogout} variant="outline" size="sm" className="gap-2 bg-transparent">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <nav className="flex flex-col py-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-colors hover:text-foreground hover:bg-accent rounded-md",
                    pathname === item.href ? "text-foreground bg-accent" : "text-muted-foreground",
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile Auth Section */}
              <div className="border-t border-border pt-4 mt-4 space-y-2">
                {isLoading ? (
                  <div className="h-9 bg-muted rounded-md animate-pulse" />
                ) : isAuthenticated ? (
                  <>
                    <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                        <User className="h-4 w-4" />
                        {user?.name || "Profile"}
                      </Button>
                    </Link>
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      className="w-full justify-start gap-2 bg-transparent"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full bg-transparent">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth/register" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full">Sign Up</Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
