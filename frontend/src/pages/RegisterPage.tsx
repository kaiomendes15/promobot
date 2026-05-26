import { Link } from 'react-router'
import { Card, Input } from "../components";
import { BrandLogo } from "../components/BrandLogo";

export default function RegisterPage() {
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
                    />

                    <Input
                        label="Username"
                        type="text"
                        placeholder="neymarjr_2018"
                    />
                    <Input
                        label="Senha"
                        type="password"
                        placeholder="••••••••"
                    />
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