'use client'

import { useState, useRef } from 'react'
import { createEmpresa } from '@/app/actions/empresas'
import { ArrowLeft, Check, AlertCircle, Loader2, Mail, Phone, Building2, Briefcase, FileText, Store, User, Hash } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Input } from '@/app/components/ui/Input'
import AdminNavbar from '@/app/components/AdminNavbar'

interface FieldConfig {
    id: string
    name: string
    label: string
    placeholder: string
    icon: React.ReactNode
    required: boolean
    type: string
    options?: string[]
    colSpan?: boolean
}

const EMPRESA_FIELDS: FieldConfig[] = [
    {
        id: 'empresa_company',
        name: 'company_name',
        label: '01 // NOMBRE DE EMPRESA',
        placeholder: 'Ej: TechCorp Chile SpA',
        icon: <Store className="w-4 h-4" />,
        required: true,
        type: 'text',
    },
    {
        id: 'empresa_phone',
        name: 'phone',
        label: '02 // TELÉFONO DE CONTACTO',
        placeholder: 'Ej: +56912345678',
        icon: <Phone className="w-4 h-4" />,
        required: true,
        type: 'tel',
    },
    {
        id: 'empresa_email',
        name: 'email',
        label: '03 // E-MAIL DE CONTACTO',
        placeholder: 'Ej: contacto@empresa.com',
        icon: <Mail className="w-4 h-4" />,
        required: true,
        type: 'email',
    },
    {
        id: 'empresa_job_search_type',
        name: 'job_search_type',
        label: '04 // TIPO DE BÚSQUEDA',
        placeholder: 'Selecciona tipo de contratación',
        icon: <Briefcase className="w-4 h-4" />,
        required: true,
        type: 'select',
        options: [
            'Trabajo full-time',
            'Trabajo part-time',
            'Práctica',
            'Freelance',
            'Todos los tipos',
        ]
    },
    {
        id: 'empresa_name',
        name: 'name',
        label: '05 // NOMBRE DEL CONTACTO / REPRESENTANTE',
        placeholder: 'Ej: María García',
        icon: <User className="w-4 h-4" />,
        required: false,
        type: 'text',
    },
    {
        id: 'empresa_position',
        name: 'position',
        label: '06 // CARGO DEL REPRESENTANTE',
        placeholder: 'Ej: Gerente de Personas',
        icon: <Hash className="w-4 h-4" />,
        required: false,
        type: 'text',
    },
    {
        id: 'empresa_industry',
        name: 'industry',
        label: '07 // INDUSTRIA / SECTOR',
        placeholder: 'Ej: Tecnología, Retail, Salud...',
        icon: <Briefcase className="w-4 h-4" />,
        required: false,
        type: 'text',
    },
    {
        id: 'empresa_opportunity',
        name: 'opportunity_description',
        label: '08 // DESCRIPCIÓN DE OPORTUNIDADES',
        placeholder: 'Ej: Buscamos ingenieros full-stack y diseñadores UX para posiciones permanentes en Santiago. Esta información se enviará al candidato vía WhatsApp.',
        icon: <FileText className="w-4 h-4" />,
        required: false,
        type: 'textarea',
        colSpan: true,
    },
]

const fadeUp = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
} as any

export default function RegistroManualPage() {
    const formRef = useRef<HTMLFormElement>(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{
        success: boolean
        message?: string
        entityId?: string | null
    } | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        setLoading(true)
        setResult(null)

        try {
            const companyName = (formData.get('company_name') as string)?.trim()
            if (!companyName) {
                setResult({ success: false, message: 'El nombre de la empresa es obligatorio.' })
                setLoading(false)
                return
            }

            const { empresaId } = await createEmpresa(formData)
            setResult({ success: true, entityId: empresaId })

            formRef.current?.reset()
        } catch (error: any) {
            setResult({ success: false, message: error.message || 'Error inesperado al guardar.' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black relative">
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] mix-blend-difference bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:4rem_4rem] -z-10" />

            <AdminNavbar />

            <main className="max-w-[1400px] mx-auto px-8 pt-32 pb-24">
                <motion.div
                    initial="initial"
                    animate="animate"
                    variants={{ animate: { transition: { staggerChildren: 0.07 } } }}
                    className="flex flex-col gap-10 lg:gap-12"
                >
                    {/* Header */}
                    <motion.div variants={fadeUp} className="space-y-2">
                        <p className="font-mono text-[10px] tracking-widest uppercase opacity-40">
                            Feria de Empleo · Registro Manual
                        </p>
                        <h2 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none">
                            Nueva<br /><span className="opacity-30">Empresa.</span>
                        </h2>
                    </motion.div>

                    {/* Formulario */}
                    <motion.form
                        ref={formRef}
                        variants={fadeUp}
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-10"
                        noValidate
                    >
                        {/* Fields */}
                        <div>
                            <p className="font-mono text-[10px] tracking-widest uppercase opacity-40 mb-4 border-b border-black/10 dark:border-white/10 pb-2">
                                — DATOS DE LA EMPRESA
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                {EMPRESA_FIELDS.map((field) => (
                                    <div key={field.id} className={`space-y-2 ${field.colSpan ? 'md:col-span-2' : ''}`}>
                                        <label
                                            htmlFor={field.id}
                                            className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase opacity-80"
                                        >
                                            {field.icon}
                                            {field.label}
                                            {field.required && (
                                                <span className="text-black dark:text-white opacity-100">*</span>
                                            )}
                                        </label>
                                        {field.type === 'select' ? (
                                            <select
                                                id={field.id}
                                                name={field.name}
                                                required={field.required}
                                                disabled={loading}
                                                className="w-full bg-transparent border border-black/20 dark:border-white/20 focus:border-black dark:focus:border-white outline-none py-4 px-4 font-mono text-sm tracking-widest transition-colors rounded-none disabled:opacity-40 cursor-pointer"
                                                defaultValue=""
                                            >
                                                <option value="" disabled className="text-black/50 dark:text-white/50">{field.placeholder}</option>
                                                {field.options?.map((opt, i) => (
                                                    <option key={i} value={opt} className="text-black bg-white dark:bg-[#050505] dark:text-white">
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : field.type === 'textarea' ? (
                                            <textarea
                                                id={field.id}
                                                name={field.name}
                                                placeholder={field.placeholder}
                                                disabled={loading}
                                                rows={3}
                                                className="w-full bg-transparent border border-black/20 dark:border-white/20 focus:border-black dark:focus:border-white outline-none py-4 px-4 font-mono text-sm tracking-wide transition-colors rounded-none disabled:opacity-40 resize-none"
                                            />
                                        ) : (
                                            <Input
                                                id={field.id}
                                                name={field.name}
                                                type={field.type}
                                                placeholder={field.placeholder}
                                                required={field.required}
                                                disabled={loading}
                                                autoComplete="off"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Feedback */}
                        <AnimatePresence mode="wait">
                            {result && (
                                <motion.div
                                    key={result.success ? 'success' : 'error'}
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className={`flex items-center gap-4 p-5 border ${result.success
                                        ? 'border-black/10 dark:border-white/10'
                                        : 'border-red-500/30 bg-red-500/5'
                                        }`}
                                >
                                    {result.success ? (
                                        <>
                                            <Check className="w-5 h-5 shrink-0" />
                                            <span className="font-mono text-xs uppercase tracking-widest flex-1">
                                                EMPRESA REGISTRADA EXITOSAMENTE.
                                                El formulario fue limpiado para un nuevo registro.
                                            </span>
                                            {result.entityId && (
                                                <Link
                                                    href={`/admin/empresas?id=${result.entityId}`}
                                                    className="inline-flex items-center gap-2 shrink-0 px-4 py-2 bg-black dark:bg-white text-white dark:text-black hover:opacity-75 transition-opacity font-mono text-[10px] uppercase tracking-widest font-bold whitespace-nowrap"
                                                >
                                                    <Store className="w-3 h-3" />
                                                    VER EMPRESA
                                                </Link>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                                            <span className="font-mono text-xs uppercase tracking-widest text-red-500 font-bold">
                                                ERROR: {result.message}
                                            </span>
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Botón submit */}
                        <div className="flex flex-col sm:flex-row gap-4 items-start">
                            <button
                                type="submit"
                                disabled={loading}
                                className="group inline-flex items-center justify-between gap-8 px-8 py-5 bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-900 dark:hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 w-full sm:w-auto"
                            >
                                <span className="font-mono text-sm tracking-widest uppercase font-bold">
                                    {loading ? 'GUARDANDO...' : 'REGISTRAR EMPRESA'}
                                </span>
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Building2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                )}
                            </button>

                            <Link
                                href="/admin/empresas"
                                className="inline-flex items-center gap-3 px-8 py-5 border border-black/20 dark:border-white/20 hover:border-black dark:hover:border-white hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200 font-mono text-sm tracking-widest uppercase"
                            >
                                Ver Todas las Empresas
                            </Link>
                        </div>
                    </motion.form>
                </motion.div>
            </main>
        </div>
    )
}
