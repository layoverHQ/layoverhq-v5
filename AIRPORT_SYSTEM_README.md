# Airport Auto-Suggest System

A comprehensive airport search and auto-suggest system for LayoverHQ, featuring integration with real airport and airline data from GitHub repositories.

## 🚀 Features

### Core Functionality
- **Global Airport Database**: Access to thousands of airports worldwide
- **Real-time Search**: Debounced search with instant results
- **Keyboard Navigation**: Full keyboard support (arrow keys, enter, escape)
- **Mobile-First Design**: Responsive interface optimized for mobile devices
- **Smart Ranking**: Intelligent prioritization of hub airports and popular destinations

### Airline Integration
- **Airline Logos**: Display airline logos and flags from the [Airlines repository](https://github.com/dotmarn/Airlines.git)
- **Alliance Information**: Star Alliance, OneWorld, SkyTeam, and more
- **Hub Airport Mapping**: Shows which airlines operate at each airport
- **Popular Routes**: Displays common routes for major airlines

### Data Sources
- **Airports**: [lxndrblz/Airports](https://github.com/lxndrblz/Airports.git) - Comprehensive IATA airport database
- **Airlines**: [dotmarn/Airlines](https://github.com/dotmarn/Airlines.git) - 500+ airlines with logos and flags
- **Supabase Backend**: Local database with fallback to GitHub data

## 🏗️ Architecture

### Components
1. **`AirportAutoSuggest`** - Basic airport search component
2. **`EnhancedAirportAutoSuggest`** - Advanced component with airline integration
3. **`AirportService`** - Backend service for airport operations
4. **`AirlineService`** - Backend service for airline operations
5. **`AirportSeeder`** - Data seeding and database management

### API Endpoints
- `GET/POST /api/airports/search` - Airport search functionality
- `GET/POST /api/airports/seed` - Database seeding and status
- `GET/POST /api/airlines/search` - Airline search functionality

### Database Schema
```sql
-- Airports table
CREATE TABLE airports (
  id UUID PRIMARY KEY,
  iata_code VARCHAR(3) UNIQUE NOT NULL,
  icao_code VARCHAR(4),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  timezone TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  elevation INTEGER,
  hub BOOLEAN DEFAULT FALSE,
  popular BOOLEAN DEFAULT FALSE,
  search_rank INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Airlines table
CREATE TABLE airlines (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  iata_code VARCHAR(3) UNIQUE NOT NULL,
  icao_code VARCHAR(4),
  country TEXT NOT NULL,
  logo_url TEXT,
  flag_url TEXT,
  website TEXT,
  alliance TEXT,
  hub_airports TEXT[],
  popular_routes TEXT[],
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase project (optional, for full backend functionality)
- Environment variables configured

### Environment Setup
```bash
# Create .env.local file
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Visit the demo page
http://localhost:3000/airport-demo
```

### Database Seeding
```bash
# Seed the airport database
curl -X POST http://localhost:3000/api/airports/seed

# Check database status
curl http://localhost:3000/api/airports/seed
```

## 📱 Usage Examples

### Basic Airport Search
```tsx
import { AirportAutoSuggest } from '@/components/airport-auto-suggest'

function FlightSearch() {
  const [airport, setAirport] = useState('')
  
  return (
    <AirportAutoSuggest
      label="Departure Airport"
      placeholder="Search airports..."
      value={airport}
      onChange={setAirport}
      onAirportSelect={(selectedAirport) => {
        console.log('Selected:', selectedAirport)
      }}
    />
  )
}
```

### Enhanced Airport Search with Airlines
```tsx
import { EnhancedAirportAutoSuggest } from '@/components/enhanced-airport-auto-suggest'

function EnhancedFlightSearch() {
  const [airport, setAirport] = useState('')
  
  return (
    <EnhancedAirportAutoSuggest
      label="Departure Airport"
      placeholder="Search with airline info..."
      value={airport}
      onChange={setAirport}
      showAirlines={true}
      showPopular={true}
      hubOnly={false}
      popularOnly={false}
    />
  )
}
```

### API Usage
```typescript
// Search airports
const response = await fetch('/api/airports/search?q=london&limit=10')
const airports = await response.json()

// Search airlines
const response = await fetch('/api/airlines/search?q=british&country=United Kingdom')
const airlines = await response.json()

// Seed database
const response = await fetch('/api/airports/seed', { method: 'POST' })
const result = await response.json()
```

## 🔧 Configuration Options

### AirportAutoSuggest Props
- `label` - Input label text
- `placeholder` - Input placeholder text
- `value` - Controlled input value
- `onChange` - Value change handler
- `onAirportSelect` - Airport selection callback
- `showPopular` - Show popular airports on focus
- `error` - Display error state
- `disabled` - Disable the input

### EnhancedAirportAutoSuggest Props
- All basic props plus:
- `showAirlines` - Display airline information
- `hubOnly` - Filter to hub airports only
- `popularOnly` - Filter to popular airports only

### Search Parameters
- `q` - Search query (required)
- `limit` - Maximum results (default: 10, max: 50)
- `country` - Filter by country
- `hub_only` - Filter to hub airports
- `popular_only` - Filter to popular airports
- `alliance` - Filter airlines by alliance

## 🌍 Data Coverage

### Airport Information
- **IATA/ICAO Codes**: Standard airport identifiers
- **Geographic Data**: Latitude, longitude, elevation
- **Timezone Information**: Local timezone for each airport
- **Hub Classification**: Major airline hub airports
- **Popularity Ranking**: Smart ranking system

### Airline Information
- **500+ Airlines**: Comprehensive global coverage
- **Logo Assets**: High-quality airline logos
- **Flag Icons**: Country flags for airlines
- **Alliance Data**: Star Alliance, OneWorld, SkyTeam
- **Hub Mapping**: Which airports each airline uses as hubs

### Geographic Coverage
- **Africa**: Major airports in Nigeria, South Africa, Kenya, Egypt, Morocco
- **Middle East**: UAE, Qatar, Saudi Arabia, Turkey, Kuwait
- **Europe**: UK, Germany, France, Netherlands, Spain, Italy
- **Asia**: Japan, China, India, Singapore, Thailand, South Korea
- **Americas**: USA, Canada, Mexico, Brazil, Argentina
- **Oceania**: Australia, New Zealand

## 🚀 Performance Features

### Search Optimization
- **Debounced Input**: 300ms delay to reduce API calls
- **Smart Caching**: 24-hour cache for airline data
- **Indexed Queries**: Database indexes for fast search
- **Result Limiting**: Configurable result limits

### User Experience
- **Loading States**: Visual feedback during search
- **Error Handling**: Graceful fallbacks and error messages
- **Keyboard Navigation**: Full keyboard accessibility
- **Mobile Responsive**: Touch-friendly interface

## 🔒 Security & Privacy

### Data Protection
- **Environment Variables**: Secure configuration management
- **API Rate Limiting**: Built-in request throttling
- **Input Validation**: Sanitized search queries
- **CORS Configuration**: Proper cross-origin handling

### Supabase Integration
- **Row Level Security**: Database-level access control
- **Service Role Keys**: Secure admin operations
- **User Authentication**: Built-in auth system

## 🧪 Testing

### Demo Page
Visit `/airport-demo` to test:
- Basic airport search
- Enhanced airport search with airlines
- Database seeding
- API functionality

### API Testing
```bash
# Test airport search
curl "http://localhost:3000/api/airports/search?q=london&limit=5"

# Test airline search
curl "http://localhost:3000/api/airlines/search?q=british&limit=5"

# Test database status
curl "http://localhost:3000/api/airports/seed"
```

## 🚀 Deployment

### Vercel Deployment
```bash
# Build the project
npm run build

# Deploy to Vercel
vercel --prod
```

### Environment Variables
Ensure these are set in your production environment:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Database Setup
1. Create Supabase project
2. Run database migrations
3. Seed initial data
4. Configure RLS policies

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Implement changes
4. Add tests
5. Submit pull request

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Component-based architecture

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [lxndrblz/Airports](https://github.com/lxndrblz/Airports.git) - Comprehensive airport database
- [dotmarn/Airlines](https://github.com/dotmarn/Airlines.git) - Airline information and logos
- Supabase - Backend infrastructure
- Next.js - React framework
- Tailwind CSS - Styling framework

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the demo page at `/airport-demo`
- Review the API documentation
- Test with the provided examples

---

**Built with ❤️ for LayoverHQ - Making travel planning smarter and more intuitive.**
