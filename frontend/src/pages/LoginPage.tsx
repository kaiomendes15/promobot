import { BrandLogo } from '../components/BrandLogo'

export default function LoginPage() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <div className="flex flex-col items-center gap-8 w-full max-w-lg">
        <BrandLogo size="lg" />
        <p className="text-gray-400 text-sm">Login — em breve</p>
      </div>
    </main>
  )
}
