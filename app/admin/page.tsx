'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Users, Search, ChevronLeft, ChevronRight, Loader2, Building2, Phone, Sparkles } from 'lucide-react'
import { Input } from '@/app/components/ui/Input'
import AdminNavbar from '@/app/components/AdminNavbar'

interface MatchRecord {
    id: string
    created_at: string
    connection_type: string | null
    candidato_phone: string | null
    scanner_name: string | null
    scanner_profile: string | null
    scanner_experience_level: string | null
    scanner_job_search_type: string | null
    scanner_email: string | null
    lead_status: string | null
    empresa: {
        company: string | null
        name: string
    } | null
}

const INTEREST_LABELS: Record<string, string> = {
    negocio: '🔥 Alta',
    mentoria: '📋 Media',
    casual: '👀 Baja',
}

const ITEMS_PER_PAGE = 50

export default function AdminPage() {
    const [matches, setMatches] = useState<MatchRecord[]>([])
    const [total, setTotal] = useState(0)
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const fetchMatches = useCallback(async (q: string, page: number) => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(ITEMS_PER_PAGE),
                ...(q.trim() ? { q: q.trim() } : {}),
            })
            const res = await fetch(`/api/matches?${params}`)
            if (!res.ok) throw new Error('fetch failed')
            const json = await res.json()
            setMatches(json.matches ?? [])
            setTotal(json.total ?? 0)
        } catch {
            setMatches([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchMatches('', 1)
    }, [fetchMatches])

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchQuery(value)
        setCurrentPage(1)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => fetchMatches(value, 1), 350)
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
        fetchMatches(searchQuery, page)
    }

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

    return (
        <div className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black relative">
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] mix-blend-difference bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:4rem_4rem] -z-10" />

            <AdminNavbar />

            <main className="max-w-[1400px] mx-auto px-8 pt-28 pb-24 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-black/10 dark:border-white/10 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <h3 className="text-3xl font-black tracking-tighter uppercase">Personas Escaneadas</h3>
                            <p className="font-mono text-[10px] tracking-widest uppercase opacity-50 mt-1 flex items-center gap-2">
                                <Users className="w-3 h-3" /> Registros de conexiones en la feria
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-start md:items-end">
                        <span className="text-5xl font-black leading-none tracking-tighter">
                            {total}
                        </span>
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-50 mt-1">Total Escaneos</span>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <Input
                        type="text"
                        placeholder="BUSCAR NOMBRE O TELÉFONO..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        icon={<Search className="h-5 w-5" />}
                        containerClassName="md:max-w-md"
                    />
                    <div className="font-mono text-[10px] font-bold tracking-widest uppercase opacity-50">
                        {loading
                            ? 'CARGANDO...'
                            : `MOSTRANDO ${matches.length} DE ${total} REGISTROS`
                        }
                    </div>
                </div>

                <div className="w-full border-t border-black/10 dark:border-white/10">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-black/10 dark:border-white/10">
                                    <th className="px-6 py-6 font-mono text-[10px] uppercase tracking-widest opacity-50">Persona</th>
                                    <th className="px-6 py-6 font-mono text-[10px] uppercase tracking-widest opacity-50">Perfil</th>
                                    <th className="px-6 py-6 font-mono text-[10px] uppercase tracking-widest opacity-50">Empresa</th>
                                    <th className="px-6 py-6 font-mono text-[10px] uppercase tracking-widest opacity-50">Interés</th>
                                    <th className="px-6 py-6 font-mono text-[10px] uppercase tracking-widest opacity-50">Contacto</th>
                                    <th className="px-6 py-6 font-mono text-[10px] uppercase tracking-widest opacity-50">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <Loader2 className="w-5 h-5 animate-spin mx-auto opacity-40" />
                                        </td>
                                    </tr>
                                ) : matches.length > 0 ? (
                                    matches.map((match, index) => (
                                        <motion.tr
                                            key={match.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.02 }}
                                            className="group hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                        >
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-none border border-black/10 dark:border-white/10 flex items-center justify-center group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors duration-300">
                                                        <Users className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black tracking-tight uppercase">
                                                            {match.scanner_name || 'Anónimo'}
                                                        </span>
                                                        {match.scanner_email && (
                                                            <span className="font-mono text-[10px] opacity-40 tracking-widest">{match.scanner_email}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex flex-col gap-0.5">
                                                    {match.scanner_profile && (
                                                        <span className="font-mono text-xs font-bold tracking-wide uppercase">{match.scanner_profile}</span>
                                                    )}
                                                    {match.scanner_experience_level && (
                                                        <span className="font-mono text-[10px] opacity-50 tracking-widest">{match.scanner_experience_level}</span>
                                                    )}
                                                    {match.scanner_job_search_type && (
                                                        <span className="font-mono text-[10px] opacity-40 tracking-widest">· {match.scanner_job_search_type}</span>
                                                    )}
                                                    {!match.scanner_profile && !match.scanner_experience_level && (
                                                        <span className="font-mono text-[10px] opacity-30">—</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                {match.empresa ? (
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="w-3 h-3 opacity-40" />
                                                        <span className="font-mono text-xs tracking-wide">
                                                            {match.empresa.company || match.empresa.name}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="font-mono text-[10px] opacity-30">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-6">
                                                {match.connection_type ? (
                                                    <span className="font-mono text-[10px] font-bold tracking-widest">
                                                        {INTEREST_LABELS[match.connection_type] || match.connection_type}
                                                    </span>
                                                ) : (
                                                    <span className="font-mono text-[10px] opacity-30">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-6">
                                                {match.candidato_phone ? (
                                                    <a
                                                        href={`https://wa.me/${match.candidato_phone.replace(/\D/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 font-mono text-xs hover:opacity-60 transition-opacity"
                                                    >
                                                        <Phone className="w-3 h-3" />
                                                        {match.candidato_phone}
                                                    </a>
                                                ) : (
                                                    <span className="font-mono text-[10px] opacity-30">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="font-mono text-[10px] opacity-50 tracking-widest">
                                                    {new Date(match.created_at).toLocaleDateString('es-CL', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-xs font-mono tracking-widest uppercase opacity-40">
                                            NO SE ENCONTRARON REGISTROS
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-6 border-t border-black/10 dark:border-white/10">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1 || loading}
                            className="inline-flex items-center gap-2 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 border border-transparent disabled:opacity-20 disabled:hover:bg-transparent transition-colors font-mono text-[10px] font-bold tracking-widest uppercase"
                        >
                            <ChevronLeft className="w-4 h-4" /> Anterior
                        </button>
                        <span className="font-mono text-[10px] tracking-widest uppercase opacity-50">
                            PÁG {currentPage} DE {totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || loading}
                            className="inline-flex items-center gap-2 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 border border-transparent disabled:opacity-20 disabled:hover:bg-transparent transition-colors font-mono text-[10px] font-bold tracking-widest uppercase"
                        >
                            Siguiente <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </main>
        </div>
    )
}
