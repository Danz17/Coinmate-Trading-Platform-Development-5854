# AI Development Rules for Coinmate

## Tech Stack Overview

- **Core Framework**: React 18 with functional components and hooks
- **Styling**: Tailwind CSS for utility-first styling with custom dark mode support
- **State Management**: Context API + Local Storage with Supabase integration
- **Routing**: React Router v6 with hash-based navigation
- **Animation**: Framer Motion for component animations and transitions
- **Charts**: ECharts for complex data visualizations
- **PDF/CSV Export**: jsPDF + jspdf-autotable for PDFs, PapaParse for CSV
- **Icons**: Lucide React for iconography
- **Form Handling**: Custom validation service with Supabase integration
- **API Layer**: Supabase JS client for all database operations

## Library Usage Rules

### UI Components
1. **Always** use shadcn/ui components as the base when available
2. For custom components, use Tailwind CSS classes directly
3. Icons must come from Lucide React (import { IconName } from 'lucide-react')
4. Complex animations should use Framer Motion
5. Data visualizations must use ECharts via echarts-for-react

### State Management
1. Global app state goes in AppStateManager service
2. User-specific state should use React context when needed
3. Session persistence must use AppStateManager (which handles Supabase + localStorage)
4. Never use Redux or other state management libraries

### Data Handling
1. All database operations must go through SupabaseService
2. CSV exports use PapaParse
3. PDF generation uses jsPDF + jspdf-autotable
4. Data validation uses ValidationService
5. Analytics calculations use AnalyticsService

### Styling Rules
1. Only use Tailwind CSS utility classes
2. Custom styles go in tailwind.config.js extensions
3. Dark mode classes must use 'dark:' prefix
4. Component variants should use clsx or class-variance-authority
5. No direct CSS files except for global styles in App.css

### Performance
1. Heavy calculations go in Web Workers
2. Large lists must be virtualized
3. API calls should be debounced when appropriate
4. Expensive renders should use React.memo
5. Animation performance critical components should use will-change

### Code Structure
1. Services go in src/services/
2. Components go in src/components/
3. Pages go in src/pages/
4. Hooks go in src/hooks/
5. Config goes in src/config/

### Testing
1. Unit tests go in __tests__ folders
2. Integration tests test service layers
3. E2E tests cover critical user flows
4. All new features require tests
5. Test coverage minimum 80%

## Supabase Rules
1. Never use Supabase client directly - always use SupabaseService
2. Row-level security must be enabled for all tables
3. All database calls must be typed
4. Errors must be properly handled
5. Sensitive operations require transactions

## Commit Rules
1. Semantic commit messages
2. Small, focused commits
3. No committing commented code
4. Commit messages reference issues
5. Pre-commit hooks must pass