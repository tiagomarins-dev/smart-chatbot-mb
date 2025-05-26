-- Create table for AI analysis logs
CREATE TABLE IF NOT EXISTS lead_ai_analysis_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN NOT NULL DEFAULT false,
  sentiment_status VARCHAR(100),
  lead_score INTEGER,
  ai_model VARCHAR(100),
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  trigger_source VARCHAR(50), -- 'event_creation', 'manual', 'cron', etc.
  trigger_details JSONB, -- Additional details about what triggered the analysis
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_lead_ai_analysis_logs_lead_id ON lead_ai_analysis_logs(lead_id);
CREATE INDEX idx_lead_ai_analysis_logs_analyzed_at ON lead_ai_analysis_logs(analyzed_at DESC);
CREATE INDEX idx_lead_ai_analysis_logs_success ON lead_ai_analysis_logs(success);

-- Add RLS policies
ALTER TABLE lead_ai_analysis_logs ENABLE ROW LEVEL SECURITY;

-- Policy for viewing logs (users can see logs for their leads)
CREATE POLICY "Users can view AI analysis logs for their leads" ON lead_ai_analysis_logs
  FOR SELECT
  USING (
    lead_id IN (
      SELECT id FROM leads WHERE user_id = auth.uid()
    )
  );

-- Policy for service role to insert logs
CREATE POLICY "Service role can insert AI analysis logs" ON lead_ai_analysis_logs
  FOR INSERT
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON lead_ai_analysis_logs TO authenticated;
GRANT ALL ON lead_ai_analysis_logs TO service_role;