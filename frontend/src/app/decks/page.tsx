"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { useDecks } from "@/hooks/use-decks"
import { Navigation } from "@/components/navigation"
import { Plus, Trash2 } from "lucide-react"
import { Modal } from "@/components/ui/modal"

export default function DecksPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { decks, isLoading, error, fetchDecks, deleteDeck, createDeck } = useDecks()
  const [searchTerm, setSearchTerm] = useState("")
  const [showNewDeckForm, setShowNewDeckForm] = useState(false)
  const [newDeckName, setNewDeckName] = useState("")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deckToDelete, setDeckToDelete] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login")
    } else if (isAuthenticated) {
      fetchDecks()
    }
  }, [isAuthenticated, authLoading, router, fetchDecks])

  const filteredDecks = decks.filter((deck) => deck.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleDeleteDeck = async (deckId: string) => {
    setDeckToDelete(deckId)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deckToDelete) return
    try {
      await deleteDeck(deckToDelete)
    } catch (err) {
      console.error("Failed to delete deck:", err)
    } finally {
      setShowDeleteModal(false)
      setDeckToDelete(null)
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Your Decks</h1>
            <p className="text-muted-foreground">Manage and study your flashcard decks</p>
          </div>
          <Button className="gap-2 w-full sm:w-auto justify-center" onClick={() => setShowNewDeckForm(!showNewDeckForm)}>
            <Plus className="h-4 w-4" />
            {showNewDeckForm ? "Cancel" : "New Deck"}
          </Button>
        </div>

        {showNewDeckForm && (
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Create New Deck</CardTitle>
              <CardDescription>Give your deck a name to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!newDeckName.trim()) return
                  try {
                    await createDeck({ name: newDeckName })
                    setNewDeckName("")
                    setShowNewDeckForm(false)
                  } catch (err) {
                    console.error("Failed to create deck:", err)
                  }
                }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <input
                  type="text"
                  placeholder="e.g. Biology 101, Midterm Revision..."
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  className="w-full sm:flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
                <Button type="submit" disabled={!newDeckName.trim() || isLoading} className="w-full sm:w-auto">
                  {isLoading ? "Creating..." : "Create Deck"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search decks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {error && (
          <Card className="mb-8 border-destructive/20 bg-destructive/5 p-4">
            <p className="text-destructive text-sm text-center">{error}</p>
          </Card>
        )}

        {filteredDecks.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              {searchTerm ? "No decks found matching your search" : "No decks yet. Create one to get started!"}
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
                          View
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

      {/* Modals */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Deck"
        description="Are you sure you want to delete this deck? All flashcards inside will be permanently removed."
        type="danger"
        confirmText="Yes, Delete"
        onConfirm={confirmDelete}
      />
    </div>
  )
}
