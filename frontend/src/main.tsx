import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router'
import './index.css'

import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import NichesPage from './pages/NichesPage'
import PromotionsPage from './pages/PromotionsPage'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    element: <Layout />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <Navigate to="/promotions" replace /> },
          { path: 'promotions', element: <PromotionsPage /> }, // protected
          { path: 'niches', element: <NichesPage /> }, // protected
        ],
      },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
