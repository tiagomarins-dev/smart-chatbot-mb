import { Request, Response } from 'express';
import { Lead, LeadCaptureRequest, LeadProject, LeadStats, LeadStatus, LeadStatusUpdateRequest, LeadEvent } from '../interfaces';
import { executeQuery, insertData, updateData, QueryFilter } from '../utils/dbUtils';
import { HttpStatus, sendError, sendSuccess } from '../utils/responseUtils';
import { getSupabaseAdmin } from '../services/supabaseService';
import { getLeadEvents, getLeadEventsByType, getLeadEventsByOrigin, getLeadEventsSummary } from '../services/leadEventsService';

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

    // Get lead's projects - query them separately to avoid join issues
    // First, get the lead projects
    const leadProjects = await executeQuery<LeadProject>({
      table: 'lead_project',
      select: '*',
      filters: [
        { column: 'lead_id', operator: 'eq', value: leadId }
      ]
    });
    
    // Then, for each lead project, get the project name
    const enrichedProjects = [];
    if (leadProjects.length > 0) {
      for (const project of leadProjects) {
        if (project.project_id) {
          const projectDetails = await executeQuery<{ id: string, name: string }>({
            table: 'projects',
            select: 'id, name',
            filters: [
              { column: 'id', operator: 'eq', value: project.project_id }
            ],
            single: true
          });
          
          if (projectDetails.length > 0) {
            enrichedProjects.push({
              ...project,
              project_name: projectDetails[0].name
            });
          } else {
            enrichedProjects.push(project);
          }
        } else {
          enrichedProjects.push(project);
        }
      }
    }

    sendSuccess(res, { 
      lead: leads[0],
      projects: enrichedProjects
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
 * Update a lead completely
 */
export async function updateLead(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const leadId = req.params.id;
    const data = req.body;

    if (!leadId) {
      sendError(res, 'Lead ID is required', HttpStatus.BAD_REQUEST);
      return;
    }

    // Validate required fields
    if (!data.name || !data.email || !data.phone || !data.status) {
      sendError(res, 'Name, email, phone, and status are required', HttpStatus.BAD_REQUEST);
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

    // Format phone (remove non-numeric characters)
    const phone = data.phone.replace(/[^0-9]/g, '');

    // Prepare update data
    const updates: Partial<Lead> = {
      name: data.name.trim(),
      first_name: data.first_name || data.name.trim().split(' ')[0],
      email: data.email.trim(),
      phone,
      status: data.status,
      updated_at: new Date().toISOString()
    };

    // Add notes if provided
    if (data.notes !== undefined) {
      updates.notes = data.notes;
    }

    // Update lead
    const updatedLeads = await updateData<Lead>(
      'leads',
      [{ column: 'id', operator: 'eq', value: leadId }],
      updates
    );

    // Log status change if status has changed (optional)
    if (currentLead.status !== data.status) {
      try {
        await insertData('lead_status_logs', {
          user_id: userId,
          lead_id: leadId,
          action: 'status_change',
          old_value: currentLead.status,
          new_value: data.status,
          notes: data.notes,
          created_at: new Date().toISOString()
        });
      } catch (logError) {
        console.warn('Failed to log status change:', logError);
        // Non-critical error, continue with response
      }
    }

    sendSuccess(res, {
      message: 'Lead updated successfully',
      lead: updatedLeads[0] || null
    });
  } catch (error) {
    console.error('Error updating lead:', error);
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

    // Initialize stats object with default empty objects
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

    // Get all leads for the user to count them
    const supabase = getSupabaseAdmin();
    
    const { data: userLeads, error: userLeadsError } = await supabase
      .from('leads')
      .select('id, created_at')
      .eq('user_id', userId);
    
    if (userLeadsError) {
      console.error('Error fetching user leads:', userLeadsError);
      // Continue execution with default values
      stats.total_leads = 0;
      stats.new_leads_period = 0;
    } else {
      // Count total leads
      stats.total_leads = userLeads?.length || 0;
      
      // Count new leads in period
      stats.new_leads_period = userLeads?.filter(lead => 
        lead.created_at && new Date(lead.created_at) >= periodStart
      ).length || 0;
    }

    // Get leads by status - using manual counting instead of group by
    const { data: statusData, error: statusError } = await supabase
      .from('leads')
      .select('status')
      .eq('user_id', userId);

    // Initialize all possible statuses with zero count
    const validStatuses: LeadStatus[] = ['novo', 'qualificado', 'contatado', 'convertido', 'desistiu', 'inativo'];
    validStatuses.forEach(status => {
      stats.leads_by_status[status] = 0;
    });

    if (statusError) {
      console.error('Error fetching lead status data:', statusError);
      // Continue execution with initialized zero counts for all statuses
    } else if (statusData) {
      // Count leads by status manually
      statusData.forEach(item => {
        const status = item.status || 'unknown';
        // Only count valid statuses
        if (validStatuses.includes(status as LeadStatus)) {
          stats.leads_by_status[status as LeadStatus] = (stats.leads_by_status[status as LeadStatus] || 0) + 1;
        }
      });
    }

    // If project ID is provided, get project-specific stats
    if (projectId) {
      // Get leads by source (utm_source) - manual counting instead of group by
      const { data: sourceData, error: sourceError } = await supabase
        .from('lead_project')
        .select('utm_source')
        .eq('project_id', projectId);

      // Initialize with direct or unknown source set to 0
      stats.leads_by_source = {
        'direct': 0,
        'unknown': 0
      };

      if (sourceError) {
        console.error('Error fetching UTM source data:', sourceError);
        // Continue execution with default sources
      } else if (sourceData) {
        // Count UTM sources manually
        sourceData.forEach(item => {
          const source = item.utm_source || 'unknown';
          stats.leads_by_source[source] = (stats.leads_by_source[source] || 0) + 1;
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

/**
 * @swagger
 * /api/leads/utm-counts:
 *   get:
 *     summary: Get UTM parameter summary counts
 *     description: Returns counts of different UTM parameters (source, medium, campaign) used across leads
 *     tags: [leads]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: company_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by company ID
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by project ID
 *     responses:
 *       200:
 *         description: UTM parameter counts successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     utm_sources:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: 'google'
 *                           count:
 *                             type: number
 *                             example: 42
 *                     utm_mediums:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: 'cpc'
 *                           count:
 *                             type: number
 *                             example: 37
 *                     utm_campaigns:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: 'spring_sale'
 *                           count:
 *                             type: number
 *                             example: 24
 *                     total_records:
 *                       type: number
 *                       example: 120
 *                     filters:
 *                       type: object
 *                       properties:
 *                         company_id:
 *                           type: string
 *                           example: '550e8400-e29b-41d4-a716-446655440000'
 *                         project_id:
 *                           type: string
 *                           example: '550e8400-e29b-41d4-a716-446655440001'
 *       401:
 *         description: Unauthorized - invalid or missing authentication token
 *       500:
 *         description: Internal server error
 */
export async function getUtmCounts(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const projectId = req.query.project_id as string;
    const companyId = req.query.company_id as string;

    const supabase = getSupabaseAdmin();
    
    // Build base query to get all lead projects associated with user
    // We'll use a simpler approach without complex joins
    let query = supabase
      .from('lead_project')
      .select(`
        id, 
        lead_id,
        project_id,
        utm_source,
        utm_medium,
        utm_campaign
      `);
    
    // Add project filter if specified
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    
    // Execute the query
    const { data: leadProjects, error: leadProjectsError } = await query;
    
    if (leadProjectsError) {
      console.error('Error fetching lead projects:', leadProjectsError);
      sendError(res, 'Error fetching lead projects', HttpStatus.INTERNAL_SERVER_ERROR);
      return;
    }
    
    // Get all leads for the current user to filter by user_id and company_id
    const { data: userLeads, error: userLeadsError } = await supabase
      .from('leads')
      .select('id, company_id')
      .eq('user_id', userId);
    
    if (userLeadsError) {
      console.error('Error fetching user leads:', userLeadsError);
      sendError(res, 'Error fetching user leads', HttpStatus.INTERNAL_SERVER_ERROR);
      return;
    }
    
    // Create a set of lead IDs that belong to the user (and optionally to the company)
    const validLeadIds = new Set<string>();
    userLeads?.forEach(lead => {
      if (!companyId || lead.company_id === companyId) {
        validLeadIds.add(lead.id);
      }
    });
    
    // Filter lead projects to only include those associated with the user's leads
    const filteredLeadProjects = leadProjects?.filter(lp => validLeadIds.has(lp.lead_id)) || [];
    
    // Process UTM data to count occurrences
    const utmSourceCounts: Record<string, number> = {};
    const utmMediumCounts: Record<string, number> = {};
    const utmCampaignCounts: Record<string, number> = {};
    
    filteredLeadProjects.forEach(item => {
      // Count UTM sources
      const source = item.utm_source || 'unknown';
      utmSourceCounts[source] = (utmSourceCounts[source] || 0) + 1;
      
      // Count UTM mediums
      const medium = item.utm_medium || 'unknown';
      utmMediumCounts[medium] = (utmMediumCounts[medium] || 0) + 1;
      
      // Count UTM campaigns
      const campaign = item.utm_campaign || 'unknown';
      utmCampaignCounts[campaign] = (utmCampaignCounts[campaign] || 0) + 1;
    });
    
    // Convert to array format
    const formatCounts = (counts: Record<string, number>) => {
      return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count); // Sort by count descending
    };
    
    sendSuccess(res, {
      utm_sources: formatCounts(utmSourceCounts),
      utm_mediums: formatCounts(utmMediumCounts),
      utm_campaigns: formatCounts(utmCampaignCounts),
      total_records: filteredLeadProjects.length,
      filters: {
        company_id: companyId,
        project_id: projectId
      }
    });
  } catch (error) {
    console.error('Error getting UTM counts:', error);
    sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * @swagger
 * /api/leads/search:
 *   get:
 *     summary: Search and filter leads
 *     description: Advanced search endpoint for leads with filtering by UTM parameters, text search, dates, etc.
 *     tags: [leads]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Text search term (matches against name, email, phone)
 *       - in: query
 *         name: company_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by company ID
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by project ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [novo, qualificado, contatado, convertido, desistiu, inativo]
 *         description: Filter by lead status
 *       - in: query
 *         name: utm_source
 *         schema:
 *           type: string
 *         description: Filter by UTM source
 *       - in: query
 *         name: utm_medium
 *         schema:
 *           type: string
 *         description: Filter by UTM medium
 *       - in: query
 *         name: utm_campaign
 *         schema:
 *           type: string
 *         description: Filter by UTM campaign
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by leads created on or after this date (YYYY-MM-DD)
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by leads created on or before this date (YYYY-MM-DD)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of results to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset for pagination
 *     responses:
 *       200:
 *         description: Filtered leads successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     leads:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           first_name:
 *                             type: string
 *                           email:
 *                             type: string
 *                             format: email
 *                           phone:
 *                             type: string
 *                           status:
 *                             type: string
 *                             enum: [novo, qualificado, contatado, convertido, desistiu, inativo]
 *                           notes:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                           company_id:
 *                             type: string
 *                             format: uuid
 *                           project_id:
 *                             type: string
 *                             format: uuid
 *                           utm_source:
 *                             type: string
 *                           utm_medium:
 *                             type: string
 *                           utm_campaign:
 *                             type: string
 *                           utm_term:
 *                             type: string
 *                           utm_content:
 *                             type: string
 *                           captured_at:
 *                             type: string
 *                             format: date-time
 *                     total:
 *                       type: number
 *                       example: 120
 *                     limit:
 *                       type: number
 *                       example: 50
 *                     offset:
 *                       type: number
 *                       example: 0
 *                     filters:
 *                       type: object
 *                       properties:
 *                         search:
 *                           type: string
 *                         company_id:
 *                           type: string
 *                         project_id:
 *                           type: string
 *                         status:
 *                           type: string
 *                         utm_source:
 *                           type: string
 *                         utm_medium:
 *                           type: string
 *                         utm_campaign:
 *                           type: string
 *                         date_from:
 *                           type: string
 *                         date_to:
 *                           type: string
 *       401:
 *         description: Unauthorized - invalid or missing authentication token
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/leads/{id}/events-list:
 *   get:
 *     summary: Get events for a specific lead
 *     description: Returns a list of events associated with a specific lead
 *     tags: [leads]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the lead
 *     responses:
 *       200:
 *         description: Lead events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     events:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           lead_id:
 *                             type: string
 *                             format: uuid
 *                           event_type:
 *                             type: string
 *                           event_data:
 *                             type: object
 *                           origin:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: Unauthorized - invalid or missing authentication token
 *       404:
 *         description: Lead not found or no events exist for the lead
 *       500:
 *         description: Internal server error
 */
export async function getLeadEventsList(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const leadId = req.params.id;

    if (!leadId) {
      sendError(res, 'Lead ID is required', HttpStatus.BAD_REQUEST);
      return;
    }

    // Verify lead exists and belongs to user
    const leads = await executeQuery<Lead>({
      table: 'leads',
      select: 'id',
      filters: [
        { column: 'id', operator: 'eq', value: leadId },
        { column: 'user_id', operator: 'eq', value: userId }
      ]
    });

    if (leads.length === 0) {
      sendError(res, 'Lead not found or unauthorized', HttpStatus.NOT_FOUND);
      return;
    }

    // Get all events for the lead
    const events = await getLeadEvents(leadId);

    // Return events
    sendSuccess(res, {
      lead_id: leadId,
      events: events,
      count: events.length
    });
  } catch (error) {
    console.error('Error getting lead events:', error);
    sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export async function searchLeads(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { 
      search, 
      company_id, 
      project_id, 
      status, 
      utm_source, 
      utm_medium, 
      utm_campaign,
      date_from,
      date_to,
      limit = 50,
      offset = 0
    } = req.query;

    // Start building the Supabase query
    const supabase = getSupabaseAdmin();
    
    // We'll use a two-step approach without relying on complex join syntax
    // First, get leads filtered by basic criteria
    let leadsQuery = supabase
      .from('leads')
      .select(`
        id,
        name,
        first_name,
        email,
        phone,
        status,
        notes,
        created_at,
        updated_at,
        company_id
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    // Apply date filters if provided
    if (date_from) {
      leadsQuery = leadsQuery.gte('created_at', date_from as string);
    }
    
    if (date_to) {
      leadsQuery = leadsQuery.lte('created_at', date_to as string);
    }
    
    // Apply status filter if provided
    if (status) {
      leadsQuery = leadsQuery.eq('status', status);
    }
    
    // Apply company filter if provided
    if (company_id) {
      leadsQuery = leadsQuery.eq('company_id', company_id);
    }
    
    // Apply search term if provided (search in name, email, and phone)
    if (search) {
      const searchTerm = search as string;
      // Use the like operator with the search term pattern
      const searchPattern = `%${searchTerm}%`;
      leadsQuery = leadsQuery.or(`name.ilike.${searchPattern},email.ilike.${searchPattern},phone.ilike.${searchPattern}`);
    }
    
    // Execute the leads query
    const { data: leadsData, error: leadsError } = await leadsQuery;
    
    if (leadsError) {
      console.error('Error searching leads:', leadsError);
      sendError(res, 'Error searching leads', HttpStatus.INTERNAL_SERVER_ERROR);
      return;
    }
    
    // If no leads found, return empty result
    if (!leadsData || leadsData.length === 0) {
      sendSuccess(res, {
        leads: [],
        total: 0,
        has_more: false,
        limit: Number(limit),
        offset: Number(offset),
        filters: {
          search,
          company_id,
          project_id,
          status,
          utm_source,
          utm_medium,
          utm_campaign,
          date_from,
          date_to
        }
      });
      return;
    }
    
    // Extract lead IDs for the second query
    const leadIds = leadsData.map(lead => lead.id);
    
    // Fetch lead projects
    let leadProjectsQuery = supabase
      .from('lead_project')
      .select(`
        lead_id,
        project_id,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_term,
        utm_content,
        captured_at
      `)
      .in('lead_id', leadIds);
    
    // Apply project filter if provided
    if (project_id) {
      leadProjectsQuery = leadProjectsQuery.eq('project_id', project_id);
    }
    
    // Apply UTM filters if provided
    if (utm_source) {
      leadProjectsQuery = leadProjectsQuery.eq('utm_source', utm_source);
    }
    
    if (utm_medium) {
      leadProjectsQuery = leadProjectsQuery.eq('utm_medium', utm_medium);
    }
    
    if (utm_campaign) {
      leadProjectsQuery = leadProjectsQuery.eq('utm_campaign', utm_campaign);
    }
    
    // Execute the lead projects query
    const { data: leadProjectsData, error: leadProjectsError } = await leadProjectsQuery;
    
    if (leadProjectsError) {
      console.error('Error fetching lead projects:', leadProjectsError);
      sendError(res, 'Error fetching lead projects', HttpStatus.INTERNAL_SERVER_ERROR);
      return;
    }
    
    // Create a map of lead ID to project data for quick lookup
    const leadProjectsMap: Record<string, any> = {};
    leadProjectsData?.forEach(project => {
      leadProjectsMap[project.lead_id] = project;
    });
    
    // If we have UTM or project filters and there are no matching lead projects, return empty
    if ((project_id || utm_source || utm_medium || utm_campaign) && (!leadProjectsData || leadProjectsData.length === 0)) {
      sendSuccess(res, {
        leads: [],
        total: 0,
        has_more: false,
        limit: Number(limit),
        offset: Number(offset),
        filters: {
          search,
          company_id,
          project_id,
          status,
          utm_source,
          utm_medium,
          utm_campaign,
          date_from,
          date_to
        }
      });
      return;
    }
    
    // Filter leads based on project and UTM criteria if needed
    let filteredLeads = leadsData;
    if (project_id || utm_source || utm_medium || utm_campaign) {
      filteredLeads = leadsData.filter(lead => leadProjectsMap[lead.id]);
    }
    
    // Apply pagination manually
    const startIndex = Number(offset);
    const endIndex = startIndex + Number(limit);
    const paginatedLeads = filteredLeads.slice(startIndex, endIndex);
    
    // For simplicity, we'll just set the total count to the number of results
    const total = filteredLeads.length;
    const hasMoreRecords = endIndex < total;
    
    // Combine leads with their project data
    const formattedLeads = paginatedLeads.map(lead => {
      const leadProject = leadProjectsMap[lead.id];
      
      return {
        id: lead.id,
        name: lead.name,
        first_name: lead.first_name,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        notes: lead.notes,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
        company_id: lead.company_id,
        project_id: leadProject?.project_id,
        utm_source: leadProject?.utm_source,
        utm_medium: leadProject?.utm_medium,
        utm_campaign: leadProject?.utm_campaign,
        utm_term: leadProject?.utm_term,
        utm_content: leadProject?.utm_content,
        captured_at: leadProject?.captured_at
      };
    });
    
    sendSuccess(res, {
      leads: formattedLeads || [],
      total: total,
      has_more: hasMoreRecords,
      limit: Number(limit),
      offset: Number(offset),
      filters: {
        search,
        company_id,
        project_id,
        status,
        utm_source,
        utm_medium,
        utm_campaign,
        date_from,
        date_to
      }
    });
  } catch (error) {
    console.error('Error searching leads:', error);
    sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}