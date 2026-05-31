'use client'

import { useState, useEffect, use } from 'react'
import { getMatchById, updateScannerData } from '@/app/actions/empresas'
import { User, Mail, Phone, CheckCircle, Loader2, Sparkles } from 'lucide-react'

interface Props {
    params: Promise<{ id: string }>
}

export default function CompletarPerfilPage({ params }: Props) {
    const { id } = use(params)
    const [match, setMatch] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [notFound, setNotFound] = useState(false)

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')

    useEffect(() => {
        getMatchById(id).then(data => {
            if (!data) {
                setNotFound(true)
                setLoading(false)
                return
            }
            setMatch(data)
            setName(data.scanner_name || '')
            setEmail(data.scanner_email || '')
            setPhone(data.candidato_phone || '')
            setLoading(false)
        })
    }, [id])

    const handleSubmit = async () => {
        setSaving(true)
        const ok = await updateScannerData(id, {
            scanner_name: name || undefined,
            scanner_email: email || undefined,
            scanner_phone: phone || undefined,
        })
        setSaving(false)
        if (ok) setSaved(true)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#050505]">
                <Loader2 className="w-8 h-8 animate-spin opacity-30" />
            </div>
        )
    }

    if (notFound) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white dark:bg-[#050505] text-black dark:text-white p-6">
                <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                    <span className="text-2xl">🔗</span>
                </div>
                <p className="font-mono text-xs uppercase tracking-widest opacity-40">Link no válido o expirado</p>
                <p className="font-mono text-[10px] uppercase tracking-widest opacity-25 text-center">
                    El enlace de completar perfil no es válido. Solicita un nuevo enlace al reclutador.
                </p>
            </div>
        )
    }

    if (saved) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#050505] p-6">
                <div className="w-full max-w-md text-center">
                    <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tighter mb-2">¡Perfil actualizado!</h2>
                    <p className="font-mono text-xs tracking-widest opacity-50">
                        La empresa ahora tiene tu información actualizada. ¡Gracias!
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white font-sans flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="border border-black/10 dark:border-white/10 p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <Sparkles className="w-5 h-5 opacity-40" />
                        <div>
                            <h1 className="font-black tracking-tighter uppercase text-lg leading-tight">
                                Completa tu perfil
                            </h1>
                            <p className="font-mono text-[10px] uppercase tracking-widest opacity-40">
                                Para que el reclutador te conozca mejor
                            </p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest opacity-50 mb-2">
                                <User className="w-3 h-3" /> Nombre completo
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Tu nombre"
                                className="w-full bg-transparent border border-black/20 dark:border-white/20 px-4 py-3 font-mono text-sm outline-none focus:border-black dark:focus:border-white transition-colors placeholder:opacity-30"
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest opacity-50 mb-2">
                                <Mail className="w-3 h-3" /> Correo electrónico
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="correo@ejemplo.com"
                                className="w-full bg-transparent border border-black/20 dark:border-white/20 px-4 py-3 font-mono text-sm outline-none focus:border-black dark:focus:border-white transition-colors placeholder:opacity-30"
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest opacity-50 mb-2">
                                <Phone className="w-3 h-3" /> Teléfono de contacto
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="+56912345678"
                                className="w-full bg-transparent border border-black/20 dark:border-white/20 px-4 py-3 font-mono text-sm outline-none focus:border-black dark:focus:border-white transition-colors placeholder:opacity-30"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="w-full mt-8 py-4 bg-black dark:bg-white text-white dark:text-black font-mono text-xs tracking-widest uppercase font-bold hover:opacity-80 transition-opacity disabled:opacity-30 flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            'Guardar perfil'
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
