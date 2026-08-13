// API Base URL
const API_BASE = '';

// DOM Elements
const endpointSelect = document.getElementById('endpoint-select');
const queryGroup = document.getElementById('query-group');
const queryInput = document.getElementById('query-input');
const slugGroup = document.getElementById('slug-group');
const slugInput = document.getElementById('slug-input');
const testBtn = document.getElementById('test-btn');
const clearBtn = document.getElementById('clear-btn');
const resultBody = document.getElementById('result-body');
const resultStatus = document.getElementById('result-status');
const resultTime = document.getElementById('result-time');
const copyResultBtn = document.getElementById('copy-result-btn');
const clientIp = document.getElementById('client-ip');

// Endpoint configs
const endpointConfigs = {
    '/api/latest': { hasQuery: false, hasSlug: false },
    '/api/ongoing': { hasQuery: false, hasSlug: false },
    '/api/completed': { hasQuery: false, hasSlug: false },
    '/api/genres': { hasQuery: false, hasSlug: false },
    '/api/schedule': { hasQuery: false, hasSlug: false },
    '/api/anime-list': { hasQuery: false, hasSlug: false },
    '/api/search': { hasQuery: true, hasSlug: false },
    '/api/anime': { hasQuery: false, hasSlug: true },
    '/api/episode': { hasQuery: false, hasSlug: true },
    '/api/batch': { hasQuery: false, hasSlug: true },
    '/api/complete-downloads': { hasQuery: false, hasSlug: true },
};

// Get client IP
async function getClientIP() {
    try {
        const response = await fetch('/health');
        const data = await response.json();
        if (data.ok && data.data) {
            clientIp.textContent = 'Connected';
        } else {
            clientIp.textContent = 'API Ready';
        }
    } catch {
        clientIp.textContent = 'API Ready';
    }
}
getClientIP();

// Update input visibility based on endpoint
endpointSelect.addEventListener('change', function() {
    const value = this.value;
    const config = endpointConfigs[value] || { hasQuery: false, hasSlug: false };
    
    queryGroup.style.display = config.hasQuery ? 'flex' : 'none';
    slugGroup.style.display = config.hasSlug ? 'flex' : 'none';
});

// Test API
testBtn.addEventListener('click', async function() {
    const endpoint = endpointSelect.value;
    let url = endpoint;
    
    // Build URL with params
    if (endpoint === '/api/search') {
        const query = queryInput.value.trim();
        if (!query) {
            showToast('Please enter a search query', 'warning');
            return;
        }
        url = `${endpoint}?q=${encodeURIComponent(query)}`;
    } else if (endpoint === '/api/anime' || endpoint === '/api/episode' || 
               endpoint === '/api/batch' || endpoint === '/api/complete-downloads') {
        const slug = slugInput.value.trim();
        if (!slug) {
            showToast('Please enter a slug', 'warning');
            return;
        }
        url = `${endpoint}/${encodeURIComponent(slug)}`;
    }
    
    await testApi(url);
});

// Clear result
clearBtn.addEventListener('click', function() {
    resultBody.innerHTML = `
        <div class="result-placeholder">
            <i class="fas fa-arrow-up"></i>
            <p>Click "Test API" to see response</p>
        </div>
    `;
    resultStatus.className = 'result-status';
    resultStatus.innerHTML = '<i class="fas fa-circle"></i> Ready';
    resultTime.textContent = '';
});

// Copy result
copyResultBtn.addEventListener('click', function() {
    const pre = resultBody.querySelector('pre');
    if (pre) {
        const text = pre.textContent;
        copyToClipboard(text);
    } else {
        showToast('Nothing to copy', 'warning');
    }
});

// Test API function
async function testApi(url) {
    const startTime = Date.now();
    
    // Set loading state
    testBtn.disabled = true;
    testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    resultStatus.className = 'result-status loading';
    resultStatus.innerHTML = '<i class="fas fa-circle"></i> Loading...';
    resultTime.textContent = '';
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        const duration = Date.now() - startTime;
        
        // Format JSON with syntax highlighting
        const formatted = syntaxHighlight(JSON.stringify(data, null, 2));
        
        resultBody.innerHTML = `<pre>${formatted}</pre>`;
        resultTime.textContent = `${duration}ms`;
        
        // Update status
        if (response.ok && data.ok !== false) {
            resultStatus.className = 'result-status success';
            resultStatus.innerHTML = '<i class="fas fa-circle"></i> Success';
            showToast('API request successful!', 'success');
        } else {
            resultStatus.className = 'result-status error';
            resultStatus.innerHTML = '<i class="fas fa-circle"></i> Error';
            showToast(`Error: ${data.error || response.status}`, 'error');
        }
    } catch (error) {
        resultBody.innerHTML = `
            <pre style="color: #f87171;">Error: ${error.message}</pre>
        `;
        resultStatus.className = 'result-status error';
        resultStatus.innerHTML = '<i class="fas fa-circle"></i> Connection Error';
        showToast('Failed to connect to API', 'error');
    } finally {
        testBtn.disabled = false;
        testBtn.innerHTML = '<i class="fas fa-play"></i> Test API';
    }
}

// Syntax highlighting for JSON
function syntaxHighlight(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let cls = 'json-number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'json-key';
            } else {
                cls = 'json-string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'json-boolean';
        } else if (/null/.test(match)) {
            cls = 'json-null';
        } else if (/[\[\{\]}]/.test(match)) {
            cls = 'json-bracket';
        }
        return `<span class="${cls}">${match}</span>`;
    });
}

// Copy to clipboard
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard!', 'success');
        }).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showToast('Copied to clipboard!', 'success');
    } catch (err) {
        showToast('Failed to copy', 'error');
    }
    document.body.removeChild(textarea);
}

// Toast notification
function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    
    let icon = 'fa-check-circle';
    let color = '#10b981';
    if (type === 'error') {
        icon = 'fa-times-circle';
        color = '#ef4444';
    } else if (type === 'warning') {
        icon = 'fa-exclamation-circle';
        color = '#f59e0b';
    }
    
    toast.innerHTML = `
        <i class="fas ${icon}" style="color: ${color};"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        testBtn.click();
    }
    if (e.key === 'Escape') {
        clearBtn.click();
    }
});

// Console greeting
console.log('%c🎌 Otakudesu REST API v2.0', 'font-size: 24px; font-weight: bold; color: #667eea;');
console.log('%c📚 Docs: /docs', 'font-size: 14px; color: #6b7280;');
console.log('%c🔒 Trust Proxy: Enabled', 'font-size: 14px; color: #10b981;');
console.log('%c💡 Tip: Ctrl+Enter to test API', 'font-size: 14px; color: #f59e0b;');