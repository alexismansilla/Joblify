'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { findContactByIdentifier } from '@/app/actions/contacts'
import { User, LogOut, Loader2, Smartphone } from 'lucide-react'

export default function IdentityStatus() {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [identifier, setIdentifier] = useState('')
    const [checking, setChecking] = useState(false)

    const checkIdentity = async () => {
        const savedId = localStorage.getItem('connectify_user_id')
        if (savedId) {
            const { data } = await supabase
                .from('contacts')
                .select('id, name')
                .eq('id', savedId)
                .single()

            if (data) setUser(data)
            else localStorage.removeItem('connectify_user_id')
        }
        setLoading(false)
    }

    useEffect(() => {
        checkIdentity()
    }, [])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setChecking(true)
        const foundUser = await findContactByIdentifier(identifier)

        if (foundUser) {
            localStorage.setItem('connectify_user_id', foundUser.id)
            setUser(foundUser)
            setIsModalOpen(false)
            window.location.reload()
        } else {
            alert('Contacto no encontrado en la base de datos.')
        }
        setChecking(false)
    }

    const logout = () => {
        localStorage.removeItem('connectify_user_id')
        setUser(null)
        window.location.reload()
    }

    if (loading) return null

    if (!user) {
        return (
            <>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl text-sm font-medium border border-amber-100 dark:border-amber-900/30 hover:bg-amber-100 transition-colors"
                >
                    <User className="w-4 h-4" />
                    <span>Configurar Mi Perfil</span>
                </button>

                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-zinc-200 dark:border-zinc-800">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6 text-indigo-600">
                                <Smartphone className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold mb-2">Identifícate</h2>
                            <p className="text-sm text-zinc-500 mb-6">Ingresa tu correo o teléfono para que la app sepa que eres tú el scanner.</p>

                            <form onSubmit={handleLogin} className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Email o Teléfono"
                                    autoFocus
                                    className="w-full px-5 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    required
                                />
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-zinc-500 font-medium">Cancelar</button>
                                    <button
                                        type="submit"
                                        disabled={checking}
                                        className="flex-[2] py-3 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {checking && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Confirmar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </>
        )
    }

    return (
        <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800/50 px-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-700">
            <div className="flex flex-col items-end leading-tight">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">Identidad Activa</span>
                <span className="text-sm font-bold text-zinc-900 dark:text-white">{user.name}</span>
            </div>
            <button
                onClick={logout}
                className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors bg-white dark:bg-zinc-900 rounded-lg shadow-sm"
            >
                <LogOut className="w-4 h-4" />
            </button>
        </div>
    )
}
