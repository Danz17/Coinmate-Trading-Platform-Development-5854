# BaryaBazaar - SaaS P2P Trading Platform

BaryaBazaar is a comprehensive SaaS platform for P2P trading operations, designed to support multiple organizations with customizable branding and powerful trading features.

## Features

### Multi-Organization Support
- White-label solution with customizable branding
- Organization-specific theming and configurations
- Isolated data between organizations

### Core Trading Features
- Simple trade execution
- Enhanced trading with advanced options
- Transaction history and management
- Platform balance tracking
- Bank integration

### Analytics & Reporting
- Real-time dashboard
- Advanced analytics
- End-of-day reporting
- Transaction logs
- System logs

### Administration
- User management with role-based access control
- HR tracking for employee hours
- System settings customization
- Branding and white-labeling options

## Technology Stack

- **Frontend**: React with Vite
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **State Management**: Custom AppStateManager
- **Backend**: Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example` and add your Supabase credentials
4. Start the development server: `npm run dev`

## User Roles

BaryaBazaar implements a comprehensive role-based access control system:

- **Super Admin**: Platform-level administrator with access to all organizations
- **Admin**: Organization administrator with access to all organization features
- **Supervisor**: Can monitor and manage transactions and users
- **Analyst**: Access to analytics and reporting features
- **User**: Basic trading functionality

## Development

### Environment Setup

Create a `.env` file with the following variables:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Database Structure

The platform uses the following main tables:

- `organizations_ft2024`: Stores organization details
- `users_ft2024`: User information
- `transactions_ft2024`: Transaction records
- `platforms_ft2024`: Trading platforms
- `banks_ft2024`: Banking institutions
- `system_logs_ft2024`: System activity logs
- `hr_logs_ft2024`: Employee time tracking
- `system_settings_ft2024`: System configuration

### Building for Production

```
npm run build
```

## License

All rights reserved. This codebase is proprietary and confidential.