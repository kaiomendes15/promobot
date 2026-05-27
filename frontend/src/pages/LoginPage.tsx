import { BrandLogo } from '../components/BrandLogo'
import { useState } from 'react'
import { Card } from '../components/Card'
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

  const isEmailValid = email.includes('@') && email.trim() !== ''
  const isPasswordNotEmpty = password.length > 0
  const isFormValid = isEmailValid && isPasswordNotEmpty

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
        <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
            <div className="flex flex-col items-center gap-8 w-full max-w-lg">
            <BrandLogo size="lg" />
            <Card padding="lg" className="w-full">
                <h1 className="text-xl font-semibold text-gray-900 mb-6">Login</h1>
                <div className="flex flex-col gap-4">
                    <Input
                        label="Email"
                        type="email"
                        placeholder="exemplo123@gmail.com"
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
                      <p className="text-sm text-red-500">Credenciais inválidas. Tente novamente.</p>
                    )}
                    <Button
                        type="submit"
                        disabled={!isFormValid || loading}
                        onClick={handleLogin}
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </Button>
                    <p className="text-sm text-gray-500">
                        Não possui conta?{' '}
                        <Link to="/register" className="text-violet-600 hover:underline">
                            Cadastrar-se
                        </Link>
                    </p>
                </div>
            </Card>
            </div>
        </main>
    );
}
