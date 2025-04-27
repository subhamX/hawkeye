'use server'

import { drizzleDb } from '@/drizzle-db/db'
import { contactUs } from '@/drizzle-db/schema'
import { nanoid } from 'nanoid'
import { headers } from 'next/headers'

export async function joinWaitlist(formData: FormData) {
    const email = formData.get('email') as string
    const message = formData.get('message') as string | null

    if (!email) {
        return { error: 'Email is required' }
    }
    const headersList = await headers();

    // Get geolocation data from Vercel headers
    const country = headersList.get('x-vercel-ip-country');
    const city = headersList.get('x-vercel-ip-city');
    const region = headersList.get('x-vercel-ip-region');
    const latitude = headersList.get('x-vercel-ip-latitude');
    const longitude = headersList.get('x-vercel-ip-longitude');
    const ipAddress = headersList.get('x-real-ip') || headersList.get('x-forwarded-for');
    const userAgent = headersList.get('user-agent');

    try {
        await drizzleDb.insert(contactUs).values({
            id: nanoid(),
            email,
            country,
            city,
            region,
            latitude,
            longitude,
            ipAddress,
            userAgent,
            message: message || '',
            createdAt: new Date(),
        })

        return { success: true }
    } catch (error) {
        console.error('Error joining waitlist:', error)
        return { error: 'Failed to join waitlist. Please try again.' }
    }
} 