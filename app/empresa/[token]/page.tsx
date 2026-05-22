'use client'

import { useState, useEffect, use, useMemo } from 'react'
import { getCompanyByToken, getLeadsForCompany } from '@/app/actions/contacts'
import { Users, Download, Building2, Loader2, TrendingUp, Filter } from 'lucide-react'

interface Candidate {
    id: string
    name: string
    email: string | null
    phone: string | null
    profile: string | null
    experience_level: string | null
    job_search_type: string | null
}

interface Lead {
    id: string
    created_at: string
    connection_type: string | null
    scanner_phone: string | null
    scanner: Candidate | null
}

interface Company {
    id: string
    name: string
    company: string | null
    position: string | null
    opportunity_description: string | null
    plan: string | null
}

const INTEREST_LABELS: Record<string, string> = {
    negocio: 'Muy interesado',
    mentoria: 'Quiere más info',
    casual: 'Solo explorando',
}

const INTEREST_COLORS: Record<string, string> = {
    negocio: 'text-emerald-600 dark:text-emerald-400',
    mentoria: 'text-amber-600 dark:text-amber-400',
    casual: 'text-zinc-500 dark:text-zinc-400',
}

export default function EmpresaPortal({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params)
    const [company, setCompany] = useState<Company | null>(null)
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)

    const [filterArea, setFilterArea] = useState('')
    const [filterExperience, setFilterExperience] = useState('')
    const [filterSearchType, setFilterSearchType] = useState('')

    useEffect(() => {
        const init = async () => {
            const companyData = await getCompanyByToken(token)
            if (!companyData) {
                setNotFound(true)
                setLoading(false)
                return
            }
            setCompany(companyData as Company)
            const leadsData = await getLeadsForCompany(companyData.id)
            setLeads(leadsData as Lead[])
            setLoading(false)
        }
        init()
    }, [token])

    const filteredLeads = useMemo(() => {
        return leads.filter((lead) => {
            const c = lead.scanner
            if (!c) return false
            if (filterArea && c.profile !== filterArea) return false
            if (filterExperience && c.experience_level !== filterExperience) return false
            if (filterSearchType && c.job_search_type !== filterSearchType) return false
            return true
        })
    }, [leads, filterArea, filterExperience, filterSearchType])

    const uniqueAreas = useMemo(() => [...new Set(leads.map(l => l.scanner?.profile).filter(Boolean))], [leads])
    const uniqueExperience = useMemo(() => [...new Set(leads.map(l => l.scanner?.experience_level).filter(Boolean))], [leads])
    const uniqueSearchTypes = useMemo(() => [...new Set(leads.map(l => l.scanner?.job_search_type).filter(Boolean))], [leads])

    const canExport = company?.plan && ['basic', 'pro', 'premium'].includes(company.plan)

    const handleExportCSV = () => {
        const headers = ['Nombre', 'Email', 'Teléfono', 'Área Profesional', 'Nivel de Experiencia', 'Tipo de Búsqueda', 'Nivel de Interés', 'Fecha']
        const rows = filteredLeads.map((lead) => {
            const c = lead.scanner
            return [
                c?.name || '',
                c?.email || '',
                c?.phone || '',
                c?.profile || '',
                c?.experience_level || '',
                c?.job_search_type || '',
                lead.connection_type ? (INTEREST_LABELS[lead.connection_type] || lead.connection_type) : 'Sin clasificar',
                new Date(lead.created_at).toLocaleDateString('es-CL'),
            ]
        })
        const csv = [headers, ...rows]
            .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
            .join('\n')
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
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

    return (
        <div className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white font-sans">
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:4rem_4rem] -z-10" />

            {/* Header */}
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
                    {company?.plan && company.plan !== 'free' && (
                        <span className="px-3 py-1 bg-black dark:bg-white text-white dark:text-black font-mono text-[10px] font-bold uppercase tracking-widest">
                            {company.plan.toUpperCase()}
                        </span>
                    )}
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-6 md:px-8 py-12">

                {/* Stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-0 mb-16 border border-black/10 dark:border-white/10 divide-y md:divide-y-0 md:divide-x divide-black/10 dark:divide-white/10">
                    <div className="p-10 flex flex-col gap-4">
                        <p className="font-mono text-[10px] uppercase tracking-widest opacity-50 flex items-center gap-2">
                            <Users className="w-3 h-3" /> LEADS CAPTURADOS
                        </p>
                        <span className="text-6xl font-black tracking-tighter leading-none text-emerald-500/70 dark:text-emerald-400/70">
                            {leads.length}
                        </span>
                        <p className="font-mono text-[10px] uppercase tracking-widest opacity-40">candidatos escanearon tu QR</p>
                    </div>

                    <div className="p-10 flex flex-col gap-4">
                        <p className="font-mono text-[10px] uppercase tracking-widest opacity-50 flex items-center gap-2">
                            <TrendingUp className="w-3 h-3" /> MUY INTERESADOS
                        </p>
                        <span className="text-6xl font-black tracking-tighter leading-none text-amber-500/70 dark:text-amber-400/70">
                            {leads.filter(l => l.connection_type === 'negocio').length}
                        </span>
                        <p className="font-mono text-[10px] uppercase tracking-widest opacity-40">clasificados como muy interesados</p>
                    </div>

                    <div className="p-10 flex flex-col gap-4">
                        <p className="font-mono text-[10px] uppercase tracking-widest opacity-50 flex items-center gap-2">
                            <Filter className="w-3 h-3" /> MOSTRANDO
                        </p>
                        <span className="text-6xl font-black tracking-tighter leading-none">
                            {filteredLeads.length}
                        </span>
                        <p className="font-mono text-[10px] uppercase tracking-widest opacity-40">con los filtros actuales</p>
                    </div>
                </div>

                {/* Opportunity description */}
                {company?.opportunity_description && (
                    <div className="mb-10 p-6 border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
                        <p className="font-mono text-[10px] uppercase tracking-widest opacity-40 mb-2">Descripción de oportunidades</p>
                        <p className="font-mono text-sm opacity-70">{company.opportunity_description}</p>
                    </div>
                )}

                {/* Filters + export */}
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
                            EXPORTAR CSV ({filteredLeads.length})
                        </button>
                    ) : (
                        <div className="flex items-center gap-3 px-6 py-3 border border-black/10 dark:border-white/10 opacity-50">
                            <Download className="w-4 h-4" />
                            <span className="font-mono text-xs tracking-widest uppercase">EXPORTAR CSV · requiere plan Basic o superior</span>
                        </div>
                    )}
                </div>

                {/* Leads table */}
                {filteredLeads.length === 0 ? (
                    <div className="border border-dashed border-black/20 dark:border-white/20 p-16 text-center">
                        <Users className="w-10 h-10 opacity-20 mx-auto mb-4" />
                        <p className="font-mono text-xs uppercase tracking-widest opacity-40">
                            {leads.length === 0
                                ? 'Aún no hay candidatos que hayan escaneado tu QR'
                                : 'Ningún candidato coincide con los filtros seleccionados'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto border border-black/10 dark:border-white/10">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-black/10 dark:border-white/10">
                                    <th className="px-6 py-5 font-mono text-[10px] uppercase tracking-widest opacity-50">Candidato</th>
                                    <th className="px-6 py-5 font-mono text-[10px] uppercase tracking-widest opacity-50">Área · Experiencia</th>
                                    <th className="px-6 py-5 font-mono text-[10px] uppercase tracking-widest opacity-50">Tipo de búsqueda</th>
                                    <th className="px-6 py-5 font-mono text-[10px] uppercase tracking-widest opacity-50">Interés</th>
                                    <th className="px-6 py-5 font-mono text-[10px] uppercase tracking-widest opacity-50">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                {filteredLeads.map((lead) => {
                                    const c = lead.scanner
                                    const interestLabel = lead.connection_type ? (INTEREST_LABELS[lead.connection_type] || lead.connection_type) : 'Sin clasificar'
                                    const interestColor = lead.connection_type ? (INTEREST_COLORS[lead.connection_type] || '') : 'opacity-30'
                                    return (
                                        <tr key={lead.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-black uppercase tracking-tight">{c?.name || '—'}</span>
                                                    <span className="font-mono text-[10px] opacity-50">{c?.email || c?.phone || '—'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-0.5">
                                                    {c?.profile && (
                                                        <span className="font-mono text-xs font-bold uppercase tracking-wide">{c.profile}</span>
                                                    )}
                                                    {c?.experience_level && (
                                                        <span className="font-mono text-[10px] opacity-50">{c.experience_level}</span>
                                                    )}
                                                    {!c?.profile && !c?.experience_level && (
                                                        <span className="font-mono text-[10px] opacity-30">—</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="font-mono text-xs opacity-70">{c?.job_search_type || '—'}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`font-mono text-xs font-bold uppercase tracking-wide ${interestColor}`}>
                                                    {interestLabel}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="font-mono text-[10px] opacity-50">
                                                    {new Date(lead.created_at).toLocaleDateString('es-CL', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <p className="font-mono text-[9px] uppercase tracking-widest opacity-25 mt-8 text-center">
                    Los datos se actualizan en tiempo real · Recarga la página para ver nuevos leads
                </p>
            </main>
        </div>
    )
}
