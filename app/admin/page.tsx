import { getContacts } from '@/app/actions/contacts'
import FileUpload from '@/app/components/FileUpload'
import ContactTable from '@/app/components/ContactTable'
import IdentityStatus from '@/app/components/IdentityStatus'
import { Users, LayoutGrid } from 'lucide-react'
import Link from 'next/link'

export default async function Home() {
  const contacts = await getContacts()

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Connectify</h1>
          </div>
          <Link
            href="/matches"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium hover:bg-indigo-600 hover:text-white transition-all group"
          >
            <LayoutGrid className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Estadísticas de Matches</span>
          </Link>
          <IdentityStatus />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <header className="mb-12">
          <h2 className="text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Gestión de Contactos
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-lg max-w-2xl">
            Sube tu lista de contactos en formato Excel, genera códigos QR únicos y envíalos directamente a tu impresora térmica.
          </p>
        </header>

        <section className="mb-16">
          <FileUpload />
        </section>

        <section>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-indigo-600" />
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Registros Cargados</h3>
            </div>
            <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {contacts.length} registros
            </span>
          </div>

          {contacts.length > 0 ? (
            <ContactTable contacts={contacts} />
          ) : (
            <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center bg-white dark:bg-zinc-900/50">
              <LayoutGrid className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 dark:text-zinc-400">No hay registros aún. Sube un archivo Excel para comenzar.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
