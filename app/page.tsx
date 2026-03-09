'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { ArrowRight, ArrowLeft, Printer, Check, User, Hash, Loader2, UserPlus, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import QRCode from 'qrcode'
import { findContactByIdentifier } from '@/app/actions/contacts'
import { Contact } from '@/lib/services/contactService'
import { printToQZ } from '@/lib/qz'
import { generateCredentialImage } from '@/lib/credentialRenderer'

const fadeUp: Variants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.3 } }
}

const containerVariants: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { staggerChildren: 0.1 } },
    exit: { opacity: 0 }
}

export default function CheckIn() {
    const [step, setStep] = useState<'input' | 'result'>('input')
    const [identifier, setIdentifier] = useState('')
    const [loading, setLoading] = useState(false)
    const [printing, setPrinting] = useState(false)
    const [contact, setContact] = useState<Contact | null>(null)
    const [qrCodeUrl, setQrCodeUrl] = useState('')
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (step === 'input') {
            inputRef.current?.focus()
        }
    }, [step])

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!identifier.trim()) return

        setLoading(true)
        setError(null)

        try {
            // Se usa el RUT para buscar
            const result = await findContactByIdentifier(identifier.trim())
            if (result) {
                setContact(result)
                const targetPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUM_BUSINESS?.replace(/\D/g, '') || ''
                const msg = encodeURIComponent(`Hola! Conecté con @${result.qr_token}`)
                const connectUrl = `https://wa.me/${targetPhone}?text=${msg}`
                const qrDataUrl = await QRCode.toDataURL(connectUrl, {
                    width: 512,
                    margin: 1,
                    color: {
                        dark: '#000000',
                        light: '#ffffff',
                    },
                })
                setQrCodeUrl(qrDataUrl)
                setStep('result')
            } else {
                setError('RUT no encontrado en el sistema.')
            }
        } catch (err) {
            console.error(err)
            setError('Error de comunicación con la base de datos.')
        } finally {
            setLoading(false)
        }
    }

    const handleReset = () => {
        setStep('input')
        setIdentifier('')
        setContact(null)
        setQrCodeUrl('')
        setError(null)
    }

    const handlePrintCredential = async () => {
        if (!qrCodeUrl || !contact) return
        setPrinting(true)
        try {
            // Generamos la imagen completa de la credencial (nombre + empresa + QR)
            const credentialImageBase64 = await generateCredentialImage({
                name: contact.name,
                company: (contact as any).company || 'CONNECTIFY',
                qrBase64: qrCodeUrl,
            })

            const result = await printToQZ(credentialImageBase64)
            if (!result.success) {
                alert(`Error al imprimir:\n${result.reason}`)
            }
        } finally {
            setPrinting(false)
        }
    }

    return (
        <div className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black overflow-hidden relative">
            {/* Minimalist Grid Pattern Background */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] mix-blend-difference bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

            <AnimatePresence mode="wait">
                {step === 'input' ? (
                    <motion.div
                        key="input-step"
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={containerVariants}
                        className="h-screen w-full flex flex-col md:flex-row"
                    >
                        {/* Left column context */}
                        <div className="hidden md:flex flex-1 flex-col justify-between p-12 lg:p-16 border-r border-black/10 dark:border-white/10 relative">
                            <motion.div variants={fadeUp} className="text-sm font-mono tracking-widest uppercase">
                                Connectify
                            </motion.div>

                            <motion.div variants={fadeUp} className="space-y-4">
                                <h1 className="text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9]">
                                    CHECK<br />IN.
                                </h1>
                                <p className="font-mono text-xs tracking-widest uppercase opacity-50">Portal de Acreditación</p>
                            </motion.div>
                        </div>

                        {/* Right column Form */}
                        <div className="flex-1 flex flex-col p-8 md:p-16 lg:p-24 relative z-10">
                            {/* Formulario centrado verticalmente */}
                            <div className="flex-1 flex flex-col justify-center">
                                <motion.div variants={fadeUp} className="max-w-xl w-full mx-auto md:mx-0">
                                    <form onSubmit={handleSearch} className="space-y-16">
                                        <div className="space-y-6">
                                            <label htmlFor="rut" className="block text-xs font-mono tracking-widest uppercase opacity-60">
                                                01 // Ingresar RUT del asistente
                                            </label>
                                            <div className="relative group">
                                                <input
                                                    id="rut"
                                                    ref={inputRef}
                                                    type="text"
                                                    placeholder="Ej: 12345678-9"
                                                    value={identifier}
                                                    onChange={(e) => setIdentifier(e.target.value)}
                                                    className="w-full bg-transparent border-b-2 border-black/20 dark:border-white/20 focus:border-black dark:focus:border-white outline-none py-4 text-4xl md:text-5xl lg:text-6xl font-black tracking-tight transition-colors placeholder:opacity-20 rounded-none"
                                                    autoComplete="off"
                                                />
                                                {error && (
                                                    <div className="absolute -bottom-8 left-0 text-red-600 dark:text-red-400 font-mono text-xs uppercase tracking-widest flex items-center gap-2">
                                                        [ERROR]: {error}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading || !identifier.trim()}
                                            className="group relative w-full lg:w-auto inline-flex items-center justify-between gap-8 px-8 py-5 bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-900 dark:hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
                                        >
                                            <span className="font-mono text-sm tracking-widest uppercase font-bold">
                                                {loading ? 'BUSCANDO...' : 'VERIFICAR IDENTIDAD'}
                                            </span>
                                            {loading ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            )}
                                        </button>
                                    </form>
                                </motion.div>
                            </div>

                            {/* Accesos rápidos anclados al fondo */}
                            <motion.div variants={fadeUp} className="max-w-xl w-full mx-auto md:mx-0 flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
                                    <span className="font-mono text-[10px] tracking-widest uppercase opacity-40">// acceso rápido</span>
                                    <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Link
                                        href="/admin/registro-manual"
                                        className="group inline-flex items-center justify-between gap-3 px-4 py-3 border border-black/20 dark:border-white/20 hover:border-black dark:hover:border-white hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200"
                                    >
                                        <span className="font-mono text-[11px] tracking-widest uppercase opacity-70 group-hover:opacity-100 transition-opacity leading-tight">
                                            Registro<br />Manual
                                        </span>
                                        <UserPlus className="w-4 h-4 opacity-40 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
                                    </Link>
                                    <Link
                                        href="/admin/autoridades"
                                        className="group inline-flex items-center justify-between gap-3 px-4 py-3 border border-black/20 dark:border-white/20 hover:border-black dark:hover:border-white hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200"
                                    >
                                        <span className="font-mono text-[11px] tracking-widest uppercase opacity-70 group-hover:opacity-100 transition-opacity leading-tight">
                                            Lista<br />Autoridades
                                        </span>
                                        <ShieldCheck className="w-4 h-4 opacity-40 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="result-step"
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={containerVariants}
                        className="h-screen w-screen flex flex-col md:flex-row"
                    >
                        {/* Left Column: Result Details */}
                        <div className="flex-1 flex flex-col justify-between p-8 md:p-16 lg:p-24 border-b md:border-b-0 md:border-r border-black/10 dark:border-white/10 relative z-10">
                            <motion.button
                                variants={fadeUp}
                                onClick={handleReset}
                                className="inline-flex items-center gap-3 text-xs font-mono uppercase tracking-widest hover:opacity-50 transition-opacity w-fit"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                CANCELAR / VOLVER
                            </motion.button>

                            <motion.div variants={fadeUp} className="my-16 md:my-0 space-y-12">
                                <div className="space-y-4">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-black dark:bg-white text-white dark:text-black font-mono text-[10px] uppercase tracking-widest">
                                        <Check className="w-3 h-3" /> ACCESO AUTORIZADO
                                    </div>
                                    <h2 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-none break-words">
                                        {contact?.name.split(' ')[0]}
                                        {contact?.name.split(' ').length && contact.name.split(' ').length > 1 ? (
                                            <>
                                                <br />
                                                <span className="opacity-40">{contact.name.split(' ').slice(1).join(' ')}</span>
                                            </>
                                        ) : null}
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-black/10 dark:border-white/10">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-mono uppercase tracking-widest opacity-50 flex items-center gap-2">
                                            <Hash className="w-3 h-3" /> RUT REGISTRADO
                                        </p>
                                        <p className="font-mono text-lg">{contact?.rut || contact?.phone || contact?.email || identifier}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-mono uppercase tracking-widest opacity-50 flex items-center gap-2">
                                            <User className="w-3 h-3" /> ID INTERNO
                                        </p>
                                        <p className="font-mono text-sm opacity-80">{contact?.id.slice(0, 8).toUpperCase()}</p>
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

                        {/* Right Column: QR Digital Frame */}
                        <div className="flex-1 flex items-center justify-center p-8 md:p-12 lg:p-24 relative overflow-hidden bg-zinc-50 dark:bg-zinc-900">
                            <motion.div variants={fadeUp} className="relative z-10 bg-white p-8 md:p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-transform duration-500 will-change-transform max-w-sm w-full text-black flex flex-col items-center">
                                {/* Aesthetic frame cuts */}
                                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-black to-transparent opacity-20" />
                                <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-black to-transparent opacity-20" />
                                <div className="absolute inset-y-0 -left-px w-px bg-gradient-to-b from-transparent via-black to-transparent opacity-20" />
                                <div className="absolute inset-y-0 -right-px w-px bg-gradient-to-b from-transparent via-black to-transparent opacity-20" />

                                {/* Virtual Badge Header */}
                                <div className="text-center w-full mb-6">
                                    <h3 className="text-3xl font-black uppercase tracking-tight leading-none line-clamp-2 w-full break-words">
                                        {contact?.name}
                                    </h3>
                                    <p className="text-xs font-bold uppercase tracking-widest mt-3 opacity-60">
                                        {contact?.company || 'CONNECTIFY'}
                                    </p>
                                </div>

                                <div className="aspect-square w-full max-w-[240px] bg-white flex items-center justify-center border-t border-b border-black/10 py-6 my-2">
                                    {qrCodeUrl && (
                                        <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain select-none pointer-events-none mix-blend-multiply" />
                                    )}
                                </div>

                                <div className="mt-6 w-full text-center flex items-center justify-between">
                                    <p className="text-[10px] font-mono uppercase tracking-widest text-black/60">
                                        ESCANEAR PARA CONECTAR
                                    </p>
                                    <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                @media print {
                    body > * {
                        visibility: hidden;
                    }
                    #__next, body, html {
                        background: white !important;
                    }
                    
                    /* This makes only the print label visible when printing */
                    #print-section, #print-section * {
                        visibility: visible !important;
                    }
                    
                    #print-section {
                        position: fixed;
                        left: 0;
                        top: 0;
                        margin: 0;
                        padding: 10mm;
                        width: 100vw;
                        height: 100vh;
                        background: white;
                        color: black;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                        gap: 20px;
                        font-family: sans-serif;
                    }
                    
                    @page {
                        margin: 0;
                        size: auto;
                    }
                }
            `}</style>

            {/* Hidden component for printing the badge */}
            {step === 'result' && (
                <div id="print-section" className="hidden">
                    <h2 style={{ fontSize: '36px', margin: 0, fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.1 }}>
                        {contact?.name}
                    </h2>
                    <p style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.6, margin: '10px 0 0 0' }}>
                        {contact?.company || 'CONNECTIFY'}
                    </p>

                    <div style={{ marginTop: '20px', borderTop: '2px solid rgba(0,0,0,0.1)', borderBottom: '2px solid rgba(0,0,0,0.1)', padding: '20px 0' }}>
                        {qrCodeUrl && (
                            <img
                                src={qrCodeUrl}
                                alt="QR Label"
                                style={{
                                    width: '240px',
                                    height: '240px',
                                    display: 'block',
                                    margin: '0 auto'
                                }}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
