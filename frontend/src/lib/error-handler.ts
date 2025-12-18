/**
 * Comprehensive error handler for parsing backend API responses
 * Supports multiple error response formats and provides user-friendly messages
 */

interface ErrorResponse {
  detail?: string | { msg?: string; type?: string }[]
  message?: string
  error?: string
  errors?: Array<{ msg?: string; field?: string }>
  msg?: string
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public userMessage: string,
    public debugMessage?: string,
  ) {
    super(userMessage)
    this.name = "ApiError"
  }
}

/**
 * Parse error response from backend and extract message
 * Only returns errors provided by the backend, no hardcoded frontend messages
 */
export function parseErrorResponse(response: Response, data: any): string {
  // Handle validation errors (422) - extract detailed error messages
  if (response.status === 422) {
    if (Array.isArray(data?.detail)) {
      const messages = data.detail
        .map((err: any) => {
          if (typeof err === "object" && err.msg) {
            return err.msg
          }
          return null
        })
        .filter(Boolean)
      if (messages.length > 0) {
        return messages.join(", ")
      }
    }
    if (typeof data?.detail === "string") {
      return data.detail
    }
  }

  // Try to extract message from various response formats
  if (typeof data?.detail === "string") {
    return data.detail
  }
  if (typeof data?.message === "string") {
    return data.message
  }
  if (typeof data?.error === "string") {
    return data.error
  }
  if (typeof data?.msg === "string") {
    return data.msg
  }

  // Fallback: return status code if no error message from backend
  return `Error: ${response.status}`
}

/**
 * Handle fetch errors and network issues
 */
export function handleFetchError(error: unknown): string {
  if (error instanceof TypeError) {
    if (error.message.includes("Failed to fetch")) {
      return "Failed to connect to server"
    }
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return "An error occurred"
}

/**
 * Validate response data structure
 */
export function validateResponseData(data: any, expectedFields: string[]): boolean {
  if (!data || typeof data !== "object") {
    return false
  }

  return expectedFields.every((field) => field in data)
}
