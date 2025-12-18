"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { useDecks } from "@/hooks/use-decks"
import { Navigation } from "@/components/navigation"
import { Plus, BookOpen, Trash2 } from "lucide-react"

export default function DecksPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { decks, isLoading, error, fetchDecks, deleteDeck } = useDecks()
  const [searchTerm, setSearchTerm] = useState("")
  const [showNewDeckForm, setShowNewDeckForm] = useState(false)
  const [newDeckName, setNewDeckName] = useState("")

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login")
    } else if (isAuthenticated) {
      fetchDecks()
    }
  }, [isAuthenticated, authLoading, router, fetchDecks])

  const filteredDecks = decks.filter((deck) => deck.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleDeleteDeck = async (deckId: string) => {
    if (confirm("Are you sure you want to delete this deck?")) {
      try {
        await deleteDeck(deckId)
      } catch (err) {
        console.error("Failed to delete deck:", err)
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Your Decks</h1>
            <p className="text-muted-foreground">Manage and study your flashcard decks</p>
          </div>
          <Link href="/generate">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Deck
            </Button>
          </Link>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search decks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive mb-6">
            {error}
          </div>
        )}

        {filteredDecks.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No decks yet</h3>
              <p className="text-muted-foreground mb-6">Create your first deck to get started</p>
              <Link href="/generate">
                <Button>Create Deck</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDecks.map((deck) => (
              <Card key={deck.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="line-clamp-2">{deck.name}</CardTitle>
                  {deck.description && <CardDescription className="line-clamp-2">{deck.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      <p>{deck.card_count} cards</p>
                      <p>Created {new Date(deck.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/decks/${deck.id}`} className="flex-1">
                        <Button variant="default" className="w-full">
                          Study
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteDeck(deck.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
