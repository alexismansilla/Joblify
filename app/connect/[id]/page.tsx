'use client'

import { useState, useEffect, use } from 'react'
import { registerMatch, getContactById } from '@/app/actions/contacts'
import { Building2, Loader2 } from 'lucide-react'

interface Props {
    params: Promise<{ id: string }>
}

export default function ConnectPage({ params }: Props) {
    const { id } = use(params)
    const [loading, setLoading] = useState(true)
    const [contact, setContact] = useState<any>(null)
    const [isConnecting, setIsConnecting] = useState(false)

    useEffect(() => {
        const init = async () => {
            const data = await getContactById(id);
            setContact(data)
            setLoading(false)
        }
        init()
    }, [id])

    const handleConnect = async () => {
        setIsConnecting(true)
        await registerMatch(id, undefined)

        if (contact) {
            // Redirigir al número del negocio con el @token para que el webhook procese el match
            const targetPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUM_BUSINESS?.replace(/\D/g, '') || ''
            const msg = encodeURIComponent(`Hola! Conecté con @${contact.qr_token}`)
            window.location.href = `https://wa.me/${targetPhone}?text=${msg}`
        }
    }

    if (loading || !contact) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black p-6">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-10 border border-zinc-200 dark:border-zinc-800 shadow-2xl text-center">
                <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-8 text-indigo-600">
                    <Building2 className="w-12 h-12" />
                </div>

                <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight">
                    Registrando tu interés
                </h1>

                <p className="text-zinc-500 dark:text-zinc-400 text-lg mb-3 leading-relaxed">
                    Estás por conectar con
                </p>
                <p className="text-zinc-900 dark:text-zinc-100 font-extrabold text-2xl mb-2">
                    {contact.company || contact.name}
                </p>
                {contact.opportunity_description && (
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8 leading-relaxed">
                        {contact.opportunity_description}
                    </p>
                )}
                {!contact.opportunity_description && (
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8 leading-relaxed">
                        Recibirás información de esta empresa vía WhatsApp
                    </p>
                )}

                <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 dark:shadow-none active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                    {isConnecting ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                        <>
                            <span>Registrar interés vía WhatsApp</span>
                            <Building2 className="w-6 h-6" />
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
