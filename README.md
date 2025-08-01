# Coinmate - Comprehensive Fintech Operations Management
Overview

Coinmate is a robust and feature-rich fintech operations management platform designed for cryptocurrency trading businesses. It provides a comprehensive suite of tools for managing transactions, monitoring balances, analyzing performance metrics, and administering user roles and permissions. With its intuitive interface and powerful features, Coinmate streamlines the day-to-day operations of cryptocurrency trading businesses, ensuring efficiency, accuracy, and security.
Table of Contents

•
[Features](#features)
•
[Technical Architecture](#technical-architecture)
•
[Installation](#installation)
•
[Configuration](#configuration)
•
[Usage Guide](#usage-guide)
•
[Security Features](#security-features)
•
[Advanced Analytics](#advanced-analytics)
•
[Role-Based Access Control](#role-based-access-control)
•
[White Labeling](#white-labeling)
•
[Contributing](#contributing)
•
[License](#license)

Features

Core Functionality

•
**Enhanced Trading Interface**: Execute buy/sell transactions with real-time validation, rate calculation, and balance checks
•
**Transaction Management**: Comprehensive tracking and management of all trading activities
•
**System Logs**: Monitor system activities and audit trails with advanced filtering capabilities
•
**User Management**: Manage team members with role-based permissions and bank account assignments
•
**Balance Management**: Track and adjust PHP and USDT balances across users and platforms
•
**End of Day Processing**: Automated profit collection and report generation
•
**HR Tracking**: Monitor user sessions and work hours with detailed logs

Advanced Features

•
**Advanced Analytics**: Comprehensive insights with predictive analytics and performance tracking
•
**Multi-Organization Support**: Manage multiple organizations with separate branding and settings
•
**White Labeling**: Customize the application with your organization's branding
•
**Role-Based Access Control**: Granular permission management with hierarchical roles
•
**Real-Time Notifications**: Configurable alerts via Telegram, Slack, and Microsoft Teams
•
**Security Monitoring**: Advanced security features including suspicious activity detection
•
**Export Capabilities**: Export data to CSV and PDF formats for reporting and analysis

Technical Architecture

Coinmate is built using modern web technologies:
•
**Frontend**: React.js with Tailwind CSS for responsive UI
•
**State Management**: Custom state management with service-based architecture
•
**Routing**: Hash-based routing with React Router
•
**Animations**: Framer Motion for smooth transitions and animations
•
**Data Visualization**: ECharts for interactive charts and analytics
•
**Backend Integration**: Supabase for database, authentication, and storage
•
**Notifications**: Integration with Telegram, Slack, and Microsoft Teams APIs
•
**PDF Generation**: jsPDF for report generation
•
**Date Handling**: date-fns for comprehensive date operations
•
**Layout Management**: React Grid Layout for customizable dashboard layouts

Installation

Prerequisites

•
Node.js (v14.0.0 or higher)
•
NPM (v6.0.0 or higher)
•
Supabase account (for database and authentication)

Setup Instructions

1.
Clone the repository:
bash
   git clone https://github.com/your-username/coinmate.git
   cd coinmate
   

2.
Install dependencies:
bash
   npm install
   

3.
Create a .env file in the root directory with the following variables:
   VITE_SUPABASE_URL=https://zeqitbdwqrvelzdmnrjw.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplcWl0YmR3cXJ2ZWx6ZG1ucmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzMxMzMsImV4cCI6MjA2ODk0OTEzM30.N_pyfbcPrvNFC1X3NkYuDwkUC8jbmndghcYBAQJ7XCY
   

4.
Start the development server:
bash
   npm run dev
   

5.
Build for production:
bash
   npm run build
   

Configuration

Database Setup

Coinmate uses Supabase for data storage. The application expects the following tables with the suffix _ft2024:
•
users_ft2024: User accounts and permissions
•
transactions_ft2024: Transaction records
•
platforms_ft2024: Trading platforms and balances
•
banks_ft2024: Bank accounts
•
system_logs_ft2024: System activity logs
•
hr_logs_ft2024: User session tracking
•
system_settings_ft2024: Application configuration
•
organizations_ft2024: Organization settings for white labeling
•
organization_admins_ft2024: Admin assignments for organizations
•
user_dashboard_layouts_ft2024: User-specific dashboard layouts
•
user_trade_memory_ft2024: User trading preferences

System Settings

Navigate to the Administration tab > System Settings to configure:
•
Daily profit reset time
•
Exchange rate update interval
•
Dashboard refresh interval
•
Notification settings (Telegram, Slack, Teams)
•
External API integrations (CoinGecko)
•
Organization branding and white labeling

Usage Guide

User Authentication

1.
Access the application through the provided URL
2.
Login using your email and password credentials
3.
The system will automatically track your login/logout times
4.
Session information is displayed in the HR Tracking section

Trading Operations

1.
Navigate to the Trade tab
2.
Select transaction type (BUY/SELL)
3.
Choose user account and bank account
4.
Select trading platform
5.
Enter rate or use current market rate
6.
Input USDT or PHP amount (the other will calculate automatically)
7.
Add optional transfer fee and notes
8.
Submit transaction for processing
9.
Review confirmation modal with balance impact details
10.
Confirm to execute the transaction

Transaction Management

1.
Go to the Transactions tab to view all trading activities
2.
Use filters to narrow down transactions by type, date range, or search terms
3.
Export transactions to CSV or PDF format
4.
Administrators can edit or delete transactions with proper audit logging
5.
Execute internal transfers between users or platforms

System Logs

1.
Access the Logs tab to view all system activities
2.
Filter logs by type, user, date range, or search terms
3.
Review detailed information about each log entry
4.
Export logs for compliance and audit purposes

End of Day Processing

1.
Navigate to the EOD tab at the end of the trading day
2.
Review the day's transaction summary
3.
Select users for profit collection
4.
Adjust profit amounts if necessary
5.
Execute EOD process to collect profits and generate reports
6.
Notifications will be sent to configured channels

HR Tracking

1.
Go to the HR Tracking tab to monitor user sessions
2.
View currently active users and their session durations
3.
Review historical login/logout data
4.
Export HR logs for payroll and compliance purposes

Security Features

Coinmate implements robust security measures:
•
**Session Management**: Automatic timeout for inactive sessions
•
**Login Attempt Monitoring**: Detection of multiple failed login attempts
•
**IP Change Detection**: Alerts for suspicious IP address changes
•
**Transaction Risk Assessment**: Identification of high-risk transactions
•
**Role-Based Access Control**: Granular permission management
•
**Audit Logging**: Comprehensive logging of all system activities
•
**Password Strength Validation**: Enforcement of strong password policies
•
**Secure Data Storage**: Encrypted storage of sensitive information

Advanced Analytics

The Advanced Analytics module provides:
•
**KPI Monitoring**: Track key performance indicators like revenue, volume, profit margin
•
**User Performance Analysis**: Evaluate trader performance with profitability metrics
•
**Platform Analysis**: Analyze platform utilization and efficiency
•
**Risk Assessment**: Monitor volatility, maximum drawdown, and risk exposure
•
**Predictive Analytics**: Forecast future performance based on historical data
•
**Time Pattern Analysis**: Identify optimal trading times and patterns
•
**Trend Detection**: Recognize emerging trends in trading activity
•
**Alert Generation**: Automated alerts for significant deviations or opportunities

Role-Based Access Control

Coinmate implements a hierarchical role system:
1.
**Super Admin**: Complete system access with all privileges
•
Can manage organizations, roles, and system configuration
•
Has access to all data and functionality

2.
**Admin**: Administrative access with user and transaction management
•
Can manage users, platforms, banks, and adjust balances
•
Can execute EOD processes and view HR logs

3.
**Supervisor**: Supervisory access with limited administrative functions
•
Can view all data and execute EOD processes
•
Can trade for assigned users and perform internal transfers

4.
**Analyst**: Basic trading access with limited data visibility
•
Can trade for their own account and view their own data
•
Can access basic analytics and export their own data

White Labeling

The white labeling feature allows:
•
**Multiple Organizations**: Create and manage multiple organizations
•
**Custom Branding**: Set organization-specific logos, favicons, and colors
•
**Organization Settings**: Configure features and settings per organization
•
**Admin Assignment**: Assign administrators to specific organizations
•
**Default Organization**: Set the default organization for new users

Contributing

We welcome contributions to Coinmate! Please follow these steps:
1.
Fork the repository
2.
Create a feature branch (git checkout -b feature/amazing-feature)
3.
Commit your changes (git commit -m 'Add some amazing feature')
4.
Push to the branch (git push origin feature/amazing-feature)
5.
Open a Pull Request

User Prompt Logic in Coinmate

Authentication Prompts

1.
**Login Modal (LoginModal.jsx)**
•
Accepts email and password inputs
•
Validates credentials against user database
•
Provides quick login options for demo users
•
Shows password visibility toggle
•
Displays error messages for invalid credentials
•
Simulates authentication delay for better UX

2.
**Logout Confirmation**
•
Confirms user intent to log out
•
Handles session termination
•
Updates HR logs with logout time and duration

Transaction Prompts

1.
**Transaction Type Selection (Trade.jsx, EnhancedTrade.jsx)**
•
Toggle between BUY and SELL transactions
•
Visual differentiation between transaction types (green for buy, red for sell)

2.
**Transaction Form**
•
User account selection with role display
•
Bank account selection with available balance
•
Platform selection
•
Rate input with current rate suggestion
•
Amount input (USDT and PHP) with automatic calculation
•
Optional transfer fee and note fields
•
Form validation with detailed error messages

3.
**Transaction Confirmation**
•
Displays transaction details for verification
•
Shows balance impact preview
•
Highlights rate deviation from market rate
•
Requires explicit confirmation

4.
**Internal Transfer**
•
PHP transfers between user bank accounts
•
USDT transfers between platforms
•
Form validation for sufficient balances
•
Confirmation dialog with transfer details

Administration Prompts

1.
**User Management**
•
Add new user with role and bank assignments
•
Edit existing user details and permissions
•
Delete user with confirmation
•
Adjust user bank balances with reason tracking

2.
**Platform & Bank Management**
•
Add/delete platforms with balance checks
•
Add/delete banks with usage checks
•
Adjust platform USDT balances with reason tracking

3.
**Role Management**
•
View role hierarchy and permissions
•
Edit role permissions with matrix interface
•
Assign roles to users with reason tracking
•
Permission validation based on role hierarchy

4.
**Organization Settings**
•
Create/edit organizations with branding options
•
Upload logos and favicons
•
Set color schemes for light and dark modes
•
Assign organization administrators
•
Set default organization

System Settings Prompts

1.
**Daily Profit Configuration**
•
Set reset time for daily profit calculations
•
Configure timezone settings

2.
**Capital Tracking**
•
Track total invested funds
•
Display ROI calculations

3.
**System Intervals**
•
Configure exchange rate update frequency
•
Set dashboard refresh intervals

4.
**External Integrations**
•
Configure CoinGecko API for exchange rates
•
Set up Telegram notifications with bot token and chat ID

5.
**Notification Settings**
•
Enable/disable various notification channels
•
Configure notification triggers

End of Day Process Prompts

1.
**Profit Collection**
•
Select users for profit collection
•
View calculated profit per user
•
Adjust profit amounts manually
•
Select bank accounts for profit deduction
•
Add notes to EOD process
•
Confirmation dialog with summary

Analytics & Filtering Prompts

1.
**Dashboard Customization**
•
Drag and resize widgets
•
Save custom layouts per user
•
Toggle auto-refresh

2.
**Transaction Filtering**
•
Search by user, platform, bank, or note
•
Filter by transaction type
•
Filter by date range
•
Export filtered results to CSV or PDF

3.
**Advanced Analytics Filtering**
•
Select time period (week, month, quarter)
•
Filter by transaction parameters
•
Select chart type and metrics
•
Export analytics reports

System Log Prompts

1.
**Log Filtering**
•
Filter by log type (transaction, balance adjustment, etc.)
•
Filter by user
•
Filter by date range
•
Search in log content
•
Export filtered logs

2.
**HR Tracking**
•
View current session duration
•
View active users and their session times
•
Manual logout option
•
Export time logs to CSV or PDF

Onboarding Prompts

1.
**Get Started Overlay**
•
Step-by-step introduction to system features
•
Interactive guide with navigation to relevant sections
•
Progress tracking
•
Minimizable interface with persistent launcher

2.
**Get Started Component**
•
Detailed feature explanations
•
Progress tracking with completion status
•
Reset progress option

Common UI Prompts

1.
**Dark Mode Toggle**
•
Switch between light and dark themes
•
Persist preference in local storage

2.
**Organization Selector**
•
Switch between organizations
•
Apply organization-specific branding
•
Navigate to organization management

3.
**Tab Navigation**
•
Navigate between application sections
•
Permission-based tab visibility
•
Hash-based routing

4.
**Toast Notifications**
•
Display success/error/warning messages
•
Support for action buttons in notifications
•
Auto-dismiss with configurable duration

The application uses a consistent pattern of form validation, confirmation dialogs, and clear error messaging across all user interactions, with role-based access control determining what actions users can perform.

it has p2p api support for bybit , okx , binance where php usdt ads pulled for analysis

License

This project is licensed under the MIT License - see the LICENSE file for details.
•
--

For support or inquiries, please contact support@coinmate.com or open an issue on the GitHub repository.
