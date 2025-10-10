# CloudWatch Live Frontend

A modern Next.js React application for real-time CloudWatch log monitoring and management. This frontend provides an intuitive interface for viewing, filtering, and managing AWS CloudWatch logs with real-time streaming capabilities.

## 🎯 Features

- **Real-time log streaming** from AWS CloudWatch
- **Advanced filtering and search** with live updates
- **User management interface** with role-based access control
- **Modern responsive design** with Tailwind CSS
- **GraphQL integration** with AWS AppSync
- **Automatic deployment** to CloudFront via S3

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** and **Yarn**
- **AWS infrastructure deployed** (see [deployment guide](../../deploy/README.md))

### Local Development

```bash
# Install dependencies (from root of monorepo)
yarn install

# Start the development server
cd packages/aws-example/frontend
yarn dev

# Or use the root-level development commands:
# For local development:
yarn dev:local

# For GitHub Codespaces:
yarn dev:codespaces
```

The development server will start on [http://localhost:3000](http://localhost:3000).

### Environment Configuration

The frontend automatically reads configuration from the deployed AWS infrastructure:

- **AppSync API endpoint** and **GraphQL schema** from CloudFormation outputs
- **Cognito User Pool** and **Identity Pool** configuration
- **CloudFront distribution** and **S3 bucket** details

No manual environment configuration is required - the deployment process handles this automatically.

## 🏗️ Architecture

### Technology Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React hooks and context
- **API Integration**: AWS AppSync GraphQL API
- **Authentication**: AWS Cognito with automatic token refresh
- **Fonts**: Optimized Geist font family
- **Deployment**: Static export to S3 with CloudFront distribution

### Build Process

```bash
# Build for production
yarn build

# The build process:
# 1. Generates optimized static files
# 2. Injects AWS configuration from deployment outputs
# 3. Creates a static export ready for S3 deployment
```

## 🚢 Deployment

The frontend is automatically deployed as part of the main deployment process:

```bash
# Deploy entire application (including frontend)
cd packages/deploy
yarn deploy

# Deploy frontend only (for quick updates)
cd packages/deploy
yarn deploy:frontend
```

### Frontend Deployment Process

1. **Build**: Compiles and optimizes the Next.js application
2. **Configuration Injection**: Adds AWS service endpoints and configuration
3. **Upload**: Uploads static files to the S3 bucket
4. **Cache Invalidation**: Invalidates CloudFront cache for immediate updates

## 🔧 Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `yarn dev` | Start development server |
| `yarn build` | Build for production |
| `yarn start` | Start production server (local) |
| `yarn lint` | Run ESLint |

### Configuration Files

- **`next.config.ts`**: Next.js configuration with deployment output injection
- **`tailwind.config.ts`**: Tailwind CSS configuration
- **`postcss.config.js`**: PostCSS configuration
- **`tsconfig.json`**: TypeScript configuration

### GraphQL Integration

The frontend automatically connects to the deployed AppSync API:

- **Schema**: Generated from the backend GraphQL schema
- **Endpoint**: Retrieved from CloudFormation stack outputs
- **Authentication**: Integrated with Cognito for secure API access

## 🔐 Authentication

The frontend uses AWS Cognito for user authentication:

- **Login/Logout**: Cognito-hosted UI or custom components
- **Token Management**: Automatic refresh and validation
- **Role-based Access**: SuperAdmin, Admin, and User roles
- **Multi-tenant Support**: Organization-based access control

## 🎨 UI/UX

### Design System

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Modern Interface**: Clean, intuitive user experience
- **Accessibility**: WCAG-compliant components
- **Performance**: Optimized for fast loading and smooth interactions

### Key Components

- **Log Viewer**: Real-time log streaming with filtering
- **User Management**: Admin interface for user and organization management
- **Dashboard**: Overview of log activity and system status
- **Settings**: Configuration and preference management

## 🐛 Troubleshooting

### Common Issues

#### Development Server Issues
- **Port conflicts**: Change port with `yarn dev -p 3001`
- **Missing dependencies**: Run `yarn install` from the monorepo root
- **Environment issues**: Ensure AWS infrastructure is deployed

#### Build Issues
- **Configuration errors**: Check that deployment outputs are available
- **TypeScript errors**: Run `yarn lint` to identify issues
- **Missing GraphQL schema**: Ensure backend is deployed first

#### Deployment Issues
- **S3 upload failures**: Check AWS credentials and S3 bucket permissions
- **CloudFront caching**: Cache invalidation may take 5-15 minutes
- **CORS issues**: Verify AppSync API configuration

### Getting Help

1. Check the [main deployment documentation](../../deploy/README.md)
2. Review CloudFormation stack outputs for configuration values
3. Check browser console for runtime errors
4. Verify AWS service configurations in the AWS Console

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [Tailwind CSS](https://tailwindcss.com/docs) - Utility-first CSS framework
- [AWS AppSync](https://docs.aws.amazon.com/appsync/) - GraphQL API documentation
- [AWS Cognito](https://docs.aws.amazon.com/cognito/) - Authentication service documentation
