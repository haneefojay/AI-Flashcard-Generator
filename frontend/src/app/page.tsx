import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, Zap, BookOpen, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">AI Flashcard Generator</h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 text-balance">
            Turn your notes into study cards instantly
          </p>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
            Paste your text, upload your notes, and let AI create interactive flashcards that help you learn faster and
            retain more information.
          </p>
          <Link href="/generate">
            <Button
              size="lg"
              className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
            >
              Generate Flashcards
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 bg-card">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-card-foreground mb-12">Why Choose FlashAI?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-border bg-background">
              <CardContent className="p-6 text-center">
                <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-3">Instant Generation</h3>
                <p className="text-muted-foreground text-pretty">
                  Transform any text into study-ready flashcards in seconds using advanced AI technology.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-background">
              <CardContent className="p-6 text-center">
                <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-3">Smart Questions</h3>
                <p className="text-muted-foreground text-pretty">
                  AI creates meaningful questions and answers that focus on key concepts and important details.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-background">
              <CardContent className="p-6 text-center">
                <Brain className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-3">Interactive Study</h3>
                <p className="text-muted-foreground text-pretty">
                  Review with smooth card animations and track your progress through each study session.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Paste Your Text</h3>
              <p className="text-muted-foreground text-pretty">
                Copy and paste your notes, articles, or study material into our text input.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">AI Processing</h3>
              <p className="text-muted-foreground text-pretty">
                Our AI analyzes your content and generates relevant question-answer pairs.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Study & Learn</h3>
              <p className="text-muted-foreground text-pretty">
                Review your flashcards with interactive flip animations and track your progress.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-card">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-card-foreground mb-4 text-balance">
            Ready to Transform Your Study Sessions?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 text-pretty">
            Join thousands of students who are learning more effectively with AI-powered flashcards.
          </p>
          <Link href="/generate">
            <Button
              size="lg"
              className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="h-6 w-6 text-primary" />
            <span className="font-semibold text-foreground">FlashAI</span>
          </div>
          <p className="text-muted-foreground">Powered by AI. Built for learners.</p>
        </div>
      </footer>
    </div>
  )
}
