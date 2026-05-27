export default function PromotionsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-zinc-100 mb-1">Promoções</h1>
        <p className="text-zinc-500 text-sm">Suas ofertas personalizadas aparecem aqui.</p>
      </div>
      <div className="flex items-center justify-center py-24 border border-dashed border-zinc-800 rounded-xl">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/10 mb-4">
            <svg className="h-6 w-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            </svg>
          </div>
          <p className="text-zinc-400 text-sm font-medium">Nenhuma promoção ainda</p>
          <p className="text-zinc-600 text-xs mt-1">Configure seus nichos para começar a receber ofertas.</p>
        </div>
      </div>
    </main>
  )
}
