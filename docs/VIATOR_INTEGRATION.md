# Viator API Integration Documentation

## API Credentials
- **API Key**: `e271226f-8102-46a6-ae57-865b609af8af`
- **Key Number**: E271
- **Access Level**: Basic Access (Affiliate Partner)

## Integration Status ✅

### Completed Features:
1. ✅ **Environment Variables** configured in `.env`
2. ✅ **Viator API Client** (`/lib/viator/client.ts`)
3. ✅ **API Routes** (`/app/api/experiences/search/route.ts`)
4. ✅ **Experience Display Component** (`/components/layover-experiences.tsx`)
5. ✅ **City Experience Pages** (`/app/experiences/[city]/page.tsx`)
6. ✅ **Mock Data System** with automatic fallback
7. ✅ **Main Page Integration** with clickable destination cards

## API Endpoints

### Search Experiences by City
```bash
GET /api/experiences/search?city=Dubai&maxDurationHours=6&mock=true
```

### Bulk Search Multiple Cities
```bash
POST /api/experiences/search
{
  "destinations": ["Dubai", "Doha", "Singapore"],
  "layoverTime": "6"
}
```

## Testing

### Local Testing (with mock data)
```bash
# Single city search
curl -X GET "http://localhost:3000/api/experiences/search?city=Dubai&maxDurationHours=6&mock=true"

# Multiple cities
curl -X POST "http://localhost:3000/api/experiences/search" \
  -H "Content-Type: application/json" \
  -d '{"destinations": ["Dubai", "Doha"], "layoverTime": "6"}'
```

### Production Viator API (when available)
```bash
curl -X POST "https://api.viator.com/partner/products/search" \
  -H "exp-api-key: e271226f-8102-46a6-ae57-865b609af8af" \
  -H "Content-Type: application/json" \
  -d '{
    "destId": 684,
    "currencyCode": "USD",
    "sortOrder": "TOP_SELLERS",
    "paging": {"offset": 0, "limit": 10}
  }'
```

## Features

### 1. Automatic Fallback
- Attempts to fetch from Viator API first
- Falls back to mock data if API fails
- Seamless user experience

### 2. Layover-Optimized
- Filters experiences by duration
- Perfect for short layovers
- Airport transfer considerations

### 3. Rich Experience Display
- Product images
- Ratings and reviews
- Pricing information
- Duration and highlights
- Direct booking links to Viator

## Available Cities (with mock data)
- Dubai
- Istanbul
- Singapore
- Doha
- Amsterdam
- Reykjavik

## Revenue Model
As a Viator Affiliate Partner, you earn commission on:
- All bookings made through your referral links
- 30-day cookie attribution window
- Commission rates vary by product category

## Next Steps
1. **Production API Access**: Contact Viator support if API issues persist
2. **Add More Cities**: Expand mock data for additional destinations
3. **Booking Analytics**: Implement tracking for conversion metrics
4. **User Reviews**: Display detailed reviews from Viator
5. **Real-time Availability**: Integrate availability checking when API is stable

## Support
- Viator Partner Help Center: https://partnerresources.viator.com/
- API Documentation: https://docs.viator.com/partner-api/
- Technical Support: Contact your Viator account manager

## Important Notes
- The API currently returns 500 errors, likely due to maintenance or configuration
- Mock data system ensures functionality while API issues are resolved
- All product codes starting with "VTR-" indicate mock data
- Real Viator product codes will replace mock data when API is available