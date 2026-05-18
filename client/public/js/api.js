// js/api.js

const API_BASE = '/api';

/**
 * Fetch wrapper that automatically attaches the JWT token
 * and handles JSON parsing / error throwing.
 */
async function fetchAPI(endpoint, options = {}) {
    let authHeader = {};
    const token = localStorage.getItem('supabase.auth.token');

    if (token) {
        try {
            const parsed = JSON.parse(token);
            const accessToken = parsed.currentSession?.access_token || parsed.access_token || token;
            if (accessToken) {
                authHeader = {
                    'Authorization': `Bearer ${accessToken}`
                };
            }
        } catch (e) {
            // If it's not JSON, maybe it's just the raw token string
            authHeader = {
                'Authorization': `Bearer ${token}`
            };
        }
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...authHeader,
            ...options.headers,
        },
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || 'API Error');
    }

    return data;
}

// Export for module usage or attach to window for standard scripts
window.fetchAPI = fetchAPI;
