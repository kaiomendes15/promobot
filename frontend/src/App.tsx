import { useState } from 'react'
import { Alert, Badge, Button, Card, Header, Input, PromotionCard, Spinner } from './components'

const SAMPLE_NAV = [
  { label: 'Promoções', href: '#' },
  { label: 'Nichos', href: '#' },
  { label: 'Conta', href: '#' },
]

const SAMPLE_PROMOTION = {
  title: 'Tênis de Corrida Nike Revolution 7 Masculino',
  photoUrl: 'https://placehold.co/400x400/f3f4f6/9ca3af?text=Produto',
  originalPrice: 349.9,
  promoPrice: 199.9,
  affiliateUrl: '#',
  niche: 'Gym & Sports',
  geminiDescription:
    'Tênis leve com amortecimento responsivo, ideal para treinos diários e corridas de curta distância. Solado de borracha durável e cabedal respirável.',
  store: 'Nike Store Oficial',
}

const PALETTE = [
  { name: 'violet-600', hex: '#7c3aed', label: 'Primary' },
  { name: 'violet-100', hex: '#ede9fe', label: 'Primary Light' },
  { name: 'gray-900', hex: '#111827', label: 'Text Dark' },
  { name: 'gray-500', hex: '#6b7280', label: 'Text Muted' },
  { name: 'gray-200', hex: '#e5e7eb', label: 'Border' },
  { name: 'gray-50', hex: '#f9fafb', label: 'Background' },
  { name: 'emerald-500', hex: '#10b981', label: 'Success' },
  { name: 'red-500', hex: '#ef4444', label: 'Danger' },
  { name: 'amber-500', hex: '#f59e0b', label: 'Warning' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 whitespace-nowrap">
          {title}
        </h2>
        <hr className="flex-1 border-gray-200" />
      </div>
      {children}
    </section>
  )
}

export default function App() {
  const [dismissedAlert, setDismissedAlert] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [inputError, setInputError] = useState('')

  function handleInputBlur() {
    setInputError(inputValue.length > 0 && inputValue.length < 4 ? 'Mínimo de 4 caracteres.' : '')
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header preview */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <Header
          navItems={SAMPLE_NAV}
          actions={
            <>
              <Button variant="ghost" size="sm">Entrar</Button>
              <Button size="sm">Cadastrar</Button>
            </>
          }
        />
      </div>

      <main className="mx-auto max-w-4xl px-4 py-12 flex flex-col gap-14">

        {/* Page title */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Design System</h1>
          <p className="mt-1 text-gray-500 text-sm">Componentes base do PromoBot.</p>
        </div>

        {/* Colors */}
        <Section title="Cores">
          <div className="flex flex-wrap gap-3">
            {PALETTE.map(({ hex, name, label }) => (
              <div key={name} className="flex flex-col items-center gap-1.5">
                <div
                  className="h-12 w-12 rounded-lg border border-gray-200 shadow-sm"
                  style={{ backgroundColor: hex }}
                />
                <span className="text-xs text-gray-500">{label}</span>
                <span className="text-xs font-mono text-gray-400">{hex}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Botões">
          <Card>
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Variantes</p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger">Danger</Button>
                </div>
              </div>
              <hr className="border-gray-100" />
              <div>
                <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Tamanhos</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
              </div>
              <hr className="border-gray-100" />
              <div>
                <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Estados</p>
                <div className="flex flex-wrap gap-3">
                  <Button loading>Carregando</Button>
                  <Button disabled>Desabilitado</Button>
                  <Button variant="secondary" loading>Salvando...</Button>
                </div>
              </div>
            </div>
          </Card>
        </Section>

        {/* Inputs */}
        <Section title="Inputs">
          <Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input label="Email" type="email" placeholder="voce@exemplo.com" />
              <Input label="Senha" type="password" placeholder="••••••••" />
              <Input
                label="Com ícone"
                placeholder="Buscar promoções..."
                leftIcon={
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
              <Input
                label="Com validação"
                placeholder="Min. 4 caracteres"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={handleInputBlur}
                error={inputError}
              />
              <Input label="Com dica" placeholder="Nome completo" hint="Será exibido no seu perfil." />
              <Input label="Desabilitado" placeholder="Não editável" disabled />
            </div>
          </Card>
        </Section>

        {/* Badges */}
        <Section title="Badges">
          <Card>
            <div className="flex flex-wrap gap-2">
              <Badge variant="purple">Gym & Sports</Badge>
              <Badge variant="gray">Tech</Badge>
              <Badge variant="green">Disponível</Badge>
              <Badge variant="red">Expirado</Badge>
              <Badge variant="amber">Em breve</Badge>
            </div>
          </Card>
        </Section>

        {/* Alerts */}
        <Section title="Alertas">
          <div className="flex flex-col gap-3">
            <Alert variant="info" title="Dica">
              Selecione seus nichos para receber promoções personalizadas.
            </Alert>
            <Alert variant="success" title="Cadastro realizado!">
              Bem-vindo ao PromoBot. Suas promoções já estão sendo preparadas.
            </Alert>
            <Alert variant="warning" title="Oferta expirando">
              Esta promoção expira em menos de 1 hora.
            </Alert>
            {!dismissedAlert ? (
              <Alert variant="error" title="Erro de autenticação" onDismiss={() => setDismissedAlert(true)}>
                Email ou senha incorretos. Tente novamente.
              </Alert>
            ) : (
              <p className="text-xs text-gray-400 italic">Alerta dispensado.</p>
            )}
          </div>
        </Section>

        {/* Cards */}
        <Section title="Cards">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card padding="sm">
              <p className="text-xs text-gray-400 mb-1">padding sm</p>
              <p className="text-sm text-gray-700">Conteúdo compacto para listas e widgets.</p>
            </Card>
            <Card padding="md">
              <p className="text-xs text-gray-400 mb-1">padding md</p>
              <p className="text-sm text-gray-700">Padrão para a maioria dos contextos.</p>
            </Card>
            <Card padding="lg">
              <p className="text-xs text-gray-400 mb-1">padding lg</p>
              <p className="text-sm text-gray-700">Seções maiores e formulários.</p>
            </Card>
          </div>
        </Section>

        {/* Spinners */}
        <Section title="Spinner">
          <Card>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <Spinner size="sm" />
                <span className="text-xs text-gray-400">sm</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner size="md" />
                <span className="text-xs text-gray-400">md</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner size="lg" />
                <span className="text-xs text-gray-400">lg</span>
              </div>
            </div>
          </Card>
        </Section>

        {/* Promotion Card */}
        <Section title="Promotion Card">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <PromotionCard {...SAMPLE_PROMOTION} />
            <PromotionCard
              {...SAMPLE_PROMOTION}
              title="Whey Protein Concentrado 900g — Baunilha"
              originalPrice={129.9}
              promoPrice={89.9}
              niche="Gym & Sports"
              geminiDescription="Proteína de alta qualidade com 20g por dose. Ótima solubilidade e sabor agradável, ideal para recuperação pós-treino."
            />
            <PromotionCard
              {...SAMPLE_PROMOTION}
              title="Garrafa Térmica Stanley 1L Inox"
              originalPrice={259}
              promoPrice={189}
              niche="Gym & Sports"
              geminiDescription="Mantém bebidas quentes por 7h e frias por 9h. Aço inoxidável de grau alimentício com tampa antivazamento."
            />
          </div>
        </Section>

      </main>

      <footer className="border-t border-gray-200 mt-8 py-6 text-center text-xs text-gray-400">
        PromoBot — Design System
      </footer>
    </div>
  )
}
