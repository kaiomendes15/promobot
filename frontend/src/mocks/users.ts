import type { User } from '../types/api'

export const MOCK_USERS: User[] = [
    {
        id: 1,
        email: 'neymarjr_2018@gmail.com',
        username: 'neymarjr_2018',
        hashed_password: 'hashed_password_1', // Adicionei a propriedade hashed_password para simular a autenticação
        created_at: '2026-05-25T10:00:00Z',
    },
    {
        id: 2,
        email: 'messi_2018@gmail.com',
        username: 'messi_2018',
        hashed_password: 'hashed_password_2', // Adicionei a propriedade hashed_password para simular a autenticação
        created_at: '2026-05-25T10:00:00Z',
    },
    {
        id: 3,
        email: 'ronaldo_2018@gmail.com',
        username: 'ronaldo_2018',
        hashed_password: 'hashed_password_3', // Adicionei a propriedade hashed_password para simular a autenticação
        created_at: '2026-05-25T10:00:00Z',
    },
]

