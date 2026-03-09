import { getAuthorities } from '@/app/actions/authorities'
import AuthorityFileUpload from '@/app/components/AuthorityFileUpload'
import AuthorityTable from '@/app/components/AuthorityTable'
import { ShieldCheck, ArrowLeft, Activity } from 'lucide-react'
import Link from 'next/link'

// Siempre dinámico: la lista debe reflejar los últimos cambios en tiempo real
export const dynamic = 'force-dynamic'

export default async function AutoridadesPage() {
    const authorities = await getAuthorities()

    return (
        <div className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black relative">
            {/* Fondo de grilla sutil */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] mix-blend-difference bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:4rem_4rem] -z-10" />

            {/* Navbar */}
            <nav className="fixed top-0 inset-x-0 h-20 border-b border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-md z-50 transition-colors">
                <div className="max-w-[1400px] mx-auto px-8 h-full flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link
                            href="/admin"
                            className="inline-flex items-center gap-2 hover:opacity-50 transition-opacity"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="font-mono text-xs tracking-widest uppercase font-bold">Admin</span>
                        </Link>

                        <div className="w-px h-5 bg-black/20 dark:bg-white/20" />

                        <div className="flex items-center gap-3">
                            <ShieldCheck className="w-4 h-4 opacity-70" />
                            <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase leading-none flex flex-col">
                                Autoridades
                                <span className="text-[10px] font-mono tracking-widest opacity-50">ACREDITACIÓN SIN QR</span>
                            </h1>
                        </div>
                    </div>

                    <Link
                        href="/matches"
                        className="hidden md:flex items-center gap-2 hover:opacity-50 transition-opacity"
                    >
                        <Activity className="w-4 h-4" />
                        <span className="font-mono text-xs font-bold tracking-widest uppercase">Métricas</span>
                    </Link>
                </div>
            </nav>

            <main className="max-w-[1400px] mx-auto px-8 pt-28 pb-24 relative">

                {/* Sección: Upload */}
                <section className="mb-12 relative z-10">
                    <div className="mb-6">
                        <p className="font-mono text-[10px] tracking-widest uppercase opacity-40">
                            01 // IMPORTAR LISTA
                        </p>
                        <h2 className="text-2xl font-black tracking-tighter uppercase mt-1">
                            Cargar Archivo
                        </h2>
                        <p className="font-mono text-xs opacity-50 mt-2 tracking-wider">
                            Formato esperado: columnas <strong>nombre</strong>, <strong>cargo</strong>, <strong>organización</strong>
                        </p>
                    </div>
                    <AuthorityFileUpload />
                </section>

                {/* Divisor */}
                <div className="h-px bg-black/10 dark:bg-white/10 mb-12" />

                {/* Sección: Lista */}
                <section className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-black/10 dark:border-white/10 gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <p className="font-mono text-[10px] tracking-widest uppercase opacity-40">
                                    02 // DIRECTORIO ACTIVO
                                </p>
                                <h3 className="text-3xl font-black tracking-tighter uppercase mt-1">
                                    Autoridades Registradas
                                </h3>
                                <p className="font-mono text-[10px] tracking-widest uppercase opacity-50 mt-1 flex items-center gap-2">
                                    <ShieldCheck className="w-3 h-3" /> Sin QR · Solo Credencial de Nombre y Cargo
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col items-start md:items-end">
                            <span className="text-5xl font-black leading-none tracking-tighter">
                                {authorities.length}
                            </span>
                            <span className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-50 mt-1">
                                Total Autoridades
                            </span>
                        </div>
                    </div>

                    {authorities.length > 0 ? (
                        <AuthorityTable authorities={authorities} />
                    ) : (
                        <div className="border border-dashed border-black/20 dark:border-white/20 p-16 text-center">
                            <div className="w-16 h-16 rounded-none border border-black/10 dark:border-white/10 flex items-center justify-center mx-auto mb-6">
                                <ShieldCheck className="w-8 h-8 opacity-30" />
                            </div>
                            <p className="font-black text-xl uppercase tracking-tighter">SIN AUTORIDADES CARGADAS</p>
                            <p className="font-mono text-xs mt-2 uppercase tracking-widest opacity-50">
                                Importa un archivo para comenzar
                            </p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    )
}
