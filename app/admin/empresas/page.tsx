'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Store, ExternalLink, Search, ChevronLeft, ChevronRight, Loader2, QrCode, CheckCheck, Copy, Building2 } from 'lucide-react'
import QRCode from 'qrcode'
import { Input } from '@/app/components/ui/Input'
import AdminNavbar from '@/app/components/AdminNavbar'
import { getEmpresasCount } from '@/app/actions/empresas'

interface Empresa {
    id: string
    name: string
    company: string | null
    position: string | null
    industry: string | null
    opportunity_description: string | null
    qr_token: string | null
    access_token: string | null
    plan: string | null
    created_at?: string
}

const ITEMS_PER_PAGE = 50

export default function EmpresasAdminPage() {
    const [empresas, setEmpresas] = useState<Empresa[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [qrUrls, setQrUrls] = useState<Record<string, string>>({})
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const fetchEmpresas = useCallback(async (q: string, page: number) => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(ITEMS_PER_PAGE),
                ...(q.trim() ? { q: q.trim() } : {}),
            })
            const res = await fetch(`/api/empresas?${params}`)
            if (!res.ok) throw new Error('fetch failed')
            const json = await res.json()
            setEmpresas(json.empresas ?? [])
            setTotal(json.total ?? 0)
        } catch {
            setEmpresas([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchEmpresas('', 1)
    }, [fetchEmpresas])

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchQuery(value)
        setCurrentPage(1)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => fetchEmpresas(value, 1), 350)
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
        fetchEmpresas(searchQuery, page)
    }

    const generateQR = async (empresa: Empresa) => {
        if (qrUrls[empresa.id]) return

        const connectUrl = `${window.location.origin}/connect/${empresa.id}`

        const qrDataUrl = await QRCode.toDataURL(connectUrl, {
            width: 256,
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' },
        })

        setQrUrls(prev => ({ ...prev, [empresa.id]: qrDataUrl }))
    }

    const copyLink = async (empresa: Empresa) => {
        const link = `${window.location.origin}/connect/${empresa.id}`
        await navigator.clipboard.writeText(link)
        setCopiedId(empresa.id)
        setTimeout(() => setCopiedId(null), 2000)
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
                            <h3 className="text-3xl font-black tracking-tighter uppercase">Empresas Participantes</h3>
                            <p className="font-mono text-[10px] tracking-widest uppercase opacity-50 mt-1 flex items-center gap-2">
                                <Store className="w-3 h-3" /> Empresas con QR y portal de leads
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-2">
                        <Link
                            href="/admin/registro-manual"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black hover:opacity-75 transition-opacity font-mono text-[10px] uppercase tracking-widest font-bold"
                        >
                            + NUEVA EMPRESA
                        </Link>
                        <span className="text-5xl font-black leading-none tracking-tighter">
                            {total}
                        </span>
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-50 mt-1">Total Empresas</span>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <Input
                        type="text"
                        placeholder="BUSCAR EMPRESA..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        icon={<Search className="h-5 w-5" />}
                        containerClassName="md:max-w-md"
                    />
                    <div className="font-mono text-[10px] font-bold tracking-widest uppercase opacity-50">
                        {loading
                            ? 'CARGANDO...'
                            : `MOSTRANDO ${empresas.length} DE ${total} EMPRESAS`
                        }
                    </div>
                </div>

                <div className="w-full border-t border-black/10 dark:border-white/10">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="border-b border-black/10 dark:border-white/10">
                                    <th className="px-6 py-6 font-mono text-[10px] uppercase tracking-widest opacity-50">Empresa</th>
                                    <th className="px-6 py-6 font-mono text-[10px] uppercase tracking-widest opacity-50">Contacto</th>
                                    <th className="px-6 py-6 font-mono text-[10px] uppercase tracking-widest opacity-50">Plan</th>
                                    <th className="px-6 py-6 font-mono text-[10px] uppercase tracking-widest opacity-50">Código QR</th>
                                    <th className="px-6 py-6 font-mono text-[10px] uppercase tracking-widest opacity-50 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <Loader2 className="w-5 h-5 animate-spin mx-auto opacity-40" />
                                        </td>
                                    </tr>
                                ) : empresas.length > 0 ? (
                                    empresas.map((empresa, index) => (
                                        <motion.tr
                                            key={empresa.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.02 }}
                                            className="group hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                        >
                                            <td className="px-6 py-6">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-black tracking-tight uppercase">{empresa.company || empresa.name}</span>
                                                    {empresa.industry && (
                                                        <span className="font-mono text-[10px] opacity-50 tracking-widest">{empresa.industry}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex flex-col gap-0.5">
                                                    {empresa.name && (
                                                        <span className="font-mono text-xs font-bold tracking-wide uppercase">{empresa.name}</span>
                                                    )}
                                                    {empresa.position && (
                                                        <span className="font-mono text-[10px] opacity-50">{empresa.position}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                {empresa.plan && empresa.plan !== 'free' ? (
                                                    <span className="inline-block px-1.5 py-0.5 bg-black dark:bg-white text-white dark:text-black font-mono text-[9px] font-bold uppercase tracking-widest">
                                                        {empresa.plan.toUpperCase()}
                                                    </span>
                                                ) : (
                                                    <span className="font-mono text-[10px] opacity-30">FREE</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-6">
                                                {empresa.qr_token ? (
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => generateQR(empresa)}
                                                            className="inline-flex items-center gap-2 px-3 py-2 border border-black/20 dark:border-white/20 hover:border-black dark:hover:border-white transition-colors font-mono text-[10px] tracking-widest uppercase"
                                                        >
                                                            <QrCode className="w-3 h-3" />
                                                            {qrUrls[empresa.id] ? 'VER QR' : 'QR'}
                                                        </button>
                                                        <button
                                                            onClick={() => copyLink(empresa)}
                                                            className="p-2 hover:opacity-50 transition-opacity"
                                                            title="Copiar link de conexión"
                                                        >
                                                            {copiedId === empresa.id
                                                                ? <CheckCheck className="w-4 h-4 text-emerald-500" />
                                                                : <Copy className="w-4 h-4" />
                                                            }
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="font-mono text-[10px] opacity-30">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-6 text-right">
                                                <Link
                                                    href={`/empresa/${empresa.access_token || ''}`}
                                                    className="inline-flex items-center gap-3 px-6 py-3 bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-900 dark:hover:bg-zinc-100 transition-colors duration-300 group-hover:scale-[1.02] active:scale-95"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    <span className="font-mono text-[10px] font-bold tracking-widest uppercase">Portal</span>
                                                </Link>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-xs font-mono tracking-widest uppercase opacity-40">
                                            NO SE ENCONTRARON EMPRESAS
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* QR Modal */}
                <AnimatePresence>
                    {Object.entries(qrUrls).map(([id, url]) => (
                        <motion.div
                            key={id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6"
                            onClick={() => setQrUrls(prev => { const n = {...prev}; delete n[id]; return n })}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white dark:bg-zinc-900 p-8 border border-black/10 dark:border-white/10 max-w-sm w-full"
                                onClick={e => e.stopPropagation()}
                            >
                                <img src={url} alt="QR" className="w-full h-auto" />
                                <p className="font-mono text-[10px] tracking-widest uppercase opacity-50 text-center mt-4">
                                    Escanea para conectar con la empresa
                                </p>
                                <p className="font-mono text-[9px] tracking-widest uppercase opacity-30 text-center mt-1">
                    El candidato completa sus datos y recibe info por WhatsApp
                </p>
                            </motion.div>
                        </motion.div>
                    ))}
                </AnimatePresence>

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
