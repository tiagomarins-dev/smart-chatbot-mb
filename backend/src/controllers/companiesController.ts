import { Request, Response } from 'express';
import { Company, CompanyUpdateRequest } from '../interfaces';
import { executeQuery, insertData, updateData, QueryFilter } from '../utils/dbUtils';
import { HttpStatus, sendError, sendSuccess } from '../utils/responseUtils';

/**
 * Get all companies (with optional filter by ID)
 */
export async function getCompanies(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const companyId = req.query.id as string;

    // Build filters
    const filters: QueryFilter[] = [
      { column: 'user_id', operator: 'eq', value: userId }
    ];

    // Add company ID filter if provided
    if (companyId) {
      filters.push({ column: 'id', operator: 'eq', value: companyId });
    }

    // Query database
    const companies = await executeQuery<Company>({
      table: 'companies',
      select: '*',
      filters,
      order: { created_at: 'desc' }
    });

    sendSuccess(res, { companies });
  } catch (error) {
    console.error('Error getting companies:', error);
    sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get company by ID
 */
export async function getCompanyById(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const companyId = req.params.id;

    if (!companyId) {
      sendError(res, 'Company ID is required', HttpStatus.BAD_REQUEST);
      return;
    }

    // Query database for specific company
    const companies = await executeQuery<Company>({
      table: 'companies',
      select: '*',
      filters: [
        { column: 'id', operator: 'eq', value: companyId },
        { column: 'user_id', operator: 'eq', value: userId }
      ]
    });

    if (companies.length === 0) {
      sendError(res, 'Company not found', HttpStatus.NOT_FOUND);
      return;
    }

    sendSuccess(res, { company: companies[0] });
  } catch (error) {
    console.error('Error getting company:', error);
    sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Create a new company
 */
export async function createCompany(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { name } = req.body;

    if (!name || !name.trim()) {
      sendError(res, 'Company name is required', HttpStatus.BAD_REQUEST);
      return;
    }

    // Create company data
    const companyData: Company = {
      user_id: userId!,
      name: name.trim(),
      is_active: true
    };

    // Insert into database
    const company = await insertData<Company>('companies', companyData);

    sendSuccess(res, { company }, HttpStatus.CREATED);
  } catch (error) {
    console.error('Error creating company:', error);
    sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Update company
 */
export async function updateCompany(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const companyId = req.params.id;
    const updateData: CompanyUpdateRequest = req.body;

    if (!companyId) {
      sendError(res, 'Company ID is required', HttpStatus.BAD_REQUEST);
      return;
    }

    if (!updateData.name || !updateData.name.trim()) {
      sendError(res, 'Company name is required', HttpStatus.BAD_REQUEST);
      return;
    }

    // Check if company exists and belongs to user
    const companies = await executeQuery<Company>({
      table: 'companies',
      select: 'id',
      filters: [
        { column: 'id', operator: 'eq', value: companyId },
        { column: 'user_id', operator: 'eq', value: userId }
      ]
    });

    if (companies.length === 0) {
      sendError(res, 'Company not found or unauthorized', HttpStatus.NOT_FOUND);
      return;
    }

    // Prepare update data
    const updates: Partial<Company> = {
      name: updateData.name.trim(),
      updated_at: new Date().toISOString()
    };

    // Add is_active if provided
    if (typeof updateData.is_active === 'boolean') {
      updates.is_active = updateData.is_active;
    }

    // Update company
    const updatedCompanies = await updateData<Company>(
      'companies',
      [{ column: 'id', operator: 'eq', value: companyId }],
      updates
    );

    if (updatedCompanies.length === 0) {
      sendError(res, 'Failed to update company', HttpStatus.INTERNAL_SERVER_ERROR);
      return;
    }

    sendSuccess(res, { company: updatedCompanies[0] });
  } catch (error) {
    console.error('Error updating company:', error);
    sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Deactivate company (soft delete)
 */
export async function deactivateCompany(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const companyId = req.params.id;

    if (!companyId) {
      sendError(res, 'Company ID is required', HttpStatus.BAD_REQUEST);
      return;
    }

    // Check if company exists and belongs to user
    const companies = await executeQuery<Company>({
      table: 'companies',
      select: 'id',
      filters: [
        { column: 'id', operator: 'eq', value: companyId },
        { column: 'user_id', operator: 'eq', value: userId }
      ]
    });

    if (companies.length === 0) {
      sendError(res, 'Company not found or unauthorized', HttpStatus.NOT_FOUND);
      return;
    }

    // Update company to inactive
    const updates: Partial<Company> = {
      is_active: false,
      updated_at: new Date().toISOString()
    };

    await updateData<Company>(
      'companies',
      [{ column: 'id', operator: 'eq', value: companyId }],
      updates
    );

    sendSuccess(res, {
      success: true,
      message: 'Company deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating company:', error);
    sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}