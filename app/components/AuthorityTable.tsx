'use client'

import { useState, useMemo } from 'react'
import { Printer, Search, User, ChevronLeft, ChevronRight, Loader2, Building2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { jsPDF } from 'jspdf'
import { printToQZ } from '@/lib/qz'

interface Authority {
    id: string
    name: string
    position: string
    organization: string | null
}

// Genera la imagen de credencial en canvas para autoridades (sin QR)
async function generateAuthorityCredentialImage(authority: Authority): Promise<string> {
    const canvas = document.createElement('canvas')
    // Proporciones de tarjeta de visita estilo credencial: 696 x 1050 (aprox badge vertical)
    canvas.width = 696
    canvas.height = 1050
    const ctx = canvas.getContext('2d')!

    // Fondo blanco
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Banda superior negra
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, canvas.width, 260)

    // Nombre en la banda superior
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'

    const nameParts = authority.name.toUpperCase().split(' ')
    const firstName = nameParts.slice(0, Math.ceil(nameParts.length / 2)).join(' ')
    const lastName = nameParts.slice(Math.ceil(nameParts.length / 2)).join(' ')

    ctx.font = 'bold 72px Arial, sans-serif'
    ctx.fillText(firstName, canvas.width / 2, 120, canvas.width - 60)

    ctx.font = 'bold 72px Arial, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.fillText(lastName, canvas.width / 2, 210, canvas.width - 60)

    // Cargo (position)
    ctx.fillStyle = '#000000'
    ctx.font = 'bold 42px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(authority.position.toUpperCase(), canvas.width / 2, 370)

    // Línea separadora
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(60, 420)
    ctx.lineTo(canvas.width - 60, 420)
    ctx.stroke()

    // Organización
    if (authority.organization) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        ctx.font = '28px Arial, sans-serif'
        ctx.fillText(authority.organization.toUpperCase(), canvas.width / 2, 490)
    }

    // Logo "CONNECTIFY" footer
    ctx.fillStyle = '#000000'
    ctx.font = 'bold 22px Arial, sans-serif'
    ctx.letterSpacing = '8px'
    ctx.fillText('CONNECTIFY', canvas.width / 2, canvas.height - 80)

    ctx.font = '16px Arial, sans-serif'
    ctx.fillStyle = 'rgba(0,0,0,0.4)'
    ctx.fillText('AUTORIDAD ACREDITADA', canvas.width / 2, canvas.height - 50)

    return canvas.toDataURL('image/png')
}

export default function AuthorityTable({ authorities }: { authorities: Authority[] }) {
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 20

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
                    alert(`✅ Credencial enviada a: ${result.printerUsed}`)
                    return
                }
                const continueWithPdf = confirm(
                    `⚠️ No se pudo imprimir directamente:\n${result.reason}\n\n¿Descargar como PDF?`
                )
                if (!continueWithPdf) return
            }

            // Fallback PDF
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [75, 105] })
            doc.addImage(credentialBase64, 'PNG', 0, 0, 75, 105)
            doc.save(`Credencial_${authority.name.replace(/\s+/g, '_')}.pdf`)
        } catch (error) {
            console.error('Error al imprimir credencial de autoridad:', error)
            alert('Error al generar la credencial')
        } finally {
            setLoadingId(null)
        }
    }

    return (
        <div className="w-full flex flex-col gap-6">
            {/* Buscador */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative w-full md:max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none opacity-50">
                        <Search className="h-5 w-5" />
                    </div>
                    <input
                        type="text"
                        placeholder="BUSCAR POR NOMBRE, CARGO U ORGANIZACIÓN..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="w-full bg-transparent border border-black/20 dark:border-white/20 focus:border-black dark:focus:border-white outline-none py-4 pl-12 pr-4 font-mono text-sm tracking-widest uppercase transition-colors placeholder:opacity-30 rounded-none"
                    />
                </div>

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
