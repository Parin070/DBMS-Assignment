// js/auth.js
document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = 'chat.html';
    }

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorDiv = document.getElementById('loginError');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = 'chat.html';
            } else {
                errorDiv.innerText = data.error || 'Login failed';
            }
        } catch (err) {
            errorDiv.innerText = 'Network error';
        }
    });

    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const errorDiv = document.getElementById('regError');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = 'chat.html';
            } else {
                errorDiv.innerText = data.error || 'Registration failed';
            }
        } catch (err) {
            errorDiv.innerText = 'Network error';
        }
    });
});

function toggleAuth() {
    const loginBox = document.getElementById('loginBox');
    const registerBox = document.getElementById('registerBox');
    
    if (loginBox.style.display === 'none') {
        loginBox.style.display = 'block';
        registerBox.style.display = 'none';
    } else {
        loginBox.style.display = 'none';
        registerBox.style.display = 'block';
    }
}
