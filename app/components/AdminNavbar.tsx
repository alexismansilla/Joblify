'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, LayoutGrid, UserPlus, ShieldCheck, Activity } from 'lucide-react'

const NAV_LINKS = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/admin', label: 'Admin', icon: LayoutGrid },
    { href: '/admin/registro-manual', label: 'Registro', icon: UserPlus },
    { href: '/admin/autoridades', label: 'Autoridades', icon: ShieldCheck },
    { href: '/matches', label: 'Métricas', icon: Activity },
]

export default function AdminNavbar() {
    const pathname = usePathname()

    return (
        <nav className="fixed top-0 inset-x-0 h-20 border-b border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-md z-50 transition-colors">
            <div className="max-w-[1400px] mx-auto px-6 md:px-8 h-full flex flex-row items-center justify-between gap-4">
                
                {/* Brand / Logo */}
                <div className="flex items-center gap-4 shrink-0">
                    <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase leading-none flex flex-col">
                        Connectify<span className="text-[10px] font-mono tracking-widest opacity-50">ADMIN DASHBOARD</span>
                    </h1>
                </div>

                {/* Navigation Links */}
                <div className="flex items-center gap-6 overflow-x-auto no-scrollbar mask-edges pb-1">
                    {NAV_LINKS.map((link) => {
                        const Icon = link.icon
                        const isActive = pathname === link.href
                        
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-2 group transition-all shrink-0 border-b-2 pt-1 ${
                                    isActive 
                                    ? 'opacity-100 border-black dark:border-white' 
                                    : 'opacity-40 hover:opacity-100 border-transparent'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="font-mono text-xs font-bold tracking-widest uppercase">{link.label}</span>
                            </Link>
                        )
                    })}
                </div>

            </div>
        </nav>
    )
}
