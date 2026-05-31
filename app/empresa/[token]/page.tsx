'use client'

import { useState, useEffect, use, useMemo, useCallback, useRef } from 'react'
import { getEmpresaByToken, getLeadsForEmpresa, updateLeadStatus } from '@/app/actions/empresas'
import { Users, Download, Building2, Loader2, TrendingUp, Filter, Phone, Sparkles, Circle, Check, Star, X, QrCode } from 'lucide-react'
import QRCode from 'qrcode'

interface ScannerData {
    name: string | null
    profile: string | null
    experience_level: string | null
    job_search_type: string | null
}

interface Lead {
    id: string
    created_at: string
    connection_type: string | null
    candidato_phone: string | null
    candidato: {
        id: string
        name: string
        email: string | null
        phone: string | null
        profile: string | null
        experience_level: string | null
        job_search_type: string | null
    } | null
    scanner_name: string | null
    scanner_profile: string | null
    scanner_experience_level: string | null
    scanner_job_search_type: string | null
    scanner_email: string | null
    lead_status: string | null
}

interface EmpresaData {
    id: string
    name: string
    company: string | null
    position: string | null
    industry: string | null
    opportunity_description: string | null
    job_search_type: string | null
    plan: string | null
}

const INTEREST_LABELS: Record<string, string> = {
    negocio: 'Muy interesado',
    mentoria: 'Quiere más info',
    casual: 'Solo explorando',
}

const INTEREST_BADGES: Record<string, { label: string; priority: number; color: string; bg: string }> = {
    negocio: {
        label: '🔥 Alta prioridad',
        priority: 3,
        color: 'text-emerald-700 dark:text-emerald-300',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    },
    mentoria: {
        label: '📋 Prioridad media',
        priority: 2,
        color: 'text-amber-700 dark:text-amber-300',
        bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    },
    casual: {
        label: '👀 Prioridad baja',
        priority: 1,
        color: 'text-zinc-500 dark:text-zinc-400',
        bg: 'bg-zinc-50 dark:bg-zinc-800/20 border-zinc-200 dark:border-zinc-700',
    },
}

function getCandidateName(lead: Lead): string {
    return lead.scanner_name || lead.candidato?.name || 'Anónimo'
}

function getCandidateProfile(lead: Lead): string | null {
    return lead.scanner_profile || lead.candidato?.profile || null
}

function getCandidateExperience(lead: Lead): string | null {
    return lead.scanner_experience_level || lead.candidato?.experience_level || null
}

function getCandidateSearchType(lead: Lead): string | null {
    return lead.scanner_job_search_type || lead.candidato?.job_search_type || null
}

function getCandidatePhone(lead: Lead): string | null {
    return lead.candidato_phone || lead.candidato?.phone || null
}

function hasProfileData(lead: Lead): boolean {
    return !!(getCandidateName(lead) !== 'Anónimo' || getCandidateProfile(lead) || getCandidateExperience(lead))
}

function relevanceScore(lead: Lead): number {
    const interest = INTEREST_BADGES[lead.connection_type || '']
    const baseScore = interest?.priority || 0
    const profileBonus = hasProfileData(lead) ? 1 : 0
    return baseScore * 10 + profileBonus
}

function sortLeads(leads: Lead[]): Lead[] {
    return [...leads].sort((a, b) => {
        const scoreA = relevanceScore(a)
        const scoreB = relevanceScore(b)
        if (scoreA !== scoreB) return scoreB - scoreA
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
}

const LEAD_STATUS_TABS = [
    { value: '', label: 'Todos', icon: '📋' },
    { value: 'pending', label: 'Pendientes', icon: '⏳' },
    { value: 'contacted', label: 'Contactados', icon: '✅' },
    { value: 'highlighted', label: 'Destacados', icon: '⭐' },
    { value: 'dismissed', label: 'Descartados', icon: '❌' },
]

function playNotificationChime() {
    try {
        const ctx = new AudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(880, ctx.currentTime)
        osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.08)
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.4)
    } catch {
        // Audio not available
    }
}

const POLL_INTERVAL = 5000

export default function EmpresaPortal({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params)
    const [company, setCompany] = useState<EmpresaData | null>(null)
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [newLeadIds, setNewLeadIds] = useState<Set<string>>(new Set())
    const prevCountRef = useRef(0)

    const [filterArea, setFilterArea] = useState('')
    const [filterExperience, setFilterExperience] = useState('')
    const [filterSearchType, setFilterSearchType] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [actionLoading, setActionLoading] = useState<Set<string>>(new Set())
    const [qrUrl, setQrUrl] = useState<string | null>(null)
    const [showQr, setShowQr] = useState(false)

    const fetchData = useCallback(async () => {
        if (!company) return
        const leadsData = await getLeadsForEmpresa(company.id)
        const typedLeads = leadsData as unknown as Lead[]
        setLeads(prev => {
            if (prev.length > 0 && typedLeads.length > prev.length) {
                const newIds = new Set(typedLeads.slice(0, typedLeads.length - prev.length).map(l => l.id))
                setNewLeadIds(newIds)
                // Play sound if any new lead is high priority
                const hasHighPriority = typedLeads.slice(0, typedLeads.length - prev.length).some(
                    l => (INTEREST_BADGES[l.connection_type || '']?.priority || 0) >= 3
                )
                if (hasHighPriority) playNotificationChime()
                setTimeout(() => setNewLeadIds(new Set()), 3000)
            }
            return typedLeads
        })
    }, [company])

    // Initial load
    useEffect(() => {
        const init = async () => {
            const companyData = await getEmpresaByToken(token)
            if (!companyData) {
                setNotFound(true)
                setLoading(false)
                return
            }
            setCompany(companyData as EmpresaData)
            const leadsData = await getLeadsForEmpresa(companyData.id)
            setLeads(leadsData as unknown as Lead[])
            setLoading(false)
        }
        init()
    }, [token])

    // Live polling every 5s
    useEffect(() => {
        if (!company || notFound) return
        const interval = setInterval(fetchData, POLL_INTERVAL)
        return () => clearInterval(interval)
    }, [company, notFound, fetchData])

    const handleAction = useCallback(async (matchId: string, status: string) => {
        setActionLoading(prev => new Set(prev).add(matchId))
        await updateLeadStatus(matchId, status)
        setActionLoading(prev => {
            const next = new Set(prev)
            next.delete(matchId)
            return next
        })
        // Refresh leads to reflect new status
        if (company) {
            const leadsData = await getLeadsForEmpresa(company.id)
            setLeads(leadsData as unknown as Lead[])
        }
    }, [company])

    const { filteredLeads, sortedLeads, priorityGroups } = useMemo(() => {
        const filtered = leads.filter((lead) => {
            const name = getCandidateName(lead)
            const profile = getCandidateProfile(lead)
            const exp = getCandidateExperience(lead)
            const searchType = getCandidateSearchType(lead)

            if (filterArea && profile !== filterArea) return false
            if (filterExperience && exp !== filterExperience) return false
            if (filterSearchType && searchType !== filterSearchType) return false
            if (filterStatus && lead.lead_status !== filterStatus) return false
            if (filterStatus === '' && lead.lead_status === 'dismissed') return false
            return true
        })

        const sorted = sortLeads(filtered)

        const groups = {
            high: sorted.filter(l => (INTEREST_BADGES[l.connection_type || '']?.priority || 0) >= 3),
            medium: sorted.filter(l => (INTEREST_BADGES[l.connection_type || '']?.priority || 0) === 2),
            low: sorted.filter(l => (INTEREST_BADGES[l.connection_type || '']?.priority || 0) <= 1),
        }

        return { filteredLeads: filtered, sortedLeads: sorted, priorityGroups: groups }
    }, [leads, filterArea, filterExperience, filterSearchType, filterStatus])

    const uniqueAreas = useMemo(() => {
        const areas = new Set<string>()
        leads.forEach(l => {
            const p = getCandidateProfile(l)
            if (p) areas.add(p)
        })
        return Array.from(areas)
    }, [leads])

    const uniqueExperience = useMemo(() => {
        const levels = new Set<string>()
        leads.forEach(l => {
            const e = getCandidateExperience(l)
            if (e) levels.add(e)
        })
        return Array.from(levels)
    }, [leads])

    const uniqueSearchTypes = useMemo(() => {
        const types = new Set<string>()
        leads.forEach(l => {
            const t = getCandidateSearchType(l)
            if (t) types.add(t)
        })
        return Array.from(types)
    }, [leads])

    const canExport = company?.plan && ['basic', 'pro', 'premium'].includes(company.plan)

    const handleExportCSV = () => {
        const headers = ['Nombre', 'Email', 'Teléfono', 'Área Profesional', 'Nivel de Experiencia', 'Tipo de Búsqueda', 'Nivel de Interés', 'Fecha']
        const rows = sortedLeads.map((lead) => {
            const c = lead.candidato
            return [
                getCandidateName(lead),
                c?.email || '',
                getCandidatePhone(lead) || '',
                getCandidateProfile(lead) || '',
                getCandidateExperience(lead) || '',
                getCandidateSearchType(lead) || '',
                lead.connection_type ? (INTEREST_LABELS[lead.connection_type] || lead.connection_type) : 'Sin clasificar',
                new Date(lead.created_at).toLocaleDateString('es-CL'),
            ]
        })
        const csv = [headers, ...rows]
            .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
            .join('\n')
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `leads-${company?.company || 'empresa'}-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#050505]">
                <Loader2 className="w-8 h-8 animate-spin opacity-30" />
            </div>
        )
    }

    if (notFound) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white dark:bg-[#050505] text-black dark:text-white">
                <Building2 className="w-12 h-12 opacity-20" />
                <p className="font-mono text-xs uppercase tracking-widest opacity-40">Link no válido o expirado</p>
                <p className="font-mono text-[10px] uppercase tracking-widest opacity-25">Solicita un nuevo link al organizador de la feria</p>
            </div>
        )
    }

    const hasActiveFilters = filterArea || filterExperience || filterSearchType

    return (
        <div className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white font-sans">
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:4rem_4rem] -z-10" />

            <header className="border-b border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-[1400px] mx-auto px-6 md:px-8 h-20 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black tracking-tighter uppercase leading-none">
                            {company?.company || company?.name}
                        </h1>
                        <p className="font-mono text-[10px] tracking-widest uppercase opacity-50">
                            Portal de Empresa · Feria de Empleo
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={async () => {
                                if (!company?.id) return
                                if (qrUrl) { setShowQr(true); return }
                                try {
                                    const connectUrl = `${window.location.origin}/connect/${company.id}`
                                    const url = await QRCode.toDataURL(connectUrl, {
                                        width: 512,
                                        margin: 2,
                                        color: { dark: '#000000', light: '#ffffff' },
                                    })
                                    setQrUrl(url)
                                    setShowQr(true)
                                } catch {}
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 transition-colors font-mono text-[10px] tracking-widest uppercase"
                        >
                            <QrCode className="w-4 h-4" />
                            MOSTRAR QR
                        </button>
                        <span className="flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase opacity-40">
                            <span className={`w-2 h-2 rounded-full ${leads.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300'}`} />
                            EN VIVO
                        </span>
                        {company?.plan && company.plan !== 'free' && (
                            <span className="px-3 py-1 bg-black dark:bg-white text-white dark:text-black font-mono text-[10px] font-bold uppercase tracking-widest">
                                {company.plan.toUpperCase()}
                            </span>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-6 md:px-8 py-12">

                {/* Stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-0 mb-12 border border-black/10 dark:border-white/10 divide-y md:divide-y-0 md:divide-x divide-black/10 dark:divide-white/10">
                    <div className="p-8 flex flex-col gap-2">
                        <p className="font-mono text-[10px] uppercase tracking-widest opacity-50 flex items-center gap-2">
                            <Users className="w-3 h-3" /> TOTAL LEADS
                        </p>
                        <span className="text-5xl font-black tracking-tighter leading-none">
                            {leads.length}
                        </span>
                    </div>
                    <div className="p-8 flex flex-col gap-2">
                        <p className="font-mono text-[10px] uppercase tracking-widest opacity-50 flex items-center gap-2">
                            <Sparkles className="w-3 h-3" /> ALTA PRIORIDAD
                        </p>
                        <span className="text-5xl font-black tracking-tighter leading-none text-emerald-500/70 dark:text-emerald-400/70">
                            {priorityGroups.high.length}
                        </span>
                    </div>
                    <div className="p-8 flex flex-col gap-2">
                        <p className="font-mono text-[10px] uppercase tracking-widest opacity-50 flex items-center gap-2">
                            <TrendingUp className="w-3 h-3" /> PRIORIDAD MEDIA
                        </p>
                        <span className="text-5xl font-black tracking-tighter leading-none text-amber-500/70 dark:text-amber-400/70">
                            {priorityGroups.medium.length}
                        </span>
                    </div>
                    <div className="p-8 flex flex-col gap-2">
                        <p className="font-mono text-[10px] uppercase tracking-widest opacity-50 flex items-center gap-2">
                            <Filter className="w-3 h-3" /> FILTRADOS
                        </p>
                        <span className="text-5xl font-black tracking-tighter leading-none">
                            {hasActiveFilters ? filteredLeads.length : '—'}
                        </span>
                        {!hasActiveFilters && (
                            <p className="font-mono text-[10px] uppercase tracking-widest opacity-30">Sin filtros</p>
                        )}
                    </div>
                </div>

                {/* Opportunity description */}
                {company?.opportunity_description && (
                    <div className="mb-8 p-5 border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
                        <p className="font-mono text-[10px] uppercase tracking-widest opacity-40 mb-1">Descripción de oportunidades</p>
                        <p className="font-mono text-sm opacity-70">{company.opportunity_description}</p>
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-8 items-start md:items-end justify-between">
                    <div className="flex flex-wrap gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="font-mono text-[9px] uppercase tracking-widest opacity-40">Área</label>
                            <select
                                value={filterArea}
                                onChange={e => setFilterArea(e.target.value)}
                                className="bg-transparent border border-black/20 dark:border-white/20 px-3 py-2 font-mono text-xs tracking-widest outline-none focus:border-black dark:focus:border-white rounded-none cursor-pointer min-w-[160px]"
                            >
                                <option value="">Todas las áreas</option>
                                {uniqueAreas.map(a => <option key={a} value={a!}>{a}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="font-mono text-[9px] uppercase tracking-widest opacity-40">Experiencia</label>
                            <select
                                value={filterExperience}
                                onChange={e => setFilterExperience(e.target.value)}
                                className="bg-transparent border border-black/20 dark:border-white/20 px-3 py-2 font-mono text-xs tracking-widest outline-none focus:border-black dark:focus:border-white rounded-none cursor-pointer min-w-[160px]"
                            >
                                <option value="">Todos los niveles</option>
                                {uniqueExperience.map(e => <option key={e} value={e!}>{e}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="font-mono text-[9px] uppercase tracking-widest opacity-40">Tipo de búsqueda</label>
                            <select
                                value={filterSearchType}
                                onChange={e => setFilterSearchType(e.target.value)}
                                className="bg-transparent border border-black/20 dark:border-white/20 px-3 py-2 font-mono text-xs tracking-widest outline-none focus:border-black dark:focus:border-white rounded-none cursor-pointer min-w-[180px]"
                            >
                                <option value="">Todos los tipos</option>
                                {uniqueSearchTypes.map(t => <option key={t} value={t!}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                    {canExport ? (
                        <button
                            onClick={handleExportCSV}
                            className="inline-flex items-center gap-3 px-6 py-3 bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-900 dark:hover:bg-zinc-100 transition-colors font-mono text-xs tracking-widest uppercase font-bold"
                        >
                            <Download className="w-4 h-4" />
                            EXPORTAR CSV ({sortedLeads.length})
                        </button>
                    ) : (
                        <div className="flex items-center gap-3 px-6 py-3 border border-black/10 dark:border-white/10 opacity-50">
                            <Download className="w-4 h-4" />
                            <span className="font-mono text-xs tracking-widest uppercase">EXPORTAR · plan Basic+</span>
                        </div>
                    )}
                </div>

                {/* Lead status filter tabs */}
                <div className="flex flex-wrap gap-1 mb-8 border-b border-black/10 dark:border-white/10 pb-0">
                    {LEAD_STATUS_TABS.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setFilterStatus(tab.value)}
                            className={`px-4 py-3 font-mono text-[10px] tracking-widest uppercase transition-colors border-b-2 -mb-[1px] ${
                                filterStatus === tab.value
                                    ? 'border-black dark:border-white font-bold opacity-100'
                                    : 'border-transparent opacity-40 hover:opacity-70'
                            }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Leads by priority group */}
                {sortedLeads.length === 0 ? (
                    <div className="border border-dashed border-black/20 dark:border-white/20 p-16 text-center">
                        <Users className="w-10 h-10 opacity-20 mx-auto mb-4" />
                        <p className="font-mono text-xs uppercase tracking-widest opacity-40">
                            {leads.length === 0
                                ? 'Aún no hay candidatos — comparte tu QR para empezar a recibir leads'
                                : 'Ningún candidato coincide con los filtros'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {priorityGroups.high.length > 0 && (
                            <PrioritySection
                                title="Alta prioridad"
                                icon="🔥"
                                leads={priorityGroups.high}
                                newLeadIds={newLeadIds}
                                badge={INTEREST_BADGES.negocio}
                                actionLoading={actionLoading}
                                onAction={handleAction}
                            />
                        )}
                        {priorityGroups.medium.length > 0 && (
                            <PrioritySection
                                title="Prioridad media"
                                icon="📋"
                                leads={priorityGroups.medium}
                                newLeadIds={newLeadIds}
                                badge={INTEREST_BADGES.mentoria}
                                actionLoading={actionLoading}
                                onAction={handleAction}
                            />
                        )}
                        {priorityGroups.low.length > 0 && (
                            <PrioritySection
                                title="Prioridad baja"
                                icon="👀"
                                leads={priorityGroups.low}
                                newLeadIds={newLeadIds}
                                badge={INTEREST_BADGES.casual}
                                actionLoading={actionLoading}
                                onAction={handleAction}
                            />
                        )}
                    </div>
                )}

                <p className="font-mono text-[9px] uppercase tracking-widest opacity-25 mt-8 text-center">
                    Actualización automática cada 5 segundos · Los leads aparecen ordenados por relevancia
                </p>

                {/* QR modal for booth display */}
                {showQr && qrUrl && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={() => setShowQr(false)}
                    >
                        <div
                            className="bg-white dark:bg-zinc-900 p-8 border border-black/10 dark:border-white/10 max-w-sm w-full"
                            onClick={e => e.stopPropagation()}
                        >
                            <img src={qrUrl} alt="QR de conexión" className="w-full h-auto" />
                            <p className="font-mono text-[10px] tracking-widest uppercase opacity-50 text-center mt-4">
                                Escanea para conectar con {company?.company || company?.name}
                            </p>
                            <p className="font-mono text-[9px] tracking-widest uppercase opacity-30 text-center mt-1">
                                Muestra este código en tu stand
                            </p>
                            <button
                                onClick={() => setShowQr(false)}
                                className="w-full mt-6 py-3 border border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 transition-colors font-mono text-[10px] tracking-widest uppercase"
                            >
                                CERRAR
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

function PrioritySection({
    title,
    icon,
    leads,
    newLeadIds,
    badge,
    actionLoading,
    onAction,
}: {
    title: string
    icon: string
    leads: Lead[]
    newLeadIds: Set<string>
    badge: { color: string; bg: string }
    actionLoading: Set<string>
    onAction: (matchId: string, status: string) => void
}) {
    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-[11px] font-bold tracking-widest uppercase opacity-50">
                    {icon} {title}
                </span>
                <span className="font-mono text-[10px] opacity-30">· {leads.length}</span>
            </div>
            <div className="border border-black/10 dark:border-white/10 divide-y divide-black/5 dark:divide-white/5">
                {leads.map((lead) => {
                    const isNew = newLeadIds.has(lead.id)
                    const name = lead.scanner_name || lead.candidato?.name || 'Anónimo'
                    const profile = lead.scanner_profile || lead.candidato?.profile || null
                    const exp = lead.scanner_experience_level || lead.candidato?.experience_level || null
                    const searchType = lead.scanner_job_search_type || lead.candidato?.job_search_type || null
                    const phone = lead.candidato_phone || lead.candidato?.phone || null
                    const timeAgo = getTimeAgo(new Date(lead.created_at))
                    const status = lead.lead_status
                    const isLoading = actionLoading.has(lead.id)

                    return (
                        <div
                            key={lead.id}
                            className={`px-6 py-5 transition-all duration-500 ${
                                status === 'dismissed'
                                    ? 'opacity-40'
                                    : status === 'highlighted'
                                    ? 'bg-amber-50/50 dark:bg-amber-900/5'
                                    : status === 'contacted'
                                    ? 'bg-emerald-50/50 dark:bg-emerald-900/5'
                                    : isNew
                                    ? 'bg-yellow-50 dark:bg-yellow-900/10'
                                    : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-black uppercase tracking-tight truncate">
                                            {isNew && (
                                                <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
                                            )}
                                            {status === 'highlighted' && (
                                                <span className="inline-block mr-1.5">⭐</span>
                                            )}
                                            {name}
                                        </span>
                                        {status === 'contacted' && (
                                            <span className="font-mono text-[9px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-widest shrink-0">
                                                Contactado
                                            </span>
                                        )}
                                        {profile && (
                                            <span className="font-mono text-[10px] px-2 py-0.5 bg-black/5 dark:bg-white/10 font-bold uppercase tracking-widest shrink-0">
                                                {profile}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono opacity-60">
                                        {exp && <span>{exp}</span>}
                                        {searchType && <span>· {searchType}</span>}
                                        <span>· {timeAgo}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {phone && (
                                        <a
                                            href={`https://wa.me/${phone.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-3 py-2 border border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 transition-colors font-mono text-[10px] tracking-widest uppercase"
                                            title="Abrir WhatsApp"
                                        >
                                            <Phone className="w-3 h-3" />
                                            WhatsApp
                                        </a>
                                    )}
                                    {/* Quick actions */}
                                    {status !== 'contacted' && (
                                        <button
                                            onClick={() => onAction(lead.id, 'contacted')}
                                            disabled={isLoading}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-2 border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors font-mono text-[9px] tracking-widest uppercase disabled:opacity-30"
                                            title="Marcar como contactado"
                                        >
                                            <Check className="w-3 h-3" />
                                            Contactado
                                        </button>
                                    )}
                                    {status !== 'highlighted' && (
                                        <button
                                            onClick={() => onAction(lead.id, 'highlighted')}
                                            disabled={isLoading}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-2 border border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors font-mono text-[9px] tracking-widest uppercase disabled:opacity-30"
                                            title="Destacar lead"
                                        >
                                            <Star className="w-3 h-3" />
                                            Destacar
                                        </button>
                                    )}
                                    {status !== 'dismissed' && (
                                        <button
                                            onClick={() => onAction(lead.id, 'dismissed')}
                                            disabled={isLoading}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-2 border border-red-300 dark:border-red-700 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-mono text-[9px] tracking-widest uppercase disabled:opacity-30"
                                            title="Descartar lead"
                                        >
                                            <X className="w-3 h-3" />
                                            Descartar
                                        </button>
                                    )}
                                </div>
                            </div>
                            {lead.candidato?.email && (
                                <div className="mt-1 font-mono text-[10px] opacity-40">
                                    {lead.candidato.email}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function getTimeAgo(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'Ahora'
    if (diffMin < 60) return `Hace ${diffMin} min`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `Hace ${diffHour}h`
    return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })
}
