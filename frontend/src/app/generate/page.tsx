"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, FileText, Sparkles, AlertCircle, CheckCircle, Upload, X } from "lucide-react"
import { FlashcardViewer } from "@/components/flashcard-viewer"
import { useFlashcards } from "@/hooks/use-flashcards"
import { useHealthCheck } from "@/hooks/use-health-check"
import { Navigation } from "@/components/navigation"
import { LoadingSpinner } from "@/components/loading-spinner"

export default function GeneratePage() {
  const [inputText, setInputText] = useState("")
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { flashcards, isLoading, error, generateFlashcards, uploadFileForFlashcards, clearFlashcards, clearError } =
    useFlashcards()
  const { isHealthy, isLoading: healthLoading, error: healthError, checkHealth } = useHealthCheck()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      const supportedFile = files.find(
        (file) =>
          file.type.startsWith("text/") ||
          file.name.endsWith(".txt") ||
          file.name.endsWith(".md") ||
          file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf") ||
          file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          file.name.toLowerCase().endsWith(".docx"),
      )

      if (supportedFile) {
        setUploadedFile(supportedFile)
        setInputText("") // Clear text when file is selected
        if (error) clearError()
      } else {
        alert("Please drop a supported file format: PDF, DOCX, TXT, or MD")
      }
    },
    [error, clearError],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        setUploadedFile(file)
        setInputText("") // Clear text when file is selected
        if (error) clearError()
      }
    },
    [error, clearError],
  )

  const removeFile = useCallback(() => {
    setUploadedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  const handleGenerateFromText = async () => {
    await generateFlashcards(inputText)
  }

  const handleGenerateFromFile = async () => {
    if (uploadedFile) {
      await uploadFileForFlashcards(uploadedFile)
    }
  }

  const handleReset = () => {
    clearFlashcards()
    setInputText("")
    clearError()
    removeFile()
  }

  const hasTextInput = inputText.trim().length > 0
  const hasFileInput = uploadedFile !== null
  const canGenerate = (hasTextInput || hasFileInput) && isHealthy && !isLoading

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {flashcards.length === 0 ? (
          /* Input Interface */
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">Generate Your Flashcards</h1>
              <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
                Transform your study material into interactive flashcards using AI
              </p>
            </div>

            <div className="flex justify-center">
              {healthLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
                  <LoadingSpinner size="sm" />
                  <span className="text-sm">Checking backend status...</span>
                </div>
              ) : isHealthy ? (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full border border-green-200">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Backend Ready</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-destructive-foreground bg-destructive px-4 py-2 rounded-full">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Backend Offline</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={checkHealth}
                    className="text-xs px-2 py-1 h-auto ml-2 bg-destructive-foreground text-destructive border-destructive-foreground hover:bg-destructive-foreground/90"
                  >
                    Retry
                  </Button>
                </div>
              )}
            </div>

            {!isHealthy && !healthLoading && (
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                      <h3 className="font-medium text-destructive-foreground">Backend Server Unavailable</h3>
                      <p className="text-sm text-destructive-foreground/90 mt-1">
                        The AI backend server is not responding. Please make sure it's running at http://127.0.0.1:8000
                      </p>
                      {healthError && <p className="text-xs text-destructive-foreground/80 mt-2">{healthError}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Text Input Method */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-card-foreground">
                    <FileText className="h-5 w-5 text-primary" />
                    Paste Text
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Paste your study notes, lecture content, or any text material here..."
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value)
                      if (uploadedFile) removeFile() // Clear file when typing
                      if (error) clearError()
                    }}
                    className="min-h-[200px] resize-none bg-input border-border text-foreground placeholder:text-muted-foreground"
                    disabled={isLoading}
                  />

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">{inputText.length} characters</div>
                    <Button
                      onClick={handleGenerateFromText}
                      disabled={!hasTextInput || !isHealthy || isLoading}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate from Text
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* File Upload Method */}
              <Card className={`border-border transition-colors ${isDragOver ? "border-primary bg-primary/5" : ""}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-card-foreground">
                    <Upload className="h-5 w-5 text-primary" />
                    Upload File
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {uploadedFile ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-4 bg-primary/10 rounded-md border border-primary/20">
                        <FileText className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{uploadedFile.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={removeFile}
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button
                        onClick={handleGenerateFromFile}
                        disabled={!hasFileInput || !isHealthy || isLoading}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing File...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate from File
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div
                      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">
                          Drag and drop your file here, or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground">Supports PDF, DOCX, TXT, and MD files</p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-4 border-border text-foreground hover:bg-accent"
                        disabled={isLoading}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Choose File
                      </Button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.md,.pdf,.docx,text/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {error && (
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div className="text-sm text-destructive-foreground">{error}</div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tips Section */}
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <h3 className="font-semibold text-card-foreground mb-3">Tips for Better Flashcards:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Include key concepts, definitions, and important facts in your material</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Use structured content like lecture notes, textbook chapters, or study guides</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>The more detailed and organized your input, the better the generated questions</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Flashcard Results */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Your Flashcards</h1>
                <p className="text-muted-foreground">
                  Generated {flashcards.length} flashcard{flashcards.length !== 1 ? "s" : ""} from your material
                </p>
              </div>
              <Button
                onClick={handleReset}
                variant="outline"
                className="border-border text-foreground hover:bg-accent bg-transparent"
              >
                Create New Set
              </Button>
            </div>

            <FlashcardViewer flashcards={flashcards} />
          </div>
        )}
      </div>
    </div>
  )
}
