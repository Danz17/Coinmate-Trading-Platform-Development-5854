# CoinMate Fintech Application

## BaryaBazaar - SaaS P2P Trading Platform for USDT and PHP

## Overview
BaryaBazaar is a comprehensive SaaS platform for peer-to-peer (P2P) trading of USDT and PHP, tailored for organizations and individual users in the Philippines. It evolves from the core Coinmate application, which serves as the flagship and first organization within the platform. Coinmate's fully developed features form the foundation of BaryaBazaar, enabling efficient cryptocurrency trading operations with advanced management tools. As a SaaS solution, BaryaBazaar supports multiple organizations through white-labeling, allowing custom branding and settings while operating on a freemium model—all core features are free, with premium AI-enhanced capabilities planned for future release. This merger integrates Coinmate's robust trading engine, analytics, and security into a scalable multi-tenant system, where Coinmate operates as one of many organizations leveraging BaryaBazaar's infrastructure.

## Features
- **Freemium Model**: All core features are free; premium AI features (e.g., predictive trading insights and automated risk alerts) are in development.
- **Multi-Organization Support**: Manage multiple organizations with separate branding, settings, and data isolation; Coinmate is the initial organization demonstrating full capabilities.
- **Enhanced Trading Interface**: Execute BUY/SELL transactions with real-time validation, rate calculation, balance checks, and P2P API support for Bybit, OKX, and Binance to pull PHP/USDT ads for analysis.
- **Transaction Management**: Track and manage trading activities, including internal transfers, with export to CSV/PDF.
- **User Management**: Superadmin oversees users, roles, and bank assignments across organizations.
- **Balance Management**: Track and adjust PHP and USDT balances for users and platforms.
- **End of Day Processing**: Automated profit collection and report generation.
- **HR Tracking**: Monitor user sessions and work hours.
- **Advanced Analytics**: KPI monitoring, user performance analysis, predictive forecasting, and risk assessment.
- **Role-Based Access Control**: Hierarchical roles (Super Admin, Admin, Supervisor, Analyst) with granular permissions.
- **White Labeling**: Customize logos, colors, and themes per organization.
- **Real-Time Notifications**: Alerts via Telegram, Slack, and Microsoft Teams.
- **Security Monitoring**: Suspicious activity detection, audit logs, and encrypted data storage.
- **P2P Trading**: Users trade USDT and PHP directly, with secure login and organization selection.

## Technical Architecture
BaryaBazaar builds on Coinmate's modern web technologies:
- **Frontend**: React.js with Tailwind CSS for responsive UI.
- **State Management**: Custom service-based architecture.
- **Routing**: Hash-based routing with React Router.
- **Animations**: Framer Motion for smooth transitions.
- **Data Visualization**: ECharts for interactive charts.
- **Backend Integration**: Supabase for database, authentication, and storage.
- **Notifications**: Telegram, Slack, and Microsoft Teams APIs.
- **PDF Generation**: jsPDF for reports.
- **Date Handling**: date-fns for operations.
- **Layout Management**: React Grid Layout for customizable dashboards.

## Database Schema
BaryaBazaar uses Supabase with tables adapted from Coinmate (suffix `_ft2024` for legacy compatibility, to be updated in future migrations). Core tables include:
1. **organizations_ft2024**: Organization details for white-labeling and multi-tenant support.
2. **users_ft2024**: User accounts, roles, permissions, and organization linkages.
3. **transactions_ft2024**: Transaction records for P2P trades.
4. **platforms_ft2024**: Trading platforms and USDT balances.
5. **banks_ft2024**: Bank accounts for PHP tracking.
6. **system_logs_ft2024**: System activity and audit logs.
7. **hr_logs_ft2024**: User session tracking.
8. **system_settings_ft2024**: Application and organization-specific configurations.
9. **organization_admins_ft2024**: Admin assignments per organization.
10. **user_dashboard_layouts_ft2024**: Custom dashboard layouts.
11. **user_trade_memory_ft2024**: Trading preferences.
12. **settings**: Additional organization-specific settings (future expansion for premium features).

## Installation
### Prerequisites
- Node.js (v14.0.0 or higher)
- NPM (v6.0.0 or higher)
- Supabase account

### Setup Instructions
1. Clone the repository:
   ```
   git clone https://github.com/your-username/baryabazaar.git
   cd baryabazaar
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Set up the database: Run migration scripts to create tables (integrated from Coinmate schema).
5. Start the development server:
   ```
   npm run dev
   ```
6. Build for production:
   ```
   npm run build
   ```

## Configuration
Navigate to Administration > System Settings to configure:
- Daily profit reset time.
- Exchange rate update interval (via CoinGecko API).
- Dashboard refresh interval.
- Notification settings (Telegram, Slack, Teams).
- Organization branding and white-labeling.
- Future premium AI integrations.

## Usage Guide
### User Authentication
1. Access the application URL.
2. Log in with email and password.
3. Select your organization (e.g., Coinmate as default).
4. System tracks login/logout for HR purposes.

### Trading Operations
1. Navigate to Trade tab.
2. Select BUY/SELL.
3. Choose user account, bank, and platform.
4. Enter rate (market-suggested) and amounts (auto-calculate USDT/PHP).
5. Add fees/notes and confirm with balance preview.

### Transaction Management
1. View/filter transactions by type/date.
2. Export to CSV/PDF.
3. Admins edit/delete with audits.

### System Logs and HR Tracking
1. Filter/view logs and sessions.
2. Export for compliance.

### End of Day Processing
1. Review summary.
2. Collect profits and generate reports.

### Advanced Analytics
Monitor KPIs, performance, and trends; export reports.

### Superadmin Access
Superadmin logs in with predefined credentials to:
- Create/manage organizations (starting with Coinmate).
- Manage users, roles, and transactions across tenants.
- Oversee global settings.

## Security Features
- Session timeouts and IP change alerts.
- Login monitoring and password strength enforcement.
- Transaction risk assessment.
- Comprehensive audit logging.
- Encrypted sensitive data.

## Role-Based Access Control
Hierarchical roles integrated across organizations:
1. **Super Admin**: Full access, manages organizations/system.
2. **Admin**: User/transaction management per organization.
3. **Supervisor**: View data, execute EOD, trade for users.
4. **Analyst**: Basic trading and analytics for own data.

## White Labeling
- Create organizations with custom branding.
- Assign admins and set defaults (Coinmate as initial).

## Contributing
Contributions welcome! Fork, branch, commit, push, and open a pull request.

## License
MIT License - see LICENSE file.

## Version History
| Version | Date       | Phase                | Description                                      |
|---------|------------|----------------------|--------------------------------------------------|
| 0.5.0   | 2023-09-01 | Initial Development  | Core architecture and basic trading (from Coinmate) |
| 0.8.0   | 2023-10-15 | Feature Enhancement  | Role management, EOD, basic analytics |
| 1.0.0   | 2023-12-01 | Production Release   | Complete trading platform |
| 1.1.0   | 2024-01-10 | Analytics Expansion  | Advanced analytics and dashboards |
| 1.2.0   | 2024-02-15 | Multi-org Support    | Organization management and white-labeling |
| 1.3.0   | 2024-03-20 | Enhanced Trading     | Improved interface with validation |
| 1.4.0   | 2024-04-25 | HR Tracking          | Session monitoring features |
| 1.5.0   | 2024-06-01 | Security Enhancements| Performance and security updates |
| 2.0.0   | 2025-08-08 | SaaS Merger          | Integration of Coinmate as first org; freemium model (planned) |

## Environment Variables
| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |

## What to Finish Off
- Fix routing bugs causing blank screens in Transactions, Logs, Tracker, Advanced Analytics, End of Day, HR Tracking, and Administration modules.
- Implement confirmation dialogs for trades and improve validation feedback to prevent premature errors.
- Enhance accessibility with ARIA labels and keyboard navigation.
- Strengthen security by adding robust authentication measures and removing quick login options.
- Develop premium AI features: predictive analytics enhancements, automated alerts, and AI-driven risk assessment.
- Update database schema: Remove or modernize `_ft2024` suffix; ensure full multi-tenant isolation.
- Align with fintech SOPs: Add detailed audit logs and accurate balance reconciliation.
- Implement full P2P user-to-user trading flows beyond internal transfers.
- Roll out freemium model: Gate premium features behind subscriptions.
- Test and deploy SaaS scalability for multiple organizations beyond Coinmate.