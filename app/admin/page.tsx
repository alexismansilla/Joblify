import { getContacts } from '@/app/actions/contacts'
import FileUpload from '@/app/components/FileUpload'
import ContactTable from '@/app/components/ContactTable'
import { Users, LayoutGrid, Activity, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// Forzamos rendering dinámico para siempre mostrar la lista actualizada de contactos
export const dynamic = 'force-dynamic'

export default async function Home() {
  const contacts = await getContacts()

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black relative">
      {/* Minimalist Grid Pattern Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] mix-blend-difference bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:4rem_4rem] -z-10"></div>

      <nav className="fixed top-0 inset-x-0 h-20 border-b border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-md z-50 transition-colors">
        <div className="max-w-[1400px] mx-auto px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="group flex items-center justify-center w-10 h-10 border border-black dark:border-white rounded-full hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
              title="Volver al inicio"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </Link>
            <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase leading-none flex flex-col ml-2">
              Connectify<span className="text-[10px] font-mono tracking-widest opacity-50">ADMIN DASHBOARD</span>
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/matches"
              className="hidden md:flex items-center gap-2 group hover:opacity-50 transition-opacity"
            >
              <Activity className="w-4 h-4" />
              <span className="font-mono text-xs font-bold tracking-widest uppercase">Métricas</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-8 pt-28 pb-24 relative overflow-hidden">
        <section className="mb-12 relative z-10 flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <FileUpload />
          </div>
        </section>

        <section className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-black/10 dark:border-white/10 gap-4">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <h3 className="text-3xl font-black tracking-tighter uppercase">Asistentes Registrados</h3>
                <p className="font-mono text-[10px] tracking-widest uppercase opacity-50 mt-1 flex items-center gap-2">
                  <Users className="w-3 h-3" /> Base de Datos Actual
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end">
              <span className="text-5xl font-black leading-none tracking-tighter">
                {contacts.length}
              </span>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-50 mt-1">Total Entidades</span>
            </div>
          </div>

          {contacts.length > 0 ? (
            <ContactTable contacts={contacts} />
          ) : (
            <div className="border border-dashed border-black/20 dark:border-white/20 p-16 text-center bg-transparent backdrop-blur-sm">
              <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 opacity-40" />
              </div>
              <p className="font-black text-xl uppercase tracking-tighter">SIN DATOS CARGADOS</p>
              <p className="font-mono text-xs mt-2 uppercase tracking-widest opacity-50">Sube un archivo para comenzar</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
