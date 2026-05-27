import { Link } from 'react-router'
import { BrandLogo } from '../components/BrandLogo'
import { Button } from '../components/Button'

function IconTarget() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  )
}

function IconSparkles() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
  )
}

function IconBolt() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  )
}

const FEATURES = [
  {
    Icon: IconTarget,
    title: 'Nichos personalizados',
    description: 'Escolha as categorias que você curte. PromoBot filtra o ruído e entrega só o que é relevante para você.',
  },
  {
    Icon: IconSparkles,
    title: 'Descrições geradas por IA',
    description: 'O Google Gemini analisa cada produto e escreve uma descrição clara e objetiva — sem copiar o título da loja.',
  },
  {
    Icon: IconBolt,
    title: 'Ofertas em tempo real',
    description: 'Assim que uma promoção é detectada no Mercado Livre, ela é processada e entregue direto na sua tela.',
  },
]

const STEPS = [
  { n: '01', title: 'Crie sua conta', desc: 'Cadastro rápido e gratuito. Sem cartão de crédito.' },
  { n: '02', title: 'Escolha seus nichos', desc: 'Selecione as categorias que mais combinam com você.' },
  { n: '03', title: 'Receba promoções', desc: 'Ofertas curadas e descritas por IA aparecem direto no seu painel.' },
]

const MOCK_CARDS = [
  { title: 'Tênis de Corrida Nike Revolution 7', original: 'R$ 349,90', promo: 'R$ 199,90', discount: '43% OFF', tag: 'Gym & Sports' },
  { title: 'Whey Protein Concentrado 900g', original: 'R$ 129,90', promo: 'R$ 89,90', discount: '31% OFF', tag: 'Gym & Sports' },
  { title: 'Garrafa Térmica Stanley 1L Inox', original: 'R$ 259,00', promo: 'R$ 189,00', discount: '27% OFF', tag: 'Gym & Sports' },
]

function MockPromoCard({ title, original, promo, discount, tag }: (typeof MOCK_CARDS)[0]) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-all duration-200 hover:border-amber-400/20 hover:shadow-[0_0_30px_rgba(245,158,11,0.06)]">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="h-9 w-9 shrink-0 rounded-lg bg-zinc-800 flex items-center justify-center">
          <svg className="h-4 w-4 text-amber-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
          </svg>
        </div>
        <span className="rounded-full bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 text-xs font-bold text-amber-300 font-display">
          {discount}
        </span>
      </div>
      <p className="mb-2.5 text-sm font-medium text-zinc-200 leading-snug line-clamp-2">{title}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold text-amber-400 font-display">{promo}</span>
        <span className="text-xs text-zinc-600 line-through">{original}</span>
      </div>
      <div className="mt-2.5">
        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-500">
          {tag}
        </span>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
        <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <BrandLogo size="sm" />
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Cadastrar</Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(245,158,11,0.08),transparent)] pointer-events-none" />

          <div className="mx-auto max-w-5xl px-4 py-20 md:py-28">
            <div className="grid md:grid-cols-2 gap-12 items-center">

              <div className="flex flex-col gap-6 animate-fade-up">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/5 px-3 py-1 text-xs font-medium text-amber-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Powered by Google Gemini
                </div>

                <h1 className="font-display text-4xl md:text-5xl font-bold text-zinc-100 leading-[1.1] tracking-tight">
                  Promoções inteligentes para os seus{' '}
                  <span className="text-amber-400">nichos</span>
                </h1>

                <p className="text-zinc-400 leading-relaxed">
                  PromoBot monitora o Mercado Livre e entrega as melhores ofertas das
                  categorias que você escolhe — cada produto descrito por IA.
                </p>

                <div className="flex flex-wrap gap-3">
                  <Link to="/register">
                    <Button size="lg">Começar grátis</Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="secondary" size="lg">Já tenho conta</Button>
                  </Link>
                </div>

                <p className="text-xs text-zinc-600">Grátis para começar · Sem cartão de crédito</p>
              </div>

              <div className="hidden md:flex flex-col gap-3" style={{ animationDelay: '0.1s' }}>
                {MOCK_CARDS.map((card) => (
                  <MockPromoCard key={card.title} {...card} />
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4 border-t border-zinc-800/50">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12">
              <p className="text-xs font-display font-semibold uppercase tracking-widest text-amber-400 mb-3">Por que usar o PromoBot?</p>
              <h2 className="font-display text-3xl font-bold text-zinc-100 tracking-tight">
                Tudo que você precisa para não perder<br className="hidden sm:block" /> mais nenhuma promoção.
              </h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {FEATURES.map(({ Icon, title, description }) => (
                <div
                  key={title}
                  className="group rounded-xl border border-zinc-800 bg-zinc-900 p-6 transition-all duration-200 hover:border-amber-400/20 hover:bg-zinc-900/80"
                >
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400 transition-colors group-hover:bg-amber-400/15">
                    <Icon />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-zinc-100 font-display">{title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 px-4 border-t border-zinc-800/50">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12">
              <p className="text-xs font-display font-semibold uppercase tracking-widest text-amber-400 mb-3">Como funciona</p>
              <h2 className="font-display text-3xl font-bold text-zinc-100 tracking-tight">Em 3 passos simples.</h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-8 relative">
              <div className="hidden sm:block absolute top-7 left-[16.6%] right-[16.6%] h-px bg-zinc-800" />
              {STEPS.map(({ n, title, desc }) => (
                <div key={n} className="flex flex-col gap-4">
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/5">
                    <span className="font-display text-xl font-bold text-amber-400">{n}</span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-zinc-100 font-display mb-1">{title}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-24 px-4 border-t border-zinc-800/50">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-4xl font-bold text-zinc-100 tracking-tight mb-4">
              Pronto para economizar?
            </h2>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              Crie sua conta em segundos e comece a receber promoções que fazem sentido para você.
            </p>
            <Link to="/register">
              <Button size="lg">Criar conta grátis</Button>
            </Link>
          </div>
        </section>

      </main>

      <footer className="border-t border-zinc-800 py-6 text-center text-xs text-zinc-600">
        © 2026 PromoBot · Feito com Google Gemini
      </footer>

    </div>
  )
}
