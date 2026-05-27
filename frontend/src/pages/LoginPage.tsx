import { BrandLogo } from '../components/BrandLogo'
import { useState } from 'react'
import { Input } from '../components/Input'
import { Button } from '../components/Button'
import { Link, useNavigate } from 'react-router'
import { login } from '../api/auth'
import { tokenStorage } from '../api/client'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState(false)
  const [loading, setLoading] = useState(false)

  const isFormValid = email.includes('@') && email.trim() !== '' && password.length > 0

  async function handleLogin() {
    setLoading(true)
    try {
      const { access_token } = await login(email, password)
      tokenStorage.set(access_token)
      navigate('/promotions')
    } catch {
      setEmail('')
      setPassword('')
      setLoginError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-zinc-950">

      {/* Left panel — editorial */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 border-r border-zinc-800 bg-zinc-900 p-10">
        <BrandLogo size="sm" />

        <div className="flex flex-col gap-5">
          <p className="text-xs font-display font-semibold uppercase tracking-widest text-amber-400">
            Bem-vindo de volta
          </p>
          <h2 className="font-display text-5xl font-bold text-zinc-100 leading-[1.1]">
            Suas melhores<br />
            <span className="text-amber-400">ofertas</span><br />
            te esperam.
          </h2>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Promoções curadas por IA, filtradas pelos nichos que você escolheu. Entre e economize.
          </p>
        </div>

        <p className="text-xs text-zinc-700">© 2026 PromoBot</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm animate-fade-up">

          <div className="mb-8 lg:hidden">
            <BrandLogo size="sm" />
          </div>

          <h1 className="font-display text-2xl font-bold text-zinc-100 mb-1">Entrar</h1>
          <p className="text-sm text-zinc-500 mb-8">
            Não tem conta?{' '}
            <Link to="/register" className="text-amber-400 hover:text-amber-300 transition-colors">
              Cadastrar-se
            </Link>
          </p>

          <form onSubmit={(e) => { e.preventDefault(); handleLogin() }} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="voce@exemplo.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setLoginError(false) }}
            />
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setLoginError(false) }}
            />

            {loginError && (
              <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                Email ou senha incorretos. Tente novamente.
              </p>
            )}

            <Button
              type="submit"
              disabled={!isFormValid || loading}
              loading={loading}
              className="w-full mt-2"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
