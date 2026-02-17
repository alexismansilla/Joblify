import { supabase } from '@/lib/supabase';

export interface Contact {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    created_at?: string;
}

export interface Match {
    id: string;
    contact_id: string;
    scanner_id: string | null;
    created_at: string;
    scanner?: {
        id: string;
        name: string;
    };
}

export const contactService = {
    async getAll() {
        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('contacts')
            .select('id, name, email, phone')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async getByEmail(email: string) {
        const { data, error } = await supabase
            .from('contacts')
            .select('id, name, email, phone')
            .eq('email', email)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async getByIdentifier(identifier: string) {
        const { data, error } = await supabase
            .from('contacts')
            .select('id, name, email, phone')
            .or(`email.eq.${identifier},phone.eq.${identifier}`)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async insertMany(contacts: Omit<Contact, 'id' | 'created_at'>[]) {
        const { data, error } = await supabase
            .from('contacts')
            .insert(contacts)
            .select();

        if (error) throw error;
        return data;
    },

    async registerMatch(contactId: string, scannerId?: string) {
        const { data, error } = await supabase
            .from('matches')
            .insert([{
                contact_id: contactId,
                scanner_id: scannerId || null
            }])
            .select();

        if (error) throw error;
        return data;
    },

    async getMatchesReport() {
        const { data, error } = await supabase
            .from('contacts')
            .select(`
        id,
        name,
        email,
        phone,
        matches:matches!matches_contact_id_fkey (
          id,
          created_at,
          scanner_id,
          scanner:contacts!matches_scanner_id_fkey (
            id,
            name
          )
        )
      `)
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    }
};
