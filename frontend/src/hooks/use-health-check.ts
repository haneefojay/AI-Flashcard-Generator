"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"

interface UseHealthCheckReturn {
  isHealthy: boolean
  isLoading: boolean
  error: string | null
  checkHealth: () => Promise<void>
  lastChecked: Date | null
}

export function useHealthCheck(autoCheck = true): UseHealthCheckReturn {
  const [isHealthy, setIsHealthy] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkHealth = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("[FlashAI] Health check starting...")
      const response = await apiClient.healthCheck()
      console.log("[FlashAI] Health check response:", response)

      const isHealthyResponse = response.status === "ok" || response.status === "healthy"
      console.log("[FlashAI] Health status determined:", isHealthyResponse)

      setIsHealthy(isHealthyResponse)
      setLastChecked(new Date())
    } catch (err) {
      console.log("[FlashAI] Health check error:", err)
      setIsHealthy(false)
      setError(err instanceof Error ? err.message : "Health check failed")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (autoCheck) {
      checkHealth()

      const interval = setInterval(checkHealth, 30000)
      return () => clearInterval(interval)
    }
  }, [autoCheck])

  return {
    isHealthy,
    isLoading,
    error,
    checkHealth,
    lastChecked,
  }
}
