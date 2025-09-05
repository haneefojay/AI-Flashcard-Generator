interface Flashcard {
  question: string
  answer: string
}

interface GenerateFlashcardsRequest {
  text: string
}

interface GenerateFlashcardsResponse {
  cards: Flashcard[]
}

interface UploadFlashcardsResponse {
  cards: Flashcard[]
}

interface HealthResponse {
  status: string
  message?: string
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl = "http://127.0.0.1:8000") {
    this.baseUrl = baseUrl
  }

  async healthCheck(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Health check error:", error)
      throw new Error("Backend server is not available")
    }
  }

  async generateFlashcards(text: string): Promise<GenerateFlashcardsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/flashcards/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text } as GenerateFlashcardsRequest),
      })

      if (!response.ok) {
        if (response.status === 422) {
          throw new Error("Invalid input text. Please check your content and try again.")
        }
        if (response.status >= 500) {
          throw new Error("Server error. Please try again later.")
        }
        throw new Error(`Failed to generate flashcards: ${response.status}`)
      }

      const data = await response.json()

      if (!data.cards || !Array.isArray(data.cards)) {
        throw new Error("Invalid response format from server")
      }

      return data
    } catch (error) {
      console.error("Generate flashcards error:", error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Failed to generate flashcards. Please make sure the backend is running.")
    }
  }

  async uploadFileForFlashcards(file: File): Promise<UploadFlashcardsResponse> {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`${this.baseUrl}/flashcards/upload`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        if (response.status === 422) {
          throw new Error("Invalid file format or content. Please check your file and try again.")
        }
        if (response.status >= 500) {
          throw new Error("Server error. Please try again later.")
        }
        throw new Error(`Failed to process file: ${response.status}`)
      }

      const data = await response.json()

      if (!data.cards || !Array.isArray(data.cards)) {
        throw new Error("Invalid response format from server")
      }

      return data
    } catch (error) {
      console.error("Upload file error:", error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Failed to process uploaded file. Please make sure the backend is running.")
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export types
export type {
  Flashcard,
  GenerateFlashcardsRequest,
  GenerateFlashcardsResponse,
  UploadFlashcardsResponse,
  HealthResponse,
}
