import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Brain, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <Brain className="h-16 w-16 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
          <h2 className="text-xl font-semibold text-foreground mb-2">Page Not Found</h2>
          <p className="text-muted-foreground text-pretty">
            The page you're looking for doesn't exist. Let's get you back to generating flashcards!
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto bg-transparent">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </Link>
          <Link href="/generate">
            <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
              Generate Flashcards
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
