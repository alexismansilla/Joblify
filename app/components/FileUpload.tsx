'use client'

import { useState, useRef } from 'react'
import { uploadContacts } from '@/app/actions/contacts'
import { Upload, FileUp, CheckCircle2, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function FileUpload() {
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
            const res = await uploadContacts(formData)
            setResult({ success: true, count: res.count })
            if (fileInputRef.current) fileInputRef.current.value = ''
        } catch (error: any) {
            setResult({ success: false, message: error.message || 'Error al procesar el archivo Excel' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full">
            <div
                onClick={() => fileInputRef.current?.click()}
                className={`
          relative group cursor-pointer border-2 border-dashed rounded-3xl p-10 
          transition-all duration-300 flex flex-col items-center justify-center gap-4
          ${loading ? 'border-zinc-300 bg-zinc-50' : 'border-zinc-200 hover:border-indigo-500 hover:bg-indigo-50/10'}
          dark:border-zinc-800 dark:hover:border-indigo-400
        `}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".xlsx, .xls"
                    onChange={handleUpload}
                    disabled={loading}
                />

                <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                    {loading ? (
                        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
                    ) : (
                        <Upload className="w-8 h-8 text-zinc-600 dark:text-zinc-400 group-hover:text-indigo-600" />
                    )}
                </div>

                <div className="text-center">
                    <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                        {loading ? 'Subiendo...' : 'Cargar Archivo Excel'}
                    </p>
                    <p className="text-sm text-zinc-500 mt-1">Haz clic o arrastra tu archivo .xlsx</p>
                </div>
            </div>

            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${result.success ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20' : 'bg-red-50 text-red-700 dark:bg-red-900/20'
                            }`}
                    >
                        {result.success ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="font-medium text-sm">
                            {result.success ? `¡Éxito! Se cargaron ${result.count} registros.` : result.message}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
