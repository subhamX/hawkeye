interface AnalysisData {
    awsec2hawk?: any[]
    awscfnhawk?: any[]
    awss3hawk?: any[]
}

import { NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import AnalysisDetailClient from './AnalysisDetailClient'

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
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-red-600 mb-4">Error</h1>
                    <p className="text-gray-600">
                        {error instanceof Error ? error.message : 'Failed to fetch analysis data'}
                    </p>
                </div>
            </div>
        )
    }
} 