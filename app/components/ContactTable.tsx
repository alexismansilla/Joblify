'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Mail, User, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Input } from './ui/Input'

interface Contact {
    id: string
    name: string
    first_name?: string | null
    last_name?: string | null
    email: string | null
    phone: string | null
    rut?: string | null
    company?: string | null
    position?: string | null
    qr_token?: string | null
    created_at?: string
}

export default function ContactTable({ contacts }: { contacts: Contact[] }) {
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 50

    const query = searchQuery.toLowerCase()
    const filteredContacts = contacts.filter(contact =>
        contact.name.toLowerCase().includes(query) ||
        (contact.email && contact.email.toLowerCase().includes(query)) ||
        (contact.phone && contact.phone.toLowerCase().includes(query)) ||
        (contact.rut && contact.rut.toLowerCase().includes(query)) ||
        (contact.company && contact.company.toLowerCase().includes(query)) ||
        (contact.position && contact.position.toLowerCase().includes(query))
    )

    const totalPages = Math.ceil(filteredContacts.length / itemsPerPage)
    const currentContacts = filteredContacts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value)
        setCurrentPage(1)
    }

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <Input
                    type="text"
                    placeholder="BUSCAR NOMBRE, EMAIL O RUT..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    icon={<Search className="h-5 w-5" />}
                    containerClassName="md:max-w-md"
                />

                <div className="font-mono text-[10px] font-bold tracking-widest uppercase opacity-50">
                    MOSTRANDO {currentContacts.length} DE {filteredContacts.length} ENTIDADES
                </div>
            </div>

            <div className="w-full border-t border-black/10 dark:border-white/10">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="border-b border-black/10 dark:border-white/10">
                                <th className="px-6 py-6 font-mono text-[10px] uppercase tracking-widest opacity-50"># Identificador</th>
                                <th className="px-6 py-6 font-mono text-[10px] uppercase tracking-widest opacity-50">Contacto Activo</th>
                                <th className="px-6 py-6 font-mono text-[10px] uppercase tracking-widest opacity-50">Cargo / Empresa</th>
                                <th className="px-6 py-6 font-mono text-[10px] uppercase tracking-widest opacity-50">Email / Teléfono</th>
                                <th className="px-6 py-6 font-mono text-[10px] uppercase tracking-widest opacity-50 text-right">Acción Prensado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                            {currentContacts.length > 0 ? (
                                currentContacts.map((contact, index) => (
                                    <motion.tr
                                        key={contact.id || `contact-${index}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: (index % itemsPerPage) * 0.02 }}
                                        className="group hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                    >
                                        <td className="px-6 py-6">
                                            <div className="font-mono text-xs opacity-60">
                                                ID-{contact.id.split('-')[0].toUpperCase()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-none border border-black/10 dark:border-white/10 flex items-center justify-center group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors duration-300">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black tracking-tight text-lg uppercase">{contact.name}</span>
                                                    {contact.rut && (
                                                        <span className="font-mono text-[10px] opacity-40 tracking-widest">{contact.rut}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col gap-0.5">
                                                {contact.position && (
                                                    <span className="font-mono text-xs font-bold tracking-wide uppercase">{contact.position}</span>
                                                )}
                                                {contact.company && (
                                                    <span className="font-mono text-[10px] opacity-50 tracking-widest">{contact.company}</span>
                                                )}
                                                {!contact.position && !contact.company && (
                                                    <span className="font-mono text-[10px] opacity-30">—</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-3 font-mono text-sm opacity-60">
                                                <Mail className="w-4 h-4" />
                                                <span className="truncate max-w-[200px]">{contact.email || contact.phone || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <Link
                                                href={`/admin/contactos/${contact.id}`}
                                                className="inline-flex items-center gap-3 px-6 py-3 bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-900 dark:hover:bg-zinc-100 transition-colors duration-300 group-hover:scale-[1.02] active:scale-95"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                <span className="font-mono text-[10px] font-bold tracking-widest uppercase">Credencial</span>
                                            </Link>
                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-xs font-mono tracking-widest uppercase opacity-40">
                                        NO SE ENCONTRARON RESULTADOS
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
