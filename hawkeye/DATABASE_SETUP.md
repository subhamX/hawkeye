# Database Setup Guide

## Prerequisites

1. **PostgreSQL Database**: You need a running PostgreSQL instance
2. **Environment Variables**: Set up your `.env.local` file

## Quick Setup

### 1. Set Environment Variables

Create `.env.local` file:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/hawkeye"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 2. Generate and Run Migrations

```bash
# Generate migration files
bun run db:generate

# Apply migrations to database
bun run db:migrate

# OR push schema directly (for development)
bun run db:push
```

### 3. Verify Setup

```bash
# Open Drizzle Studio to view your database
bun run db:studio
```

## Database Schema

### NextAuth Tables (Required for Authentication)

- **users**: User profiles from Google OAuth
- **accounts**: OAuth account connections
- **sessions**: User sessions
- **verificationTokens**: Email verification tokens

### Application Tables

- **aws_account**: AWS account configurations
- **s3_bucket_config**: S3 bucket monitoring settings
- **analysis_run**: Analysis job tracking
- **s3_analysis_result**: S3 optimization results
- **ec2_analysis_result**: EC2 optimization results
- **job_queue**: Background job processing

## Local Development with Docker

If you don't have PostgreSQL installed locally:

```bash
# Create docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: hawkeye
      POSTGRES_USER: hawkeye
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:

# Run the database
docker-compose up -d
```

Then use: `DATABASE_URL="postgresql://hawkeye:password@localhost:5432/hawkeye"`

## Troubleshooting

### Migration Issues

```bash
# Reset migrations (CAUTION: This will drop all data)
rm -rf drizzle-db/autogen-migrations
bun run db:generate
bun run db:push
```

### Connection Issues

1. Check if PostgreSQL is running
2. Verify DATABASE_URL format
3. Ensure database exists
4. Check user permissions

### NextAuth Issues

Make sure these tables exist:
- user
- account  
- session
- verificationToken

These are created automatically by our schema.