import { supabase } from '../utils/supabase';

type Recipient = {
  name: string;
  date: string;
  address?: string;
  phone_number?: string;
  driver_license?: string;
  marital_status: 'single' | 'married';
  zakat_requests: number;
  notes?: string;
  status: string;
};

export const recipientService = {
  async searchRecipients(searchTerm: string) {
    const { data, error } = await supabase
      .from('recipients')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,driver_license.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async addRecipient(recipientData: Recipient) {
    const { data, error } = await supabase
      .from('recipients')
      .insert([recipientData])
      .select();

    if (error) throw error;
    return data[0];
  },
  
  async getRecipientsByDateRange(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('recipients')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;
    return data;
  },
};