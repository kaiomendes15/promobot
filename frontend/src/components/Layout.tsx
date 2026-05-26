import { Outlet, Link } from 'react-router'
import { Header } from './Header'
import { Button } from './Button'

const NAV_ITEMS = [
  { label: 'Promoções', href: '/promotions' },
  { label: 'Nichos', href: '/niches' },
]

export default function Layout() {
  return (
    <>
      <Header
        navItems={NAV_ITEMS}
        actions={
          <Link to="/login">
            <Button variant="ghost" size="sm">Sair</Button>
          </Link>
        }
      />
      <Outlet />
    </>
  )
}
