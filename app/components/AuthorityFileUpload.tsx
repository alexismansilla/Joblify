'use client'

import { useState, useRef } from 'react'
import { uploadAuthorities } from '@/app/actions/authorities'
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AuthorityFileUpload() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{ success: boolean; count?: number; message?: string } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setLoading(true)
        setResult(null)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await uploadAuthorities(formData)
            setResult({ success: true, count: res.count })
            if (fileInputRef.current) fileInputRef.current.value = ''
        } catch (error: any) {
            setResult({ success: false, message: error.message || 'Error al procesar el archivo' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full">
            <div
                onClick={() => fileInputRef.current?.click()}
                className={`
                    relative group cursor-pointer border border-dashed border-black/20 dark:border-white/20 p-12
                    transition-colors duration-300 flex flex-col items-center justify-center gap-4
                    ${loading ? 'bg-black/5 dark:bg-white/5' : 'hover:bg-black/5 dark:hover:bg-white/5'}
                `}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleUpload}
                    disabled={loading}
                />

                <div className={`p-4 transition-opacity duration-300 ${loading ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'}`}>
                    {loading ? (
                        <div className="animate-spin h-8 w-8 border-2 border-black dark:border-white border-t-transparent rounded-full" />
                    ) : (
                        <Upload className="w-8 h-8" />
                    )}
                </div>

                <div className="text-center">
                    <p className="font-black text-xl tracking-tighter uppercase">
                        {loading ? 'Cargando...' : 'Importar Lista de Autoridades'}
                    </p>
                    <p className="font-mono text-[11px] tracking-widest uppercase opacity-50 mt-2">
                        Columnas requeridas: nombre · cargo · organización
                    </p>
                </div>
            </div>

            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`mt-4 p-5 border flex items-center gap-4 ${result.success
                                ? 'bg-transparent border-black/10 dark:border-white/10'
                                : 'bg-red-500/10 border-red-500/30'
                            }`}
                    >
                        {result.success
                            ? <CheckCircle2 className="w-5 h-5 shrink-0" />
                            : <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                        }
                        <span className={`font-mono text-xs uppercase tracking-widest ${result.success ? '' : 'text-red-500 font-bold'}`}>
                            {result.success
                                ? `${result.count} AUTORIDADES CARGADAS EXITOSAMENTE.`
                                : `ERROR: ${result.message}`
                            }
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
