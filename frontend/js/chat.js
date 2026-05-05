const token = localStorage.getItem('token');
if (!token) window.location.href = 'index.html';

let currentSessionId = null;
let contextSessionId = null;
let contextTitle = null;

const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
};

document.addEventListener('DOMContentLoaded', () => {
    loadSessions();
    
    document.getElementById('chatForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('messageInput');
        const text = input.value.trim();
        if (!text || !currentSessionId) return;

        // check natural language trigger
        if (/refer to|continue from|based on my previous chat/i.test(text) && !contextSessionId) {
            openContextModal();
            return;
        }

        input.value = '';
        appendMessage('user', text);
        
        try {
            const res = await fetch(`/api/sessions/${currentSessionId}/messages`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ content: text, context_session_id: contextSessionId })
            });
            const data = await res.json();
            if (res.ok) {
                appendMessage('assistant', data.content, data.id);
            }
        } catch (err) {
            console.error(err);
        }
    });
});

async function loadSessions() {
    const res = await fetch('/api/sessions', { headers });
    const sessions = await res.json();
    const list = document.getElementById('sessionList');
    list.innerHTML = '';
    
    sessions.forEach(s => {
        const li = document.createElement('li');
        li.className = `session-item ${s.id === currentSessionId ? 'active' : ''}`;
        li.innerHTML = `
            <span onclick="openSession(${s.id}, '${s.title.replace(/'/g, "\\'")}')">${s.title}</span>
            <button class="delete-btn" onclick="deleteSession(${s.id}, event)">x</button>
        `;
        list.appendChild(li);
    });
}

async function createNewSession() {
    const title = prompt('Enter session title:');
    if (!title) return;
    const res = await fetch('/api/sessions', {
        method: 'POST',
        headers,
        body: JSON.stringify({ title })
    });
    const session = await res.json();
    if (res.ok) {
        openSession(session.id, session.title);
        loadSessions();
    }
}

async function deleteSession(id, event) {
    event.stopPropagation();
    if (!confirm('Delete this session?')) return;
    await fetch(`/api/sessions/${id}`, { method: 'DELETE', headers });
    if (currentSessionId === id) {
        currentSessionId = null;
        document.getElementById('chatMessages').innerHTML = '';
        document.getElementById('currentSessionTitle').innerText = '> Select a session_';
        document.getElementById('messageInput').disabled = true;
        document.getElementById('sendBtn').disabled = true;
    }
    loadSessions();
}

async function openSession(id, title) {
    currentSessionId = id;
    document.getElementById('currentSessionTitle').innerText = `> ${title}_`;
    document.getElementById('messageInput').disabled = false;
    document.getElementById('sendBtn').disabled = false;
    
    // reset context on session change
    clearContext();
    loadSessions(); // to update active class

    const res = await fetch(`/api/sessions/${id}/messages`, { headers });
    const messages = await res.json();
    
    const container = document.getElementById('chatMessages');
    container.innerHTML = '';
    messages.forEach(m => appendMessage(m.role, m.content, m.id));
}

function appendMessage(role, content, msgId = null) {
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = `message ${role}`;
    
    let contentHtml = `<div class="content">${content.replace(/\n/g, '<br>')}</div>`;
    let metaHtml = `<div class="message-meta"><span>${role.toUpperCase()}</span>`;
    
    if (role === 'assistant' && msgId) {
        metaHtml += `<button class="bookmark-btn" onclick="bookmarkMessage(${msgId})" title="Bookmark this message">★</button>`;
    }
    metaHtml += `</div>`;
    
    div.innerHTML = contentHtml + metaHtml;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

async function bookmarkMessage(msgId) {
    const note = prompt('Add a note for this bookmark (optional):');
    if (note === null) return;
    await fetch('/api/bookmarks', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message_id: msgId, note })
    });
    alert('Bookmarked successfully!');
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// --- Context Modal Logic ---
let tempContextSelection = null;

async function openContextModal() {
    const res = await fetch('/api/sessions', { headers });
    const sessions = await res.json();
    
    const list = document.getElementById('contextSessionList');
    list.innerHTML = '';
    
    sessions.forEach(s => {
        if (s.id === currentSessionId) return; // skip current
        const div = document.createElement('div');
        div.className = 'session-picker-item';
        div.innerText = s.title + ' (' + new Date(s.last_active).toLocaleDateString() + ')';
        div.onclick = () => selectContextSession(s.id, s.title, div);
        list.appendChild(div);
    });
    
    document.getElementById('contextPreview').style.display = 'none';
    document.getElementById('contextModal').style.display = 'flex';
}

function closeContextModal() {
    document.getElementById('contextModal').style.display = 'none';
}

async function selectContextSession(id, title, el) {
    document.querySelectorAll('.session-picker-item').forEach(d => d.classList.remove('selected'));
    el.classList.add('selected');
    
    tempContextSelection = { id, title };
    
    const res = await fetch(`/api/sessions/${id}/messages/summary`, { headers });
    const data = await res.json();
    
    const preview = document.getElementById('contextPreview');
    preview.style.display = 'block';
    
    let html = `<strong>Preview (${data.total} messages):</strong><br>`;
    data.messages.forEach(m => {
        const text = m.content.length > 50 ? m.content.substring(0, 50) + '...' : m.content;
        html += `<div style="margin-top: 5px; color: ${m.role === 'user' ? 'var(--text-secondary)' : 'var(--accent-color)'}">[${m.role}] ${text}</div>`;
    });
    preview.innerHTML = html;
}

function confirmContext() {
    if (!tempContextSelection) return;
    contextSessionId = tempContextSelection.id;
    contextTitle = tempContextSelection.title;
    
    const badge = document.getElementById('contextBadge');
    badge.style.display = 'block';
    badge.innerHTML = `[Context: ${contextTitle}] <span onclick="clearContext()" style="cursor:pointer; margin-left:5px;">x</span>`;
    
    closeContextModal();
}

function clearContext() {
    contextSessionId = null;
    contextTitle = null;
    document.getElementById('contextBadge').style.display = 'none';
}
