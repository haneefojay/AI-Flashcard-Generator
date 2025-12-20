"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { apiClient, type Deck, type Flashcard } from "@/lib/api-client"
import { FlashcardViewer } from "@/components/flashcard-viewer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Sparkles } from "lucide-react"

export default function SharedDeckPage() {
    const params = useParams()
    const shareId = params.shareId as string
    const [deck, setDeck] = useState<Deck | null>(null)
    const [flashcards, setFlashcards] = useState<Flashcard[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        const loadSharedContent = async () => {
            try {
                setIsLoading(true)
                const deckData = await apiClient.getSharedDeck(shareId)
                setDeck(deckData)
                const flashcardsData = await apiClient.getSharedFlashcards(shareId)
                setFlashcards(flashcardsData)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load shared deck")
            } finally {
                setIsLoading(false)
            }
        }

        if (shareId) {
            loadSharedContent()
        }
    }, [shareId])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Navigation />
                <div className="flex items-center justify-center h-96">
                    <p className="text-muted-foreground animate-pulse">Loading shared deck...</p>
                </div>
            </div>
        )
    }

    if (error || !deck) {
        return (
            <div className="min-h-screen bg-background">
                <Navigation />
                <div className="max-w-2xl mx-auto px-4 py-12">
                    <Card className="border-destructive/20 bg-destructive/5">
                        <CardContent className="p-8 text-center text-destructive">
                            <h2 className="text-xl font-bold mb-2">Deck Not Found</h2>
                            <p className="mb-6">{error || "This shared link might be invalid or expired."}</p>
                            <Link href="/">
                                <Button variant="outline">Go Home</Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <Navigation />

            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="text-center mb-12">
                    <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">
                        Shared Deck
                    </div>
                    <h1 className="text-4xl font-bold text-foreground mb-4">{deck.name}</h1>
                    {deck.description && (
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            {deck.description}
                        </p>
                    )}
                    <div className="mt-6 flex items-center justify-center gap-4 text-sm text-muted-foreground">
                        <span>{flashcards.length} Cards</span>
                        <span>•</span>
                        <span>Shared with you</span>
                    </div>
                </div>

                <FlashcardViewer flashcards={flashcards} />

                {deck.summary && (
                  <div className="mt-12 p-6 bg-muted/30 rounded-xl border border-border/50">
                    <h3 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      AI Summary
                    </h3>
                    <p className="text-muted-foreground italic leading-relaxed whitespace-pre-wrap">
                      {deck.summary}
                    </p>
                  </div>
                )}

                <div className="mt-16 pt-8 border-t border-border text-center">
                    <h3 className="text-xl font-semibold mb-2">Want to create your own?</h3>
                    <p className="text-muted-foreground mb-6">
                        Generate your own flashcards in seconds using AI.
                    </p>
                    <Link href="/auth/register">
                        <Button size="lg" className="rounded-full px-8">
                            Get Started for Free
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
