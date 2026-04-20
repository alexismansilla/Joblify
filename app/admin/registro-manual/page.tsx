'use client'

import { useState, useRef, useActionState } from 'react'
import { createContact } from '@/app/actions/contacts'
import { ArrowLeft, UserPlus, Check, AlertCircle, Loader2, User, Hash, Mail, Phone, Building2, Briefcase, ExternalLink } from 'lucide-react'
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
}

const FIELDS: FieldConfig[] = [
    {
        id: 'rut',
        name: 'rut',
        label: '01 // RUT / DNI / PASAPORTE',
        placeholder: 'Ej: 12345678-9',
        icon: <Hash className="w-4 h-4" />,
        required: false,
        type: 'text',
    },
    {
        id: 'first_name',
        name: 'first_name',
        label: '02 // NOMBRES',
        placeholder: 'Ej: Juan Andrés',
        icon: <User className="w-4 h-4" />,
        required: true,
        type: 'text',
    },
    {
        id: 'last_name',
        name: 'last_name',
        label: '03 // APELLIDOS',
        placeholder: 'Ej: Pérez González',
        icon: <User className="w-4 h-4" />,
        required: true,
        type: 'text',
    },
    {
        id: 'phone',
        name: 'phone',
        label: '04 // TELÉFONO MÓVIL',
        placeholder: 'Ej: +56912345678',
        icon: <Phone className="w-4 h-4" />,
        required: false,
        type: 'tel',
    },
    {
        id: 'company',
        name: 'company',
        label: '05 // EMPRESA U ORGANIZACIÓN',
        placeholder: 'Ej: Acme Corp',
        icon: <Building2 className="w-4 h-4" />,
        required: true,
        type: 'text',
    },
    {
        id: 'position',
        name: 'position',
        label: '06 // CARGO',
        placeholder: 'Ej: Gerente de Innovación',
        icon: <Briefcase className="w-4 h-4" />,
        required: false,
        type: 'text',
    },
    {
        id: 'profile',
        name: 'profile',
        label: '07 // PERFIL PROFESIONAL',
        placeholder: 'Selecciona Opción',
        icon: <User className="w-4 h-4" />,
        required: false,
        type: 'select',
        options: [
            'Startup o emprendedor',
            'Gremio - Gran empresa - Corporativo',
            'Sector Publico',
            'Academia',
            'Ecosistema',
            'Publico general'
        ]
    },
    {
        id: 'industry',
        name: 'industry',
        label: '08 // INDUSTRIA PRINCIPAL',
        placeholder: 'Ej: Tecnología',
        icon: <Briefcase className="w-4 h-4" />,
        required: false,
        type: 'text',
    },
    {
        id: 'email',
        name: 'email',
        label: '09 // E-MAIL',
        placeholder: 'Ej: alan.turing@empresa.com',
        icon: <Mail className="w-4 h-4" />,
        required: false,
        type: 'email',
    },
]

const fadeUp = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
} as any

export default function RegistroManualPage() {
    const formRef = useRef<HTMLFormElement>(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{ success: boolean; message?: string; contactId?: string | null } | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        // Early return: validar campos requeridos
        const firstName = (formData.get('first_name') as string)?.trim()
        const lastName = (formData.get('last_name') as string)?.trim()
        const company = (formData.get('company') as string)?.trim()

        if (!firstName || !lastName || !company) {
            setResult({ success: false, message: 'Nombres, Apellidos y Empresa son campos obligatorios.' })
            return
        }

        setLoading(true)
        setResult(null)

        try {
            const { contactId } = await createContact(formData)
            setResult({ success: true, contactId })
            formRef.current?.reset()
        } catch (error: any) {
            setResult({ success: false, message: error.message || 'Error inesperado al guardar.' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black relative">
            {/* Grilla de fondo */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] mix-blend-difference bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:4rem_4rem] -z-10" />

            {/* Navbar */}
            <AdminNavbar />

            {/* Contenido */}
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
                            Connectify · Registro Manual
                        </p>
                        <h2 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none">
                            Nuevo<br /><span className="opacity-30">Asistente.</span>
                        </h2>
                        <p className="font-mono text-xs tracking-widest uppercase opacity-50 pt-2">
                            Nombre, Apellidos y Emresa son obligatorios. El QR se genera automáticamente.
                        </p>
                    </motion.div>

                    {/* Formulario */}
                    <motion.form
                        ref={formRef}
                        variants={fadeUp}
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-10"
                        noValidate
                    >
                        {/* Campos (Layout en 2 columnas p/ optimizar espacio) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            {FIELDS.map((field) => (
                                <div key={field.id} className="space-y-2">
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
                                                ASISTENTE REGISTRADO EXITOSAMENTE. El formulario fue limpiado para un nuevo registro.
                                            </span>
                                            {result.contactId && (
                                                <Link
                                                    href={`/admin/contactos/${result.contactId}`}
                                                    className="inline-flex items-center gap-2 shrink-0 px-4 py-2 bg-black dark:bg-white text-white dark:text-black hover:opacity-75 transition-opacity font-mono text-[10px] uppercase tracking-widest font-bold whitespace-nowrap"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    VER CREDENCIAL
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
                                    {loading ? 'GUARDANDO...' : 'REGISTRAR ASISTENTE'}
                                </span>
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                )}
                            </button>

                            <Link
                                href="/admin"
                                className="inline-flex items-center gap-3 px-8 py-5 border border-black/20 dark:border-white/20 hover:border-black dark:hover:border-white hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200 font-mono text-sm tracking-widest uppercase"
                            >
                                Ver Todos los Asistentes
                            </Link>
                        </div>
                    </motion.form>
                </motion.div>
            </main>
        </div>
    )
}
