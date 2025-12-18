"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { Navigation } from "@/components/navigation"
import { LogOut, Trash2, ChevronLeft, Loader2 } from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading, logout, updateProfile, deleteAccount } = useAuth()
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login")
    } else if (user) {
      setName(user.name)
    }
  }, [isAuthenticated, authLoading, user, router])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (password && password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password && password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    try {
      setIsUpdating(true)
      await updateProfile(name || undefined, password || undefined)
      setSuccess("Profile updated successfully")
      setPassword("")
      setConfirmPassword("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        setIsDeleting(true)
        await deleteAccount()
        router.push("/")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete account")
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-2xl mx-auto px-4 py-12">
        <Button variant="ghost" onClick={() => router.back()} className="mb-8">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Profile Settings</h1>
            <p className="text-muted-foreground">Manage your account information and preferences</p>
          </div>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-card-foreground">Account Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <div className="px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground">
                  {user?.email}
                </div>
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Member Since</label>
                <div className="px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Update Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="text-card-foreground">Update Profile</CardTitle>
              <CardDescription>Change your name or password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-foreground">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
                    New Password (optional)
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Leave blank to keep current password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
                    {success}
                  </div>
                )}

                <Button type="submit" disabled={isUpdating} className="w-full">
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Profile"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium text-foreground">Delete Account</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  variant="outline"
                  className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive bg-transparent"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Logout */}
          <Card>
            <CardContent className="p-6">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full border-border text-foreground bg-transparent"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
