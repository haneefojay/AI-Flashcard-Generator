"use client"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { Brain, CheckCircle, AlertCircle } from "lucide-react"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { verifyEmail } = useAuth()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get("token")

      if (!token) {
        setStatus("error")
        setMessage("No verification token provided")
        return
      }

      try {
        await verifyEmail(token)
        setStatus("success")
        setMessage("Email verified successfully! Redirecting to login...")
        setTimeout(() => router.push("/auth/login"), 2000)
      } catch (err) {
        setStatus("error")
        setMessage(err instanceof Error ? err.message : "Email verification failed")
      }
    }

    verifyToken()
  }, [searchParams, verifyEmail, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Brain className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-foreground">FlashAI</span>
        </div>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Verify Email</CardTitle>
            <CardDescription>Verifying your email address</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center space-y-4">
              {status === "loading" && (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="text-muted-foreground">Verifying your email...</p>
                </>
              )}

              {status === "success" && (
                <>
                  <CheckCircle className="h-12 w-12 text-green-500" />
                  <p className="text-center text-foreground font-medium">{message}</p>
                </>
              )}

              {status === "error" && (
                <>
                  <AlertCircle className="h-12 w-12 text-destructive" />
                  <p className="text-center text-destructive">{message}</p>
                  <Link href="/auth/login" className="w-full">
                    <Button className="w-full">Back to Login</Button>
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
