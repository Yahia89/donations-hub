import { supabase } from '../utils/supabase';
import { PostgrestError } from '@supabase/supabase-js';
import memoize from 'lodash.memoize';

// Define interfaces for type safety
interface Recipient {
  id?: string;
  name: string;
  date: string;
  address?: string;
  phone_number?: string;
  driver_license?: string;
  marital_status: 'single' | 'married';
  zakat_requests: number;
  notes?: string;
  status: 'active' | 'inactive';
  center_id: string;
  created_at?: string;
  centers?: { name: string };
  center_name?: string;
  added_by?: {
    display_name: string;
  };
}

interface CenterAccess {
  centerId: string;
  isAdmin: boolean;
  centerName?: string;
}

interface ServiceError extends Error {
  code?: string;
  details?: string;
}

// Utility function for input sanitization
const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>{}]/g, '') // Remove potential XSS characters
    .trim()
    .substring(0, 1000); // Limit length
};

// Utility function for consistent error handling
const handleServiceError = (error: unknown, context: string): ServiceError => {
  const serviceError = new Error(`${context}: ${(error as Error).message}`) as ServiceError;
  if (error instanceof PostgrestError) {
    serviceError.code = error.code;
    serviceError.details = error.details;
  }
  return serviceError;
};

// Cache for getCurrentUserCenter (5-minute TTL)
const cachedGetCurrentUserCenter = memoize(
  async (): Promise<CenterAccess> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) throw new Error('Not authenticated');

    const { data: adminCenter, error } = await supabase
      .from('admin_centers')
      .select(`
        center_id,
        role,
        centers (
          name
        )
      `)
      .eq('admin_id', user.id)
      .single();

    if (error) throw handleServiceError(error, 'Failed to fetch center access');
    if (!adminCenter) throw new Error('No center access found');

    return {
      centerId: adminCenter.center_id,
      isAdmin: adminCenter.role === 'app_admin',
      centerName: adminCenter.centers?.name
    };
  },
  () => 'user_center',
  5 * 60 * 1000 
);

export const recipientService = {
  /**
   * Get current user's center access information
   * @returns CenterAccess object containing center ID, admin status, and center name
   * @throws ServiceError if authentication fails or center access not found
   */
  async getCurrentUserCenter(): Promise<CenterAccess> {
    try {
      return await cachedGetCurrentUserCenter();
    } catch (error) {
      throw handleServiceError(error, 'getCurrentUserCenter');
    }
  },

  /**
   * Search recipients based on search term
   * @param searchTerm - Term to search across name, phone, address, or license
   * @param options - Pagination options (limit, page)
   * @returns Array of matching Recipient objects
   * @throws ServiceError if query fails
   */
  async searchRecipients(
    searchTerm: string,
    options: { limit?: number; page?: number } = {}
  ): Promise<Recipient[]> {
    try {
      const sanitizedTerm = sanitizeInput(searchTerm);
      if (!sanitizedTerm) throw new Error('Invalid search term');

      const { centerId, isAdmin } = await this.getCurrentUserCenter();
      const { limit = 50, page = 1 } = options;

      let query = supabase
        .from('recipients')
        .select(`
          id,
          name,
          date,
          address,
          phone_number,
          driver_license,
          marital_status,
          zakat_requests,
          notes,
          status,
          center_id,
          created_at,
          centers!center_id (
            name
          ),
          added_by:admins!added_by_admin_id (
            display_name
          )
        `, { count: 'exact' })
        .or(
          `name.ilike.*${sanitizedTerm}*,phone_number.ilike.*${sanitizedTerm}*,address.ilike.*${sanitizedTerm}*,driver_license.ilike.*${sanitizedTerm}*`
        )
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (!isAdmin) {
        query = query.eq('center_id', centerId);
      }

      const { data, error, count } = await query;
      if (error) throw handleServiceError(error, 'Failed to search recipients');

      return (data || []).map(item => ({
        ...item,
        center_name: item.centers?.name
      }));
    } catch (error) {
      throw handleServiceError(error, 'searchRecipients');
    }
  },

  /**
   * Add a new recipient
   * @param recipientData - Recipient data to insert
   * @returns Created Recipient object
   * @throws ServiceError if validation fails or insertion fails
   */
  async addRecipient(
    recipientData: Omit<Recipient, 'center_id' | 'id' | 'created_at' | 'center_name'>
  ): Promise<Recipient> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { centerId } = await this.getCurrentUserCenter();

      // Enhanced validation
      const errors: string[] = [];
      if (!recipientData.name?.trim()) errors.push('Name is required');
      if (!recipientData.date?.trim()) errors.push('Date is required');
      if (!recipientData.marital_status || !['single', 'married'].includes(recipientData.marital_status)) {
        errors.push('Valid marital status is required');
      }
      if (typeof recipientData.zakat_requests !== 'number' || recipientData.zakat_requests < 0) {
        errors.push('Zakat requests must be a non-negative number');
      }
      if (recipientData.phone_number && !/^\+?[\d\s-]{7,}$/.test(recipientData.phone_number)) {
        errors.push('Invalid phone number format');
      }
      if (recipientData.status && !['active', 'inactive'].includes(recipientData.status)) {
        errors.push('Invalid status');
      }
      if (errors.length > 0) throw new Error(errors.join('; '));

      // Sanitize inputs
      const sanitizedData = {
        ...recipientData,
        name: sanitizeInput(recipientData.name),
        address: recipientData.address ? sanitizeInput(recipientData.address) : undefined,
        phone_number: recipientData.phone_number ? sanitizeInput(recipientData.phone_number) : undefined,
        driver_license: recipientData.driver_license ? sanitizeInput(recipientData.driver_license) : undefined,
        notes: recipientData.notes ? sanitizeInput(recipientData.notes) : undefined,
      };

      const { data, error } = await supabase
        .from('recipients')
        .insert([{
          ...sanitizedData,
          center_id: centerId,
          added_by_admin_id: user?.id, // Add this line
          status: recipientData.status || 'active',
          created_at: new Date().toISOString()
        }])
        .select(`
          *,
          centers (
            name
          ),
          admins!added_by_admin_id (
            display_name
          )
        `)
        .single();

      if (error) throw handleServiceError(error, 'Failed to add recipient');
      if (!data) throw new Error('No data returned after adding recipient');

      return {
        ...data,
        center_name: data.centers?.name
      };
    } catch (error) {
      throw handleServiceError(error, 'addRecipient');
    }
  },

  /**
   * Update an existing recipient
   * @param id - Recipient ID
   * @param updates - Partial recipient data to update
   * @returns Updated Recipient object
   * @throws ServiceError if update fails
   */
  async updateRecipient(
    id: string,
    updates: Partial<Omit<Recipient, 'center_id' | 'id' | 'created_at' | 'center_name'>>
  ): Promise<Recipient> {
    try {
      const { centerId, isAdmin } = await this.getCurrentUserCenter();

      // Sanitize updates
      const sanitizedUpdates = {
        ...updates,
        name: updates.name ? sanitizeInput(updates.name) : undefined,
        address: updates.address ? sanitizeInput(updates.address) : undefined,
        phone_number: updates.phone_number ? sanitizeInput(updates.phone_number) : undefined,
        driver_license: updates.driver_license ? sanitizeInput(updates.driver_license) : undefined,
        notes: updates.notes ? sanitizeInput(updates.notes) : undefined,
      };

      const { data, error } = await supabase
        .from('recipients')
        .update(sanitizedUpdates)
        .eq('id', id)
        .eq(isAdmin ? 'id' : 'center_id', isAdmin ? id : centerId)
        .select(`
          *,
          centers (
            name
          )
        `)
        .single();

      if (error) throw handleServiceError(error, 'Failed to update recipient');
      if (!data) throw new Error('No data returned after updating recipient');

      return {
        ...data,
        center_name: data.centers?.name
      };
    } catch (error) {
      throw handleServiceError(error, 'updateRecipient');
    }
  },

  /**
   * Get recipient by ID
   * @param id - Recipient ID
   * @returns Recipient object or null if not found
   * @throws ServiceError if query fails
   */
  async getRecipientById(id: string): Promise<Recipient | null> {
    try {
      const sanitizedId = sanitizeInput(id);
      if (!sanitizedId) throw new Error('Invalid recipient ID');

      const { data, error } = await supabase
        .from('recipients')
        .select(`
          *,
          centers (
            name
          )
        `)
        .eq('id', sanitizedId)
        .single();

      if (error) throw handleServiceError(error, 'Failed to fetch recipient by ID');
      if (!data) return null;

      return {
        ...data,
        center_name: data.centers?.name
      };
    } catch (error) {
      throw handleServiceError(error, 'getRecipientById');
    }
  },

  /**
   * Get recipients within a date range
   * @param startDate - Start date (ISO format)
   * @param endDate - End date (ISO format)
   * @param options - Pagination options (limit, page)
   * @returns Array of Recipient objects
   * @throws ServiceError if query fails
   */
  async getRecipientsByDateRange(
    startDate: string,
    endDate: string,
    options: { limit?: number; page?: number } = {}
  ): Promise<Recipient[]> {
    try {
      const { centerId, isAdmin } = await this.getCurrentUserCenter();
      const { limit = 50, page = 1 } = options;

      // Validate dates
      if (!/^\d{4}-\d{2}-\d{2}/.test(startDate) || !/^\d{4}-\d{2}-\d{2}/.test(endDate)) {
        throw new Error('Invalid date format');
      }

      let query = supabase
        .from('recipients')
        .select(`
          *,
          centers (
            name
          )
        `, { count: 'exact' })
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (!isAdmin) {
        query = query.eq('center_id', centerId);
      }

      const { data, error } = await query;
      if (error) throw handleServiceError(error, 'Failed to fetch recipients by date range');

      return (data || []).map(item => ({
        ...item,
        center_name: item.centers?.name
      }));
    } catch (error) {
      throw handleServiceError(error, 'getRecipientsByDateRange');
    }
  },

  /**
   * Get recipients by center
   * @param options - Pagination options (limit, page)
   * @returns Array of Recipient objects
   * @throws ServiceError if query fails
   */
  async getRecipientsByCenter(
    options: { limit?: number; page?: number } = {}
  ): Promise<Recipient[]> {
    try {
      const { centerId, isAdmin } = await this.getCurrentUserCenter();
      const { limit = 50, page = 1 } = options;

      let query = supabase
        .from('recipients')
        .select(`
          id,
          name,
          date,
          address,
          phone_number,
          driver_license,
          marital_status,
          zakat_requests,
          notes,
          status,
          center_id,
          created_at,
          centers (
            name
          ),
          added_by:admins!added_by_admin_id (
            display_name
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (!isAdmin) {
        query = query.eq('center_id', centerId);
      }

      const { data, error } = await query;
      if (error) throw handleServiceError(error, 'Failed to fetch recipients by center');

      return (data || []).map(item => ({
        ...item,
        center_name: item.centers?.name
      }));
    } catch (error) {
      throw handleServiceError(error, 'getRecipientsByCenter');
    }
  }
};