"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { useDecks } from "@/hooks/use-decks"
import { Navigation } from "@/components/navigation"
import { Download, Share2, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { apiClient, type Deck, type Flashcard } from "@/lib/api-client"
import Link from "next/link"

export default function DeckDetailPage() {
  const router = useRouter()
  const params = useParams()
  const deckId = params.deckId as string
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { deleteDeck, exportDeck, shareDeck } = useDecks()
  const [deck, setDeck] = useState<Deck | null>(null)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login")
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    const loadDeck = async () => {
      try {
        setIsLoading(true)
        const deckData = await apiClient.getDeck(deckId)
        setDeck(deckData)
        // Fetch flashcards for this deck from API
        const flashcardsData = await apiClient.getFlashcards(deckId)
        setFlashcards(flashcardsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load deck")
      } finally {
        setIsLoading(false)
      }
    }

    if (isAuthenticated && deckId) {
      loadDeck()
    }
  }, [isAuthenticated, deckId])

  const handleExport = async () => {
    try {
      await exportDeck(deckId)
    } catch (err) {
      console.error("Export failed:", err)
    }
  }

  const handleShare = async () => {
    try {
      const shareUrl = await shareDeck(deckId)
      if (navigator.share) {
        await navigator.share({ title: deck?.name, url: shareUrl })
      } else {
        navigator.clipboard.writeText(shareUrl)
        alert("Share link copied to clipboard!")
      }
    } catch (err) {
      console.error("Share failed:", err)
    }
  }

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this deck?")) {
      try {
        await deleteDeck(deckId)
        router.push("/decks")
      } catch (err) {
        console.error("Delete failed:", err)
      }
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !deck) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-destructive mb-4">{error || "Deck not found"}</p>
              <Button onClick={() => router.push("/decks")}>Back to Decks</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const currentCard = flashcards[currentCardIndex]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button variant="ghost" onClick={() => router.push("/decks")} className="mb-4">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-4xl font-bold text-foreground">{deck.name}</h1>
            {deck.description && <p className="text-muted-foreground mt-2">{deck.description}</p>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handleExport} title="Download as PDF">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleShare} title="Share Deck">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive bg-transparent"
              title="Delete Deck"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {flashcards.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No flashcards in this deck yet</p>
              <Link href="/generate">
                <Button>Generate Flashcards</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="text-center text-sm text-muted-foreground">
              Card {currentCardIndex + 1} of {flashcards.length}
            </div>

            <Card
              className="cursor-pointer h-64 flex items-center justify-center transition-transform hover:shadow-lg"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <CardContent className="p-8 text-center w-full">
                <div className="text-lg font-semibold text-foreground">
                  {isFlipped ? currentCard.answer : currentCard.question}
                </div>
                <p className="text-sm text-muted-foreground mt-4">{isFlipped ? "Answer" : "Question"}</p>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentCardIndex(Math.max(0, currentCardIndex - 1))}
                disabled={currentCardIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <Button
                variant="outline"
                onClick={() => setCurrentCardIndex(Math.min(flashcards.length - 1, currentCardIndex + 1))}
                disabled={currentCardIndex === flashcards.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
