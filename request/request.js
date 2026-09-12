// ==========================================
// SUNIL PHOTOS STUDIO - FIREBASE CONFIG & API
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyAVKcK8eTv1W0FtJZX_0vRQ5Vvq52f7BIM",
    databaseURL: "https://sunil-online-service-default-rtdb.firebaseio.com"
};

const API_BASE_URL = firebaseConfig.databaseURL;
const nativePrint = window.print;

// १. क्लाउड (Firebase) मा नयाँ डाटा सेभ गर्ने
async function saveRequestToCloud(type, formData) {
    const token = 'NIV-' + Math.floor(100000 + Math.random() * 900000);
    const currentFileLink = window.location.href.split('?')[0];

    // निवेदकको नाम र फोन नम्बर विभिन्न फारामका नामहरूबाट पत्ता लगाउने
    const applicantName = formData['applicant_name'] || formData['नाम'] || formData['fullname'] || formData['name'] || 'अज्ञात निवेदक';
    const phoneNum = formData['phone'] || formData['मोबाइल'] || formData['सम्पर्क'] || formData['mobile'] || '-';

    const newRequest = {
        token: token,
        type: type || document.title || 'अन्य निवेदन',
        fileLink: currentFileLink,
        applicant_name: applicantName,
        phone: phoneNum,
        esewa_code: '',
        status: 'PENDING',
        today: new Date().toLocaleDateString('ne-NP'),
        timestamp: Date.now(),
        data: formData
    };

    // Firebase database मा 'requests/TOKEN' मा सेभ गर्ने
    try {
        await fetch(`${API_BASE_URL}/requests/${token}.json?key=${firebaseConfig.apiKey}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRequest)
        });
    } catch (error) {
        console.warn("Firebase Storage Error:", error);
    }

    // Backup LocalStorage
    let localRequests = JSON.parse(localStorage.getItem('nivedan_requests')) || [];
    localRequests.push(newRequest);
    localStorage.setItem('nivedan_requests', JSON.stringify(localRequests));

    return token;
}

// २. टोकनबाट डाटा तान्ने
async function getRequestByToken(token) {
    if (!token) return null;
    try {
        const response = await fetch(`${API_BASE_URL}/requests/${token}.json?key=${firebaseConfig.apiKey}`);
        if (response.ok) {
            const data = await response.json();
            if (data) return data;
        }
    } catch (error) {
        console.warn("Firebase Fetch Error:", error);
    }
    const localRequests = JSON.parse(localStorage.getItem('nivedan_requests')) || [];
    return localRequests.find(req => req.token === token) || null;
}

// ३. eSewa Code वा Status अपडेट गर्ने
async function updateRequestField(token, fieldsToUpdate) {
    try {
        await fetch(`${API_BASE_URL}/requests/${token}.json?key=${firebaseConfig.apiKey}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fieldsToUpdate)
        });
    } catch (error) {
        console.error("Update Error:", error);
    }

    let localRequests = JSON.parse(localStorage.getItem('nivedan_requests')) || [];
    let index = localRequests.findIndex(r => r.token === token);
    if (index !== -1) {
        localRequests[index] = { ...localRequests[index], ...fieldsToUpdate };
        localStorage.setItem('nivedan_requests', JSON.stringify(localRequests));
    }
}

// ४. फारामका Data सङ्कलन गर्ने
function collectPageData() {
    const formData = {};
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach((input, index) => {
        if (input.type !== 'button' && input.type !== 'submit') {
            const key = input.name || input.id || input.placeholder || `फिल्ड_${index + 1}`;
            formData[key] = input.value || '-';
        }
    });
    return formData;
}

// ५. फाराम सबमिट इन्टरसेप्ट गर्ने
async function handleFormSubmission(event) {
    if (event) {
        event.preventDefault();
        if (event.stopPropagation) event.stopPropagation();
    }
    
    const data = collectPageData();
    const token = await saveRequestToCloud(document.title, data);

    alert(`तपाईंको विवरण दर्ता भयो!\n\nटोकन नम्बर: ${token}\n\nअब QR स्क्यान गरी भुक्तानी गर्नुहोस्।`);
    window.location.href = `../request/payment.html?token=${token}`;
}

// ==========================================
// AUTO DETECT & PRINT OVERRIDE LOGIC
// ==========================================
(function() {
    const currentPath = window.location.pathname.toLowerCase();
    const urlParams = new URLSearchParams(window.location.search);
    const printToken = urlParams.get('printToken');

    if (currentPath.includes('track.html') || currentPath.includes('payment.html') || currentPath.includes('admin')) {
        return;
    }

    if (!printToken) {
        window.print = function() {
            handleFormSubmission();
        };
    }
})();

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const printToken = urlParams.get('printToken');
    const currentPath = window.location.pathname.toLowerCase();

    if (currentPath.includes('track.html') || currentPath.includes('payment.html') || currentPath.includes('admin')) {
        return;
    }

    // स्वीकृत भएपछि स्वतः डाटा भरेर प्रिन्ट गर्ने
    if (printToken) {
        const req = await getRequestByToken(printToken);
        
        if (req && req.status === 'APPROVED') {
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

            setTimeout(() => { 
                nativePrint.call(window); 
            }, 800);
        } else {
            alert('⚠️ यो निवेदन अझै स्वीकृत (APPROVED) भएको छैन।');
            window.location.href = `../request/track.html?token=${printToken}`;
        }
        return;
    }

    // Button click intercepts
    const printButtons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
    printButtons.forEach(btn => {
        btn.onclick = function(e) {
            e.preventDefault();
            handleFormSubmission(e);
            return false;
        };
    });

    const form = document.querySelector('form');
    if (form) {
        form.onsubmit = function(e) {
            e.preventDefault();
            handleFormSubmission(e);
            return false;
        };
    }
});
