const token = localStorage.getItem('token');
if (!token) window.location.href = 'index.html';

document.addEventListener('DOMContentLoaded', async () => {
    const res = await fetch('/api/bookmarks', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const bookmarks = await res.json();
    
    const container = document.getElementById('bookmarksContainer');
    if (bookmarks.length === 0) {
        container.innerHTML = '<p>No bookmarks found.</p>';
        return;
    }
    
    bookmarks.forEach(b => {
        const div = document.createElement('div');
        div.className = 'result-card';
        div.innerHTML = `
            <div style="font-size: 0.8em; color: var(--text-secondary); margin-bottom: 10px;">
                Session: ${b.session_title} | Date: ${new Date(b.created_at).toLocaleString()}
            </div>
            <div style="margin-bottom: 15px; border-left: 2px solid var(--accent-color); padding-left: 10px;">
                ${b.message_content.replace(/\n/g, '<br>')}
            </div>
            ${b.note ? `<div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 4px; font-style: italic;">Note: ${b.note}</div>` : ''}
        `;
        container.appendChild(div);
    });
});
