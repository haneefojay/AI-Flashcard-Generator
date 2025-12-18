"use client"

import { useState, useCallback } from "react"
import { apiClient, type Deck, type CreateDeckRequest } from "@/lib/api-client"

interface UseDecksReturn {
  decks: Deck[]
  isLoading: boolean
  error: string | null
  createDeck: (data: CreateDeckRequest) => Promise<Deck>
  updateDeck: (deckId: string, data: { name?: string; description?: string }) => Promise<Deck>
  deleteDeck: (deckId: string) => Promise<void>
  fetchDecks: () => Promise<void>
  exportDeck: (deckId: string) => Promise<void>
  shareDeck: (deckId: string) => Promise<string>
}

export function useDecks(): UseDecksReturn {
  const [decks, setDecks] = useState<Deck[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDecks = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await apiClient.listDecks()
      setDecks(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch decks"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createDeck = useCallback(async (data: CreateDeckRequest): Promise<Deck> => {
    try {
      setIsLoading(true)
      setError(null)
      const newDeck = await apiClient.createDeck(data)
      setDecks((prev) => [...prev, newDeck])
      return newDeck
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create deck"
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateDeck = useCallback(
    async (deckId: string, data: { name?: string; description?: string }): Promise<Deck> => {
      try {
        setIsLoading(true)
        setError(null)
        const updated = await apiClient.updateDeck(deckId, data)
        setDecks((prev) => prev.map((d) => (d.id === deckId ? updated : d)))
        return updated
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update deck"
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const deleteDeck = useCallback(async (deckId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      await apiClient.deleteDeck(deckId)
      setDecks((prev) => prev.filter((d) => d.id !== deckId))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete deck"
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const exportDeck = useCallback(async (deckId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      const blob = await apiClient.exportDeckPDF(deckId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `deck-${deckId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to export deck"
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const shareDeck = useCallback(async (deckId: string): Promise<string> => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await apiClient.shareDeck(deckId)
      return result.share_url
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to share deck"
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    decks,
    isLoading,
    error,
    createDeck,
    updateDeck,
    deleteDeck,
    fetchDecks,
    exportDeck,
    shareDeck,
  }
}
