-- Create system services table for backend service management
CREATE TABLE IF NOT EXISTS system_services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('api', 'database', 'queue', 'cache', 'auth', 'storage')),
  status TEXT NOT NULL DEFAULT 'stopped' CHECK (status IN ('running', 'stopped', 'error', 'maintenance')),
  version TEXT NOT NULL,
  port INTEGER,
  url TEXT,
  config JSONB DEFAULT '{}',
  last_restart TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default services
INSERT INTO system_services (id, name, type, status, version, port, url) VALUES
('api-gateway', 'API Gateway', 'api', 'running', 'v2.1.4', 3000, '/api/v1'),
('auth-service', 'Authentication Service', 'auth', 'running', 'v1.8.2', 3001, '/api/auth'),
('database', 'PostgreSQL Database', 'database', 'running', 'v15.3', 5432, NULL),
('redis-cache', 'Redis Cache', 'cache', 'running', 'v7.0.12', 6379, NULL),
('message-queue', 'Message Queue', 'queue', 'error', 'v3.2.1', 5672, NULL),
('file-storage', 'File Storage Service', 'storage', 'maintenance', 'v1.4.7', 9000, NULL)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE system_services ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin can manage system services" ON system_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );
