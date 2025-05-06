import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '../services/supabaseService';

/**
 * Type for filter operations in queries
 */
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is' | 'in' | 'contains';

/**
 * Filter definition for queries
 */
export interface QueryFilter {
  column: string;
  operator: FilterOperator;
  value: any;
}

/**
 * Generic database query options
 */
export interface QueryOptions {
  table: string;
  select?: string;
  filters?: QueryFilter[];
  order?: Record<string, 'asc' | 'desc'>;
  limit?: number;
  offset?: number;
  single?: boolean;
}

/**
 * Execute a query with the provided options
 */
export async function executeQuery<T>(options: QueryOptions, client?: SupabaseClient): Promise<T[]> {
  const supabase = client || getSupabaseAdmin();
  
  // Start with the base query
  let query = supabase
    .from(options.table)
    .select(options.select || '*');
  
  // Apply filters
  if (options.filters && options.filters.length > 0) {
    options.filters.forEach(filter => {
      query = query.filter(filter.column, filter.operator, filter.value);
    });
  }
  
  // Apply ordering
  if (options.order) {
    Object.entries(options.order).forEach(([column, direction]) => {
      query = query.order(column, { ascending: direction === 'asc' });
    });
  }
  
  // Apply pagination
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }
  
  // Execute the query
  const { data, error } = await query;
  
  if (error) {
    console.error('Database query error:', error);
    throw new Error(`Database query error: ${error.message}`);
  }
  
  return (data || []) as T[];
}

/**
 * Insert data into a table
 */
export async function insertData<T>(
  table: string, 
  data: Record<string, any>,
  client?: SupabaseClient
): Promise<T> {
  const supabase = client || getSupabaseAdmin();
  
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select();
  
  if (error) {
    console.error('Database insert error:', error);
    throw new Error(`Database insert error: ${error.message}`);
  }
  
  if (!result || result.length === 0) {
    throw new Error('No data returned after insert');
  }
  
  return result[0] as T;
}

/**
 * Update data in a table
 */
export async function updateData<T>(
  table: string,
  filters: QueryFilter[],
  data: Record<string, any>,
  client?: SupabaseClient
): Promise<T[]> {
  console.log(`[dbUtils] Updating data in table: ${table}`);
  console.log(`[dbUtils] Update filters:`, JSON.stringify(filters));
  console.log(`[dbUtils] Update data:`, JSON.stringify(data));
  
  const supabase = client || getSupabaseAdmin();
  
  try {
    // Create the update query
    let query = supabase
      .from(table)
      .update(data);
    
    // Apply filters
    filters.forEach(filter => {
      console.log(`[dbUtils] Adding filter: ${filter.column} ${filter.operator} ${filter.value}`);
      query = query.filter(filter.column, filter.operator, filter.value);
    });
    
    console.log(`[dbUtils] Executing update query...`);
    const { data: result, error } = await query.select();
    
    if (error) {
      console.error('[dbUtils] Database update error:', error);
      throw new Error(`Database update error: ${error.message}`);
    }
    
    console.log(`[dbUtils] Update successful, returned ${result?.length || 0} records`);
    return (result || []) as T[];
  } catch (err) {
    console.error('[dbUtils] Error updating data:', err);
    console.error('[dbUtils] Stack trace:', err instanceof Error ? err.stack : 'No stack trace');
    throw err;
  }
}

/**
 * Delete data from a table (or soft-delete by updating is_active)
 */
export async function deleteData<T>(
  table: string,
  filters: QueryFilter[],
  softDelete: boolean = true,
  client?: SupabaseClient
): Promise<boolean> {
  const supabase = client || getSupabaseAdmin();
  
  if (softDelete) {
    // Soft delete by setting is_active to false
    let query = supabase
      .from(table)
      .update({ is_active: false, updated_at: new Date().toISOString() });
    
    // Apply filters
    filters.forEach(filter => {
      query = query.filter(filter.column, filter.operator, filter.value);
    });
    
    const { error } = await query;
    
    if (error) {
      console.error('Database soft delete error:', error);
      throw new Error(`Database soft delete error: ${error.message}`);
    }
  } else {
    // Hard delete
    let query = supabase.from(table).delete();
    
    // Apply filters
    filters.forEach(filter => {
      query = query.filter(filter.column, filter.operator, filter.value);
    });
    
    const { error } = await query;
    
    if (error) {
      console.error('Database delete error:', error);
      throw new Error(`Database delete error: ${error.message}`);
    }
  }
  
  return true;
}