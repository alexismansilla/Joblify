import { getMatchesReport } from '@/app/actions/contacts'
import { Zap, Activity, Users, Target } from 'lucide-react'
import AdminNavbar from '@/app/components/AdminNavbar'
// Forzamos rendering dinámico para que el dashboard siempre muestre datos frescos
export const dynamic = 'force-dynamic'

export default async function MatchesDashboard() {
    const report = await getMatchesReport()

    // Cálculos de métricas de Adopción
    const totalAttendees = report.length;
    const activeAttendees = report.filter((user: any) => user.matches && user.matches.length > 0).length;
    const adoptionRate = totalAttendees > 0 ? Math.round((activeAttendees / totalAttendees) * 100) : 0;
    const totalMatches = report.reduce((acc: any, user: any) => acc + (user.matches ? user.matches.length : 0), 0);

    const connectionTypesCount = report.reduce((acc: Record<string, number>, user: any) => {
        user.matches.forEach((m: any) => {
            const type = m.connection_type ? m.connection_type.toLowerCase() : 'no registrado';
            acc[type] = (acc[type] || 0) + 1;
        });
        return acc;
    }, { negocio: 0, mentoria: 0, casual: 0, 'no registrado': 0 });

    const sortedTopReport = [...report]
        .filter((user: any) => user.matches && user.matches.length > 0)
        .sort((a: any, b: any) => b.matches.length - a.matches.length)
        .slice(0, 10);

    return (
        <div className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black relative pb-24">
            {/* Minimalist Grid Pattern Background */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] mix-blend-difference bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:4rem_4rem] -z-10"></div>

            {/* Topbar flotante */}
            <AdminNavbar />

            <main className="max-w-[1400px] mx-auto px-8 pt-28 relative z-10">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-0 mb-20 border-y border-x md:border-x-0 border-black/10 dark:border-white/10 divide-y md:divide-y-0 md:divide-x divide-black/10 dark:divide-white/10 bg-white/50 dark:bg-black/50 backdrop-blur-sm">
                    {/* Tarjeta 1 */}
                    <div className="group relative p-12 hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-500 flex flex-col justify-between min-h-[250px]">
                        <div className="flex justify-between items-start">
                            <p className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-50 w-2/3">VOLUMEN DE CONEXIONES Y ENLACES</p>
                            <Users className="w-8 h-8 opacity-20" strokeWidth={1} />
                        </div>
                        <div className="flex flex-col gap-1 mt-8">
                            <div className="flex items-baseline gap-3">
                                <span className="text-8xl font-black tracking-tighter leading-none text-emerald-500/70 dark:text-emerald-400/70 transition-colors">
                                    {totalMatches}
                                </span>
                            </div>
                            <span className="font-mono text-[10px] tracking-widest uppercase opacity-40 mt-2">
                                INTERACCIONES TOTALES ACUMULADAS EN LA RED
                            </span>
                        </div>
                    </div>

                    {/* Tarjeta 2: Tasa de Adopción (Usuarios con interacciones) */}
                    <div className="group relative p-12 hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-500 flex flex-col justify-between min-h-[250px]">
                        <div className="flex justify-between items-start">
                            <p className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-50 w-2/3">TASA DE ADOPCIÓN (PARTICIPACIÓN ACTIVA)</p>
                            <Target className="w-8 h-8 opacity-20" strokeWidth={1} />
                        </div>
                        <div className="flex flex-col gap-1 mt-8">
                            <div className="flex items-baseline gap-3">
                                <span className="text-8xl font-black tracking-tighter leading-none text-amber-500/70 dark:text-amber-400/70 transition-colors">
                                    {adoptionRate}<span className="text-4xl text-black/50 dark:text-white/50">%</span>
                                </span>
                            </div>
                            <span className="font-mono text-[10px] tracking-widest uppercase opacity-40 mt-2">
                                {activeAttendees} de {totalAttendees} asistentes lograron al menos 1 enlace
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
                            {Object.entries(connectionTypesCount).map(([type, count]) => {
                                const percentage = totalMatches > 0 ? Math.round(((count as number) / totalMatches) * 100) : 0;
                                return (
                                    <div key={type} className="flex justify-between items-baseline border-b border-black/5 dark:border-white/5 pb-2 last:border-0 last:pb-0 group/stat">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-bold tracking-widest uppercase opacity-70">{type}</span>
                                            <span className="font-mono text-[10px] tracking-widest opacity-0 group-hover/stat:opacity-40 transition-opacity" title="Volumen bruto">({count as number})</span>
                                        </div>
                                        <span className="font-black text-4xl tracking-tighter text-purple-500/70 dark:text-purple-400/70 transition-colors">
                                            {percentage}<span className="text-xl opacity-50">%</span>
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

                <div className="mb-12">
                    <h3 className="text-3xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3 border-b border-black/10 dark:border-white/10 pb-4">
                        <span className="w-3 h-3 bg-black dark:bg-white animate-pulse"></span>
                        TOP 10 PERFILES CON MÁS CONEXIONES
                    </h3>

                    <div className="bg-transparent">
                        {sortedTopReport.length === 0 ? (
                            <div className="w-full p-12 border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 flex flex-col items-center justify-center min-h-[300px]">
                                <Users className="w-12 h-12 opacity-20 mb-4" strokeWidth={1} />
                                <p className="font-mono text-sm tracking-widest uppercase opacity-50 text-center">NO HAY ACTIVIDAD DE MATCHES REGISTRADA</p>
                            </div>
                        ) : (
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
                                                <td className="px-4 py-4 w-1/3 align-top border-r border-transparent transition-colors">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-black text-xl uppercase tracking-tighter">{user.name}</span>
                                                        <span className="text-[10px] font-mono tracking-widest uppercase opacity-50">{user.email || user.phone}</span>
                                                        {user.company && (
                                                            <span className="inline-block mt-2 px-2 py-0.5 bg-black/5 dark:bg-white/5 text-[10px] font-bold uppercase tracking-widest w-fit border border-black/10 dark:border-white/10">
                                                                {user.company}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center w-1/4 align-top border-r border-transparent transition-colors">
                                                    <div className="inline-flex flex-col items-center justify-center">
                                                        <span className={`text-5xl font-black tracking-tighter leading-none text-emerald-500/70 dark:text-emerald-400/70 transition-colors ${user.matches.length > 0 ? '' : 'opacity-20'}`}>
                                                            {user.matches.length}
                                                        </span>
                                                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest mt-2 opacity-50">MATCH REGISTRADOS</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 align-top">
                                                    <div className="flex flex-col gap-1.5">
                                                        {user.matches.length > 0 ? (
                                                            user.matches.slice(0, 5).map((match: any) => (
                                                                <div key={match.id} className="flex items-center justify-between px-3 py-1.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                                                                    <div className="flex items-center gap-2">
                                                                        {match.scanner ? (
                                                                            <div className="w-6 h-6 bg-black dark:bg-white flex items-center justify-center text-[10px] font-bold text-white dark:text-black font-mono">
                                                                                {match.scanner.name.charAt(0)}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="w-6 h-6 border border-black/20 dark:border-white/20 flex items-center justify-center text-[10px] font-bold opacity-50 font-mono">
                                                                                ?
                                                                            </div>
                                                                        )}
                                                                        <span className="font-bold text-xs tracking-tight uppercase">
                                                                            {match.scanner ? match.scanner.name : (match.scanner_phone || 'NO IDENTIFICADO')}
                                                                        </span>
                                                                    </div>
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
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
