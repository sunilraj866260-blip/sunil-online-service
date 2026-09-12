// ==========================================
// STRICT PRINT INTERCEPT & REDIRECT LOGIC
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const printToken = urlParams.get('printToken');
    const currentPath = window.location.pathname.toLowerCase();

    // १. track, payment वा admin पेजमा भए केही नगर्ने
    if (currentPath.includes('track.html') || currentPath.includes('payment.html') || currentPath.includes('admin')) {
        return;
    }

    // २. यदि एडमिनले स्वीकृत गरेपछि आएको (printToken भएको) लिंक हो भने अटो-फिल गरेर प्रिन्ट गर्ने
    if (printToken) {
        const req = await getRequestByToken(printToken);
        
        if (req && req.status === 'स्वीकृत (Approved)') {
            const inputs = document.querySelectorAll('input, select, textarea');
            inputs.forEach((input, index) => {
                const key = input.name || input.id || input.placeholder || `फिल्ड_${index + 1}`;
                if (req.data && req.data[key] !== undefined) {
                    input.value = req.data[key];
                }
            });

            const style = document.createElement('style');
            style.innerHTML = '@media print { button, input[type="button"], input[type="submit"], .no-print { display: none !important; } }';
            document.head.appendChild(style);

            setTimeout(() => { window.print(); }, 800);
        } else {
            alert('⚠️ यो निवेदन अझै स्वीकृत भएको छैन।');
            window.location.href = `../request/track.html?token=${printToken}`;
        }
        return;
    }

    // ३. मुख्य फाराममा प्रिन्ट र सबमिट रोकेर सिधै QR Payment मा पठाउने
    
    // ब्राउजरको Keyboard Print Short-cut (Ctrl + P) रोक्ने
    window.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            e.stopImmediatePropagation();
            handleFormSubmission(e);
        }
    }, true);

    // पेजका सबै Button / Input हरूमा Click रोक्ने
    const printButtons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
    printButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            handleFormSubmission(e);
        }, true); // Use capturing phase
    });

    const form = document.querySelector('form');
    if (form) {
        form.onsubmit = function(e) {
            e.preventDefault();
            handleFormSubmission(e);
        };
    }
});
