"use client"

import { useState, useCallback, useEffect } from "react"
import { apiClient, type UserProfile } from "@/lib/api-client"

interface UseAuthReturn {
  user: UserProfile | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
  register: (email: string, password: string, name?: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateProfile: (name?: string, password?: string, currentPassword?: string) => Promise<void>
  deleteAccount: () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
  verifyEmail: (token: string) => Promise<void>
  resendVerification: (email: string) => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Load user profile on mount if token exists
  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem("auth_token")
      if (token) {
        try {
          const profile = await apiClient.getProfile()
          setUser(profile)
          setIsAuthenticated(true)
        } catch (err) {
          console.error("Failed to load profile:", err)
          localStorage.removeItem("auth_token")
          setIsAuthenticated(false)
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  const register = useCallback(async (email: string, password: string, name?: string) => {
    try {
      setIsLoading(true)
      setError(null)
      await apiClient.register({ email, password, name })
      const profile = await apiClient.getProfile()
      setUser(profile)
      setIsAuthenticated(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed"
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)
      await apiClient.login({ email, password })
      const profile = await apiClient.getProfile()
      setUser(profile)
      setIsAuthenticated(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed"
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    apiClient.clearToken()
    setUser(null)
    setIsAuthenticated(false)
    setError(null)
  }, [])

  const updateProfile = useCallback(async (name?: string, password?: string, currentPassword?: string) => {
    try {
      setIsLoading(true)
      setError(null)
      const updated = await apiClient.updateProfile({
        name,
        password,
        current_password: currentPassword
      })
      setUser(updated)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed"
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteAccount = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      await apiClient.deleteAccount()
      setUser(null)
      setIsAuthenticated(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Delete failed"
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const forgotPassword = useCallback(async (email: string) => {
    try {
      setIsLoading(true)
      setError(null)
      await apiClient.forgotPassword(email)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed"
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const resetPassword = useCallback(async (token: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)
      await apiClient.resetPassword(token, password)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Reset failed"
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const verifyEmail = useCallback(async (token: string) => {
    try {
      setIsLoading(true)
      setError(null)
      await apiClient.verifyEmail(token)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Verification failed"
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const resendVerification = useCallback(async (email: string) => {
    try {
      setIsLoading(true)
      setError(null)
      await apiClient.resendVerification(email)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to resend verification"
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    register,
    login,
    logout,
    updateProfile,
    deleteAccount,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
  }
}
