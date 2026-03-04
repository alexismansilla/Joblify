'use client'

import { useState } from 'react'
import QRCode from 'qrcode'
import { jsPDF } from 'jspdf'
import { printToQZ } from '@/lib/qz'
import { QrCode, Mail, Phone, User, Printer } from 'lucide-react'
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

    const handlePrint = async (contact: Contact) => {
        setLoadingId(contact.id)
        try {
            // El QR apunta a WhatsApp del bot
            const targetPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUM_BUSINESS?.replace(/\D/g, '') || ''
            const msg = encodeURIComponent(`Hola! Conecté con @${contact.qr_token}:${contact.id}`)
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
        <div className="w-full overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                            <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Email</th>
                            <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Teléfono</th>
                            <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {contacts.map((contact, index) => (
                            <motion.tr
                                key={contact.id || `contact-${index}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{contact.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                        <Mail className="w-4 h-4" />
                                        <span>{contact.email || '—'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 font-mono">
                                        <Phone className="w-4 h-4" />
                                        <span>{contact.phone || '—'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handlePrint(contact)}
                                        disabled={loadingId === contact.id}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-all disabled:opacity-50 font-medium active:scale-95"
                                    >
                                        {loadingId === contact.id ? (
                                            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                                        ) : (
                                            <>
                                                <QrCode className="w-4 h-4" />
                                                <span>Imprimir QR</span>
                                            </>
                                        )}
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
