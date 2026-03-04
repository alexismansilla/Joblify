'use client'

import { useState, useEffect } from 'react'
import { findContactByIdentifier, getContactById } from '@/app/actions/contacts'
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
            // ✅ Fix: Using Server Action instead of direct DB access
            const data = await getContactById(savedId);

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
                    className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-900 dark:hover:bg-zinc-100 transition-colors font-mono text-[10px] uppercase font-bold tracking-widest"
                >
                    <User className="w-4 h-4" />
                    <span>Enlazar Identidad</span>
                </button>

                {isModalOpen && (
                    <div className="fixed inset-0 bg-white/90 dark:bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                        <div className="bg-white dark:bg-[#050505] p-10 md:p-16 max-w-md w-full border border-black/10 dark:border-white/10 relative overflow-hidden text-black dark:text-white">
                            <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-2 leading-none">Acreditación<br />Manual</h2>
                            <p className="font-mono text-[10px] uppercase tracking-widest opacity-50 mb-12">Portal de Identificación para impresión de Credenciales.</p>

                            <form onSubmit={handleLogin} className="space-y-8">
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-mono tracking-widest uppercase opacity-60">
                                        01 // DATA O TELEMETRÍA (EMAIL/PHONE)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej: 912345678"
                                        autoFocus
                                        className="w-full bg-transparent border-b-2 border-black/20 dark:border-white/20 focus:border-black dark:focus:border-white outline-none py-4 text-3xl font-black tracking-tight transition-colors placeholder:opacity-20 rounded-none uppercase"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-4">
                                    <button
                                        type="submit"
                                        disabled={checking}
                                        className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-mono text-xs uppercase font-bold tracking-widest flex items-center justify-between hover:bg-zinc-900 dark:hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed group transition-all duration-300"
                                    >
                                        <span className="flex-1 text-center">
                                            {checking ? 'VERIFICANDO...' : 'AUTORIZAR ACCESO'}
                                        </span>
                                        {checking && <Loader2 className="w-4 h-4 mr-4 animate-spin absolute right-0" />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="w-full py-4 bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white font-mono text-[10px] font-bold uppercase tracking-widest hover:opacity-50 transition-opacity"
                                    >
                                        ABORTAR
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
        <div className="flex items-center gap-4 border border-black/10 dark:border-white/10 px-4 py-2 bg-black/5 dark:bg-white/5">
            <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-black dark:bg-white animate-pulse"></div>
                <div className="flex flex-col items-start leading-[1.1]">
                    <span className="text-[9px] font-mono uppercase font-bold tracking-[0.2em] opacity-50 mb-0.5">Operador Activo</span>
                    <span className="text-xs font-black uppercase tracking-tighter truncate max-w-[120px]">{user.name}</span>
                </div>
            </div>

            <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-1"></div>

            <button
                onClick={logout}
                className="p-1.5 opacity-40 hover:opacity-100 transition-opacity"
                title="Desconectar"
            >
                <LogOut className="w-4 h-4" />
            </button>
        </div>
    )
}
