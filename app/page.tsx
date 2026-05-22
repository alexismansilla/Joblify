'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { ArrowRight, ArrowLeft, Printer, Check, User, Users, Hash, Loader2, UserPlus, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import QRCode from 'qrcode'
import { Input } from '@/app/components/ui/Input'

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
    const [qrDataUrl, setQrDataUrl] = useState('')
    const [includeQR, setIncludeQR] = useState(true)
    const [credentialImageUrl, setCredentialImageUrl] = useState('')
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (step === 'input') {
            inputRef.current?.focus()
        }
    }, [step])

    // Regenerar la credencial dinámicamente si se alterna includeQR
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
                console.error('Error re-generando credencial:', err)
            }
        }
        updateImage()

        return () => { isMounted = false }
    }, [includeQR, contact, qrDataUrl])

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!identifier.trim()) return

        setLoading(true)
        setError(null)

        try {
            const result = await findContactByIdentifier(identifier.trim())
            if (result) {
                setContact(result)

                // Generamos QR
                const targetPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUM_BUSINESS?.replace(/\D/g, '') || ''
                const msg = encodeURIComponent(`Hola! Conecté con @${result.qr_token}`)
                const connectUrl = `https://wa.me/${targetPhone}?text=${msg}`
                const qrDataUrl = await QRCode.toDataURL(connectUrl, {
                    width: 512,
                    margin: 1,
                    color: { dark: '#000000', light: '#ffffff' },
                })

                setQrDataUrl(qrDataUrl)
                setIncludeQR(true)
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
        setQrDataUrl('')
        setCredentialImageUrl('')
        setError(null)
    }

    const handlePrintCredential = async () => {
        if (!credentialImageUrl) return
        setPrinting(true)
        try {
            // credentialImageUrl ya es la imagen generada — la enviamos directo
            const result = await printToQZ(credentialImageUrl)
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
                                Joblify
                            </motion.div>

                            <motion.div variants={fadeUp} className="space-y-4">
                                <h1 className="text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9]">
                                    FERIA<br />DE<br />EMPLEO.
                                </h1>
                                <p className="font-mono text-xs tracking-widest uppercase opacity-50">Portal de Acreditación · Candidatos</p>
                            </motion.div>
                        </div>

                        {/* Right column Form */}
                        <div className="flex-1 flex flex-col p-12 lg:p-16 relative z-10">
                            {/* Formulario centrado verticalmente */}
                            <div className="flex-1 flex flex-col justify-center">
                                <motion.div variants={fadeUp} className="max-w-xl w-full mx-auto md:mx-0">
                                    <form onSubmit={handleSearch} className="space-y-16">
                                        <div className="space-y-6">
                                            <label htmlFor="rut" className="block text-xs font-mono tracking-widest uppercase opacity-60">
                                                01 // Ingresar RUT del candidato
                                            </label>
                                            <div className="relative group">
                                                <Input
                                                    id="rut"
                                                    ref={inputRef}
                                                    type="text"
                                                    placeholder="Ej: 12345678-9"
                                                    value={identifier}
                                                    onChange={(e) => setIdentifier(e.target.value)}
                                                    className="!text-3xl md:!text-5xl lg:!text-6xl !font-black !tracking-tight !border-b-2 !border-x-0 !border-t-0 !px-0 bg-transparent placeholder:opacity-20 transition-colors"
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
                                <div className="flex flex-col gap-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <Link
                                            href="/admin/registro-manual"
                                            className="group inline-flex items-center justify-between gap-3 px-4 py-3 h-[60px] border border-black/20 dark:border-white/20 hover:border-black dark:hover:border-white hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200"
                                        >
                                            <span className="font-mono text-[11px] tracking-widest uppercase opacity-70 group-hover:opacity-100 transition-opacity leading-tight">
                                                Registro<br />Manual
                                            </span>
                                            <UserPlus className="w-4 h-4 opacity-40 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
                                        </Link>
                                        <Link
                                            href="/admin/autoridades"
                                            className="group inline-flex items-center justify-between gap-3 px-4 py-3 h-[60px] border border-black/20 dark:border-white/20 hover:border-black dark:hover:border-white hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200"
                                        >
                                            <span className="font-mono text-[11px] tracking-widest uppercase opacity-70 group-hover:opacity-100 transition-opacity leading-tight">
                                                Lista<br />Autoridades
                                            </span>
                                            <ShieldCheck className="w-4 h-4 opacity-40 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
                                        </Link>
                                    </div>
                                    <Link
                                        href="/admin"
                                        className="group flex w-full items-center justify-center gap-3 px-4 py-3 h-[60px] border border-black/20 dark:border-white/20 hover:border-black dark:hover:border-white hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200"
                                    >
                                        <Users className="w-4 h-4 opacity-40 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
                                        <span className="font-mono text-[11px] tracking-widest uppercase opacity-70 group-hover:opacity-100 transition-opacity leading-tight">
                                            VER TODOS LOS CANDIDATOS
                                        </span>
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

                        {/* Right Column: Preview WYSIWYG — la misma imagen que se imprime */}
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

                            <motion.div variants={fadeUp} className="mt-8 relative z-10 flex flex-col items-center gap-2">
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
                                    Al ocultar, la credencial se imprimirá más corta. Puede imprimirla de nuevo con QR más tarde.
                                </p>
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
            {step === 'result' && credentialImageUrl && (
                <div id="print-section" className="hidden">
                    <img
                        src={credentialImageUrl}
                        alt="Credencial"
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                </div>
            )}
        </div>
    )
}
