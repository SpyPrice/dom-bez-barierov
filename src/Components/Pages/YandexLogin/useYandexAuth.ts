import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

const STORAGE_KEY = 'yandex_user';
const AUTH_START_URL = `${import.meta.env.VITE_SERVER_URL || 'http://localhost:8000'}/api/auth/yandex`;

export interface YandexUser {
    yandex_id: string;
    login: string;
    display_name: string;
}

function readStoredUser(): YandexUser | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as YandexUser;
    } catch {
        localStorage.removeItem(STORAGE_KEY);
        return null;
    }
}

export function useYandexAuth() {
    const [user, setUser] = useState<YandexUser | null>(() => readStoredUser());

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        const authError = params.get('auth_error');
        if (authError) {
            toast.error(`Ошибка входа: ${authError}`);
            window.history.replaceState({}, '', window.location.pathname);
            return;
        }

        const yandexId = params.get('yandex_id');
        if (yandexId) {
            const incoming: YandexUser = {
                yandex_id: yandexId,
                login: params.get('login') || '',
                display_name: params.get('display_name') || '',
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(incoming));
            setUser(incoming);
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const login = () => {
        window.location.href = AUTH_START_URL;
    };

    const logout = () => {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
    };

    return { user, login, logout };
}