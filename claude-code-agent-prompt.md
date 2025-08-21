# LayoverHQ Enterprise Backend - Claude Code Agent Engineering Prompt

## Project Overview
Transform LayoverHQ from a prototype into an enterprise-ready travel platform suitable for Y Combinator application. The system already has core functionality (weather integration, transit calculator, flight aggregation) and needs enterprise-grade architecture, admin management, and scalability.

## Key Engineering Principles

### 1. Zero-CLI Administration
- **Critical**: Once deployed, admins must be able to configure everything through the UI
- No SSH, no environment variable changes, no code deployments for configuration
- All settings stored in database with hot-reload capability
- Real-time validation and rollback mechanisms

### 2. Database-Driven Configuration
- Every configurable parameter stored in `system_configs` table
- Feature flags with tenant-specific overrides
- Algorithm parameters (ML weights, scoring) adjustable through admin UI
- API credentials encrypted and managed through secure admin interface

## Technical Architecture

### Core Stack
```
Frontend: Next.js 14 (app directory) + TypeScript + Tailwind
Backend: Next.js API Routes + Vercel Edge Functions
Database: Neon Postgres (with branching)
Cache: Upstash Redis (global replication)
Auth: Supabase (enterprise SSO)
Deployment: Vercel (enterprise tier)
```

### Existing Codebase Structure
```
/app/
  /admin/ - Admin dashboard (needs enterprise enhancement)
  /api/ - API routes (needs enterprise gateway)
/lib/
  /services/ - Core services (weather, transit, flight aggregation)
  /viator/ - Viator API integration
  redis-cache.ts - Caching layer
  error-tracking.ts - Error handling
/components/ - UI components
```

## Priority Implementation Tasks

### P0: Infrastructure Foundation
1. **Admin Configuration System**
   ```typescript
   // Create: /lib/admin/config-manager.ts
   interface ConfigValue {
     key: string
     value: any
     type: 'string' | 'number' | 'boolean' | 'json'
     description: string
     category: string
     requires_restart: boolean
     tenant_id?: string
   }
   
   class ConfigManager {
     async updateConfig(key: string, value: any, userId: string): Promise<void>
     async getConfig(key: string, tenantId?: string): Promise<any>
     async rollbackConfig(key: string, version: number): Promise<void>
   }
   ```

2. **Feature Flags Engine**
   ```typescript
   // Create: /lib/admin/feature-flags.ts
   interface FeatureFlag {
     name: string
     enabled: boolean
     rollout_percentage: number
     conditions: Record<string, any>
     tenant_overrides: Record<string, boolean>
   }
   
   class FeatureFlagService {
     async isEnabled(flag: string, tenantId?: string, userId?: string): Promise<boolean>
     async updateFlag(flag: string, config: Partial<FeatureFlag>): Promise<void>
   }
   ```

3. **Multi-Tenant Database Architecture**
   ```sql
   -- Enhance existing schema with admin tables
   CREATE TABLE system_configs (
     id SERIAL PRIMARY KEY,
     key VARCHAR(255) UNIQUE NOT NULL,
     value JSONB NOT NULL,
     type VARCHAR(50) NOT NULL,
     description TEXT,
     category VARCHAR(100),
     requires_restart BOOLEAN DEFAULT false,
     tenant_id VARCHAR(255),
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW(),
     updated_by VARCHAR(255)
   );
   
   CREATE TABLE feature_flags (
     id SERIAL PRIMARY KEY,
     name VARCHAR(255) UNIQUE NOT NULL,
     enabled BOOLEAN DEFAULT false,
     rollout_percentage INTEGER DEFAULT 0,
     conditions JSONB DEFAULT '{}',
     tenant_overrides JSONB DEFAULT '{}',
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );
   ```

### P0: Admin Dashboard Enhancement
4. **Real-Time Configuration UI**
   ```typescript
   // Enhance: /app/admin/config/page.tsx
   interface AdminConfigProps {
     categories: string[]
     configs: ConfigValue[]
     onUpdate: (key: string, value: any) => Promise<void>
     onRollback: (key: string, version: number) => Promise<void>
   }
   
   // Components needed:
   // - ConfigEditor (JSON, string, number inputs with validation)
   // - FeatureFlagToggle (real-time toggle with rollout controls)
   // - TenantConfigOverrides (tenant-specific overrides)
   // - ConfigAuditLog (change history with rollback)
   // - ConfigPreview (test configuration changes before applying)
   ```

5. **White-Label Management Interface**
   ```typescript
   // Create: /app/admin/white-label/page.tsx
   interface WhiteLabelConfig {
     tenant_id: string
     branding: {
       logo_url: string
       primary_color: string
       secondary_color: string
       custom_css: string
     }
     domain_settings: {
       custom_domain: string
       subdomain: string
     }
     features: Record<string, boolean>
   }
   ```

### P1: Enterprise API Gateway
6. **API Gateway with Rate Limiting**
   ```typescript
   // Create: /lib/api/gateway.ts
   interface APIGatewayConfig {
     rate_limits: Record<string, { requests: number; window: number }>
     tenant_overrides: Record<string, Record<string, any>>
     auth_requirements: Record<string, string[]>
   }
   
   // Enhance: /app/api/v1/enterprise/[...route]/route.ts
   export async function middleware(req: NextRequest) {
     // Tenant identification
     // Rate limiting (Redis-based)
     // Authentication validation
     // Request routing
     // Response transformation
   }
   ```

7. **Dynamic Algorithm Configuration**
   ```typescript
   // Enhance: /lib/services/enhanced-viator-service.ts
   class ConfigurableViatorService {
     private async getAlgorithmParams(key: string): Promise<any> {
       return await configManager.getConfig(`algorithm.${key}`)
     }
     
     async calculateWeatherScore(weather: WeatherData): Promise<number> {
       const weights = await this.getAlgorithmParams('weather_weights')
       // Use dynamic weights instead of hardcoded values
     }
   }
   ```

### P1: Real-Time Updates
8. **WebSocket Configuration Updates**
   ```typescript
   // Create: /lib/realtime/config-updates.ts
   class ConfigUpdateService {
     async broadcastConfigChange(key: string, value: any, tenantId?: string): Promise<void>
     async subscribeToConfigChanges(tenantId: string): Promise<void>
   }
   
   // Use Supabase Realtime for instant configuration propagation
   ```

## Implementation Guidelines

### Code Structure Best Practices
1. **Service Layer Pattern**: All business logic in `/lib/services/`
2. **Configuration Abstraction**: Never hardcode values, always use config manager
3. **Tenant Isolation**: Every database query must include tenant context
4. **Error Handling**: Comprehensive error tracking with admin notifications
5. **Caching Strategy**: Multi-layer caching with Redis + in-memory for configs

### Database Design Patterns
1. **Row-Level Security**: Postgres RLS for tenant isolation
2. **Configuration Versioning**: Keep audit trail of all configuration changes
3. **Soft Deletes**: Never hard delete data, use deleted_at timestamps
4. **Indexes**: Proper indexing for tenant_id, config keys, timestamps

### Security Requirements
1. **API Key Management**: Encrypted storage with rotation capability
2. **Admin Access Control**: Role-based permissions with audit logging
3. **Configuration Validation**: Schema validation for all configuration changes
4. **Secrets Management**: Use Vercel environment variables for deployment secrets only

## Testing Strategy
1. **Unit Tests**: All services and utilities
2. **Integration Tests**: API endpoints with different tenant configurations
3. **E2E Tests**: Admin configuration workflows
4. **Load Tests**: Enterprise-scale traffic simulation

## Performance Targets
- API Response Time: <200ms p95
- Configuration Change Propagation: <5 seconds
- Database Query Time: <50ms average
- Cache Hit Rate: >90% for frequently accessed configs

## Monitoring and Observability
1. **Metrics**: Custom metrics for configuration changes, tenant usage, performance
2. **Alerts**: Automated alerts for configuration errors, performance degradation
3. **Dashboards**: Real-time dashboards for admins and operations
4. **Audit Logs**: Complete audit trail of all administrative actions

## Development Workflow
1. **Database-First**: Design schema changes before implementing features
2. **Configuration-Driven**: Make everything configurable through admin UI
3. **Tenant-Aware**: Test all features with multiple tenant configurations
4. **Admin Validation**: Validate admin workflows before implementing business logic
5. **Hot-Reload Testing**: Ensure configuration changes work without restarts

## Success Criteria
- Admins can onboard new enterprise customers entirely through UI
- All algorithm parameters tunable without code deployment
- White-label customization deployable in <5 minutes
- System scales to 10,000+ concurrent users
- Zero downtime for configuration changes

## Next Actions
1. Start with admin configuration tables and basic config manager
2. Build real-time configuration UI with validation
3. Implement feature flags with tenant overrides
4. Create white-label management interface
5. Add comprehensive monitoring and audit logging

Focus on making the system completely self-service for administrators while maintaining enterprise-grade security and performance.