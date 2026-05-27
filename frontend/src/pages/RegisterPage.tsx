import { Link, useNavigate } from 'react-router'
import { Input } from '../components/Input'
import { Button } from '../components/Button'
import { BrandLogo } from '../components/BrandLogo'
import { useState } from 'react'
import { register } from '../api/auth'
import { tokenStorage } from '../api/client'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isEmailValid = email.includes('@') && email.trim() !== ''
  const isUsernameValid = username.trim().length >= 3
  const isPasswordValid = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password)
  const isConfirmPasswordValid = confirmPassword === password && confirmPassword.length > 0
  const isFormValid = isEmailValid && isUsernameValid && isPasswordValid && isConfirmPasswordValid

  async function handleRegister() {
    setLoading(true)
    setRegisterError(null)
    try {
      const { access_token } = await register(email, username, password)
      tokenStorage.set(access_token)
      navigate('/promotions')
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setRegisterError(
        detail === 'Email is already registered'
          ? 'Este email já está cadastrado.'
          : 'Erro ao criar conta. Tente novamente.',
      )
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
            Comece agora
          </p>
          <h2 className="font-display text-5xl font-bold text-zinc-100 leading-[1.1]">
            Economize em<br />
            tudo que você<br />
            <span className="text-amber-400">realmente</span> quer.
          </h2>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Crie sua conta grátis e receba promoções personalizadas do Mercado Livre, descritas por IA.
          </p>

          <div className="flex flex-col gap-2 mt-2">
            {['Sem cartão de crédito', 'Cadastro em menos de 1 minuto', 'Promoções filtradas por nicho'].map((benefit) => (
              <div key={benefit} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                <span className="text-xs text-zinc-400">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-zinc-700">© 2026 PromoBot</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm animate-fade-up">

          <div className="mb-8 lg:hidden">
            <BrandLogo size="sm" />
          </div>

          <h1 className="font-display text-2xl font-bold text-zinc-100 mb-1">Criar conta</h1>
          <p className="text-sm text-zinc-500 mb-8">
            Já tem conta?{' '}
            <Link to="/login" className="text-amber-400 hover:text-amber-300 transition-colors">
              Entrar
            </Link>
          </p>

          <form onSubmit={(e) => { e.preventDefault(); handleRegister() }} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="voce@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Username"
              type="text"
              placeholder="seunome"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <div className="relative">
              <Input
                label="Senha"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {password.length > 0 && !isPasswordValid && (
                <ul className="absolute top-full left-0 z-10 mt-1 w-full list-none rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-xs shadow-xl shadow-black/30 space-y-1">
                  <li className={password.length >= 8 ? 'text-emerald-400' : 'text-zinc-500'}>
                    {password.length >= 8 ? '✓' : '·'} Mínimo de 8 caracteres
                  </li>
                  <li className={/[A-Z]/.test(password) ? 'text-emerald-400' : 'text-zinc-500'}>
                    {/[A-Z]/.test(password) ? '✓' : '·'} Pelo menos uma letra maiúscula
                  </li>
                  <li className={/[a-z]/.test(password) ? 'text-emerald-400' : 'text-zinc-500'}>
                    {/[a-z]/.test(password) ? '✓' : '·'} Pelo menos uma letra minúscula
                  </li>
                  <li className={/[0-9]/.test(password) ? 'text-emerald-400' : 'text-zinc-500'}>
                    {/[0-9]/.test(password) ? '✓' : '·'} Pelo menos um número
                  </li>
                </ul>
              )}
            </div>

            <Input
              label="Confirmar senha"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={confirmPassword.length > 0 && !isConfirmPasswordValid ? 'As senhas não coincidem' : undefined}
            />

            {registerError && (
              <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                {registerError}
              </p>
            )}

            <Button
              type="submit"
              disabled={!isFormValid || loading}
              loading={loading}
              className="w-full mt-2"
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
