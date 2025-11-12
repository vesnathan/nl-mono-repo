# Lawn Order - Modern Lawn Care & Landscaping Platform

A modern, full-stack lawn care and landscaping service platform built with Next.js 15, React 19, AWS AppSync, and AWS Serverless technologies.

## Architecture

This project follows the same architecture pattern as The Story Hub (TSH) in the monorepo:

### Frontend

- **Framework**: Next.js 15 with React 19 RC
- **Styling**: Tailwind CSS with NextUI components
- **State Management**: Zustand
- **Data Fetching**: React Query (@tanstack/react-query)
- **Authentication**: AWS Amplify with Cognito
- **GraphQL Client**: AWS Amplify GraphQL

### Backend

- **API**: AWS AppSync (GraphQL)
- **Database**: Amazon DynamoDB
- **Authentication**: Amazon Cognito
- **Functions**: AWS Lambda
- **Storage**: Amazon S3
- **CDN**: Amazon CloudFront

## Project Structure

```
lawn-order/
├── frontend/               # Next.js 15 frontend application
│   ├── src/
│   │   ├── app/           # Next.js App Router pages
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── stores/        # Zustand stores
│   │   ├── graphQL/       # GraphQL queries/mutations
│   │   ├── config/        # Configuration files
│   │   └── utils/         # Utility functions
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── backend/               # Backend GraphQL schemas and resolvers
│   ├── schema/           # GraphQL schema definitions
│   │   ├── User.graphql
│   │   ├── Service.graphql
│   │   ├── Booking.graphql
│   │   └── Quote.graphql
│   ├── resolvers/        # AppSync resolvers (TypeScript)
│   ├── lambda/           # Lambda functions
│   └── package.json
│
├── infrastructure/       # AWS Infrastructure as Code
│   └── cloudformation/  # CloudFormation templates
│
├── html/                # Original HTML template (reference)
└── documentation/       # Project documentation
```

## Features

### Core Features

- **Service Management**: Browse and manage lawn care services
- **Quote Requests**: Customers can request quotes for services
- **Booking System**: Schedule and manage service appointments
- **User Authentication**: Secure login with AWS Cognito
- **Admin Dashboard**: Manage services, bookings, and quotes

### Service Types

- Lawn Mowing
- Lawn Maintenance
- Landscaping Design
- Garden Care
- Tree Trimming
- Hedge Trimming
- Fertilization
- Weed Control
- Irrigation
- Seasonal Cleanup

## GraphQL Schema

### Types

- **User**: Customer and admin profiles
- **Service**: Available lawn care services
- **Booking**: Service appointments
- **Quote**: Quote requests and estimates
- **Address**: Property addresses

### Key Mutations

- `requestQuote`: Submit a quote request
- `createBooking`: Schedule a service appointment
- `updateBookingStatus`: Update booking status
- `createService`: Add new services (admin)

## Development

### Prerequisites

- Node.js 20+
- AWS Account
- AWS CLI configured

### Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   - Set up AWS credentials
   - Configure deployment outputs in `packages/deploy`

3. **Run frontend locally**

   ```bash
   cd frontend
   npm run dev
   ```

   The app will run on http://localhost:3003

4. **Deploy backend infrastructure**
   ```bash
   cd packages/deploy
   npm run deploy:lawn-order
   ```

### Environment Variables

The frontend uses these environment variables (auto-configured via `next.config.js`):

- `NEXT_PUBLIC_USER_POOL_ID`: Cognito User Pool ID
- `NEXT_PUBLIC_USER_POOL_CLIENT_ID`: Cognito App Client ID
- `NEXT_PUBLIC_IDENTITY_POOL_ID`: Cognito Identity Pool ID
- `NEXT_PUBLIC_GRAPHQL_URL`: AppSync GraphQL endpoint

## Tech Stack

### Frontend Dependencies

- `next`: ^15.0.2
- `react`: 19.0.0-rc
- `tailwindcss`: ^3.4.14
- `@nextui-org/react`: 2.4.6
- `aws-amplify`: ^6.10.0
- `@tanstack/react-query`: ^5.61.3
- `zustand`: ^4.5.1
- `zod`: ^3.23.8

### Backend Dependencies

- `@aws-appsync/utils`: ^1.10.1
- `@aws-sdk/client-dynamodb`: 3.669.0
- `@aws-sdk/lib-dynamodb`: 3.669.0
- `@aws-sdk/client-cognito-identity-provider`: 3.669.0

## Deployment

The project uses AWS CloudFormation for infrastructure deployment:

1. **Build frontend**

   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy infrastructure**

   ```bash
   cd packages/deploy
   npm run deploy
   ```

3. **Upload frontend to S3/CloudFront**
   - Automated via deployment scripts

## Converting from HTML Template

The original HTML template (in `html/` directory) has been converted to:

- Modern React components with Tailwind CSS
- Responsive Next.js pages
- AWS serverless backend
- GraphQL API

### Original Pages

- Home (index.html) → `/` (app/page.tsx)
- Services → `/services`
- About → `/about`
- Contact → `/contact`
- Gallery → `/gallery`
- Blog → `/blog`
- Team → `/team`
- Pricing → `/pricing`

## License

MIT

## Support

For issues and questions, please open an issue in the repository.
