// js/auth.js

/**
 * Checks if user is authenticated and has required role.
 * Redirects if necessary.
 */
async function checkAuth(requiredRoles = []) {
    const token = localStorage.getItem('supabase.auth.token');
    
    // If not on login page and no token, redirect to login
    const isAuthPage = window.location.pathname === '/' || window.location.pathname === '/index.html';
    
    if (!token && !isAuthPage) {
        window.location.href = '/';
        return null;
    }
    
    if (token) {
        try {
            // We use the backend to fetch current user profile using the token
            // A dedicated endpoint like /api/auth/me could be used, or we just trust the local storage user object let's parse local storage if we set it during login
            // For now
            const profileStr = localStorage.getItem('user.profile');
            if (!profileStr && !isAuthPage) {
                localStorage.removeItem('supabase.auth.token');
                window.location.href = '/';
                return null;
            }
            
            let profile = null;
            if (profileStr) {
                profile = JSON.parse(profileStr);
            }
            
            // If on login page and logged in, redirect to respective dashboard
            if (isAuthPage && profile) {
                redirectBasedOnRole(profile.role);
                return profile;
            }
            
            // If page requires specific roles and user doesn't have it, redirect
            if (requiredRoles.length > 0 && profile && !requiredRoles.includes(profile.role)) {
                redirectBasedOnRole(profile.role);
                return null;
            }
            
            renderNavbar(profile);
            return profile;
        } catch (e) {
            console.error('Auth error', e);
            if (!isAuthPage) {
                localStorage.removeItem('supabase.auth.token');
                localStorage.removeItem('user.profile');
                window.location.href = '/';
            }
            return null;
        }
    }
    return null;
}

function redirectBasedOnRole(role) {
    if (role === 'admin') window.location.href = '/admin.html';
    else if (role === 'professor') window.location.href = '/professor.html';
    else window.location.href = '/dashboard.html';
}

function logout() {
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('user.profile');
    window.location.href = '/';
}

function renderNavbar(profile) {
    const navContainer = document.getElementById('navbar-container');
    if (!navContainer || !profile) return;
    
    let linksHTML = '';
    if (profile.role === 'student') linksHTML += `<a href="/dashboard.html" class="nav-link">Dashboard</a>`;
    if (profile.role === 'admin') linksHTML += `<a href="/admin.html" class="nav-link">Admin Portal</a>`;
    if (profile.role === 'professor') linksHTML += `<a href="/professor.html" class="nav-link">Professor Portal</a>`;
    
    linksHTML += `<a href="/marketplace.html" class="nav-link">Marketplace</a>`;
    
    const pendingText = profile.status === 'pending' ? `<span style="color: orange; margin-left: 5px;">(Pending)</span>` : '';
    
    navContainer.innerHTML = `
        <nav class="navbar">
            <a href="#" style="display: flex; align-items: center; gap: 8px;" onclick="redirectBasedOnRole('${profile.role}'); return false;">
                <div style="width: 24px; height: 24px; background: var(--neon-primary); border-radius: 50%; box-shadow: 0 0 10px var(--neon-primary);"></div>
                <h2 class="gradient-text" style="margin: 0;">UniRewards</h2>
            </a>
            
            <div class="nav-links">
                ${linksHTML}
                <div style="color: var(--text-main); border-left: 1px solid var(--border-color); padding-left: 1rem; margin-left: 0.5rem; display: flex; align-items: center;">
                    <span style="font-size: 0.9rem; color: var(--text-muted); margin-right: 10px;">
                        ${profile.role.toUpperCase()}
                        ${pendingText}
                        <br />Bal: <span style="color: var(--neon-primary); font-weight: bold;">${profile.balance || 0} pts</span>
                    </span>
                    <button onclick="logout()" class="btn-secondary" style="padding: 6px 12px; font-size: 0.8rem;">Logout</button>
                </div>
            </div>
        </nav>
    `;
}

// Make functions globally available
window.checkAuth = checkAuth;
window.redirectBasedOnRole = redirectBasedOnRole;
window.logout = logout;
window.renderNavbar = renderNavbar;
