// API Base URL
const API_BASE = '';

// DOM Elements
const endpointSelect = document.getElementById('endpoint-select');
const queryGroup = document.getElementById('query-group');
const queryInput = document.getElementById('query-input');
const slugGroup = document.getElementById('slug-group');
const slugInput = document.getElementById('slug-input');
const dayGroup = document.getElementById('day-group');
const dayInput = document.getElementById('day-input');
const pageGroup = document.getElementById('page-group');
const pageInput = document.getElementById('page-input');
const testBtn = document.getElementById('test-btn');
const clearBtn = document.getElementById('clear-btn');
const resultBody = document.getElementById('result-body');
const resultStatus = document.getElementById('result-status');
const resultTime = document.getElementById('result-time');
const resultSize = document.getElementById('result-size');
const copyResultBtn = document.getElementById('copy-result-btn');
const expandResultBtn = document.getElementById('expand-result-btn');
const clientIp = document.getElementById('client-ip');
const endpointsList = document.getElementById('endpoints-list');

// Endpoint configs
const endpointConfigs = {
    '/': { hasQuery: false, hasSlug: false, hasDay: false, hasPage: false },
    '/health': { hasQuery: false, hasSlug: false, hasDay: false, hasPage: false },
    '/api/latest': { hasQuery: false, hasSlug: false, hasDay: false, hasPage: false },
    '/api/ongoing': { hasQuery: false, hasSlug: false, hasDay: false, hasPage: true },
    '/api/completed': { hasQuery: false, hasSlug: false, hasDay: false, hasPage: true },
    '/api/search': { hasQuery: true, hasSlug: false, hasDay: false, hasPage: false },
    '/api/anime-list': { hasQuery: false, hasSlug: false, hasDay: false, hasPage: false },
    '/api/genres': { hasQuery: false, hasSlug: false, hasDay: false, hasPage: false },
    '/api/schedule': { hasQuery: false, hasSlug: false, hasDay: false, hasPage: false },
    '/api/anime': { hasQuery: false, hasSlug: true, hasDay: false, hasPage: false },
    '/api/episode': { hasQuery: false, hasSlug: true, hasDay: false, hasPage: false },
    '/api/batch': { hasQuery: false, hasSlug: true, hasDay: false, hasPage: false },
    '/api/complete-downloads': { hasQuery: false, hasSlug: true, hasDay: false, hasPage: false },
    '/api/ongoing-by-day': { hasQuery: false, hasSlug: false, hasDay: true, hasPage: false },
};

// All endpoints data
const allEndpoints = [
    { group: 'Service', method: 'GET', path: '/', desc: 'Service info' },
    { group: 'Service', method: 'GET', path: '/health', desc: 'Health check' },
    { group: 'Main', method: 'GET', path: '/api/latest', desc: 'Latest anime from homepage' },
    { group: 'Main', method: 'GET', path: '/api/ongoing?page=1', desc: 'Ongoing anime with pagination' },
    { group: 'Main', method: 'GET', path: '/api/completed?page=1', desc: 'Completed anime with pagination' },
    { group: 'Main', method: 'GET', path: '/api/search?q=keyword', desc: 'Search anime (series only)' },
    { group: 'List', method: 'GET', path: '/api/anime-list', desc: 'All anime list' },
    { group: 'List', method: 'GET', path: '/api/genres', desc: 'All genres' },
    { group: 'List', method: 'GET', path: '/api/schedule', desc: 'Release schedule' },
    { group: 'Detail', method: 'GET', path: '/api/anime/:slug', desc: 'Anime detail with episodes' },
    { group: 'Detail', method: 'GET', path: '/api/episode/:slug', desc: 'Episode detail with streams & downloads' },
    { group: 'Detail', method: 'GET', path: '/api/batch/:slug', desc: 'Batch download detail' },
    { group: 'Detail', method: 'GET', path: '/api/complete-downloads/:slug', desc: 'Complete downloads all episodes' },
    { group: 'Advanced', method: 'GET', path: '/api/ongoing-by-day/:day', desc: 'Ongoing anime by day (senin-sabtu)' },
];

// Render endpoints
function renderEndpoints() {
    const groups = {};
    allEndpoints.forEach(ep => {
        if (!groups[ep.group]) groups[ep.group] = [];
        groups[ep.group].push(ep);
    });

    let html = '';
    for (const [group, endpoints] of Object.entries(groups)) {
        const iconMap = {
            'Service': 'heartbeat',
            'Main': 'database',
            'List': 'list',
            'Detail': 'info-circle',
            'Advanced': 'star'
        };
        html += `
            <div class="endpoint-group">
                <div class="group-title"><i class="fas fa-${iconMap[group] || 'circle'}"></i> ${group}</div>
        `;
        endpoints.forEach(ep => {
            const methodClass = `method-${ep.method.toLowerCase()}`;
            html += `
                <div class="endpoint">
                    <div class="endpoint-left">
                        <span class="method ${methodClass}">${ep.method}</span>
                        <span class="path">${ep.path}</span>
                    </div>
                    <div class="endpoint-right">
                        <span class="desc">${ep.desc}</span>
                        <button class="copy-btn" onclick="copyToClipboard('${ep.path}')" title="Copy">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }
    endpointsList.innerHTML = html;
}
renderEndpoints();

// Get client IP
async function getClientIP() {
    try {
        const response = await fetch('/health');
        const data = await response.json();
        if (data.ok) {
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
    const config = endpointConfigs[value] || { hasQuery: false, hasSlug: false, hasDay: false, hasPage: false };
    
    queryGroup.style.display = config.hasQuery ? 'flex' : 'none';
    slugGroup.style.display = config.hasSlug ? 'flex' : 'none';
    dayGroup.style.display = config.hasDay ? 'flex' : 'none';
    pageGroup.style.display = config.hasPage ? 'flex' : 'none';
});

// Quick buttons
document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const endpoint = this.dataset.endpoint;
        const query = this.dataset.query || '';
        const day = this.dataset.day || '';
        
        // Set select value
        const selectOption = endpointSelect.querySelector(`option[value="${endpoint}"]`);
        if (selectOption) {
            endpointSelect.value = endpoint;
            endpointSelect.dispatchEvent(new Event('change'));
        }
        
        // Set query if exists
        if (query && queryInput) {
            queryInput.value = query;
        }
        
        // Set day if exists
        if (day && dayInput) {
            dayInput.value = day;
        }
        
        // Auto click test
        testBtn.click();
    });
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
    } else if (endpoint === '/api/ongoing' || endpoint === '/api/completed') {
        const page = pageInput.value.trim() || '1';
        url = `${endpoint}?page=${parseInt(page) || 1}`;
    } else if (endpoint === '/api/anime' || endpoint === '/api/episode' || 
               endpoint === '/api/batch' || endpoint === '/api/complete-downloads') {
        const slug = slugInput.value.trim();
        if (!slug) {
            showToast('Please enter a slug', 'warning');
            return;
        }
        url = `${endpoint}/${encodeURIComponent(slug)}`;
    } else if (endpoint === '/api/ongoing-by-day') {
        const day = dayInput.value.trim();
        if (!day) {
            showToast('Please select a day', 'warning');
            return;
        }
        url = `${endpoint}/${encodeURIComponent(day)}`;
    }
    
    await testApi(url);
});

// Clear result
clearBtn.addEventListener('click', function() {
    resultBody.innerHTML = `
        <div class="result-placeholder">
            <i class="fas fa-arrow-up"></i>
            <p>Click "Test" or quick button to see response</p>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 8px;">
                <i class="fas fa-info-circle"></i> 
                If you get 403 error, the website is blocking the request. Try again in a few minutes.
            </p>
        </div>
    `;
    resultStatus.className = 'result-status';
    resultStatus.innerHTML = '<i class="fas fa-circle"></i> Ready';
    resultTime.textContent = '';
    resultSize.textContent = '';
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

// Expand result
let isExpanded = false;
expandResultBtn.addEventListener('click', function() {
    isExpanded = !isExpanded;
    const body = document.querySelector('.result-body');
    if (isExpanded) {
        body.style.maxHeight = '800px';
        this.innerHTML = '<i class="fas fa-compress"></i>';
    } else {
        body.style.maxHeight = '500px';
        this.innerHTML = '<i class="fas fa-expand"></i>';
    }
});

// ========================================
// TEST API FUNCTION
// ========================================
async function testApi(url) {
    const startTime = Date.now();
    
    // Set loading state
    testBtn.disabled = true;
    testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
    resultStatus.className = 'result-status loading';
    resultStatus.innerHTML = '<i class="fas fa-circle"></i> Loading...';
    resultTime.textContent = '';
    resultSize.textContent = '';
    
    try {
        const response = await fetch(url);
        const duration = Date.now() - startTime;
        
        // Cek content-type
        const contentType = response.headers.get('content-type') || '';
        
        // Baca response sebagai text dulu
        const rawText = await response.text();
        
        // Coba parse JSON
        let data = null;
        let isJson = false;
        
        try {
            if (contentType.includes('application/json') || rawText.trim().startsWith('{') || rawText.trim().startsWith('[')) {
                data = JSON.parse(rawText);
                isJson = true;
            }
        } catch (parseError) {
            console.warn('Response is not valid JSON:', parseError.message);
        }
        
        const size = new Blob([rawText]).size;
        
        // Tampilkan response
        if (isJson && data) {
            const formatted = syntaxHighlight(JSON.stringify(data, null, 2));
            resultBody.innerHTML = `<pre>${formatted}</pre>`;
            
            if (response.ok && data.ok !== false) {
                resultStatus.className = 'result-status success';
                resultStatus.innerHTML = '<i class="fas fa-circle"></i> Success';
                showToast('Request successful!', 'success');
            } else {
                resultStatus.className = 'result-status error';
                resultStatus.innerHTML = '<i class="fas fa-circle"></i> Error';
                showToast(`Error: ${data.error || data.message || response.status}`, 'error');
            }
        } else {
            const isHtml = rawText.includes('<html') || rawText.includes('<!DOCTYPE');
            const isError = rawText.includes('403') || rawText.includes('Forbidden') || rawText.includes('blocked');
            
            let displayText = rawText;
            if (isError) {
                displayText = '⚠️ Access Denied (403)\n\nThe website is blocking the request. This usually happens when:\n• The website detects automated requests\n• The IP address is rate-limited\n• The User-Agent is blocked\n\nTry again in a few minutes or use a different network.';
                resultStatus.className = 'result-status error';
                resultStatus.innerHTML = '<i class="fas fa-circle"></i> Blocked (403)';
                showToast('Access Denied (403) - Website blocking request', 'error');
            } else if (isHtml) {
                displayText = '📄 HTML Response (not JSON)\n\n' + rawText.substring(0, 500) + (rawText.length > 500 ? '\n\n... (truncated)' : '');
                resultStatus.className = 'result-status error';
                resultStatus.innerHTML = '<i class="fas fa-circle"></i> Not JSON';
                showToast('Response is HTML, not JSON', 'warning');
            } else {
                displayText = '📝 Text Response\n\n' + rawText.substring(0, 500) + (rawText.length > 500 ? '\n\n... (truncated)' : '');
                resultStatus.className = 'result-status error';
                resultStatus.innerHTML = '<i class="fas fa-circle"></i> Invalid Response';
                showToast('Invalid response format', 'warning');
            }
            
            resultBody.innerHTML = `<pre style="color: #fbbf24;">${escapeHtml(displayText)}</pre>`;
        }
        
        resultTime.textContent = `${duration}ms`;
        resultSize.textContent = `${(size / 1024).toFixed(1)}KB`;
        
    } catch (error) {
        resultBody.innerHTML = `
            <pre style="color: #f87171;">
❌ Connection Error

${error.message}

Possible causes:
• Server is not running
• Network connection issue
• CORS policy blocking the request
• Invalid URL: ${url}
            </pre>
        `;
        resultStatus.className = 'result-status error';
        resultStatus.innerHTML = '<i class="fas fa-circle"></i> Connection Error';
        showToast('Failed to connect to API', 'error');
        
    } finally {
        testBtn.disabled = false;
        testBtn.innerHTML = '<i class="fas fa-play"></i> Test';
    }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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

function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied!', 'success');
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
        showToast('Copied!', 'success');
    } catch {
        showToast('Failed to copy', 'error');
    }
    document.body.removeChild(textarea);
}

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
console.log('%c🔄 Fallback: 5 domains', 'font-size: 14px; color: #f59e0b;');
console.log('%c💡 Tip: Ctrl+Enter to test API', 'font-size: 14px; color: #f59e0b;');