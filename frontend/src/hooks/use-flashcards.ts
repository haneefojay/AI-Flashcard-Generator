"use client"

import { useState } from "react"
import { apiClient, type Flashcard } from "@/lib/api-client"

interface UseFlashcardsReturn {
  flashcards: Flashcard[]
  isLoading: boolean
  error: string | null
  generateFlashcards: (
    text: string,
    count?: number,
    questionMode?: "multiple_choice" | "open-ended" | "true_false",
    difficulty?: "beginner" | "intermediate" | "advanced",
  ) => Promise<void>
  uploadFileForFlashcards: (
    file: File,
    count?: number,
    questionMode?: "multiple_choice" | "open-ended" | "true_false",
    difficulty?: "beginner" | "intermediate" | "advanced",
  ) => Promise<void>
  clearFlashcards: () => void
  clearError: () => void
}

export function useFlashcards(): UseFlashcardsReturn {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateFlashcards = async (
    text: string,
    count?: number,
    questionMode?: "multiple_choice" | "open-ended",
    difficulty?: "beginner" | "intermediate" | "advanced",
  ) => {
    if (!text.trim()) {
      setError("Please enter some text to generate flashcards.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.generateFlashcards(text, count, questionMode, difficulty)
      setFlashcards(response.cards)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate flashcards")
      setFlashcards([])
    } finally {
      setIsLoading(false)
    }
  }

  const uploadFileForFlashcards = async (
    file: File,
    count?: number,
    questionMode?: "multiple_choice" | "open-ended",
    difficulty?: "beginner" | "intermediate" | "advanced",
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.uploadFileForFlashcards(file, count, questionMode, difficulty)
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
