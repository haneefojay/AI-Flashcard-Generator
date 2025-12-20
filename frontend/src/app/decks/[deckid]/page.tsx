"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { useDecks } from "@/hooks/use-decks"
import { Navigation } from "@/components/navigation"
import { Download, Share2, Trash2, ChevronLeft, ChevronRight, Edit2, Check, X, Sparkles } from "lucide-react"
import { apiClient, type Deck, type Flashcard } from "@/lib/api-client"
import { FlashcardViewer } from "@/components/flashcard-viewer"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Modal } from "@/components/ui/modal"
import Link from "next/link"

export default function DeckDetailPage() {
  const router = useRouter()
  const params = useParams()
  const deckId = params.deckid as string
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { deleteDeck, exportDeck, shareDeck, updateDeck } = useDecks()
  const [deck, setDeck] = useState<Deck | null>(null)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Modal States
  const [showShareModal, setShowShareModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [shareUrl, setShareUrl] = useState("")

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
        setEditName(deckData.name)
        setEditDescription(deckData.description || "")
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

  const handleUpdate = async () => {
    try {
      setIsSaving(true)
      const updated = await updateDeck(deckId, { name: editName, description: editDescription })
      setDeck(updated)
      setIsEditing(false)
    } catch (err) {
      console.error("Update failed:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleExport = async () => {
    try {
      await exportDeck(deckId, deck?.name)
    } catch (err) {
      console.error("Export failed:", err)
    }
  }

  const handleShare = async () => {
    try {
      const url = await shareDeck(deckId)
      if (navigator.share) {
        await navigator.share({ title: deck?.name, url: url })
      } else {
        await navigator.clipboard.writeText(url)
        setShareUrl(url)
        setShowShareModal(true)
      }
    } catch (err) {
      console.error("Share failed:", err)
    }
  }

  const handleDelete = async () => {
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    try {
      await deleteDeck(deckId)
      router.push("/decks")
    } catch (err) {
      console.error("Delete failed:", err)
    } finally {
      setShowDeleteModal(false)
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-start justify-between mb-8 gap-4">
          <Button variant="ghost" onClick={() => router.push("/decks")} className="mb-4 -ml-2">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex gap-2 shrink-0">
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
        <div className="flex items-center justify-center mb-8 gap-4">
          {isEditing ? (
            <div className="space-y-4">
              <Input
                value={editName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
                className="text-2xl font-bold h-auto py-1"
                placeholder="Deck Name"
              />
              <Textarea
                value={editDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditDescription(e.target.value)}
                placeholder="Add a description..."
                className="resize-none"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleUpdate} disabled={isSaving}>
                  {isSaving ? "Saving..." : <><Check className="h-4 w-4 mr-1" /> Save</>}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{deck.name}</h1>
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="h-8 w-8">
                  <Edit2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              {deck.description && <p className="text-sm text-muted-foreground mt-2">{deck.description}</p>}
            </div>
          )}
        </div>

        {flashcards.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No flashcards in this deck yet</p>
              <Link href={`/generate?deckId=${deckId}`}>
                <Button>Generate Flashcards</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <FlashcardViewer flashcards={flashcards} />
          </div>
        )}

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
      </div>
      {/* Modals */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Link Copied!"
        description="The share link has been copied to your clipboard. You can now send it to anyone."
        type="success"
        confirmText="Got it"
        cancelText=""
      />

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Deck"
        description={`Are you sure you want to delete "${deck.name}"? This will permanently remove all associated flashcards.`}
        type="danger"
        confirmText="Delete Permanently"
        onConfirm={confirmDelete}
      />
    </div>
  )
}
