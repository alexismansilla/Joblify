'use client'

import { useState, useMemo } from 'react'
import QRCode from 'qrcode'
import { jsPDF } from 'jspdf'
import { printToQZ } from '@/lib/qz'
import { QrCode, Mail, User, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

interface Contact {
    id: string
    name: string
    email: string | null
    phone: string | null
    qr_token?: string | null
    created_at?: string
}

export default function ContactTable({ contacts }: { contacts: Contact[] }) {
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 50

    const filteredContacts = useMemo(() => {
        const query = searchQuery.toLowerCase()
        return contacts.filter(contact =>
            contact.name.toLowerCase().includes(query) ||
            (contact.email && contact.email.toLowerCase().includes(query)) ||
            (contact.phone && contact.phone.toLowerCase().includes(query))
        )
    }, [contacts, searchQuery])

    const totalPages = Math.ceil(filteredContacts.length / itemsPerPage)
    const currentContacts = filteredContacts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value)
        setCurrentPage(1)
    }

    const handlePrint = async (contact: Contact) => {
        setLoadingId(contact.id)
        try {
            // El QR apunta a WhatsApp del bot
            const targetPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUM_BUSINESS?.replace(/\D/g, '') || ''
            const msg = encodeURIComponent(`Hola! Conecté con @${contact.qr_token}`)
            const connectLink = `https://wa.me/${targetPhone}?text=${msg}`

            const qrBase64 = await QRCode.toDataURL(connectLink, {
                scale: 10,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                },
                errorCorrectionLevel: 'H'
            })

            // Función para añadir logo en el centro
            const addLogoToQR = async (qrData: string): Promise<string> => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                return new Promise((resolve) => {
                    img.onload = () => {
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx?.drawImage(img, 0, 0);
                        const logo = new Image();
                        // Logo de WhatsApp
                        logo.src = 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg';
                        logo.crossOrigin = "anonymous";
                        logo.onload = () => {
                            const size = canvas.width * 0.22;
                            const pos = (canvas.width - size) / 2;
                            ctx!.fillStyle = 'white';
                            ctx?.fillRect(pos - 2, pos - 2, size + 4, size + 4);
                            ctx?.drawImage(logo, pos, pos, size, size);
                            resolve(canvas.toDataURL());
                        };
                        logo.onerror = () => resolve(qrData);
                    };
                    img.src = qrData;
                });
            };

            const finalQrBase64 = await addLogoToQR(qrBase64);

            const mode = process.env.NEXT_PUBLIC_QR_OUTPUT_MODE || 'PRINT';
            let printed = false;

            if (mode === 'PRINT') {
                printed = await printToQZ(finalQrBase64)
            }

            if (!printed) {
                const doc = new jsPDF()
                doc.setFontSize(20)
                doc.text('Contacto Connectify', 10, 20)
                doc.setFontSize(12)
                doc.text(`Nombre: ${contact.name}`, 10, 40)
                doc.text(`Email: ${contact.email || 'N/A'}`, 10, 50)
                doc.text(`Tel: ${contact.phone || 'N/A'}`, 10, 60)
                // Usamos finalQrBase64 para el PDF también para que tenga el logo
                doc.addImage(finalQrBase64, 'PNG', 10, 70, 60, 60)
                doc.save(`QR_${contact.name.replace(/\s+/g, '_')}.pdf`)

                if (mode === 'PRINT') {
                    alert('QZ Tray no detectado. Se ha descargado el PDF.')
                } else {
                    alert('Modo PDF activo. El archivo se ha descargado.')
                }
            }
        } catch (error) {
            console.error(error)
            alert('Error al generar el QR')
        } finally {
            setLoadingId(null)
        }
    }

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative w-full md:max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none opacity-50">
                        <Search className="h-5 w-5" />
                    </div>
                    <input
                        type="text"
                        placeholder="BUSCAR NOMBRE, EMAIL O RUT..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="w-full bg-transparent border border-black/20 dark:border-white/20 focus:border-black dark:focus:border-white outline-none py-4 pl-12 pr-4 font-mono text-sm tracking-widest uppercase transition-colors placeholder:opacity-30 rounded-none"
                    />
                </div>

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
                                <th className="px-6 py-6 font-mono text-[10px] uppercase tracking-widest opacity-50">Email DB</th>
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
                                                <span className="font-black tracking-tight text-lg uppercase">{contact.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-3 font-mono text-sm opacity-60">
                                                <Mail className="w-4 h-4" />
                                                <span className="truncate max-w-[200px]">{contact.email || contact.phone || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <button
                                                onClick={() => handlePrint(contact)}
                                                disabled={loadingId === contact.id}
                                                className="inline-flex items-center gap-3 px-6 py-3 bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-900 dark:hover:bg-zinc-100 transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed group-hover:scale-[1.02] active:scale-95 border-none rounded-none"
                                            >
                                                {loadingId === contact.id ? (
                                                    <div className="animate-spin h-4 w-4 border-2 border-white dark:border-black border-t-transparent rounded-full" />
                                                ) : (
                                                    <>
                                                        <QrCode className="w-4 h-4" />
                                                        <span className="font-mono text-[10px] font-bold tracking-widest uppercase">Generar</span>
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-xs font-mono tracking-widest uppercase opacity-40">
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
