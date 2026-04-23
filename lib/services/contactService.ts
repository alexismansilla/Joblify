import { supabase } from '@/lib/supabase';

export interface Contact {
    id: string;
    name: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    rut: string | null;
    company: string | null;
    position: string | null;
    profile: string | null;
    industry: string | null;
    qr_token: string | null;
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
        let allData: any[] = [];
        let from = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await supabase
                .from('contacts')
                .select('*')
                .order('created_at', { ascending: false })
                .range(from, from + pageSize - 1);

            if (error) throw error;

            if (data && data.length > 0) {
                allData = [...allData, ...data];
                if (data.length < pageSize) {
                    hasMore = false;
                } else {
                    from += pageSize;
                }
            } else {
                hasMore = false;
            }
        }

        return allData || [];
    },

    async getCount(): Promise<number> {
        const { count, error } = await supabase
            .from('contacts')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;
        return count ?? 0;
    },

    async getPage(page: number, limit: number): Promise<Contact[]> {
        const from = (page - 1) * limit;
        const { data, error } = await supabase
            .from('contacts')
            .select('id, name, first_name, last_name, email, phone, rut, company, position, qr_token, created_at')
            .order('created_at', { ascending: false })
            .range(from, from + limit - 1);

        if (error) throw error;
        return (data ?? []) as Contact[];
    },

    async search(query: string, page: number, limit: number): Promise<Contact[]> {
        const from = (page - 1) * limit;
        const q = query.trim();
        const { data, error } = await supabase
            .from('contacts')
            .select('id, name, first_name, last_name, email, phone, rut, company, position, qr_token, created_at')
            .or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,rut.ilike.%${q}%,company.ilike.%${q}%,position.ilike.%${q}%`)
            .order('created_at', { ascending: false })
            .range(from, from + limit - 1);

        if (error) throw error;
        return (data ?? []) as Contact[];
    },

    async searchCount(query: string): Promise<number> {
        const q = query.trim();
        const { count, error } = await supabase
            .from('contacts')
            .select('*', { count: 'exact', head: true })
            .or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,rut.ilike.%${q}%,company.ilike.%${q}%,position.ilike.%${q}%`);

        if (error) throw error;
        return count ?? 0;
    },

    async deleteAll() {
        // Ejecutamos una función RPC (Remote Procedure Call) en Supabase 
        // configurada como SECURITY DEFINER para poder eludir las restricciones nativas de RLS al realizar purgas masivas
        const { error } = await supabase.rpc('purge_contacts');

        if (error) throw error;
        return true;
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('contacts')
            .select('id, name, first_name, last_name, email, phone, rut, company, position, profile, industry, qr_token')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async getByQrToken(qrToken: string) {
        const { data, error } = await supabase
            .from('contacts')
            .select('id, name, first_name, last_name, email, phone, rut, company, position, profile, industry, qr_token')
            .eq('qr_token', qrToken)
            .maybeSingle();

        if (error) throw error;
        return data;
    },


    async getByEmail(email: string) {
        const { data, error } = await supabase
            .from('contacts')
            .select('id, name, first_name, last_name, email, phone, rut, company, position, profile, industry, qr_token')
            .eq('email', email)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async getByIdentifier(identifier: string) {
        // 1. Variantes para RUT
        const cleanRutIdentifier = identifier.replace(/[^0-9kK]/g, '').toUpperCase();
        const formattedRutIdentifier = cleanRutIdentifier.length > 1
            ? `${cleanRutIdentifier.slice(0, -1)}-${cleanRutIdentifier.slice(-1)}`
            : cleanRutIdentifier;

        // 2. Variantes robustas para el Teléfono
        const digitsOnly = identifier.replace(/[^0-9]/g, '');
        
        let orQueryParts = [
            `email.eq.${identifier}`,
            `rut.eq.${identifier}`,
            `rut.eq.${cleanRutIdentifier}`,
            `rut.eq.${formattedRutIdentifier}`
        ];

        // Añadimos el original por defecto
        orQueryParts.push(`phone.eq.${identifier}`);

        if (digitsOnly) {
            orQueryParts.push(`phone.eq.${digitsOnly}`);
            orQueryParts.push(`phone.eq.+${digitsOnly}`);
            
            // Si parece ser un número chileno con prefijo 56 (11 dígitos, ej: 56912345678)
            if (digitsOnly.length === 11 && digitsOnly.startsWith('56')) {
                const localPhone = digitsOnly.substring(2); // Extrae el 912345678
                orQueryParts.push(`phone.eq.${localPhone}`);
                orQueryParts.push(`phone.eq.+56${localPhone}`);
            }
            // Si el texto entrante ya era el formato corto de 9 dígitos (ej: 912345678)
            else if (digitsOnly.length === 9) {
                orQueryParts.push(`phone.eq.56${digitsOnly}`);
                orQueryParts.push(`phone.eq.+56${digitsOnly}`);
            }
        }

        const orQueryString = orQueryParts.join(',');

        const { data, error } = await supabase
            .from('contacts')
            .select('id, name, first_name, last_name, email, phone, rut, company, position, profile, industry, qr_token')
            .or(orQueryString)
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async insertMany(contacts: Omit<Contact, 'id' | 'created_at' | 'qr_token'>[]) {
        const MAX_RETRIES = 3

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            const { data, error } = await supabase
                .from('contacts')
                .insert(contacts)
                .select()

            // Código 23505 = unique_violation en Postgres
            // Si hay colisión de qr_token, reintentamos (la DB regenera un token nuevo)
            if (error?.code === '23505' && error.message.includes('qr_token')) {
                console.warn(`Colisión de qr_token en intento ${attempt}. Reintentando...`)
                if (attempt === MAX_RETRIES) throw new Error('No se pudo generar un qr_token único después de 3 intentos.')
                continue
            }

            if (error) throw error
            return data
        }
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

    async registerWhatsappMatch(contactId: string, scannerId: string | null, scannerPhone: string) {
        const { data, error } = await supabase
            .from('matches')
            .insert([{
                contact_id: contactId,
                scanner_id: scannerId,
                scanner_phone: scannerPhone
            }])
            .select();

        if (error) {
            console.error('Error in registerWhatsappMatch', error)
            return null;
        }
        return data;
    },

    async updateMatchConnectionType(matchId: string, connectionType: string) {
        const { data, error } = await supabase
            .from('matches')
            .update({ connection_type: connectionType })
            .eq('id', matchId)
            .select();

        if (error) {
            console.error('Error in updateMatchConnectionType', error)
            return null;
        }
        return data;
    },

    async getMatchesReport() {
        let allData: any[] = [];
        let from = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await supabase
                .from('contacts')
                .select(`
                    id,
                    name,
                    first_name,
                    last_name,
                    email,
                    phone,
                    rut,
                    company,
                    position,
                    qr_token,
                    matches:matches!matches_contact_id_fkey (
                        id,
                        created_at,
                        scanner_id,
                        scanner_phone,
                        connection_type,
                        scanner:contacts!matches_scanner_id_fkey (
                            id,
                            name
                        )
                    )
                `)
                .order('name', { ascending: true })
                .range(from, from + pageSize - 1);

            if (error) throw error;

            if (data && data.length > 0) {
                allData = [...allData, ...data];
                if (data.length < pageSize) {
                    hasMore = false;
                } else {
                    from += pageSize;
                }
            } else {
                hasMore = false;
            }
        }

        return allData || [];
    }
};
