/**
 * Comprehensive error handler for parsing backend API responses
 * Supports multiple error response formats and provides user-friendly messages
 */

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
export function parseErrorResponse(response: Response, data: unknown): string {
  const d = data as Record<string, unknown> | null | undefined

  // Handle validation errors (422) - extract detailed error messages
  if (response.status === 422 && d && Array.isArray(d.detail)) {
    const messages = d.detail
      .map((err: unknown) => {
        if (typeof err === "object" && err !== null && "msg" in err) {
          return (err as { msg: string }).msg
        }
        return null
      })
      .filter((msg): msg is string => msg !== null)

    if (messages.length > 0) {
      return messages.join(", ")
    }
  }

  // Try to extract message from various response formats
  if (d && typeof d.detail === "string") {
    return d.detail
  }
  if (d && typeof d.message === "string") {
    return d.message
  }
  if (d && typeof d.error === "string") {
    return d.error
  }
  if (d && typeof d.msg === "string") {
    return d.msg
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
export function validateResponseData(data: unknown, expectedFields: string[]): boolean {
  if (!data || typeof data !== "object") {
    return false
  }

  const d = data as Record<string, unknown>
  return expectedFields.every((field) => field in d)
}
