'use client'

import { useState, useEffect, use } from 'react'
import { getEmpresaById, getSuggestedEmpresas } from '@/app/actions/empresas'
import { registerMatchFromScan } from '@/app/actions/empresas'
import { Building2, Loader2, Send, User, Briefcase, Hash, Sparkles, ArrowRight } from 'lucide-react'

interface Props {
    params: Promise<{ id: string }>
}

const PROFILES = [
    'Tecnología',
    'Finanzas',
    'Marketing',
    'Operaciones',
    'Salud',
    'Legal',
    'Educación',
    'Ventas',
    'Recursos Humanos',
    'Logística',
    'Otro',
]

const EXPERIENCE_LEVELS = [
    'Sin experiencia',
    'Junior',
    'Semi-senior',
    'Senior',
]

const SEARCH_TYPES = [
    'Trabajo full-time',
    'Trabajo part-time',
    'Práctica',
    'Freelance',
    'Solo información',
]

const INTEREST_LEVELS = [
    { value: 'negocio', label: '⭐ Muy interesado', desc: 'Quiero postular activamente' },
    { value: 'mentoria', label: '📋 Quiero más info', desc: 'Me interesa conocer más' },
    { value: 'casual', label: '👀 Solo explorando', desc: 'Estoy viendo opciones' },
]

export default function ConnectPage({ params }: Props) {
    const { id } = use(params)
    const [empresa, setEmpresa] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [step, setStep] = useState<'info' | 'form' | 'redirecting'>('info')

    const [name, setName] = useState('')
    const [profile, setProfile] = useState('')
    const [experience, setExperience] = useState('')
    const [searchType, setSearchType] = useState('')
    const [interest, setInterest] = useState('')
    const [suggestions, setSuggestions] = useState<any[]>([])

    useEffect(() => {
        getEmpresaById(id).then(data => {
            setEmpresa(data)
            setLoading(false)
        })
    }, [id])

    const handleStart = () => setStep('form')

    const handleSubmit = async () => {
        if (!interest) return
        if (!empresa) return

        setSubmitting(true)

        try {
            await registerMatchFromScan(empresa.id, '', {
                name,
                profile,
                experience_level: experience,
                job_search_type: searchType,
                interest,
            })

            // Fetch suggested stands in parallel
            getSuggestedEmpresas(empresa.id, profile, interest).then(setSuggestions)

            setStep('redirecting')

            const targetPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUM_BUSINESS?.replace(/\D/g, '') || ''
            const msg = encodeURIComponent(`Hola! Conecté con @${empresa.qr_token}`)

            // Redirect after a moment so user sees success + suggestions
            setTimeout(() => {
                window.location.href = `https://wa.me/${targetPhone}?text=${msg}`
            }, 4000)
        } catch {
            setSubmitting(false)
        }
    }

    if (loading || !empresa) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
                <Loader2 className="w-10 h-10 animate-spin text-black/30" />
            </div>
        )
    }

    if (step === 'redirecting') {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-6">
                <div className="w-full max-w-lg mx-auto space-y-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-2xl text-center">
                        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                            <Sparkles className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-3">
                            ¡Conexión registrada!
                        </h2>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-2">
                            Recibirás la información de contacto de
                        </p>
                        <p className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-4">
                            {empresa.company || empresa.name}
                        </p>
                        <div className="flex items-center justify-center gap-3 text-xs text-zinc-400 font-mono">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Redirigiendo a WhatsApp...</span>
                        </div>
                    </div>

                    {/* Suggested stands */}
                    {suggestions.length > 0 && (
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
                            <div className="flex items-center gap-2 mb-5">
                                <Building2 className="w-4 h-4 text-zinc-400" />
                                <p className="text-sm font-bold text-zinc-900 dark:text-white">
                                    Otros stands que podrían interesarte
                                </p>
                            </div>
                            <div className="space-y-3">
                                {suggestions.map((s: any) => (
                                    <div
                                        key={s.id}
                                        className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700"
                                    >
                                        <div>
                                            <p className="font-bold text-sm text-zinc-900 dark:text-white">
                                                {s.company || s.name}
                                            </p>
                                            {s.industry && (
                                                <p className="text-xs text-zinc-400 mt-0.5">{s.industry}</p>
                                            )}
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-zinc-300" />
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-zinc-300 dark:text-zinc-600 text-center mt-4 font-mono tracking-widest uppercase">
                            Acércate a sus stands durante la feria
                        </p>
                    </div>
                )}
            </div>
        </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-lg mx-auto">
                {step === 'info' && (
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 md:p-10 border border-zinc-200 dark:border-zinc-800 shadow-2xl text-center">
                        <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
                            <Building2 className="w-10 h-10" />
                        </div>

                        <p className="text-xs font-mono tracking-widest uppercase text-zinc-400 mb-3">
                            Estás por conectar con
                        </p>
                        <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-1">
                            {empresa.company || empresa.name}
                        </h1>

                        {empresa.industry && (
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                                {empresa.industry}
                            </p>
                        )}

                        {empresa.opportunity_description && (
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3 leading-relaxed border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-4">
                                {empresa.opportunity_description}
                            </p>
                        )}

                        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6 mt-4">
                            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-6">
                                Cuéntanos de ti para que {empresa.company || empresa.name} te conozca mejor
                            </p>
                            <button
                                onClick={handleStart}
                                className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-base hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all active:scale-[0.98]"
                            >
                                <User className="w-5 h-5 inline-block mr-2" />
                                Quiero conectar →
                            </button>
                        </div>
                    </div>
                )}

                {step === 'form' && (
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 md:p-10 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <Building2 className="w-5 h-5 text-zinc-400" />
                            <div>
                                <p className="font-bold text-zinc-900 dark:text-white text-lg leading-tight">
                                    {empresa.company || empresa.name}
                                </p>
                                <p className="text-xs text-zinc-400 font-mono tracking-widest uppercase">
                                    Completa tus datos
                                </p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {/* Nombre opcional */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-mono tracking-widest uppercase text-zinc-500 mb-2">
                                    <User className="w-3.5 h-3.5" />
                                    Tu nombre <span className="text-zinc-300 normal-case tracking-normal">(opcional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Ej: Juan Pérez"
                                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                                />
                            </div>

                            {/* Área profesional */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-mono tracking-widest uppercase text-zinc-500 mb-2">
                                    <Briefcase className="w-3.5 h-3.5" />
                                    Área profesional
                                </label>
                                <select
                                    value={profile}
                                    onChange={e => setProfile(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors appearance-none cursor-pointer"
                                >
                                    <option value="">Selecciona tu área</option>
                                    {PROFILES.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Nivel de experiencia */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-mono tracking-widest uppercase text-zinc-500 mb-2">
                                    <Hash className="w-3.5 h-3.5" />
                                    Nivel de experiencia
                                </label>
                                <select
                                    value={experience}
                                    onChange={e => setExperience(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors appearance-none cursor-pointer"
                                >
                                    <option value="">Selecciona tu nivel</option>
                                    {EXPERIENCE_LEVELS.map(e => (
                                        <option key={e} value={e}>{e}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Tipo de búsqueda */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-mono tracking-widest uppercase text-zinc-500 mb-2">
                                    <Briefcase className="w-3.5 h-3.5" />
                                    Tipo de búsqueda
                                </label>
                                <select
                                    value={searchType}
                                    onChange={e => setSearchType(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors appearance-none cursor-pointer"
                                >
                                    <option value="">Selecciona tipo</option>
                                    {SEARCH_TYPES.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Nivel de interés */}
                            <div className="pt-2">
                                <label className="flex items-center gap-1.5 text-xs font-mono tracking-widest uppercase text-zinc-500 mb-3">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Tu interés en esta empresa
                                </label>
                                <div className="grid grid-cols-1 gap-2">
                                    {INTEREST_LEVELS.map(level => (
                                        <button
                                            key={level.value}
                                            type="button"
                                            onClick={() => setInterest(level.value)}
                                            className={`text-left px-4 py-3 rounded-xl border transition-all ${
                                                interest === level.value
                                                    ? 'border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                                                    : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500'
                                            }`}
                                        >
                                            <span className="font-bold text-sm">{level.label}</span>
                                            <p className={`text-xs mt-0.5 ${
                                                interest === level.value
                                                    ? 'text-white/70 dark:text-zinc-700'
                                                    : 'text-zinc-400'
                                            }`}>
                                                {level.desc}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={!interest || submitting}
                            className="w-full mt-6 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-base transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Enviar y continuar a WhatsApp
                                </>
                            )}
                        </button>
                        <p className="text-[10px] text-zinc-300 dark:text-zinc-600 text-center mt-3 font-mono tracking-widest uppercase">
                            Tus datos se compartirán con {empresa.company || empresa.name} con tu consentimiento
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
