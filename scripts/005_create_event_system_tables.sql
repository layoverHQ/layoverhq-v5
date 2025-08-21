-- Event System and Message Queue Tables

-- Events table for event sourcing
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  version TEXT DEFAULT '1.0',
  correlation_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event processing queue
CREATE TABLE IF NOT EXISTS public.event_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'retry')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Background job queue
CREATE TABLE IF NOT EXISTS public.job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'retry')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  timeout INTEGER DEFAULT 30000, -- milliseconds
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dead letter queue for failed events
CREATE TABLE IF NOT EXISTS public.dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id),
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  error_message TEXT NOT NULL,
  failed_at TIMESTAMPTZ NOT NULL,
  retry_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook logs
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  signature TEXT,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'failed')),
  error_message TEXT,
  received_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event subscriptions (for real-time notifications)
CREATE TABLE IF NOT EXISTS public.event_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_types TEXT[] NOT NULL,
  endpoint_url TEXT, -- For webhook subscriptions
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dead_letter_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admin/Manager access for system tables
CREATE POLICY "events_admin_read" ON public.events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "events_system_write" ON public.events FOR INSERT WITH CHECK (true); -- Allow system to write events

CREATE POLICY "event_queue_admin_only" ON public.event_queue FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "job_queue_admin_only" ON public.job_queue FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "dead_letter_queue_admin_only" ON public.dead_letter_queue FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "webhook_logs_admin_only" ON public.webhook_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "event_subscriptions_own_or_admin" ON public.event_subscriptions FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

CREATE POLICY "event_subscriptions_own_write" ON public.event_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "event_subscriptions_own_update" ON public.event_subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_events_type ON public.events(type);
CREATE INDEX idx_events_timestamp ON public.events(timestamp);
CREATE INDEX idx_events_correlation_id ON public.events(correlation_id);
CREATE INDEX idx_events_user_id ON public.events(user_id);

CREATE INDEX idx_event_queue_status ON public.event_queue(status);
CREATE INDEX idx_event_queue_scheduled_at ON public.event_queue(scheduled_at);
CREATE INDEX idx_event_queue_priority ON public.event_queue(priority);

CREATE INDEX idx_job_queue_status ON public.job_queue(status);
CREATE INDEX idx_job_queue_scheduled_at ON public.job_queue(scheduled_at);
CREATE INDEX idx_job_queue_priority ON public.job_queue(priority);
CREATE INDEX idx_job_queue_type ON public.job_queue(type);

CREATE INDEX idx_webhook_logs_source ON public.webhook_logs(source);
CREATE INDEX idx_webhook_logs_received_at ON public.webhook_logs(received_at);

-- Add updated_at trigger to event_subscriptions
CREATE TRIGGER event_subscriptions_updated_at 
  BEFORE UPDATE ON public.event_subscriptions 
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to clean up old events (for scheduled cleanup)
CREATE OR REPLACE FUNCTION public.cleanup_old_events(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete old processed events
  DELETE FROM public.events 
  WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep 
    AND status = 'processed';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete old completed jobs
  DELETE FROM public.job_queue 
  WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep 
    AND status = 'completed';
  
  -- Delete old webhook logs
  DELETE FROM public.webhook_logs 
  WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep 
    AND status = 'processed';
  
  RETURN deleted_count;
END;
$$;
