import { getMatchesReport } from '@/app/actions/contacts'
import { Users, Zap, Calendar, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function MatchesDashboard() {
    const report = await getMatchesReport()

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-20">
            <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-black/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Volver al Inicio</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">M</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Análisis de Matches</h1>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <header className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-bold mb-4">
                        <Zap className="w-4 h-4" />
                        ESTADÍSTICAS
                    </div>
                    <h2 className="text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                        Panel de Conexiones
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-lg max-w-2xl">
                        Rastrea la interacción y actividad de networking por cada contacto generado mediante QR.
                    </p>
                </header>

                <div className="grid grid-cols-1 gap-8">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                                        <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Perfil de Usuario</th>
                                        <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-center">Total Matches</th>
                                        <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Última Actividad</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                    {report.map((user: any) => (
                                        <tr key={user.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors align-top">
                                            <td className="px-6 py-6 w-1/3">
                                                <div>
                                                    <p className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{user.name}</p>
                                                    <p className="text-sm text-zinc-500">{user.email || user.phone}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-center w-1/4">
                                                <span className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl font-bold text-xl ${user.matches.length > 0
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                                        : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800'
                                                    }`}>
                                                    {user.matches.length}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="space-y-2">
                                                    {user.matches.length > 0 ? (
                                                        user.matches.slice(0, 5).map((match: any) => (
                                                            <div key={match.id} className="flex items-center justify-between text-sm py-1 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                                                                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                                                    {match.scanner ? `👤 ${match.scanner.name}` : '🌐 Invitado (Anónimo)'}
                                                                </span>
                                                                <span className="text-xs text-zinc-400">
                                                                    {new Date(match.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                                </span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span className="text-zinc-400 italic">Sin actividad aún</span>
                                                    )}
                                                    {user.matches.length > 5 && (
                                                        <p className="text-xs text-indigo-500 font-medium">Y {user.matches.length - 5} conexiones más...</p>
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
