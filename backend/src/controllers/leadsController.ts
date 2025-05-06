import { Request, Response } from 'express';
import { Lead, LeadCaptureRequest, LeadProject, LeadStats, LeadStatus, LeadStatusUpdateRequest } from '../interfaces';
import { executeQuery, insertData, updateData, QueryFilter } from '../utils/dbUtils';
import { HttpStatus, sendError, sendSuccess } from '../utils/responseUtils';
import { getSupabaseAdmin } from '../services/supabaseService';

/**
 * Get all leads (with optional filters)
 */
export async function getLeads(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const leadId = req.query.id as string;
    const projectId = req.query.project_id as string;
    const email = req.query.email as string;
    
    // Build base filters for leads table
    const filters: QueryFilter[] = [
      { column: 'user_id', operator: 'eq', value: userId }
    ];

    // Add specific filters
    if (leadId) {
      filters.push({ column: 'id', operator: 'eq', value: leadId });
    }

    if (email) {
      filters.push({ column: 'email', operator: 'eq', value: email });
    }

    // Query database for leads
    const leads = await executeQuery<Lead>({
      table: 'leads',
      select: 'id, name, first_name, email, phone, status, notes, created_at, updated_at',
      filters,
      order: { created_at: 'desc' }
    });

    // If filtered by project, further filter the leads
    if (projectId) {
      // Get lead IDs associated with the project
      const leadProjects = await executeQuery<LeadProject>({
        table: 'lead_project',
        select: 'lead_id',
        filters: [
          { column: 'project_id', operator: 'eq', value: projectId }
        ]
      });

      // Extract lead IDs
      const projectLeadIds = leadProjects.map(lp => lp.lead_id);
      
      // Filter leads by those associated with the project
      const filteredLeads = leads.filter(lead => projectLeadIds.includes(lead.id!));

      sendSuccess(res, { leads: filteredLeads });
    } else {
      sendSuccess(res, { leads });
    }
  } catch (error) {
    console.error('Error getting leads:', error);
    sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get lead by ID
 */
export async function getLeadById(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const leadId = req.params.id;

    if (!leadId) {
      sendError(res, 'Lead ID is required', HttpStatus.BAD_REQUEST);
      return;
    }

    // Query database for specific lead
    const leads = await executeQuery<Lead>({
      table: 'leads',
      select: '*',
      filters: [
        { column: 'id', operator: 'eq', value: leadId },
        { column: 'user_id', operator: 'eq', value: userId }
      ]
    });

    if (leads.length === 0) {
      sendError(res, 'Lead not found', HttpStatus.NOT_FOUND);
      return;
    }

    // Get lead's projects
    const leadProjects = await executeQuery<LeadProject & { project_name: string }>({
      table: 'lead_project lp JOIN projects p ON lp.project_id = p.id',
      select: 'lp.*, p.name as project_name',
      filters: [
        { column: 'lp.lead_id', operator: 'eq', value: leadId }
      ]
    });

    sendSuccess(res, { 
      lead: leads[0],
      projects: leadProjects
    });
  } catch (error) {
    console.error('Error getting lead:', error);
    sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Capture a new lead
 */
export async function captureLead(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const data: LeadCaptureRequest = req.body;

    // Validate required fields
    if (!data.name || !data.email || !data.phone || !data.project_id) {
      sendError(res, 'Name, email, phone, and project_id are required', HttpStatus.BAD_REQUEST);
      return;
    }

    // Validate project
    const projects = await executeQuery({
      table: 'projects',
      select: 'id, name',
      filters: [
        { column: 'id', operator: 'eq', value: data.project_id },
        { column: 'user_id', operator: 'eq', value: userId }
      ]
    });

    if (projects.length === 0) {
      sendError(res, 'Project not found or unauthorized', HttpStatus.NOT_FOUND);
      return;
    }

    const projectName = projects[0].name;

    // Format phone (remove non-numeric characters)
    const phone = data.phone.replace(/[^0-9]/g, '');

    // Determine first name (if not provided)
    const firstName = data.first_name || data.name.split(' ')[0];

    // Check if lead with same email already exists
    const existingLeads = await executeQuery<Lead>({
      table: 'leads',
      select: 'id',
      filters: [
        { column: 'email', operator: 'eq', value: data.email },
        { column: 'user_id', operator: 'eq', value: userId }
      ]
    });

    let leadId: string;
    let existingLead = false;

    if (existingLeads.length > 0) {
      // Lead already exists
      leadId = existingLeads[0].id!;
      existingLead = true;
    } else {
      // Create new lead
      const lead: Lead = {
        user_id: userId!,
        name: data.name.trim(),
        first_name: firstName,
        email: data.email.trim(),
        phone,
        status: 'novo',
        notes: data.notes
      };

      const newLead = await insertData<Lead>('leads', lead);
      leadId = newLead.id!;
    }

    // Create lead-project association
    const leadProject: LeadProject = {
      lead_id: leadId,
      project_id: data.project_id,
      utm_source: data.utm_source,
      utm_medium: data.utm_medium,
      utm_campaign: data.utm_campaign,
      utm_term: data.utm_term,
      utm_content: data.utm_content
    };

    await insertData<LeadProject>('lead_project', leadProject);

    // Get full lead details
    const lead = await executeQuery<Lead>({
      table: 'leads',
      select: '*',
      filters: [
        { column: 'id', operator: 'eq', value: leadId }
      ],
      single: true
    });

    // Prepare response
    const responseData = {
      lead: lead[0],
      message: existingLead ? 'Lead already exists, associated with project' : 'Lead captured successfully',
      details: {
        name: data.name,
        project: projectName,
        captured_at: new Date().toISOString()
      }
    };

    sendSuccess(res, responseData, HttpStatus.CREATED);
  } catch (error) {
    console.error('Error capturing lead:', error);
    sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Update lead status
 */
export async function updateLeadStatus(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const leadId = req.params.id;
    const data: LeadStatusUpdateRequest = req.body;

    if (!leadId) {
      sendError(res, 'Lead ID is required', HttpStatus.BAD_REQUEST);
      return;
    }

    if (!data.status) {
      sendError(res, 'Status is required', HttpStatus.BAD_REQUEST);
      return;
    }

    // Validate status
    const validStatuses: LeadStatus[] = ['novo', 'qualificado', 'contatado', 'convertido', 'desistiu', 'inativo'];
    if (!validStatuses.includes(data.status)) {
      sendError(res, `Invalid status, must be one of: ${validStatuses.join(', ')}`, HttpStatus.BAD_REQUEST);
      return;
    }

    // Check if lead exists and belongs to user
    const leads = await executeQuery<Lead>({
      table: 'leads',
      select: 'id, name, email, status',
      filters: [
        { column: 'id', operator: 'eq', value: leadId },
        { column: 'user_id', operator: 'eq', value: userId }
      ]
    });

    if (leads.length === 0) {
      sendError(res, 'Lead not found or unauthorized', HttpStatus.NOT_FOUND);
      return;
    }

    const currentLead = leads[0];
    const currentStatus = currentLead.status;

    // If status is the same and no notes are provided, no update needed
    if (currentStatus === data.status && !data.notes) {
      sendSuccess(res, {
        message: `Status already set to ${data.status}`,
        lead_id: leadId
      });
      return;
    }

    // Prepare update data
    const updates: Partial<Lead> = {
      status: data.status,
      updated_at: new Date().toISOString()
    };

    // Add notes if provided
    if (data.notes) {
      updates.notes = data.notes;
    }

    // Update lead
    const updatedLeads = await updateData<Lead>(
      'leads',
      [{ column: 'id', operator: 'eq', value: leadId }],
      updates
    );

    // Log status change (optional)
    try {
      await insertData('lead_status_logs', {
        user_id: userId,
        lead_id: leadId,
        action: 'status_change',
        old_value: currentStatus,
        new_value: data.status,
        notes: data.notes,
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.warn('Failed to log status change:', logError);
      // Non-critical error, continue with response
    }

    sendSuccess(res, {
      message: 'Lead status updated successfully',
      lead_id: leadId,
      lead_name: currentLead.name,
      lead_email: currentLead.email,
      previous_status: currentStatus,
      new_status: data.status,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating lead status:', error);
    sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get lead statistics
 */
export async function getLeadStats(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const projectId = req.query.project_id as string;
    const periodDays = parseInt(req.query.period as string) || 30;

    // Initialize stats object
    const stats: LeadStats = {
      total_leads: 0,
      new_leads_period: 0,
      leads_by_status: {} as Record<LeadStatus, number>,
      leads_by_source: {},
      leads_by_day: [],
      conversion_rate: 0
    };

    // Calculate period start date
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);
    const periodStartISO = periodStart.toISOString().split('T')[0];

    // Get total leads count
    const supabase = getSupabaseAdmin();
    
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
      
    stats.total_leads = totalLeads || 0;

    // Get new leads count in period
    const { count: newLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', periodStartISO);
      
    stats.new_leads_period = newLeads || 0;

    // Get leads by status
    const { data: statusData } = await supabase
      .from('leads')
      .select('status, count')
      .eq('user_id', userId)
      .group('status');

    if (statusData) {
      statusData.forEach(item => {
        stats.leads_by_status[item.status as LeadStatus] = parseInt(item.count);
      });
    }

    // If project ID is provided, get project-specific stats
    if (projectId) {
      // Get leads by source (utm_source)
      const { data: sourceData } = await supabase
        .from('lead_project')
        .select('utm_source, count')
        .eq('project_id', projectId)
        .group('utm_source');

      if (sourceData) {
        sourceData.forEach(item => {
          const source = item.utm_source || 'unknown';
          stats.leads_by_source[source] = parseInt(item.count);
        });
      }

      // Get leads by day in period
      const { data: dailyData } = await supabase
        .from('lead_project')
        .select('captured_at')
        .eq('project_id', projectId)
        .gte('captured_at', periodStartISO);

      if (dailyData) {
        // Group by day
        const dayCount: Record<string, number> = {};
        
        // Initialize all days in period with 0
        const today = new Date();
        let currentDate = new Date(periodStart);
        
        while (currentDate <= today) {
          const dateStr = currentDate.toISOString().split('T')[0];
          dayCount[dateStr] = 0;
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Count leads by day
        dailyData.forEach(item => {
          const dateStr = new Date(item.captured_at).toISOString().split('T')[0];
          dayCount[dateStr] = (dayCount[dateStr] || 0) + 1;
        });
        
        // Convert to array format for response
        stats.leads_by_day = Object.entries(dayCount).map(([date, count]) => ({
          date,
          count
        })).sort((a, b) => a.date.localeCompare(b.date));
      }

      // Calculate conversion rate
      const { data: projectData } = await supabase
        .from('projects')
        .select('views_count')
        .eq('id', projectId)
        .single();

      if (projectData) {
        const viewsCount = projectData.views_count || 100; // Default value if no views
        const totalLeadsInProject = Object.values(stats.leads_by_source).reduce((sum, count) => sum + count, 0);
        stats.conversion_rate = viewsCount > 0 ? parseFloat(((totalLeadsInProject / viewsCount) * 100).toFixed(2)) : 0;
      } else {
        stats.conversion_rate = 2.5; // Default simulated rate
      }
    }

    sendSuccess(res, {
      stats,
      period_days: periodDays,
      project_id: projectId
    });
  } catch (error) {
    console.error('Error getting lead stats:', error);
    sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}