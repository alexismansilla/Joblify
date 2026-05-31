import { supabase } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export interface Empresa {
    id: string;
    name: string;
    company: string | null;
    position: string | null;
    industry: string | null;
    opportunity_description: string | null;
    phone: string | null;
    email: string | null;
    qr_token: string | null;
    access_token: string | null;
    plan: string | null;
    job_search_type: string | null;
    created_at?: string;
}

export interface Match {
    id: string;
    empresa_id: string;
    candidato_id: string | null;
    candidato_phone: string | null;
    connection_type: string | null;
    scanner_name: string | null;
    scanner_profile: string | null;
    scanner_experience_level: string | null;
    scanner_job_search_type: string | null;
    scanner_email: string | null;
    lead_status: string | null;
    created_at: string;
}

export const empresaService = {
    async getAll() {
        let allData: Empresa[] = [];
        let from = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await supabase
                .from('empresas')
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
            .from('empresas')
            .select('*', { count: 'exact', head: true });
        if (error) throw error;
        return count ?? 0;
    },

    async getPage(page: number, limit: number): Promise<Empresa[]> {
        const from = (page - 1) * limit;
        const { data, error } = await supabase
            .from('empresas')
            .select('*')
            .order('created_at', { ascending: false })
            .range(from, from + limit - 1);
        if (error) throw error;
        return (data ?? []) as Empresa[];
    },

    async search(query: string, page: number, limit: number): Promise<Empresa[]> {
        const from = (page - 1) * limit;
        const q = query.trim();
        const { data, error } = await supabase
            .from('empresas')
            .select('*')
            .or(`name.ilike.%${q}%,company.ilike.%${q}%`)
            .order('created_at', { ascending: false })
            .range(from, from + limit - 1);
        if (error) throw error;
        return (data ?? []) as Empresa[];
    },

    async searchCount(query: string): Promise<number> {
        const q = query.trim();
        const { count, error } = await supabase
            .from('empresas')
            .select('*', { count: 'exact', head: true })
            .or(`name.ilike.%${q}%,company.ilike.%${q}%`);
        if (error) throw error;
        return count ?? 0;
    },

    async getById(id: string): Promise<Empresa | null> {
        const { data, error } = await supabase
            .from('empresas')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error) throw error;
        return data as Empresa | null;
    },

    /** Find empresa by qr_token (used in WhatsApp webhook) */
    async getByQrToken(qrToken: string): Promise<Empresa | null> {
        const { data, error } = await supabase
            .from('empresas')
            .select('*')
            .eq('qr_token', qrToken)
            .maybeSingle();
        if (error) throw error;
        return data as Empresa | null;
    },

    /** Find empresa by access_token (used in empresa portal) */
    async getByAccessToken(token: string): Promise<Empresa | null> {
        const { data, error } = await supabase
            .from('empresas')
            .select('*')
            .eq('access_token', token)
            .maybeSingle();
        if (error) throw error;
        return data as Empresa | null;
    },

    /** Insert a new empresa with auto-generated qr_token */
    async create(empresa: Omit<Empresa, 'id' | 'created_at' | 'qr_token'>) {
        const { data, error } = await supabase
            .from('empresas')
            .insert([empresa])
            .select();
        if (error) throw error;
        return data?.[0] as Empresa | undefined;
    },

    /** Generate access_token for empresa portal */
    async generateAccessToken(empresaId: string): Promise<string> {
        const token = crypto.randomUUID();
        const { error } = await getSupabaseAdmin()
            .from('empresas')
            .update({ access_token: token })
            .eq('id', empresaId);
        if (error) throw error;
        return token;
    },

    /** Update empresa's subscription plan */
    async updatePlan(empresaId: string, plan: string): Promise<void> {
        const { error } = await getSupabaseAdmin()
            .from('empresas')
            .update({ plan })
            .eq('id', empresaId);
        if (error) throw error;
    },

    /** Get all matches (leads) for an empresa with candidato details */
    async getLeads(empresaId: string) {
        const { data, error } = await supabase
            .from('matches')
            .select(`
                id,
                created_at,
                connection_type,
                candidato_phone,
                candidato_id,
                scanner_name,
                scanner_profile,
                scanner_experience_level,
                scanner_job_search_type,
                scanner_email,
                lead_status,
                candidato:candidatos!matches_candidato_id_fkey (
                    id, name, email, phone, profile, experience_level, job_search_type
                )
            `)
            .eq('empresa_id', empresaId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data ?? [];
    },

    /** Register a match (candidate scanned empresa's QR) */
    async registerMatch(
        empresaId: string,
        candidatoPhone: string,
        candidatoId?: string,
        scannerData?: {
            name: string
            profile: string
            experience_level: string
            job_search_type: string
            interest: string
        }
    ) {
        const { data, error } = await supabase
            .from('matches')
            .insert([{
                empresa_id: empresaId,
                candidato_phone: candidatoPhone,
                candidato_id: candidatoId || null,
                connection_type: scannerData?.interest || null,
                scanner_name: scannerData?.name || null,
                scanner_profile: scannerData?.profile || null,
                scanner_experience_level: scannerData?.experience_level || null,
                scanner_job_search_type: scannerData?.job_search_type || null,
            }])
            .select();
        if (error) throw error;
        return data;
    },

    /** Get a match by its ID */
    async getMatchById(matchId: string): Promise<Match | null> {
        const { data, error } = await supabase
            .from('matches')
            .select('*')
            .eq('id', matchId)
            .maybeSingle();
        if (error) throw error;
        return data as Match | null;
    },

    /** Find the most recent match for an empresa where candidato_phone is empty (from scan form) */
    async findUnmatchedByEmpresa(empresaId: string) {
        const { data, error } = await supabase
            .from('matches')
            .select('*')
            .eq('empresa_id', empresaId)
            .is('candidato_phone', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error) throw error;
        return data as Match | null;
    },

    /** Update match candidato_phone after WhatsApp confirms the phone */
    async updateMatchPhone(matchId: string, phone: string) {
        const { data, error } = await supabase
            .from('matches')
            .update({ candidato_phone: phone })
            .eq('id', matchId)
            .select();
        if (error) {
            console.error('Error updating match phone', error);
            return null;
        }
        return data;
    },

    /** Update lead status (contacted, highlighted, dismissed) */
    async updateLeadStatus(matchId: string, status: string) {
        const { data, error } = await supabase
            .from('matches')
            .update({ lead_status: status })
            .eq('id', matchId)
            .select();
        if (error) {
            console.error('Error updating lead status', error);
            return null;
        }
        return data;
    },

    /** Update match scanner data (profile completion from WhatsApp link) */
    async updateScannerData(matchId: string, data: {
        scanner_name?: string
        scanner_email?: string
        scanner_phone?: string
    }) {
        const { error } = await supabase
            .from('matches')
            .update({
                ...(data.scanner_name !== undefined && { scanner_name: data.scanner_name }),
                ...(data.scanner_email !== undefined && { scanner_email: data.scanner_email }),
                ...(data.scanner_phone !== undefined && { candidato_phone: data.scanner_phone }),
            })
            .eq('id', matchId);
        if (error) {
            console.error('Error updating scanner data', error);
            return null;
        }
        return true;
    },

    /** Update match connection_type from WhatsApp button response */
    async updateMatchConnectionType(matchId: string, connectionType: string) {
        const { data, error } = await supabase
            .from('matches')
            .update({ connection_type: connectionType })
            .eq('id', matchId)
            .select();
        if (error) {
            console.error('Error updating match connection_type', error);
            return null;
        }
        return data;
    },

    /** Get all matches with pagination (for admin candidates listing) */
    async getAllMatchesPaginated(page: number, limit: number) {
        const from = (page - 1) * limit;
        const { data, error } = await supabase
            .from('matches')
            .select(`
                id, created_at, connection_type, candidato_phone,
                scanner_name, scanner_profile, scanner_experience_level,
                scanner_job_search_type, scanner_email, lead_status,
                empresa_id,
                empresa:empresas!matches_empresa_id_fkey ( company, name )
            `)
            .order('created_at', { ascending: false })
            .range(from, from + limit - 1);
        if (error) throw error;
        return data ?? [];
    },

    async getAllMatchesCount(): Promise<number> {
        const { count, error } = await supabase
            .from('matches')
            .select('*', { count: 'exact', head: true });
        if (error) throw error;
        return count ?? 0;
    },

    async searchMatches(query: string, page: number, limit: number) {
        const from = (page - 1) * limit;
        const q = query.trim();
        const { data, error } = await supabase
            .from('matches')
            .select(`
                id, created_at, connection_type, candidato_phone,
                scanner_name, scanner_profile, scanner_experience_level,
                scanner_job_search_type, scanner_email, lead_status,
                empresa_id,
                empresa:empresas!matches_empresa_id_fkey ( company, name )
            `)
            .or(`scanner_name.ilike.%${q}%,candidato_phone.ilike.%${q}%`)
            .order('created_at', { ascending: false })
            .range(from, from + limit - 1);
        if (error) throw error;
        return data ?? [];
    },

    async searchMatchesCount(query: string): Promise<number> {
        const q = query.trim();
        const { count, error } = await supabase
            .from('matches')
            .select('*', { count: 'exact', head: true })
            .or(`scanner_name.ilike.%${q}%,candidato_phone.ilike.%${q}%`);
        if (error) throw error;
        return count ?? 0;
    },

    /** Get suggested empresas for a candidate based on their profile */
    async getSuggestedEmpresas(excludeId: string, profile?: string, interest?: string, limit = 5) {
        const { data, error } = await supabase
            .from('empresas')
            .select('id, company, name, industry, opportunity_description')
            .neq('id', excludeId)
            .order('created_at', { ascending: false })
            .limit(limit * 2);
        if (error) throw error;
        return (data ?? []).slice(0, limit);
    },

    /** Dashboard stats via RPC */
    async getDashboard() {
        const { data, error } = await supabase.rpc('get_matches_dashboard_v2');
        if (error) throw error;
        return data as {
            stats: {
                total_candidatos: number;
                total_empresas: number;
                active_matches: number;
                total_matches: number;
                negocio: number;
                mentoria: number;
                casual: number;
                no_registrado: number;
            };
            top_empresas: Array<{
                id: string;
                name: string;
                company: string | null;
                match_count: number;
                matches: Array<{
                    id: string;
                    created_at: string;
                    connection_type: string | null;
                    candidato_phone: string | null;
                    candidato_id: string | null;
                }>;
            }>;
        };
    },
};
