interface AnalysisData {
    awsec2hawk?: any[]
    awscfnhawk?: any[]
    awss3hawk?: any[]
}

import { NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import AnalysisDetailClient from './AnalysisDetailClient'
import { HeroHeader } from '@/components/hero5-header'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
    },
})

export default async function AnalysisDetailPage({
    params,
}: {
    params: { id: string }
}) {
    try {
        const command = new GetObjectCommand({
            Bucket: 'aws-hawk',
            Key: `${params.id}/super.json`,
        })
        
        const response = await s3Client.send(command)
        const bodyContents = await response.Body?.transformToString()
        
        if (!bodyContents) {
            throw new Error('No data found')
        }

        const analysisData = JSON.parse(bodyContents)
        
        return <AnalysisDetailClient initialData={analysisData} />
    } catch (error) {
        console.error('Error fetching analysis data:', error)
        return (
            <>
                <HeroHeader />
                <div className="bg-background flex items-center justify-center pt-50">
                    <div className="text-center space-y-6 max-w-2xl mx-auto p-8 rounded-xl border bg-card shadow-lg">
                        <div className="flex justify-center">
                            <div className="rounded-full bg-destructive/10 p-3">
                                <AlertCircle className="h-8 w-8 text-destructive" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-semibold text-destructive">Analysis Not Found</h1>
                            <p className="text-muted-foreground">
                                {error instanceof Error ? error.message : 'Failed to fetch analysis data'}
                            </p>
                        </div>
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                The analysis you're looking for might have been removed or the ID is incorrect.
                            </p>
                            <div className="flex justify-center gap-4">
                                <Button variant="outline" asChild>
                                    <Link href="/analysis" className="flex items-center gap-2">
                                        <ArrowLeft className="h-4 w-4" />
                                        Back to Analysis Dashboard
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        )
    }
} 