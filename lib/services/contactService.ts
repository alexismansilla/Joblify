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
            .select('id, name, first_name, last_name, email, phone, rut, company, position, qr_token')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async getByQrToken(qrToken: string) {
        const { data, error } = await supabase
            .from('contacts')
            .select('id, name, first_name, last_name, email, phone, rut, company, position, qr_token')
            .eq('qr_token', qrToken)
            .maybeSingle();

        if (error) throw error;
        return data;
    },


    async getByEmail(email: string) {
        const { data, error } = await supabase
            .from('contacts')
            .select('id, name, first_name, last_name, email, phone, rut, company, position, qr_token')
            .eq('email', email)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async getByIdentifier(identifier: string) {
        // Limpiamos la entrada para que pueda comparar independientemente de puntos o guiones
        const cleanIdentifier = identifier.replace(/[^0-9kK]/g, '').toUpperCase();
        const formattedIdentifier = cleanIdentifier.length > 1
            ? `${cleanIdentifier.slice(0, -1)}-${cleanIdentifier.slice(-1)}`
            : cleanIdentifier;

        const { data, error } = await supabase
            .from('contacts')
            .select('id, name, first_name, last_name, email, phone, rut, company, position, qr_token')
            .or(`email.eq.${identifier},phone.eq.${identifier},rut.eq.${identifier},rut.eq.${cleanIdentifier},rut.eq.${formattedIdentifier}`)
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
          connection_type,
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
