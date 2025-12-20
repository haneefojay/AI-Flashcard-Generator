"use client"

import { useState } from "react"
import { apiClient, type Flashcard } from "@/lib/api-client"

interface UseFlashcardsReturn {
  flashcards: Flashcard[]
  summary: string | null
  isLoading: boolean
  error: string | null
  generateFlashcards: (
    text: string,
    count?: number,
    questionMode?: "multiple_choice" | "open-ended" | "true_false",
    difficulty?: "beginner" | "intermediate" | "advanced",
    deckId?: string,
  ) => Promise<void>
  uploadFileForFlashcards: (
    file: File,
    count?: number,
    questionMode?: "multiple_choice" | "open-ended" | "true_false",
    difficulty?: "beginner" | "intermediate" | "advanced",
    deckId?: string,
  ) => Promise<void>
  clearFlashcards: () => void
  clearError: () => void
}

export function useFlashcards(): UseFlashcardsReturn {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [summary, setSummary] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateFlashcards = async (
    text: string,
    count?: number,
    questionMode?: "multiple_choice" | "open-ended" | "true_false",
    difficulty?: "beginner" | "intermediate" | "advanced",
    deckId?: string,
  ) => {
    if (!text.trim()) {
      setError("Please enter some text to generate flashcards.")
      return
    }

    setIsLoading(true)
    setError(null)
    setSummary(null)

    try {
      const response = await apiClient.generateFlashcards(text, count, questionMode, difficulty, deckId)
      setFlashcards(response.cards)
      if (response.summary) {
        setSummary(response.summary)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate flashcards")
      setFlashcards([])
      setSummary(null)
    } finally {
      setIsLoading(false)
    }
  }

  const uploadFileForFlashcards = async (
    file: File,
    count?: number,
    questionMode?: "multiple_choice" | "open-ended" | "true_false",
    difficulty?: "beginner" | "intermediate" | "advanced",
    deckId?: string,
  ) => {
    setIsLoading(true)
    setError(null)
    setSummary(null)

    try {
      const response = await apiClient.uploadFileForFlashcards(file, count, questionMode, difficulty, deckId)
      setFlashcards(response.cards)
      if (response.summary) {
        setSummary(response.summary)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process uploaded file")
      setFlashcards([])
      setSummary(null)
    } finally {
      setIsLoading(false)
    }
  }

  const clearFlashcards = () => {
    setFlashcards([])
    setSummary(null)
    setError(null)
  }

  const clearError = () => {
    setError(null)
  }

  return {
    flashcards,
    summary,
    isLoading,
    error,
    generateFlashcards,
    uploadFileForFlashcards,
    clearFlashcards,
    clearError,
  }
}
