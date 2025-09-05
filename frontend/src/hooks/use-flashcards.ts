"use client"

import { useState } from "react"
import { apiClient, type Flashcard } from "@/lib/api-client"

interface UseFlashcardsReturn {
  flashcards: Flashcard[]
  isLoading: boolean
  error: string | null
  generateFlashcards: (text: string) => Promise<void>
  uploadFileForFlashcards: (file: File) => Promise<void>
  clearFlashcards: () => void
  clearError: () => void
}

export function useFlashcards(): UseFlashcardsReturn {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateFlashcards = async (text: string) => {
    if (!text.trim()) {
      setError("Please enter some text to generate flashcards.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.generateFlashcards(text)
      setFlashcards(response.cards)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate flashcards")
      setFlashcards([])
    } finally {
      setIsLoading(false)
    }
  }

  const uploadFileForFlashcards = async (file: File) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.uploadFileForFlashcards(file)
      setFlashcards(response.cards)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process uploaded file")
      setFlashcards([])
    } finally {
      setIsLoading(false)
    }
  }

  const clearFlashcards = () => {
    setFlashcards([])
    setError(null)
  }

  const clearError = () => {
    setError(null)
  }

  return {
    flashcards,
    isLoading,
    error,
    generateFlashcards,
    uploadFileForFlashcards,
    clearFlashcards,
    clearError,
  }
}
