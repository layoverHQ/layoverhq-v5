# V5 - Mobile First Application

A modern, mobile-first web application designed for Africa, built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Quick Start

### Development in Cursor
1. Open this project in Cursor
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Deploy to Vercel
1. **Quick Deploy**: `vercel` (deploys to preview)
2. **Production Deploy**: `vercel --prod`
3. **View Deployments**: `vercel ls`

## 🛠️ Development Workflow

### 1. Local Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### 2. Deploy Updates
```bash
# Deploy to preview (staging)
vercel

# Deploy to production
vercel --prod

# View deployment status
vercel ls
```

### 3. Environment Variables
```bash
# List environment variables
vercel env ls

# Add environment variable
vercel env add VARIABLE_NAME

# Pull environment variables
vercel env pull
```

## 📱 Mobile-First Design

This application is built with mobile-first principles:
- Responsive design starting from mobile breakpoints
- Touch-friendly interface elements
- Optimized for slower network conditions
- Progressive enhancement for larger screens

## 🏗️ Project Structure

```
src/
├── app/                 # Next.js 13+ app directory
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page
│   └── globals.css     # Global styles
├── components/          # Reusable components
└── lib/                # Utility functions
```

## 🔧 Configuration Files

- `next.config.js` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `vercel.json` - Vercel deployment configuration (auto-generated)

## 🚀 Deployment

This project is connected to Vercel and will automatically:
- Deploy preview builds for every change
- Deploy to production when you run `vercel --prod`
- Provide instant rollbacks and preview URLs

## 📱 Mobile Optimization

- Responsive breakpoints: `xs: 475px`, `sm: 640px`, `md: 768px`, `lg: 1024px`
- Touch-friendly button sizes and spacing
- Optimized for various screen densities
- Progressive Web App ready

## 🎨 Design System

Built with Tailwind CSS featuring:
- Custom color schemes
- Consistent spacing and typography
- Dark mode support
- Mobile-first responsive utilities

## 🔄 Continuous Development

1. **Edit in Cursor**: Make changes to your code
2. **Test locally**: `npm run dev` to see changes
3. **Deploy**: `vercel` to deploy updates
4. **Iterate**: Repeat the cycle

## 📊 Vercel Integration

- **Project ID**: `prj_MPD33b3RwSo44J9AdXGSm57xlOtw`
- **Organization**: Doculet
- **Auto-deployment**: Enabled
- **Preview URLs**: Generated for each deployment

## 🆘 Troubleshooting

### Common Issues
- **Build fails**: Check `vercel logs` for build errors
- **Environment variables**: Use `vercel env pull` to sync
- **Deployment issues**: Check `vercel ls` for status

### Useful Commands
```bash
vercel logs          # View deployment logs
vercel inspect       # Inspect deployment details
vercel domains       # Manage custom domains
vercel analytics     # View analytics
```

## 🌍 Africa-Focused Features

- Mobile-first design for smartphone users
- Optimized for slower network conditions
- Localized content support
- Offline-first capabilities (coming soon)

---

**Happy coding! 🎉**
