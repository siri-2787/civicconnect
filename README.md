# CivicConnect - Smart Governance for Sustainable Cities

A full-stack, production-ready civic engagement platform that empowers citizens to report issues, uses AI to classify and prioritize them, and provides transparent dashboards for authorities and the public.

## Features

### For Citizens
- **Issue Reporting**: Report civic issues with photos, location, and detailed descriptions
- **AI Classification**: Automatic issue categorization and severity detection using Google Gemini
- **Community Voting**: Vote on issues that affect you to increase their priority
- **Real-time Tracking**: Track your reported issues through their complete lifecycle
- **Feedback System**: Rate and provide feedback on resolved issues

### For Municipal Officers
- **Department Dashboard**: View and manage issues assigned to your department
- **KPI Tracking**: Monitor pending, in-progress, resolved, and overdue issues
- **Status Management**: Update issue statuses and add resolution notes
- **Priority Queue**: Issues automatically prioritized based on AI severity and community votes

### For Administrators
- **Comprehensive Analytics**: City-wide performance metrics and trends
- **Department Performance**: Track transparency scores and resolution times
- **User Management**: Oversight of all platform users
- **System Health**: Monitor platform status and performance

### Public Features
- **Transparency Dashboard**: Public view of all department performance metrics
- **Issue Heatmap**: Visual representation of issue density by ward/area
- **Trust Index**: City-wide and department-specific trust scores
- **Open Analytics**: Anyone can view city performance without authentication

## Technology Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- Vite for build tooling

### Backend
- Supabase (PostgreSQL database)
- Supabase Authentication (role-based access)
- Supabase Edge Functions (serverless)
- Row Level Security (RLS) for data protection

### AI Integration
- Google Gemini API for issue classification
- Automated severity detection
- Smart priority scoring
- AI-generated resolution suggestions

## Database Schema

### Tables
1. **profiles** - Extended user profiles with role-based access
2. **departments** - Municipal departments with performance metrics
3. **issues** - Civic issues with comprehensive tracking
4. **issue_votes** - Community voting system
5. **issue_feedback** - Citizen feedback and ratings
6. **issue_timeline** - Complete status change history

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Supabase account
- Google Gemini API key (optional, for AI features)

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key (optional)
VITE_GEMINI_API_KEY=your_gemini_api_key (optional)
```

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Supabase**
   - The database schema is already created via migrations
   - Default departments are automatically seeded
   - Configure your Supabase project URL and keys in `.env`

3. **Configure Edge Function (Optional)**
   - The AI classification edge function is already deployed
   - Add your Gemini API key to Supabase secrets:
     ```bash
     # In Supabase Dashboard: Project Settings > Edge Functions > Secrets
     # Add: GEMINI_API_KEY = your_api_key
     ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   ```

## User Roles

### Citizen (Default)
- Report new issues
- Vote on existing issues
- Track personal issues
- Provide feedback on resolved issues

### Officer
- View all issues
- Update issue statuses
- Add resolution notes
- Access department KPIs

### Admin
- Full platform access
- View all analytics
- Manage departments
- System oversight

## Key Features Explained

### AI Classification
When an issue is submitted, the system:
1. Analyzes title and description using Gemini AI
2. Detects severity level (Low/Medium/High)
3. Suggests appropriate department
4. Calculates initial priority score
5. Generates resolution suggestions for officers

### Priority Scoring
Issues are scored (0-100) based on:
- AI-detected severity (base score)
- Community votes (+5 per vote)
- Similar unresolved issues in area
- Time since submission

### Escalation Mechanism
Issues are automatically escalated if:
- Not acknowledged within 2 days
- Not resolved within 7 days
- Marked as high severity with no progress

### Transparency Score
Departments are scored (0-100) based on:
- Average resolution time
- Citizen feedback ratings
- Percentage of resolved issues
- Communication quality
- Escalation frequency

## API Endpoints

### Supabase Edge Functions
- `classify-issue` - AI classification and priority calculation

### Database Queries
All database operations use Supabase client with Row Level Security:
- Citizens can only view/edit their own data
- Officers can manage assigned issues
- Admins have full access
- Public can view resolved issues and analytics

## Security

### Row Level Security (RLS)
- All tables protected with RLS policies
- Authentication required for most operations
- Role-based access control enforced at database level
- No data leakage between users

### Data Validation
- Input sanitization on all forms
- Image upload size limits (5MB)
- SQL injection protection via Supabase
- XSS prevention through React

## Performance Optimizations

- Lazy loading of images
- Efficient database queries with indexes
- Real-time subscriptions for live updates
- Optimized bundle size with code splitting

## Deployment

### Recommended Platforms
- **Frontend**: Vercel, Netlify, or Firebase Hosting
- **Backend**: Supabase (already configured)
- **Edge Functions**: Supabase Edge Functions

### Build Command
```bash
npm run build
```

### Output Directory
```
dist/
```

## Future Enhancements

- Google Maps integration for precise location picking
- Real-time notifications via push/email
- Mobile app (React Native)
- Multi-language support
- Advanced analytics with charts (Recharts)
- Export functionality for reports
- API for third-party integrations

## Contributing

This is a production-ready platform suitable for:
- Municipal governments
- Smart city initiatives
- Civic hackathons
- Urban development projects
- Community engagement programs

## License

This project is ready for both personal and commercial use.

## Support

For issues, feature requests, or questions, please refer to the Supabase documentation or the platform administrator.

---

**Built with modern web technologies for sustainable urban development.**
