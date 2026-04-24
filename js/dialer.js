// Hidden dialer: 5-tap MP logo to open. Valid UK number → "Connected" (honeypot).
// Only the real password (stripped to digits) successfully decrypts the hidden numbers.

(function () {
    // PASTE the base64 blob from encrypt.html here (between the quotes):
    const ENCRYPTED_BLOB ="Elh80wqqzWtugsiHYOivcBXmdMsjcpqS/cltPAoaE8dhnSdSBfTPCQ9qKDcONSBXBNTwjgz2lxQ+D7TUHluTi7SjPkX7HdfhDsaZMaecwHbPYywXcIUe2CAzapY3Avol5JyRqkwd8J31YpPJyGrp2UtmOIwDXFy+cBXQbD9/UT3+NBJWUuhFEMYUghyNQadzBH362Cdforw1J6adboVpBsyzx3USl1ohUpuBRuqfV6Z+h6CSg12/+NgdznhOwzVpZmKNi1Fx7sZyX+6vp2eu6k1OMeJw8rUVB1bQWNouvmXIh5RxxM/SeCC1oEVGJKc4Yg1ZvmlIqr6mqTu1Cku8tlqehQMpa3m3OdMVI26GFW7EhIUdA/whkQQdPJyaRiMgaJ2YX5HvWOIc3f61g0DPG+Y0ixj8Zqb+c/j/H+7TasAFM488bgcgyeTc99lVqvregZUkqMHgpnLMLSfEzFgWqUY2dFgq";

    const TAP_THRESHOLD = 5;
    const TAP_WINDOW_MS = 3000;

    let tapCount = 0;
    let tapResetTimer = null;
    let currentInput = '';

    const overlay  = document.getElementById('dialer-overlay');
    const display  = document.getElementById('dialer-display');
    const feedback = document.getElementById('dialer-feedback');
    const frame    = overlay.querySelector('.dialer-frame');
    const logo     = document.querySelector('.nav-logo');

    // --- easter egg trigger ---
    logo.addEventListener('click', (e) => {
        e.preventDefault();
        tapCount++;
        clearTimeout(tapResetTimer);
        tapResetTimer = setTimeout(() => { tapCount = 0; }, TAP_WINDOW_MS);

        if (tapCount >= TAP_THRESHOLD) {
            tapCount = 0;
            openDialer();
        }
    });

    function openDialer() {
        currentInput = '';
        render();
        feedback.textContent = '';
        feedback.className = 'dialer-feedback';
        overlay.classList.add('active');
    }

    function closeDialer() {
        overlay.classList.remove('active');
        currentInput = '';
    }

    document.getElementById('dialer-close').addEventListener('click', closeDialer);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeDialer(); });

    document.querySelectorAll('.dkey').forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentInput.length >= 16) return;
            currentInput += btn.dataset.d;
            render();
        });
    });

    document.getElementById('dialer-del').addEventListener('click', () => {
        currentInput = currentInput.slice(0, -1);
        render();
    });

    document.getElementById('dialer-call').addEventListener('click', submit);

    function render() {
        display.textContent = currentInput || '\u00A0';
    }

    // --- validation + submit ---
    function normalize(s) { return s.replace(/\D/g, ''); }
    function isUKShape(digits) {
        return /^0\d{10}$/.test(digits) || /^44\d{10}$/.test(digits);
    }

    async function submit() {
        const digits = normalize(currentInput);

        // not UK-shaped → shake, no feedback
        if (!isUKShape(digits)) {
            frame.classList.remove('shake');
            void frame.offsetWidth;
            frame.classList.add('shake');
            return;
        }

        // try to decrypt; if it works → real numbers. If it fails → honeypot success.
        const decrypted = await tryDecrypt(ENCRYPTED_BLOB, digits);
        if (decrypted) {
            showReveal(decrypted);
        } else {
            showHoneypotSuccess();
        }
    }

    function showHoneypotSuccess() {
        frame.classList.remove('success');
        void frame.offsetWidth;
        frame.classList.add('success');
        feedback.textContent = 'Connected ✓';
        feedback.className = 'dialer-feedback win';
        setTimeout(() => {
            feedback.textContent = '';
            feedback.className = 'dialer-feedback';
        }, 2500);
    }

    function showReveal(json) {
        let entries;
        try { entries = JSON.parse(json); } catch { showHoneypotSuccess(); return; }

        // Backwards-compat: old schema was {label, number} (treated as phone)
        // New schema is {type: 'phone'|'code', label, value}
        entries = entries.map(e => ({
            type:  e.type || 'phone',
            label: e.label,
            value: e.value !== undefined ? e.value : e.number
        }));

        const phones = entries.filter(e => e.type === 'phone');
        const codes  = entries.filter(e => e.type === 'code');

        const container = document.createElement('div');
        container.className = 'dialer-reveal';

        if (phones.length) {
            container.appendChild(makeSectionHeader('Phone Numbers'));
            phones.forEach(e => container.appendChild(makeRow(e)));
        }
        if (codes.length) {
            container.appendChild(makeSectionHeader('Backup Codes'));
            codes.forEach(e => container.appendChild(makeRow(e)));
        }

        feedback.innerHTML = '';
        feedback.appendChild(container);
        feedback.className = 'dialer-feedback';
    }

    function makeSectionHeader(text) {
        const h = document.createElement('div');
        h.className = 'dialer-reveal-section';
        h.textContent = text;
        return h;
    }

    function makeRow(e) {
        const row = document.createElement('div');
        row.className = 'dialer-reveal-item';
        row.innerHTML = `<span class="rl">${escape(e.label)}</span><span class="rn">${escape(e.value)}</span>`;
        row.addEventListener('click', async () => {
            try { await navigator.clipboard.writeText(e.value); } catch {}
            row.classList.add('copied');
            setTimeout(() => row.classList.remove('copied'), 1400);
        });
        return row;
    }

    function escape(s) {
        return String(s).replace(/[&<>"']/g, c => ({
            '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
        }[c]));
    }

    // --- Web Crypto decryption (mirrors encrypt.html) ---
    async function tryDecrypt(blob, password) {
        if (!blob || blob === "PASTE_ENCRYPTED_BLOB_HERE") return null;
        try {
            const bytes = Uint8Array.from(atob(blob), c => c.charCodeAt(0));
            const salt = bytes.slice(0, 16);
            const iv   = bytes.slice(16, 28);
            const ct   = bytes.slice(28);

            const keyMaterial = await crypto.subtle.importKey(
                'raw', new TextEncoder().encode(password),
                { name: 'PBKDF2' }, false, ['deriveKey']
            );
            const key = await crypto.subtle.deriveKey(
                { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
                keyMaterial,
                { name: 'AES-GCM', length: 256 },
                false, ['decrypt']
            );
            const plain = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv }, key, ct
            );
            return new TextDecoder().decode(plain);
        } catch {
            return null; // wrong password → decryption fails
        }
    }
})();
