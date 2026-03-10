'use client'

import { useState, useEffect, use } from 'react'
import { motion, Variants } from 'framer-motion'
import { ArrowLeft, Check, Hash, User, Printer, Loader2 } from 'lucide-react'
import Link from 'next/link'
import QRCode from 'qrcode'
import { getContactById } from '@/app/actions/contacts'
import { Contact } from '@/lib/services/contactService'
import { printToQZ } from '@/lib/qz'
import { generateCredentialImage } from '@/lib/credentialRenderer'

interface Props {
    params: Promise<{ id: string }>
}

const fadeUp: Variants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

const containerVariants: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

export default function ContactCredentialPage({ params }: Props) {
    const { id } = use(params)
    const [contact, setContact] = useState<Contact | null>(null)
    const [qrDataUrl, setQrDataUrl] = useState('')
    const [includeQR, setIncludeQR] = useState(true)
    const [credentialImageUrl, setCredentialImageUrl] = useState('')
    const [loading, setLoading] = useState(true)
    const [printing, setPrinting] = useState(false)
    const [notFound, setNotFound] = useState(false)

    useEffect(() => {
        const init = async () => {
            const data = await getContactById(id)
            if (!data) {
                setNotFound(true)
                setLoading(false)
                return
            }

            setContact(data as Contact)

            // Generamos QR
            const targetPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUM_BUSINESS?.replace(/\D/g, '') || ''
            const msg = encodeURIComponent(`Hola! Conecté con @${data.qr_token}`)
            const connectUrl = `https://wa.me/${targetPhone}?text=${msg}`

            const qrDataUrl = await QRCode.toDataURL(connectUrl, {
                width: 512,
                margin: 1,
                color: { dark: '#000000', light: '#ffffff' },
            })

            setQrDataUrl(qrDataUrl)
            setLoading(false)
        }

        init()
    }, [id])

    // Re-generar dinámicamente si incluyen o no el QR
    useEffect(() => {
        if (!contact || !qrDataUrl) return

        let isMounted = true
        async function updateImage() {
            try {
                const credentialImg = await generateCredentialImage({
                    name: contact!.name,
                    company: (contact as any).company || ' ',
                    qrBase64: qrDataUrl,
                    includeQR
                })
                if (isMounted) setCredentialImageUrl(credentialImg)
            } catch (err) {
                console.error(err)
            }
        }
        updateImage()

        return () => { isMounted = false }
    }, [includeQR, contact, qrDataUrl])

    const handlePrintCredential = async () => {
        if (!credentialImageUrl) return
        setPrinting(true)
        try {
            const result = await printToQZ(credentialImageUrl)
            if (!result.success) {
                alert(`Error al imprimir:\n${result.reason}`)
            }
        } finally {
            setPrinting(false)
        }
    }

    // --- Estados de carga ---
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#050505]">
                <Loader2 className="w-8 h-8 animate-spin opacity-30" />
            </div>
        )
    }

    if (notFound) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white dark:bg-[#050505] text-black dark:text-white">
                <p className="font-mono text-xs uppercase tracking-widest opacity-40">Contacto no encontrado</p>
                <Link href="/admin" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest hover:opacity-50 transition-opacity">
                    <ArrowLeft className="w-4 h-4" /> Volver al Admin
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black overflow-hidden relative">
            {/* Grid bg */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:4rem_4rem]" />

            <motion.div
                initial="initial"
                animate="animate"
                variants={containerVariants}
                className="h-screen w-full flex flex-col md:flex-row"
            >
                {/* ─── Panel Izquierdo: info del contacto ─── */}
                <div className="flex-1 flex flex-col justify-between p-8 md:p-16 lg:p-24 border-b md:border-b-0 md:border-r border-black/10 dark:border-white/10 relative z-10">
                    <motion.div variants={fadeUp}>
                        <Link
                            href="/admin"
                            className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-widest hover:opacity-50 transition-opacity"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            CANCELAR / VOLVER
                        </Link>
                    </motion.div>

                    <motion.div variants={fadeUp} className="my-16 md:my-0 space-y-12">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-black dark:bg-white text-white dark:text-black font-mono text-[10px] uppercase tracking-widest">
                                <Check className="w-3 h-3" /> ACCESO AUTORIZADO
                            </div>
                            {/* Nombre grande — primer token oscuro, resto gris */}
                            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-none break-words">
                                {contact?.name.split(' ')[0]}
                                {contact && contact.name.split(' ').length > 1 && (
                                    <>
                                        <br />
                                        <span className="opacity-40">
                                            {contact.name.split(' ').slice(1).join(' ')}
                                        </span>
                                    </>
                                )}
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-black/10 dark:border-white/10">
                            <div className="space-y-2">
                                <p className="text-[10px] font-mono uppercase tracking-widest opacity-50 flex items-center gap-2">
                                    <Hash className="w-3 h-3" /> RUT REGISTRADO
                                </p>
                                <p className="font-mono text-lg">
                                    {(contact as any)?.rut || (contact as any)?.phone || contact?.email || '—'}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-mono uppercase tracking-widest opacity-50 flex items-center gap-2">
                                    <User className="w-3 h-3" /> ID INTERNO
                                </p>
                                <p className="font-mono text-sm opacity-80">
                                    {contact?.id.slice(0, 8).toUpperCase()}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={fadeUp} className="flex flex-col gap-4 max-w-sm mt-8 md:mt-0">
                        <button
                            onClick={handlePrintCredential}
                            disabled={printing}
                            className="group relative w-full inline-flex items-center justify-between gap-4 px-6 py-5 bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-900 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                        >
                            <span className="font-mono text-sm tracking-widest uppercase font-bold">
                                {printing ? 'ENVIANDO...' : 'IMPRIMIR CREDENCIAL'}
                            </span>
                            {printing
                                ? <Loader2 className="w-5 h-5 animate-spin" />
                                : <Printer className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                            }
                        </button>
                    </motion.div>
                </div>

                {/* ─── Panel Derecho: preview WYSIWYG de lo que se imprime ─── */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 lg:p-16 relative overflow-hidden bg-zinc-50 dark:bg-zinc-900">
                    <motion.div
                        variants={fadeUp}
                        className="relative z-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] max-w-sm w-full transition-all duration-300"
                    >
                        {credentialImageUrl && (
                            <img
                                src={credentialImageUrl}
                                alt="Vista previa de la credencial"
                                className="w-full h-auto block select-none"
                                draggable={false}
                            />
                        )}
                    </motion.div>

                    <motion.div variants={fadeUp} className="mt-8 relative z-10 flex flex-col items-center gap-2 text-black dark:text-white">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" className="hidden" checked={includeQR} onChange={(e) => setIncludeQR(e.target.checked)} />
                            <div className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${includeQR ? 'bg-black dark:bg-white' : 'bg-black/20 dark:bg-white/20'}`}>
                                <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white dark:bg-black transition-transform duration-300 ${includeQR ? 'translate-x-6' : 'translate-x-0'}`} />
                            </div>
                            <span className="font-mono text-[10px] tracking-widest uppercase opacity-60 group-hover:opacity-100 transition-opacity font-bold">
                                {includeQR ? 'INCLUIR CÓDIGO QR' : 'OCULTAR CÓDIGO QR'}
                            </span>
                        </label>
                        <p className="text-[9px] font-mono tracking-widest uppercase opacity-40 max-w-[280px] text-center mt-2">
                            Al ocultar, la credencial se imprimirá más corta. Puede imprimirla de nuevo con QR más tarde si así lo desea.
                        </p>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    )
}

