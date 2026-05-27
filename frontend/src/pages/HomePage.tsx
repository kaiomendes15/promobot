import { Link } from 'react-router'
import { BrandLogo } from '../components/BrandLogo'
import { Button } from '../components/Button'

function IconTarget() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

function IconSparkles() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
  )
}

function IconBolt() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  )
}

const FEATURES = [
  {
    Icon: IconTarget,
    title: 'Nichos personalizados',
    description:
      'Escolha as categorias que você curte. PromoBot filtra o ruído e entrega só o que é relevante para você.',
  },
  {
    Icon: IconSparkles,
    title: 'Descrições geradas por IA',
    description:
      'O Google Gemini analisa cada produto e escreve uma descrição clara e objetiva — sem copiar o título da loja.',
  },
  {
    Icon: IconBolt,
    title: 'Ofertas em tempo real',
    description:
      'Assim que uma promoção é detectada no Mercado Livre, ela é processada e entregue direto na sua tela.',
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Crie sua conta',
    desc: 'Cadastro rápido e gratuito. Sem cartão de crédito.',
  },
  {
    n: '02',
    title: 'Escolha seus nichos',
    desc: 'Selecione as categorias que mais combinam com você.',
  },
  {
    n: '03',
    title: 'Receba promoções',
    desc: 'Ofertas curadas e descritas por IA aparecem direto no seu painel.',
  },
]

const MOCK_CARDS = [
  {
    title: 'Tênis de Corrida Nike Revolution 7',
    original: 'R$ 349,90',
    promo: 'R$ 199,90',
    discount: '43% OFF',
    tag: 'Gym & Sports',
  },
  {
    title: 'Whey Protein Concentrado 900g',
    original: 'R$ 129,90',
    promo: 'R$ 89,90',
    discount: '31% OFF',
    tag: 'Gym & Sports',
  },
  {
    title: 'Garrafa Térmica Stanley 1L Inox',
    original: 'R$ 259,00',
    promo: 'R$ 189,00',
    discount: '27% OFF',
    tag: 'Gym & Sports',
  },
]

function MockPromoCard({ title, original, promo, discount, tag }: (typeof MOCK_CARDS)[0]) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="h-10 w-10 shrink-0 rounded-lg bg-violet-50 flex items-center justify-center">
          <svg className="h-5 w-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
          </svg>
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
          {discount}
        </span>
      </div>
      <p className="mb-2 text-sm font-medium text-gray-800 leading-snug line-clamp-2">{title}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold text-violet-600">{promo}</span>
        <span className="text-xs text-gray-400 line-through">{original}</span>
      </div>
      <div className="mt-2">
        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-600">
          {tag}
        </span>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
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

        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-white -z-10" />
          <div className="absolute -top-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-violet-100/50 blur-3xl -z-10" />
          <div className="absolute top-20 -left-24 h-64 w-64 rounded-full bg-violet-100/30 blur-2xl -z-10" />

          <div className="mx-auto max-w-5xl px-4 py-20 md:py-28">
            <div className="grid md:grid-cols-2 gap-12 items-center">

              {/* Left – headline + CTAs */}
              <div className="flex flex-col gap-6">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
                  Powered by Google Gemini
                </div>

                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight tracking-tight">
                  Promoções inteligentes para os seus{' '}
                  <span className="text-violet-600">nichos</span>
                </h1>

                <p className="text-lg text-gray-500 leading-relaxed">
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

                <p className="text-xs text-gray-400">
                  Grátis para começar · Sem cartão de crédito
                </p>
              </div>

              {/* Right – mock promo cards */}
              <div className="hidden md:flex flex-col gap-3">
                {MOCK_CARDS.map((card) => (
                  <MockPromoCard key={card.title} {...card} />
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="py-20 px-4">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                Por que usar o PromoBot?
              </h2>
              <p className="mt-3 text-gray-500 text-lg">
                Tudo que você precisa para não perder mais nenhuma promoção.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              {FEATURES.map(({ Icon, title, description }) => (
                <div
                  key={title}
                  className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition-colors group-hover:bg-violet-100">
                    <Icon />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-gray-900">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                Como funciona
              </h2>
              <p className="mt-3 text-gray-500 text-lg">Em 3 passos simples.</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-8">
              {STEPS.map(({ n, title, desc }) => (
                <div key={n} className="flex flex-col items-center text-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white text-xl font-bold shadow-lg shadow-violet-200">
                    {n}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="py-24 px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-4">
              Pronto para economizar?
            </h2>
            <p className="text-gray-500 text-lg mb-8">
              Crie sua conta em segundos e comece a receber promoções que fazem sentido
              para você.
            </p>
            <Link to="/register">
              <Button size="lg">Criar conta grátis</Button>
            </Link>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        © 2026 PromoBot · Feito com Google Gemini
      </footer>

    </div>
  )
}
