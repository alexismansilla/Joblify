'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Printer, Search, User, ChevronLeft, ChevronRight, Loader2, Building2, CheckCircle2, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { Input } from './ui/Input'
import { jsPDF } from 'jspdf'
import { printToQZ } from '@/lib/qz'
import { generateAuthorityCredentialImage } from '@/lib/authorityCredentialRenderer'

interface Authority {
    id: string
    name: string
    position: string
    organization: string | null
}

type ToastState = { message: string; type: 'success' | 'error' } | null

export default function AuthorityTable({ authorities }: { authorities: Authority[] }) {
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [toast, setToast] = useState<ToastState>(null)
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const itemsPerPage = 20

    const showToast = (message: string, type: 'success' | 'error') => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
        setToast({ message, type })
        toastTimerRef.current = setTimeout(() => setToast(null), 3000)
    }

    useEffect(() => () => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }, [])

    const filteredAuthorities = useMemo(() => {
        const query = searchQuery.toLowerCase().trim()
        if (!query) return authorities
        return authorities.filter(a =>
            a.name.toLowerCase().includes(query) ||
            a.position.toLowerCase().includes(query) ||
            (a.organization && a.organization.toLowerCase().includes(query))
        )
    }, [authorities, searchQuery])

    const totalPages = Math.ceil(filteredAuthorities.length / itemsPerPage)
    const currentAuthorities = filteredAuthorities.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value)
        setCurrentPage(1)
    }

    const handlePrintCredential = async (authority: Authority) => {
        setLoadingId(authority.id)
        try {
            const credentialBase64 = await generateAuthorityCredentialImage(authority)

            const mode = process.env.NEXT_PUBLIC_QR_OUTPUT_MODE || 'PRINT'

            if (mode === 'PRINT') {
                const result = await printToQZ(credentialBase64)
                if (result.success) {
                    showToast(`Credencial enviada a: ${result.printerUsed}`, 'success')
                    return
                }
                // Falló la impresión directa → fallback silencioso a PDF
                showToast(`No se pudo imprimir. Descargando PDF...`, 'error')
            }

            // Fallback PDF. Como la imagen redujo un 30% su alto (732x512), usamos formato rectangular apaisado ~62x43mm
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [62, 43] })
            doc.addImage(credentialBase64, 'PNG', 0, 0, 62, 43)
            doc.save(`Autoridad_${authority.name.replace(/\s+/g, '_')}.pdf`)
        } catch (error) {
            console.error('Error al imprimir credencial de autoridad:', error)
            showToast('Error al generar la credencial', 'error')
        } finally {
            setLoadingId(null)
        }
    }

    return (
        <div className="w-full flex flex-col gap-6">
            {/* Toast de notificación — esquina inferior derecha, sin bloquear UI */}
            <motion.div
                key={toast?.message ?? 'empty'}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={toast ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 16, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                aria-live="polite"
                className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 shadow-xl border font-mono text-[11px] font-bold tracking-widest uppercase pointer-events-none ${
                    toast?.type === 'success'
                        ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                        : 'bg-red-600 text-white border-red-600'
                }`}
            >
                {toast?.type === 'success'
                    ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                    : <XCircle className="w-4 h-4 shrink-0" />}
                {toast?.message}
            </motion.div>
            {/* Buscador */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <Input
                    type="text"
                    placeholder="BUSCAR POR NOMBRE, CARGO U ORGANIZACIÓN..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    icon={<Search className="h-5 w-5" />}
                    containerClassName="md:max-w-md"
                />

                <div className="font-mono text-[10px] font-bold tracking-widest uppercase opacity-50">
                    MOSTRANDO {currentAuthorities.length} DE {filteredAuthorities.length} AUTORIDADES
                </div>
            </div>

            {/* Tabla */}
            <div className="w-full border-t border-black/10 dark:border-white/10">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="border-b border-black/10 dark:border-white/10">
                                <th className="px-6 py-5 font-mono text-[10px] uppercase tracking-widest opacity-50">#</th>
                                <th className="px-6 py-5 font-mono text-[10px] uppercase tracking-widest opacity-50">Nombre</th>
                                <th className="px-6 py-5 font-mono text-[10px] uppercase tracking-widest opacity-50">Cargo</th>
                                <th className="px-6 py-5 font-mono text-[10px] uppercase tracking-widest opacity-50">Organización</th>
                                <th className="px-6 py-5 font-mono text-[10px] uppercase tracking-widest opacity-50 text-right">Credencial</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                            {currentAuthorities.length > 0 ? (
                                currentAuthorities.map((authority, index) => (
                                    <motion.tr
                                        key={authority.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: (index % itemsPerPage) * 0.025 }}
                                        className="group hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                    >
                                        {/* Número de fila */}
                                        <td className="px-6 py-5">
                                            <span className="font-mono text-xs opacity-30">
                                                {String((currentPage - 1) * itemsPerPage + index + 1).padStart(2, '0')}
                                            </span>
                                        </td>

                                        {/* Nombre */}
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 border border-black/10 dark:border-white/10 flex items-center justify-center group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors duration-300 shrink-0">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <span className="font-black tracking-tight text-lg uppercase">
                                                    {authority.name}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Cargo */}
                                        <td className="px-6 py-5">
                                            <span className="font-mono text-sm uppercase tracking-wider opacity-70">
                                                {authority.position}
                                            </span>
                                        </td>

                                        {/* Organización */}
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 font-mono text-sm opacity-50">
                                                {authority.organization && (
                                                    <>
                                                        <Building2 className="w-3 h-3 shrink-0" />
                                                        <span className="truncate max-w-[200px]">
                                                            {authority.organization}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </td>

                                        {/* Botón imprimir */}
                                        <td className="px-6 py-5 text-right">
                                            <button
                                                onClick={() => handlePrintCredential(authority)}
                                                disabled={loadingId === authority.id}
                                                className="inline-flex items-center gap-3 px-5 py-3 bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-900 dark:hover:bg-zinc-100 transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed rounded-none border-none"
                                            >
                                                {loadingId === authority.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Printer className="w-4 h-4" />
                                                        <span className="font-mono text-[10px] font-bold tracking-widest uppercase">
                                                            Imprimir
                                                        </span>
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-xs font-mono tracking-widest uppercase opacity-40">
                                        {searchQuery ? 'SIN RESULTADOS PARA LA BÚSQUEDA' : 'SIN AUTORIDADES REGISTRADAS'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t border-black/10 dark:border-white/10">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="inline-flex items-center gap-2 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 border border-transparent disabled:opacity-20 disabled:hover:bg-transparent transition-colors font-mono text-[10px] font-bold tracking-widest uppercase"
                    >
                        <ChevronLeft className="w-4 h-4" /> Anterior
                    </button>
                    <span className="font-mono text-[10px] tracking-widest uppercase opacity-50">
                        PÁG {currentPage} DE {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center gap-2 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 border border-transparent disabled:opacity-20 disabled:hover:bg-transparent transition-colors font-mono text-[10px] font-bold tracking-widest uppercase"
                    >
                        Siguiente <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    )
}
