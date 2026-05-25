import type { ReactNode } from 'react'

interface NavItem {
  label: string
  href: string
}

interface HeaderProps {
  logo?: ReactNode
  navItems?: NavItem[]
  actions?: ReactNode
}

export function Header({ logo, navItems = [], actions }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <div className="text-violet-600 font-semibold text-lg tracking-tight">
            {logo ?? 'PromoBot'}
          </div>

          {navItems.length > 0 && (
            <nav className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="px-3 py-1.5 text-sm text-gray-600 rounded-md hover:text-violet-600 hover:bg-violet-50 transition-colors duration-150"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          )}
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}
