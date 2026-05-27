import { Outlet, useNavigate } from 'react-router'
import { Header } from './Header'
import { Button } from './Button'
import { tokenStorage } from '../api/client'

const NAV_ITEMS = [
  { label: 'Promoções', href: '/promotions' },
  { label: 'Nichos', href: '/niches' },
]

export default function Layout() {
  const navigate = useNavigate()

  function handleLogout() {
    tokenStorage.clear()
    navigate('/login')
  }

  return (
    <>
      <Header
        navItems={NAV_ITEMS}
        actions={
          <Button variant="ghost" size="sm" onClick={handleLogout}>Sair</Button>
        }
      />
      <Outlet />
    </>
  )
}
