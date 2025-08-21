# LayoverHQ Development Guide for Claude

## Quick Commands

### Linting & Code Quality
```bash
# Run all checks
npm run check-all

# Fix all issues automatically  
npm run fix-all

# Individual commands
npm run lint          # Check ESLint issues
npm run lint:fix      # Auto-fix ESLint issues
npm run type-check    # Check TypeScript types
npm run format        # Format with Prettier
npm run format:check  # Check formatting
```

### Development
```bash
npm run dev           # Start development server (port 3001)
npm run build         # Build for production
npm run start         # Start production server
```

## Project Structure

### Key Directories
- `/app` - Next.js app router pages
- `/components` - React components
- `/design-system` - Enterprise design system components
- `/lib/services` - Core business logic and integrations
- `/scripts` - Database migrations and setup

### Important Files
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `.env` - Environment variables (Supabase, API keys)

## Known Issues & Fixes

### Build Errors
If you encounter module resolution errors:
1. Check that all imports exist
2. Run `npm install` to ensure dependencies
3. Check TypeScript paths in `tsconfig.json`

### Common TypeScript Errors
- Missing components in `/components/enterprise/` - These need to be created or imports fixed
- Supabase client issues - Ensure proper async/await usage
- Duplicate exports - Check for conflicting export statements

## Testing Checklist
Before committing:
1. ✅ Run `npm run lint:fix`
2. ✅ Run `npm run format`  
3. ✅ Run `npm run type-check`
4. ✅ Run `npm run build` (when ready for production)

## API Integrations
- **Viator**: Experience booking API
- **Amadeus**: Flight search API  
- **Duffel**: Flight booking API
- **Kiwi**: Alternative flight search
- **Stripe**: Payment processing
- **Supabase**: Database and authentication

## Development Workflow
1. Create feature branch
2. Make changes
3. Run `npm run fix-all` to auto-fix issues
4. Test locally with `npm run dev`
5. Build check with `npm run build`
6. Commit with descriptive message

## Performance Tips
- Use `design-system` components for consistency
- Implement error boundaries for better error handling
- Use proper TypeScript types for type safety
- Follow established patterns in existing code