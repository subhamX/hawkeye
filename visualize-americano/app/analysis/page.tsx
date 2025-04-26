'use client'
import { HeroHeader } from '@/components/hero5-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export default function AnalysisPage() {
    const [jobId, setJobId] = useState('')

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        // TODO: Handle job ID submission
        console.log('Job ID:', jobId)
    }

    return (
        <main className="min-h-screen bg-background">
            <HeroHeader />
            <div className="container mx-auto px-4 pt-32">
                <div className="mx-auto max-w-2xl">
                    <h1 className="mb-8 text-4xl font-bold">Job Analysis</h1>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="jobId" className="text-sm font-medium">
                                Enter Job ID
                            </label>
                            <Input
                                id="jobId"
                                type="text"
                                placeholder="Enter your job ID"
                                value={jobId}
                                onChange={(e) => setJobId(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <Button type="submit" className="w-full">
                            Analyze Job
                        </Button>
                    </form>
                </div>
            </div>
        </main>
    )
} 