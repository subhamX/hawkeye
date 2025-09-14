# Implementation Plan

- [x] 1. Set up project foundation and development environment

  - Initialize Next.js 15 project with TypeScript and Tailwind CSS v4
  - Configure Bun as package manager and runtime
  - Set up shadcn/ui component library with base components
  - Install and configure Vercel AI SDK v5 with Google Gemini
  - Configure ESLint, Prettier, and TypeScript strict mode
  - _Requirements: All requirements need proper foundation_

- [x] 2. Configure database and ORM setup

  - Set up PostgreSQL database with Docker Compose for development
  - Install and configure Drizzle ORM with PostgreSQL adapter
  - Create database connection utilities and configuration
  - Set up database migration system with Drizzle
  - _Requirements: 2.1, 3.1, 4.1, 5.1_

- [x] 3. Implement core data models and database schema

  - Create User, AWSAccount, and S3BucketConfig table schemas
  - Create AnalysisRun, S3AnalysisResult, and EC2AnalysisResult schemas with recommendation categories
  - Add AI-generated report fields for cost, security, and general recommendations
  - Create job queue table schema for background processing
  - Generate and run initial database migrations
  - Create database seed scripts for development data
  - _Requirements: 2.1, 3.1, 4.1, 5.1, 6.1, 7.1_

- [x] 4. Set up authentication system with Google OAuth

  - Install and configure NextAuth.js with Google provider
  - Create authentication configuration and middleware
  - Implement session management using React Server Components
  - Create login page with Google OAuth button using Server Components
  - Add authentication protection for protected routes
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 5. Create basic UI layout and navigation

  - Implement main layout component with navigation
  - Create protected route wrapper component
  - Build login page with shadcn/ui components
  - Add loading states and error boundaries
  - Implement responsive design with Tailwind CSS v4
  - _Requirements: 1.1, 1.5_

- [x] 6. Implement AWS integration service foundation

  - Install AWS SDK v3 and configure credential management
  - Create AWS service wrapper with error handling
  - Implement IAM role assumption and credential validation
  - Create utility functions for AWS API calls with retry logic
  - Add comprehensive error mapping for AWS service errors
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 7. Build AWS account onboarding flow

  - Create account onboarding page using React Server Components
  - Implement AWS credential validation using Server Actions
  - Build form for AWS role ARN input with validation
  - Add progress indicators and error handling for onboarding
  - Create database operations for storing AWS account configuration
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 8. Implement S3 bucket discovery and configuration

  - Create S3 service for listing buckets and getting usage data
  - Build S3 onboarding page using React Server Components
  - Implement Storage Class Analytics enablement using Server Actions
  - Add S3 Inventory configuration for selected buckets
  - Use Server Actions for S3 bucket operations instead of API routes
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 9. Create database-based job queue system

  - Implement job queue table schema and operations
  - Create job processor service for background tasks
  - Add job status tracking and progress updates
  - Implement job retry logic and error handling
  - Create utilities for job scheduling and execution
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 10. Build S3 analysis agent with AI-powered recommendations

  - Create S3 analysis service using Inventory and Storage Class Analytics data
  - Implement storage class recommendation algorithms with cost, security, and general categories
  - Integrate Vercel AI SDK v5 with Gemini to generate detailed recommendation reports
  - Add cost calculation logic for optimization suggestions
  - Create data processing pipeline for S3 metrics
  - Use Server Actions for triggering S3 analysis instead of API endpoints
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 11. Implement EC2 analysis agent with AI-powered recommendations

  - Create EC2 service for instance and EBS volume discovery
  - Implement unused EBS volume detection logic with categorized recommendations
  - Add instance utilization analysis using CloudWatch metrics
  - Integrate Vercel AI SDK v5 with Gemini for EC2 recommendation reports
  - Create recommendation engine categorizing suggestions as cost, security, or general
  - Use Server Actions for EC2 analysis operations instead of API endpoints
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 12. Create dashboard with categorized analysis results display

  - Build main dashboard page using React Server Components with metrics cards
  - Implement recommendations list categorized by cost, security, and general suggestions
  - Add analysis run trigger using Server Actions with progress tracking
  - Create real-time status updates for running analyses
  - Display AI-generated recommendation reports with cost savings calculations
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 13. Add comprehensive error handling and user feedback

  - Implement global error boundary for React components
  - Add user-friendly error messages for all failure scenarios
  - Create retry mechanisms for transient failures
  - Add loading states and progress indicators throughout the app
  - Implement proper error logging and monitoring
  - _Requirements: 2.4, 2.6, 3.5, 5.4, 6.6, 7.6_

- [ ] 14. Implement future services roadmap section

  - Create "More services coming" section on dashboard
  - Add planned AWS services list with descriptions
  - Implement user interest tracking for future features
  - Create roadmap information display with expected availability
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 15. Add comprehensive testing suite

  - Set up Jest and React Testing Library for component testing
  - Create unit tests for all service functions and utilities
  - Implement integration tests for API endpoints
  - Add E2E tests for critical user journeys with Playwright
  - Create AWS service mocking for reliable testing
  - _Requirements: All requirements need proper testing coverage_

- [ ] 16. Optimize performance and add production readiness
  - Implement database indexing for optimal query performance
  - Add API rate limiting and request validation
  - Configure Next.js caching for static and dynamic content
  - Add security headers and CSRF protection
  - Create Docker configuration for deployment
  - _Requirements: All requirements need production-ready implementation_
