import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold tracking-tight">
            BrandName
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="#about" className="hover:text-foreground transition-colors">
              About
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }))}>
              Login
            </Link>
            <Link href="/signup" className={cn(buttonVariants())}>
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 md:py-28 text-center">
          <Badge variant="secondary" className="mb-4 px-3 py-1 text-xs">
            Next.js + shadcn/ui Starter
          </Badge>

          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Build modern web apps faster with clean UI
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground">
            Accessible, customizable, and production-ready components built on top of Tailwind CSS.
            Customize everything to match your product.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }))}>
              Start Building
            </Link>
            <Link
              href="#features"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            >
              Explore Features
            </Link>
          </div>
        </section>

        <Separator className="container mx-auto" />

        {/* Features Section */}
        <section id="features" className="container mx-auto px-4 py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to ship quickly
            </h2>
            <p className="mt-3 text-muted-foreground">
              Clean structure, responsive layout, and easy theming right out of the box.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Badge className="w-fit mb-2">Speed</Badge>
                <CardTitle>Fast Setup</CardTitle>
                <CardDescription>
                  Start with clean components and sensible defaults without heavy bloat.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Focus on your business logic while keeping UI consistency across every screen.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Badge variant="outline" className="w-fit mb-2">Customization</Badge>
                <CardTitle>Full Control</CardTitle>
                <CardDescription>
                  Own your component code and tailor styles directly in your codebase.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Easily adjust colors, radius, spacing, and dark mode support with CSS variables.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Badge variant="secondary" className="w-fit mb-2">Responsive</Badge>
                <CardTitle>Mobile Ready</CardTitle>
                <CardDescription>
                  Designed to look sharp across mobile, tablet, and desktop viewports.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Flexible grids and spacing adapt smoothly as screen sizes change.
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="container mx-auto" />

        {/* Pricing Section */}
        <section id="pricing" className="container mx-auto px-4 py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-3 text-muted-foreground">
              Choose a plan that fits your project stage.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            <Card className="flex flex-col justify-between">
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <CardDescription>For personal projects and MVPs</CardDescription>
                <div className="pt-4">
                  <span className="text-3xl font-bold">₹0</span>
                  <span className="text-muted-foreground text-sm"> / month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• All core UI blocks</p>
                <p>• Responsive layout</p>
                <p>• Community updates</p>
              </CardContent>
              <CardFooter>
                <Link
                  href="/signup"
                  className={cn(buttonVariants({ variant: "outline" }), "w-full")}
                >
                  Choose Starter
                </Link>
              </CardFooter>
            </Card>

            <Card className="flex flex-col justify-between border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pro</CardTitle>
                  <Badge>Popular</Badge>
                </div>
                <CardDescription>For growing teams and production apps</CardDescription>
                <div className="pt-4">
                  <span className="text-3xl font-bold">₹999</span>
                  <span className="text-muted-foreground text-sm"> / month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Everything in Starter</p>
                <p>• Priority support & templates</p>
                <p>• Team collaboration features</p>
              </CardContent>
              <CardFooter>
                <Link href="/signup" className={cn(buttonVariants(), "w-full")}>
                  Upgrade to Pro
                </Link>
              </CardFooter>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="about" className="border-t py-8">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2026 BrandName. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}