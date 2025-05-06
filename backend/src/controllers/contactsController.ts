import { Request, Response } from 'express';
import { 
  Contact, 
  ContactCreateRequest, 
  ContactUpdateRequest, 
  ContactsQueryParams 
} from '../interfaces';
import { executeQuery, insertData, updateData, QueryFilter } from '../utils/dbUtils';
import { HttpStatus, sendError, sendSuccess } from '../utils/responseUtils';
import { getSupabaseAdmin } from '../services/supabaseService';

/**
 * Get all contacts with pagination and optional filters
 */
export async function getContacts(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { 
      page = 1, 
      limit = 20, 
      tag, 
      search 
    } = req.query as unknown as ContactsQueryParams;
    
    // Validate pagination params
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const offset = (pageNum - 1) * limitNum;
    
    // Get the Supabase client directly for this complex query
    const supabase = getSupabaseAdmin();
    
    // Start building the query
    let query = supabase
      .from('contacts')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('name', { ascending: true });
    
    // Add tag filter if provided
    if (tag) {
      query = query.contains('tags', [tag]);
    }
    
    // Add search filter if provided
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.or(
        `name.ilike.${searchTerm},first_name.ilike.${searchTerm},` +
        `last_name.ilike.${searchTerm},phone_number.ilike.${searchTerm},` +
        `email.ilike.${searchTerm}`
      );
    }
    
    // Add pagination
    query = query.range(offset, offset + limitNum - 1);
    
    // Execute the query
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching contacts:', error);
      throw new Error(`Error fetching contacts: ${error.message}`);
    }
    
    const total = count || 0;
    
    sendSuccess(res, {
      data: data || [],
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error getting contacts:', error);
    sendError(res, 'Error fetching contacts', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get contact by ID
 */
export async function getContactById(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const contactId = req.params.id;

    if (!contactId) {
      sendError(res, 'Contact ID is required', HttpStatus.BAD_REQUEST);
      return;
    }

    // Query database for specific contact
    const contacts = await executeQuery<Contact>({
      table: 'contacts',
      select: '*',
      filters: [
        { column: 'id', operator: 'eq', value: contactId },
        { column: 'user_id', operator: 'eq', value: userId }
      ]
    });

    if (contacts.length === 0) {
      sendError(res, 'Contact not found', HttpStatus.NOT_FOUND);
      return;
    }

    sendSuccess(res, { data: contacts[0] });
  } catch (error) {
    console.error('Error getting contact:', error);
    sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get contact by phone number
 */
export async function getContactByPhone(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const phone = req.query.phone as string;
    
    if (!phone) {
      sendError(res, 'Phone number is required', HttpStatus.BAD_REQUEST);
      return;
    }
    
    // Normalize phone number (remove non-numeric characters)
    const phoneNumber = phone.replace(/[^0-9]/g, '');
    
    // Query database for contact by phone
    const contacts = await executeQuery<Contact>({
      table: 'contacts',
      select: '*',
      filters: [
        { column: 'phone_number', operator: 'eq', value: phoneNumber },
        { column: 'user_id', operator: 'eq', value: userId }
      ]
    });
    
    if (contacts.length === 0) {
      sendError(res, 'Contact not found', HttpStatus.NOT_FOUND);
      return;
    }
    
    sendSuccess(res, { data: contacts[0] });
  } catch (error) {
    console.error('Error getting contact by phone:', error);
    sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Create a new contact
 */
export async function createContact(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const data: ContactCreateRequest = req.body;
    
    // Validate required fields
    if (!data.phone_number) {
      sendError(res, 'Phone number is required', HttpStatus.BAD_REQUEST);
      return;
    }
    
    // Normalize phone number
    const phoneNumber = data.phone_number.replace(/[^0-9]/g, '');
    
    // Validate phone number
    if (phoneNumber.length < 10) {
      sendError(res, 'Invalid phone number. Expected format: 5511999999999', HttpStatus.BAD_REQUEST);
      return;
    }
    
    // Check if contact already exists
    const existingContacts = await executeQuery<Contact>({
      table: 'contacts',
      select: 'id',
      filters: [
        { column: 'phone_number', operator: 'eq', value: phoneNumber },
        { column: 'user_id', operator: 'eq', value: userId }
      ]
    });
    
    if (existingContacts.length > 0) {
      sendError(
        res, 
        {
          message: 'Contact already exists for this phone number',
          code: 'CONTACT_EXISTS',
          id: existingContacts[0].id
        },
        HttpStatus.CONFLICT
      );
      return;
    }
    
    // Create contact object
    const contact: Contact = {
      user_id: userId!,
      phone_number: phoneNumber,
      name: data.name,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      profile_image_url: data.profile_image_url,
      is_blocked: data.is_blocked || false,
      tags: data.tags,
      custom_fields: data.custom_fields
    };
    
    // Insert into database
    const newContact = await insertData<Contact>('contacts', contact);
    
    sendSuccess(
      res, 
      { 
        data: newContact,
        message: 'Contact created successfully'
      }, 
      HttpStatus.CREATED
    );
  } catch (error) {
    console.error('Error creating contact:', error);
    sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Update an existing contact
 */
export async function updateContact(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const contactId = req.params.id;
    const updateData: ContactUpdateRequest = req.body;
    
    if (!contactId) {
      sendError(res, 'Contact ID is required', HttpStatus.BAD_REQUEST);
      return;
    }
    
    // Check if contact exists and belongs to user
    const contacts = await executeQuery<Contact>({
      table: 'contacts',
      select: 'id',
      filters: [
        { column: 'id', operator: 'eq', value: contactId },
        { column: 'user_id', operator: 'eq', value: userId }
      ]
    });
    
    if (contacts.length === 0) {
      sendError(res, 'Contact not found or unauthorized', HttpStatus.NOT_FOUND);
      return;
    }
    
    // Prepare update data with validations
    const updates: Partial<Contact> = {
      updated_at: new Date().toISOString()
    };
    
    // Add fields if provided
    const updateableFields: (keyof ContactUpdateRequest)[] = [
      'name', 'first_name', 'last_name', 'email', 
      'profile_image_url', 'is_blocked', 'tags', 'custom_fields'
    ];
    
    updateableFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    });
    
    // Check if there's anything to update
    if (Object.keys(updates).length <= 1) { // Only has updated_at
      sendError(res, 'No data provided for update', HttpStatus.BAD_REQUEST);
      return;
    }
    
    // Update contact
    const updatedContacts = await updateData<Contact>(
      'contacts',
      [{ column: 'id', operator: 'eq', value: contactId }],
      updates
    );
    
    if (updatedContacts.length === 0) {
      sendError(res, 'Failed to update contact', HttpStatus.INTERNAL_SERVER_ERROR);
      return;
    }
    
    sendSuccess(res, { 
      data: updatedContacts[0],
      message: 'Contact updated successfully'
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Delete a contact
 */
export async function deleteContact(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const contactId = req.params.id;
    
    if (!contactId) {
      sendError(res, 'Contact ID is required', HttpStatus.BAD_REQUEST);
      return;
    }
    
    // Check if contact exists and belongs to user
    const contacts = await executeQuery<Contact>({
      table: 'contacts',
      select: 'id',
      filters: [
        { column: 'id', operator: 'eq', value: contactId },
        { column: 'user_id', operator: 'eq', value: userId }
      ]
    });
    
    if (contacts.length === 0) {
      sendError(res, 'Contact not found or unauthorized', HttpStatus.NOT_FOUND);
      return;
    }
    
    // Delete the contact - using hard delete as specified in PHP code
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId);
    
    if (error) {
      throw new Error(`Error deleting contact: ${error.message}`);
    }
    
    sendSuccess(res, {
      message: 'Contact deleted successfully',
      id: contactId
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}