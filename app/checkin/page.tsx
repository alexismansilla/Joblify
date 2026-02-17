'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { Search, User, Mail, Building2, Briefcase, QrCode, Printer, ChevronRight, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import QRCode from 'qrcode'
import { findContactByEmail } from '@/app/actions/contacts'
import { Contact } from '@/lib/services/contactService'

const containerVariants: Variants = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, scale: 1.02, transition: { duration: 0.3 } }
}

export default function SelfCheckIn() {
    const [step, setStep] = useState<'input' | 'result'>('input')
    const [identifier, setIdentifier] = useState('')
    const [loading, setLoading] = useState(false)
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
            const result = await findContactByEmail(identifier.trim())
            if (result) {
                setContact(result)
                // Generate QR code URL (Link to the connect page for this ID)
                const connectUrl = `${window.location.origin}/connect/${result.id}`
                const qrDataUrl = await QRCode.toDataURL(connectUrl, {
                    width: 400,
                    margin: 2,
                    color: {
                        dark: '#1e1b4b', // indigo-950
                        light: '#ffffff',
                    },
                })
                setQrCodeUrl(qrDataUrl)
                setStep('result')
            } else {
                setError('No se encontró ningún registro con ese correo.')
            }
        } catch (err) {
            console.error(err)
            setError('Ocurrió un error al buscar tus datos.')
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

    const handlePrint = () => {
        // In a real scenario, this would call QZ Tray or trigger the browser print
        window.print()
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black overflow-hidden selection:bg-indigo-500/30">
            <AnimatePresence mode="wait">
                {step === 'input' ? (
                    <motion.div
                        key="input-step"
                        variants={containerVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="h-screen w-full flex flex-col items-center justify-center p-6 md:p-12"
                    >
                        <div className="max-w-4xl w-full space-y-12">
                            <div className="text-center space-y-4">
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-indigo-200 dark:shadow-none mb-4"
                                >
                                    <Search className="w-10 h-10 text-white" />
                                </motion.div>
                                <motion.h1
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-5xl md:text-7xl font-black tracking-tight text-zinc-900 dark:text-white"
                                >
                                    Bienvenido
                                </motion.h1>
                                <motion.p
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-xl md:text-2xl text-zinc-500 dark:text-zinc-400 font-medium"
                                >
                                    Ingresa tu correo para realizar el check-in
                                </motion.p>
                            </div>

                            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto group">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Ej: usuario@empresa.com"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="w-full bg-white dark:bg-zinc-900 border-x-0 border-t-0 border-b-4 border-zinc-200 dark:border-zinc-800 focus:border-indigo-600 dark:focus:border-indigo-500 outline-none p-8 text-4xl md:text-6xl text-center font-bold text-zinc-900 dark:text-white transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                                />

                                {error && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute -bottom-10 left-0 right-0 text-center text-red-500 font-bold"
                                    >
                                        {error}
                                    </motion.p>
                                )}

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={loading || !identifier.trim()}
                                    className="mt-16 w-full py-8 md:py-10 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 text-white rounded-[2rem] text-3xl font-black shadow-2xl shadow-emerald-200 dark:shadow-none transition-all flex items-center justify-center gap-4 group"
                                >
                                    {loading ? (
                                        <Loader2 className="w-10 h-10 animate-spin" />
                                    ) : (
                                        <>
                                            <span>INGRESAR</span>
                                            <ChevronRight className="w-10 h-10 group-hover:translate-x-2 transition-transform" />
                                        </>
                                    )}
                                </motion.button>
                            </form>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="result-step"
                        variants={containerVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="h-screen w-screen flex flex-col md:flex-row bg-white dark:bg-zinc-950"
                    >
                        {/* Left Column: Data */}
                        <div className="flex-1 flex flex-col justify-center p-12 md:p-24 space-y-10 border-r border-zinc-100 dark:border-zinc-900">
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors mb-4 group"
                            >
                                <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                                <span className="text-lg font-bold">VOLVER</span>
                            </button>

                            <div className="space-y-2">
                                <div className="flex items-center gap-3 text-emerald-500 mb-2">
                                    <CheckCircle2 className="w-8 h-8" />
                                    <span className="text-xl font-black uppercase tracking-widest">Identificación Existosa</span>
                                </div>
                                <h2 className="text-6xl md:text-8xl font-black text-zinc-900 dark:text-white tracking-tighter">
                                    {contact?.name.split(' ')[0]}
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-10 border-y border-zinc-100 dark:border-zinc-900">
                                <DataField icon={User} label="Nombre Completo" value={contact?.name || ''} />
                                <DataField icon={Mail} label="Correo" value={contact?.email || 'Sin registrar'} />
                            </div>

                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={handlePrint}
                                    className="w-full py-8 bg-indigo-600 text-white rounded-[2rem] text-3xl font-black flex items-center justify-center gap-4 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 dark:shadow-none"
                                >
                                    <Printer className="w-8 h-8" />
                                    <span>IMPRIMIR ETIQUETA</span>
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="w-full py-6 text-zinc-400 font-bold hover:text-zinc-600 decoration-2 underline-offset-4"
                                >
                                    TERMINAR
                                </button>
                            </div>
                        </div>

                        {/* Right Column: QR Preview (Digital Signage Style) */}
                        <div className="hidden md:flex flex-[0.8] items-center justify-center bg-zinc-50 dark:bg-black p-24">
                            <div className="relative group">
                                {/* Decorative Elements */}
                                <div className="absolute -inset-10 bg-gradient-to-tr from-indigo-500 to-emerald-500 rounded-[4rem] blur-3xl opacity-20 group-hover:opacity-30 transition-opacity" />

                                <div className="relative bg-white dark:bg-zinc-900 p-16 rounded-[4rem] border border-zinc-200 dark:border-zinc-800 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] flex flex-col items-center gap-8">
                                    <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-3xl">
                                        {qrCodeUrl && (
                                            <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64 md:w-80 md:h-80" />
                                        )}
                                    </div>
                                    <div className="text-center">
                                        <p className="text-zinc-400 font-bold tracking-widest uppercase text-sm mb-2">Escanea para Conectar</p>
                                        <div className="w-12 h-1.5 bg-indigo-600 mx-auto rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
        </div>
    )
}

function DataField({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2 text-zinc-400">
                <Icon className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 truncate">{value}</p>
        </div>
    )
}
