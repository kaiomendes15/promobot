export default function NichesPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-zinc-100 mb-1">Nichos</h1>
        <p className="text-zinc-500 text-sm">Escolha as categorias que você quer acompanhar.</p>
      </div>
      <div className="flex items-center justify-center py-24 border border-dashed border-zinc-800 rounded-xl">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/10 mb-4">
            <svg className="h-6 w-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
            </svg>
          </div>
          <p className="text-zinc-400 text-sm font-medium">Nenhum nicho selecionado</p>
          <p className="text-zinc-600 text-xs mt-1">Em breve você poderá escolher suas categorias aqui.</p>
        </div>
      </div>
    </main>
  )
}
