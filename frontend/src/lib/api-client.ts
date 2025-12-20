
interface Flashcard {
  id: string
  question: string
  answer?: string
  options?: {
    A: string
    B: string
    C: string
    D: string
  }
  correct_answer?: string
  deck_id: string
}

interface GenerateFlashcardsRequest {
  text: string
  count?: number
  question_mode?: "multiple_choice" | "open-ended"
  difficulty?: "beginner" | "intermediate" | "advanced"
  deck_id?: string
}

interface GenerateFlashcardsResponse {
  cards: Flashcard[]
  summary?: string
}

interface UploadFlashcardsResponse {
  cards: Flashcard[]
  summary?: string
}

interface HealthResponse {
  status: string
  message?: string
}

interface AuthResponse {
  access_token: string
  token_type: string
}

interface RegisterRequest {
  email: string
  password: string
  name?: string
}

interface LoginRequest {
  email: string
  password: string
}

interface UserProfile {
  id: string
  email: string
  name: string
  is_verified: boolean
  has_password: boolean
  created_at: string
}

interface UpdateProfileRequest {
  name?: string
  password?: string
  current_password?: string
}

interface Deck {
  id: string
  name: string
  description?: string
  summary?: string
  created_at: string
  updated_at: string
  card_count: number
}

interface DeckResponse {
  decks: Deck[]
}

interface CreateDeckRequest {
  name: string
  description?: string
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl = "http://127.0.0.1:8000") {
    this.baseUrl = baseUrl
    // Load token from localStorage if available
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token")
    }
  }

  setToken(token: string) {
    this.token = token
    localStorage.setItem("auth_token", token)
  }

  clearToken() {
    this.token = null
    localStorage.removeItem("auth_token")
  }

  private getAuthHeaders() {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (this.token) {
      // Token already includes type (Bearer) from setToken
      headers["Authorization"] = this.token
    }
    return headers
  }

  private async parseErrorResponse(response: Response, fallbackMessage: string): Promise<never> {
    let errorBody: unknown = null
    try {
      errorBody = await response.json()
    } catch {
      // ignore JSON parse errors
    }
    const detail = (errorBody && typeof errorBody === "object" && "detail" in (errorBody as Record<string, unknown>)
      ? (errorBody as Record<string, unknown>)["detail"]
      : (errorBody && typeof errorBody === "object" && "message" in (errorBody as Record<string, unknown>)
        ? (errorBody as Record<string, unknown>)["message"]
        : null)) as string | null
    const message = detail || fallbackMessage
    const err: Error & { status?: number } = new Error(message)
    err.status = response.status
    throw err
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



  async generateFlashcards(
    text: string,
    count?: number,
    questionMode?: "multiple_choice" | "open-ended" | "true_false",
    difficulty?: "beginner" | "intermediate" | "advanced",
    deckId?: string,
  ): Promise<GenerateFlashcardsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/flashcards/generate`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          text,
          count,
          question_mode: questionMode,
          difficulty,
          deck_id: deckId,
        } as GenerateFlashcardsRequest),
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

  async uploadFileForFlashcards(
    file: File,
    count?: number,
    questionMode?: "multiple_choice" | "open-ended" | "true_false",
    difficulty?: "beginner" | "intermediate" | "advanced",
    deckId?: string,
  ): Promise<UploadFlashcardsResponse> {
    try {
      const formData = new FormData()
      formData.append("file", file)
      if (count) formData.append("count", count.toString())
      if (questionMode) formData.append("question_mode", questionMode)
      if (difficulty) formData.append("difficulty", difficulty)
      if (deckId) formData.append("deck_id", deckId)

      const headers: Record<string, string> = {}
      if (this.token) {
        headers["Authorization"] = this.token
      }

      const response = await fetch(`${this.baseUrl}/flashcards/upload`, {
        method: "POST",
        headers,
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

  async getFlashcards(deckId: string): Promise<Flashcard[]> {
    try {
      const response = await fetch(`${this.baseUrl}/flashcards/${deckId}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch flashcards")
      }

      return await response.json()
    } catch (error) {
      console.error("Get flashcards error:", error)
      throw error
    }
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Registration failed")
      }

      const result = await response.json()
      // Store both token and type (the backend returns token_type: "bearer")
      this.setToken(`${result.token_type} ${result.access_token}`)
      return result
    } catch (error) {
      console.error("Register error:", error)
      throw error
    }
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        await this.parseErrorResponse(response, "Login failed")
      }

      const result = await response.json()
      // Store both token and type
      this.setToken(`${result.token_type} ${result.access_token}`)
      return result
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  async loginWithGoogle(credential: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      })

      if (!response.ok) {
        await this.parseErrorResponse(response, "Google sign-in failed")
      }

      const result = await response.json()
      this.setToken(`${result.token_type} ${result.access_token}`)
      return result
    } catch (error) {
      console.error("Google login error:", error)
      throw error
    }
  }

  async getProfile(): Promise<UserProfile> {
    try {
      const response = await fetch(`${this.baseUrl}/users/me`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        await this.parseErrorResponse(response, "Failed to fetch profile")
      }

      return await response.json()
    } catch (error) {
      console.error("Get profile error:", error)
      throw error
    }
  }

  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    try {
      const response = await fetch(`${this.baseUrl}/users/me`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      return await response.json()
    } catch (error) {
      console.error("Update profile error:", error)
      throw error
    }
  }

  async deleteAccount(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/users/me`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to delete account")
      }

      this.clearToken()
    } catch (error) {
      console.error("Delete account error:", error)
      throw error
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        throw new Error("Failed to send reset email")
      }

      return await response.json()
    } catch (error) {
      console.error("Forgot password error:", error)
      throw error
    }
  }

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      if (!response.ok) {
        throw new Error("Failed to reset password")
      }

      return await response.json()
    } catch (error) {
      console.error("Reset password error:", error)
      throw error
    }
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      // Backend endpoint expects query param `token` at /auth/verify-email
      const response = await fetch(`${this.baseUrl}/auth/verify-email?token=${encodeURIComponent(token)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        // Try to parse backend error body (detail/message)
        let errorBody: unknown = null
        try {
          errorBody = await response.json()
        } catch {
          // ignore JSON parse errors
        }

        // Narrow possible shapes
        const detail = (errorBody && typeof errorBody === "object" && "detail" in (errorBody as Record<string, unknown>)
          ? (errorBody as Record<string, unknown>)["detail"]
          : (errorBody && typeof errorBody === "object" && "message" in (errorBody as Record<string, unknown>)
            ? (errorBody as Record<string, unknown>)["message"]
            : null)) as string | null

        const message = detail || `Verification failed (${response.status})`
        const err: Error & { status?: number } = new Error(message)
        err.status = response.status
        throw err
      }

      // The backend returns an HTMLResponse on success. Try to read text first,
      // but if it returned JSON, parse it.
      const contentType = response.headers.get("content-type") || ""
      if (contentType.includes("application/json")) {
        return await response.json()
      }

      const text = await response.text()
      return { message: text }
    } catch (error) {
      console.error("Verify email error:", error)
      throw error
    }
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/resend-verification?email=${encodeURIComponent(email)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        return this.parseErrorResponse(response, "Failed to resend verification email")
      }

      return await response.json()
    } catch (error) {
      console.error("Resend verification error:", error)
      throw error
    }
  }

  async listDecks(): Promise<Deck[]> {
    try {
      const response = await fetch(`${this.baseUrl}/decks`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch decks")
      }

      const data = await response.json()
      return data || []
    } catch (error) {
      console.error("List decks error:", error)
      throw error
    }
  }

  async getDeck(deckId: string): Promise<Deck> {
    try {
      const response = await fetch(`${this.baseUrl}/decks/${deckId}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch deck")
      }

      return await response.json()
    } catch (error) {
      console.error("Get deck error:", error)
      throw error
    }
  }

  async createDeck(data: CreateDeckRequest): Promise<Deck> {
    try {
      const response = await fetch(`${this.baseUrl}/decks`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to create deck")
      }

      return await response.json()
    } catch (error) {
      console.error("Create deck error:", error)
      throw error
    }
  }

  async updateDeck(deckId: string, data: { name?: string; description?: string }): Promise<Deck> {
    try {
      const response = await fetch(`${this.baseUrl}/decks/${deckId}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to update deck")
      }

      return await response.json()
    } catch (error) {
      console.error("Update deck error:", error)
      throw error
    }
  }

  async deleteDeck(deckId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/decks/${deckId}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to delete deck")
      }
    } catch (error) {
      console.error("Delete deck error:", error)
      throw error
    }
  }

  async exportDeckPDF(deckId: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/decks/${deckId}/export?format=pdf`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to export deck")
      }

      return await response.blob()
    } catch (error) {
      console.error("Export deck error:", error)
      throw error
    }
  }

  async shareDeck(deckId: string): Promise<{ share_url: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/decks/${deckId}/share`, {
        method: "POST",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to share deck")
      }

      return await response.json()
    } catch (error) {
      console.error("Share deck error:", error)
      throw error
    }
  }

  async getSharedDeck(shareId: string): Promise<Deck> {
    try {
      const response = await fetch(`${this.baseUrl}/decks/share/${shareId}`, {
        method: "GET",
      })

      if (!response.ok) {
        throw new Error("Shared deck not found")
      }

      return await response.json()
    } catch (error) {
      console.error("Get shared deck error:", error)
      throw error
    }
  }

  async getSharedFlashcards(shareId: string): Promise<Flashcard[]> {
    try {
      const response = await fetch(`${this.baseUrl}/flashcards/share/${shareId}`, {
        method: "GET",
      })

      if (!response.ok) {
        throw new Error("Shared flashcards not found")
      }

      return await response.json()
    } catch (error) {
      console.error("Get shared flashcards error:", error)
      throw error
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
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  UserProfile,
  UpdateProfileRequest,
  Deck,
  DeckResponse,
  CreateDeckRequest,
}
