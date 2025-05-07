-- Migration: 00017_execute_sql_function.sql
-- Creates a function to execute raw SQL queries from the Node.js backend

-- Function to execute raw SQL queries with parameters
CREATE OR REPLACE FUNCTION public.execute_sql(query_text TEXT, params JSONB DEFAULT '[]') 
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    query_with_params TEXT;
    param_value TEXT;
    i INT;
BEGIN
    -- Set up the query with parameters
    query_with_params := query_text;
    
    -- Replace positional parameters ($1, $2, etc.) with actual values
    IF jsonb_array_length(params) > 0 THEN
        FOR i IN 0..jsonb_array_length(params)-1 LOOP
            -- Convert the parameter to text for use in the query
            param_value := params->i;
            -- Handle nulls
            IF param_value IS NULL THEN
                param_value := 'NULL';
            -- Handle strings by ensuring they're properly quoted
            ELSIF jsonb_typeof(params->i) = 'string' THEN
                param_value := quote_literal(params->i#>>'{}');
            -- Handle booleans
            ELSIF jsonb_typeof(params->i) = 'boolean' THEN
                param_value := CASE WHEN (params->i)::text = 'true' THEN 'TRUE' ELSE 'FALSE' END;
            -- Handle numerics
            ELSIF jsonb_typeof(params->i) = 'number' THEN
                param_value := (params->i)::text;
            -- Handle other types
            ELSE
                param_value := params->i#>>'{}';
            END IF;
            
            -- Replace the parameter placeholder with the actual value
            query_with_params := REPLACE(query_with_params, '$' || (i+1)::text, param_value);
        END LOOP;
    END IF;
    
    -- Execute the query and capture the result as JSON
    EXECUTE 'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (' || query_with_params || ') t' INTO result;
    
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    -- Return error information
    RETURN jsonb_build_object(
        'error', SQLERRM,
        'detail', SQLSTATE,
        'query', query_with_params
    );
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.execute_sql IS 'Executes raw SQL queries with parameter substitution. For use by authorized service accounts only.';

-- Permissions
REVOKE ALL ON FUNCTION public.execute_sql FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.execute_sql TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_sql TO service_role;