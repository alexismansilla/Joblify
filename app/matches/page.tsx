import { getMatchesReport } from '@/app/actions/contacts'
import { Zap, ArrowLeft, Activity, Users, Target } from 'lucide-react'
import Link from 'next/link'

export default async function MatchesDashboard() {
    const report = await getMatchesReport()

    // Cálculos de métricas
    const totalMatches = report.reduce((acc: any, user: any) => acc + user.matches.length, 0);
    const identifiedMatches = report.reduce((acc: any, user: any) => acc + user.matches.filter((m: any) => m.scanner_id).length, 0);
    const identityRate = totalMatches > 0 ? Math.round((identifiedMatches / totalMatches) * 100) : 0;

    const connectionTypesCount = report.reduce((acc: Record<string, number>, user: any) => {
        user.matches.forEach((m: any) => {
            const type = m.connection_type ? m.connection_type.toLowerCase() : 'no registrado';
            acc[type] = (acc[type] || 0) + 1;
        });
        return acc;
    }, { negocio: 0, mentoria: 0, casual: 0, 'no registrado': 0 });

    const sortedTopReport = [...report]
        .sort((a: any, b: any) => b.matches.length - a.matches.length)
        .slice(0, 10);

    return (
        <div className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black relative pb-24">
            {/* Minimalist Grid Pattern Background */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] mix-blend-difference bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:4rem_4rem] -z-10"></div>

            {/* Topbar flotante */}
            <nav className="fixed top-0 inset-x-0 h-20 border-b border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-md z-50 transition-colors">
                <div className="max-w-[1400px] mx-auto px-8 h-full flex items-center justify-between">
                    <Link
                        href="/admin"
                        className="group flex items-center gap-3 px-5 py-2.5 hover:opacity-50 transition-opacity"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-mono text-xs font-bold tracking-widest uppercase">Volver al Dashboard</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase leading-none flex flex-col items-end">
                            Connectify<span className="text-[10px] font-mono tracking-widest opacity-50">ANALYTICS ENGINE</span>
                        </h1>
                        <div className="w-10 h-10 border border-black/10 dark:border-white/10 flex items-center justify-center bg-black/5 dark:bg-white/5">
                            <Activity className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-[1400px] mx-auto px-8 pt-28 relative z-10">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-0 mb-20 border-y border-x md:border-x-0 border-black/10 dark:border-white/10 divide-y md:divide-y-0 md:divide-x divide-black/10 dark:divide-white/10 bg-white/50 dark:bg-black/50 backdrop-blur-sm">
                    {/* Tarjeta 1 */}
                    <div className="group relative p-12 hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-500 flex flex-col justify-between min-h-[250px]">
                        <div className="flex justify-between items-start">
                            <p className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-50 w-2/3">VOLUMEN DE CONEXIONES Y ENLACES</p>
                            <Users className="w-8 h-8 opacity-20" strokeWidth={1} />
                        </div>
                        <div className="flex items-baseline gap-3 mt-8">
                            <span className="text-8xl font-black tracking-tighter leading-none text-emerald-500/70 dark:text-emerald-400/70 transition-colors">
                                {totalMatches}
                            </span>
                        </div>
                    </div>

                    {/* Tarjeta 2 */}
                    <div className="group relative p-12 hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-500 flex flex-col justify-between min-h-[250px]">
                        <div className="flex justify-between items-start">
                            <p className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-50 w-2/3">TASA DE IDENTIDAD VERIFICADA</p>
                            <Target className="w-8 h-8 opacity-20" strokeWidth={1} />
                        </div>
                        <div className="flex items-baseline gap-3 mt-8">
                            <span className="text-8xl font-black tracking-tighter leading-none text-amber-500/70 dark:text-amber-400/70 transition-colors">
                                {identityRate}<span className="text-4xl text-black/50 dark:text-white/50">%</span>
                            </span>
                        </div>
                    </div>

                    {/* Tarjeta 3: Tipos de Vínculo */}
                    <div className="group relative p-12 hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-500 flex flex-col justify-between min-h-[250px]">
                        <div className="flex justify-between items-start">
                            <p className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-50 w-2/3">TIPOS DE VÍNCULO</p>
                            <Zap className="w-8 h-8 opacity-20" strokeWidth={1} />
                        </div>
                        <div className="flex flex-col gap-4 mt-8">
                            {Object.entries(connectionTypesCount).map(([type, count]) => (
                                <div key={type} className="flex justify-between items-baseline border-b border-black/5 dark:border-white/5 pb-2 last:border-0 last:pb-0">
                                    <span className="font-mono text-xs font-bold tracking-widest uppercase opacity-70">{type}</span>
                                    <span className="font-black text-4xl tracking-tighter text-purple-500/70 dark:text-purple-400/70 transition-colors">{count as number}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                <div className="mb-12">
                    <h3 className="text-3xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3 border-b border-black/10 dark:border-white/10 pb-4">
                        <span className="w-3 h-3 bg-black dark:bg-white animate-pulse"></span>
                        TOP 10 PERFILES CON MÁS CONEXIONES
                    </h3>

                    <div className="bg-transparent">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="border-b border-black/10 dark:border-white/10">
                                        <th className="px-6 py-6 font-mono text-[10px] uppercase tracking-widest opacity-50">IDENTIDAD</th>
                                        <th className="px-6 py-6 font-mono text-[10px] uppercase tracking-widest opacity-50 text-center">FRECUENCIA DE ENLACE</th>
                                        <th className="px-6 py-6 font-mono text-[10px] uppercase tracking-widest opacity-50">TRAZA DE ACTIVIDAD HISTÓRICA</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/10 dark:divide-white/10">
                                    {sortedTopReport.map((user: any) => (
                                        <tr key={user.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-8 w-1/3 align-top border-r border-transparent transition-colors">
                                                <div className="flex flex-col gap-2">
                                                    <span className="font-black text-2xl uppercase tracking-tighter">{user.name}</span>
                                                    <span className="text-xs font-mono tracking-widest uppercase opacity-50">{user.email || user.phone}</span>
                                                    {user.company && (
                                                        <span className="inline-block mt-4 px-3 py-1 bg-black/5 dark:bg-white/5 text-xs font-bold uppercase tracking-widest w-fit border border-black/10 dark:border-white/10">
                                                            {user.company}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-8 text-center w-1/4 align-top border-r border-transparent transition-colors">
                                                <div className="inline-flex flex-col items-center justify-center pt-2">
                                                    <span className={`text-6xl font-black tracking-tighter leading-none text-emerald-500/70 dark:text-emerald-400/70 transition-colors ${user.matches.length > 0 ? '' : 'opacity-20'}`}>
                                                        {user.matches.length}
                                                    </span>
                                                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest mt-3 opacity-50">MATCH REGISTRADOS</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8 align-top">
                                                <div className="flex flex-col gap-3">
                                                    {user.matches.length > 0 ? (
                                                        user.matches.slice(0, 5).map((match: any) => (
                                                            <div key={match.id} className="flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                                                                <div className="flex items-center gap-3">
                                                                    {match.scanner ? (
                                                                        <div className="w-8 h-8 bg-black dark:bg-white flex items-center justify-center text-xs font-bold text-white dark:text-black font-mono">
                                                                            {match.scanner.name.charAt(0)}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-8 h-8 border border-black/20 dark:border-white/20 flex items-center justify-center text-xs font-bold opacity-50 font-mono">
                                                                            ?
                                                                        </div>
                                                                    )}
                                                                    <span className="font-bold text-sm tracking-tight uppercase">
                                                                        {match.scanner ? match.scanner.name : 'NO IDENTIFICADO'}
                                                                    </span>
                                                                </div>
                                                                <span className="text-[10px] font-mono tracking-widest opacity-60">
                                                                    {new Date(match.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="h-full py-6 flex items-center text-xs font-mono uppercase tracking-widest opacity-40">
                                                            [ VACÍO ] NO SE ENCONTRÓ ACTIVIDAD
                                                        </div>
                                                    )}
                                                    {user.matches.length > 5 && (
                                                        <div className="text-center w-full py-3 border border-dashed border-black/20 dark:border-white/20 text-[10px] font-mono font-bold uppercase tracking-widest cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                                            + {user.matches.length - 5} REGISTROS OCULTOS
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
