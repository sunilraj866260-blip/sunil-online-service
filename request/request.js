// ==========================================
// PRINT & AUTO DETECT LOGIC (FIXED)
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const printToken = urlParams.get('printToken');

    // १. यदि यो ट्र्याकिङ, पेमेन्ट वा एडमिन पेज हो भने फाराम सबमिट इन्टरसेप्ट नगर्ने
    const currentPath = window.location.pathname;
    if (currentPath.includes('track.html') || currentPath.includes('payment.html') || currentPath.includes('admin')) {
        return; // यी पेजहरूमा अटोमेटिक Submision नचलाउने
    }

    // २. स्वीकृत भएपछि स्वतः डाटा भरेर प्रिन्ट गर्ने
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

    // ३. मुख्य फारामहरूमा मात्र Submit/Print रोक्ने र Payment मा पठाउने
    const form = document.querySelector('form');
    if (form) {
        form.onsubmit = handleFormSubmission;
    } else {
        const printButtons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
        printButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                if (!printToken) {
                    e.preventDefault();
                    handleFormSubmission(e);
                }
            }, true);
        });
    }
});
