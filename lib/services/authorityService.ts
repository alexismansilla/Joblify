import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export interface Authority {
    id: string;
    name: string;
    position: string;
    organization: string | null;
    created_at?: string;
}

export const authorityService = {
    async getAll(): Promise<Authority[]> {
        const { data, error } = await getSupabaseAdmin()
            .from('authorities')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async searchByName(query: string): Promise<Authority[]> {
        const { data, error } = await getSupabaseAdmin()
            .from('authorities')
            .select('*')
            .ilike('name', `%${query}%`)
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async insertMany(authorities: Omit<Authority, 'id' | 'created_at'>[]): Promise<Authority[]> {
        const { data, error } = await getSupabaseAdmin()
            .from('authorities')
            .insert(authorities)
            .select();

        if (error) throw error;
        return data || [];
    },

    async deleteAll(): Promise<void> {
        const { error } = await getSupabaseAdmin()
            .from('authorities')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // elimina todos

        if (error) throw error;
    },
};
