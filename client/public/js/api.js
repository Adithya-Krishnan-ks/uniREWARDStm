// js/api.js

const API_BASE = '/api';

/**
 * Fetch wrapper that automatically attaches the JWT token
 * and handles JSON parsing / error throwing.
 */
async function fetchAPI(endpoint, options = {}) {
    let authHeader = {};
    
    // Supabase JS Client automatically handles token refreshes in the background
    // Fetching the session from the client ensures we always get a valid, unexpired token if possible
    if (window.supabaseClient) {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session && session.access_token) {
            authHeader = { 'Authorization': `Bearer ${session.access_token}` };
            // Sync with localStorage for other scripts
            localStorage.setItem('supabase.auth.token', JSON.stringify(session));
        }
    }

    // Fallback for cases where supabaseClient might not be ready
    if (!authHeader['Authorization']) {
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
                authHeader = {
                    'Authorization': `Bearer ${token}`  
                };
            }
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

    const data = await res.json().catch(() => ({}));
    
    // Automatically handle 401 Unauthorized globally (e.g. token expired and couldn't be refreshed)
    if (res.status === 401) {
        if (window.logout) {
            window.logout();
        } else {
            localStorage.removeItem('supabase.auth.token');
            localStorage.removeItem('user.profile');
            window.location.href = '/';
        }
        throw new Error('Session expired. Please log in again.');
    }

    if (!res.ok) {
        throw new Error(data.message || 'API Error');
    }

    return data;
}

// Export for module usage or attach to window for standard scripts
window.fetchAPI = fetchAPI;
