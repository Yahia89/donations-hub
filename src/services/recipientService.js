import { supabase } from '../lib/supabase';

export const recipientService = {
  async addRecipient(recipientData) {
    const { data, error } = await supabase
      .from('recipients')
      .insert([recipientData])
      .select();

    if (error) throw error;
    return data[0];
  },

  async getRecipients() {
    const { data, error } = await supabase
      .from('recipients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getRecipientById(id) {
    const { data, error } = await supabase
      .from('recipients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async updateRecipient(id, updates) {
    const { data, error } = await supabase
      .from('recipients')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  },

  async searchRecipients(searchTerm) {
    const { data, error } = await supabase
      .from('recipients')
      .select('*')
      .ilike('name', `%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error };
  },
};
