import type { ReactNode } from 'react'
import { BrandLogo } from './BrandLogo'

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
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <div>{logo ?? <BrandLogo size="sm" />}</div>

          {navItems.length > 0 && (
            <nav className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="px-3 py-1.5 text-sm text-zinc-400 rounded-md hover:text-zinc-100 hover:bg-zinc-800 transition-colors duration-150"
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
