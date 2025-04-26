'use client'
import { HeroHeader } from '@/components/hero5-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Search, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function AnalysisPage() {
    const [jobId, setJobId] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const validateJobId = (id: string) => {
        if (!id.trim()) {
            return 'Job ID is required'
        }
        if (id.length < 3) {
            return 'Job ID must be at least 3 characters'
        }
        return null
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)

        const validationError = validateJobId(jobId)
        if (validationError) {
            setError(validationError)
            return
        }

        setIsLoading(true)
        try {
            // TODO: Replace with actual API call to validate job ID
            await new Promise(resolve => setTimeout(resolve, 500)) // Simulated API call
            router.push(`/analysis/${jobId}`)
        } catch (err) {
            setError('Failed to analyze job. Please try again.')
            setIsLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-background to-background/80">
            <HeroHeader />
            <div className="container mx-auto px-4 pt-32">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto max-w-2xl"
                >
                    <div className="mb-12 text-center">
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60"
                        >
                            Job Analysis
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="text-muted-foreground text-lg"
                        >
                            Enter your job ID to analyze its performance and get detailed insights.
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="bg-card/50 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-border/50"
                    >
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="jobId" className="text-sm font-medium flex items-center gap-2">
                                    <Search className="w-4 h-4" />
                                    Enter Job ID
                                </label>
                                <div className="relative">
                                    <Input
                                        id="jobId"
                                        type="text"
                                        placeholder="Enter your job ID"
                                        value={jobId}
                                        onChange={(e) => {
                                            setJobId(e.target.value)
                                            setError(null)
                                        }}
                                        className="w-full pl-10 bg-background/50"
                                        disabled={isLoading}
                                    />
                                    <BarChart3 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                </div>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    <Alert variant="destructive">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                </motion.div>
                            )}

                            <Button 
                                type="submit" 
                                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    'Analyze Job'
                                )}
                            </Button>
                        </form>
                    </motion.div>
                </motion.div>
            </div>
        </main>
    )
} 