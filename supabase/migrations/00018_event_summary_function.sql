-- Migration: 00018_event_summary_function.sql
-- Creates a function to get event summary count by type

-- Function to get lead events summary grouped by type
CREATE OR REPLACE FUNCTION public.get_lead_events_summary(lead_id_param UUID)
RETURNS TABLE (
    event_type TEXT,
    count BIGINT
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT event_type, COUNT(*) as count
    FROM public.lead_events
    WHERE lead_id = lead_id_param
    GROUP BY event_type
    ORDER BY count DESC;
$$;

-- Add comment
COMMENT ON FUNCTION public.get_lead_events_summary IS 'Get a summary count of events by type for a specific lead';

-- Set permissions
REVOKE ALL ON FUNCTION public.get_lead_events_summary FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_lead_events_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_lead_events_summary TO service_role;