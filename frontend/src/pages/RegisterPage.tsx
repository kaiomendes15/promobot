import { Link } from 'react-router'
import { Button, Card, Input } from "../components";
import { BrandLogo } from "../components/BrandLogo";
import { useState } from 'react';

export default function RegisterPage() {
    const [email, setEmail] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const isEmailValid = email.includes('@') && email.trim() !== ''
    const isUsernameValid = username.trim().length >= 3
    const isPasswordValid = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password)
    const isConfirmPasswordValid = confirmPassword === password

    const isFormValid = isEmailValid && isUsernameValid && isPasswordValid && isConfirmPasswordValid
    return (
        <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
            <div className="flex flex-col items-center gap-8 w-full max-w-lg">
            <BrandLogo size="lg" />
            <Card padding="lg" className="w-full">
                <h1 className="text-xl font-semibold text-gray-900 mb-6">Criar conta</h1>
                <div className="flex flex-col gap-4">
                    <Input
                        label="Email"
                        type="email"
                        placeholder="exemplo123@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <Input
                        label="Username"
                        type="text"
                        placeholder="neymarjr_2018"
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
                            <ul className="absolute top-full left-0 z-10 mt-1 w-full list-disc list-inside rounded-lg border border-gray-100 bg-white px-4 py-2.5 text-xs shadow-sm">
                                <li className={password.length >= 8 ? 'text-emerald-500' : 'text-red-500'}>Mínimo de 8 caracteres</li>
                                <li className={/[A-Z]/.test(password) ? 'text-emerald-500' : 'text-red-500'}>Pelo menos uma letra maiúscula</li>
                                <li className={/[a-z]/.test(password) ? 'text-emerald-500' : 'text-red-500'}>Pelo menos uma letra minúscula</li>
                                <li className={/[0-9]/.test(password) ? 'text-emerald-500' : 'text-red-500'}>Pelo menos um número</li>
                            </ul>
                        )}
                    </div>

                    <Input
                        label="Confirmar senha"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <Button 
                        type="submit"
                        disabled={!isFormValid}
                        onClick={() => {
                            // Lógica para enviar os dados de registro para o backend
                            console.log('Registrando usuário:', { email, username, password })
                        }}
                    >
                        Criar conta
                    </Button>
                    <p className="text-sm text-gray-500">
                        Já tem conta?{' '}
                        <Link to="/login" className="text-violet-600 hover:underline">
                            Entrar
                        </Link>
                    </p>
                </div>
            </Card>
            </div>
        </main>
    );
}