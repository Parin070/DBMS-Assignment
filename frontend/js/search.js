const token = localStorage.getItem('token');
if (!token) window.location.href = 'index.html';

document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});

async function performSearch() {
    const q = document.getElementById('searchInput').value.trim();
    if (!q) return;

    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const results = await res.json();
    
    const container = document.getElementById('searchContainer');
    container.innerHTML = `<h3>Found ${results.length} results for "${q}"</h3><br>`;
    
    if (results.length === 0) {
        container.innerHTML += '<p>No matching messages.</p>';
        return;
    }
    
    results.forEach(m => {
        const div = document.createElement('div');
        div.className = 'result-card';
        
        // Highlight keyword
        const regex = new RegExp(`(${q})`, 'gi');
        const highlighted = m.content.replace(regex, '<span class="highlight">$1</span>');
        
        div.innerHTML = `
            <div style="font-size: 0.8em; color: var(--text-secondary); margin-bottom: 10px; display: flex; justify-content: space-between;">
                <span>Session: ${m.session_title}</span>
                <span>${new Date(m.timestamp).toLocaleString()}</span>
            </div>
            <div style="margin-bottom: 10px; color: ${m.role === 'user' ? 'var(--text-primary)' : 'var(--accent-color)'}">
                [${m.role.toUpperCase()}]
            </div>
            <div>
                ${highlighted.replace(/\n/g, '<br>')}
            </div>
        `;
        container.appendChild(div);
    });
}
