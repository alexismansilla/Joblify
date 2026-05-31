import { supabase } from '@/lib/supabase';

export interface Candidato {
    id: string;
    name: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    rut: string | null;
    qr_token: string | null;
    profile: string | null;
    industry: string | null;
    experience_level: string | null;
    job_search_type: string | null;
    created_at?: string;
}

export const candidatoService = {
    async getAll() {
        let allData: Candidato[] = [];
        let from = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await supabase
                .from('candidatos')
                .select('*')
                .order('created_at', { ascending: false })
                .range(from, from + pageSize - 1);

            if (error) throw error;
            if (data && data.length > 0) {
                allData = [...allData, ...data];
                if (data.length < pageSize) hasMore = false;
                else from += pageSize;
            } else {
                hasMore = false;
            }
        }
        return allData;
    },

    async getCount(): Promise<number> {
        const { count, error } = await supabase
            .from('candidatos')
            .select('*', { count: 'exact', head: true });
        if (error) throw error;
        return count ?? 0;
    },

    async getPage(page: number, limit: number): Promise<Candidato[]> {
        const from = (page - 1) * limit;
        const { data, error } = await supabase
            .from('candidatos')
            .select('*')
            .order('created_at', { ascending: false })
            .range(from, from + limit - 1);
        if (error) throw error;
        return (data ?? []) as Candidato[];
    },

    async search(query: string, page: number, limit: number): Promise<Candidato[]> {
        const from = (page - 1) * limit;
        const q = query.trim();
        const { data, error } = await supabase
            .from('candidatos')
            .select('*')
            .or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,rut.ilike.%${q}%`)
            .order('created_at', { ascending: false })
            .range(from, from + limit - 1);
        if (error) throw error;
        return (data ?? []) as Candidato[];
    },

    async searchCount(query: string): Promise<number> {
        const q = query.trim();
        const { count, error } = await supabase
            .from('candidatos')
            .select('*', { count: 'exact', head: true })
            .or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,rut.ilike.%${q}%`);
        if (error) throw error;
        return count ?? 0;
    },

    async getById(id: string): Promise<Candidato | null> {
        const { data, error } = await supabase
            .from('candidatos')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error) throw error;
        return data as Candidato | null;
    },

    async getByIdentifier(identifier: string): Promise<Candidato | null> {
        const cleanRutIdentifier = identifier.replace(/[^0-9kK]/g, '').toUpperCase();
        const formattedRutIdentifier = cleanRutIdentifier.length > 1
            ? `${cleanRutIdentifier.slice(0, -1)}-${cleanRutIdentifier.slice(-1)}`
            : cleanRutIdentifier;
        const digitsOnly = identifier.replace(/[^0-9]/g, '');

        const orQueryParts = [
            `email.eq.${identifier}`,
            `rut.eq.${identifier}`,
            `rut.eq.${cleanRutIdentifier}`,
            `rut.eq.${formattedRutIdentifier}`,
            `phone.eq.${identifier}`,
        ];

        if (digitsOnly) {
            orQueryParts.push(`phone.eq.${digitsOnly}`);
            orQueryParts.push(`phone.eq.+${digitsOnly}`);
            if (digitsOnly.length === 11 && digitsOnly.startsWith('56')) {
                const localPhone = digitsOnly.substring(2);
                orQueryParts.push(`phone.eq.${localPhone}`);
                orQueryParts.push(`phone.eq.+56${localPhone}`);
            } else if (digitsOnly.length === 9) {
                orQueryParts.push(`phone.eq.56${digitsOnly}`);
                orQueryParts.push(`phone.eq.+56${digitsOnly}`);
            }
        }

        const { data, error } = await supabase
            .from('candidatos')
            .select('*')
            .or(orQueryParts.join(','))
            .limit(1)
            .maybeSingle();
        if (error) throw error;
        return data as Candidato | null;
    },

    async insertMany(contacts: Omit<Candidato, 'id' | 'created_at' | 'qr_token'>[]) {
        const { data, error } = await supabase
            .from('candidatos')
            .insert(contacts)
            .select();
        if (error) throw error;
        return data;
    },

    /** Bulk delete via RPC (SECURITY DEFINER bypasses RLS) */
    async deleteAll() {
        const { error } = await supabase.rpc('purge_candidatos');
        if (error) throw error;
        return true;
    },
};
