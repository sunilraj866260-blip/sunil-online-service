// ==========================================
// SUNIL PHOTOS STUDIO - FIREBASE CONFIG
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyAVKcK8eTv1W0FtJZX_0vRQ5Vvq52f7BIM",
    authDomain: "sunil-online-service.firebaseapp.com",
    databaseURL: "https://sunil-online-service-default-rtdb.firebaseio.com",
    projectId: "sunil-online-service",
    storageBucket: "sunil-online-service.appspot.com",
    messagingSenderId: "",
    appId: ""
};

const API_BASE_URL = firebaseConfig.databaseURL;

// १. क्लाउडमा डाटा सेभ गर्ने फङ्क्सन
async function saveRequestToCloud(type, formData) {
    const token = 'NIV-' + Math.floor(100000 + Math.random() * 900000);
    const currentFileLink = window.location.href.split('?')[0];

    const newRequest = {
        token: token,
        type: type || document.title || 'अन्य निवेदन',
        fileLink: currentFileLink,
        data: formData,
        paymentStatus: 'Pending',
        status: 'प्रक्रियामा (Pending)',
        timestamp: Date.now(),
        date: new Date().toLocaleDateString('ne-NP')
    };

    try {
        const response = await fetch(`${API_BASE_URL}/requests/${token}.json?key=${firebaseConfig.apiKey}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRequest)
        });

        if (response.ok) return token;
        throw new Error('Firebase Storage Error');
    } catch (error) {
        console.error("Cloud Storage Error, LocalStorage used:", error);
        let localRequests = JSON.parse(localStorage.getItem('nivedan_requests')) || [];
        localRequests.push(newRequest);
        localStorage.setItem('nivedan_requests', JSON.stringify(localRequests));
        return token;
    }
}

// २. टोकनबाट डाटाहरू ल्याउने
async function getRequestByToken(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/requests/${token}.json?key=${firebaseConfig.apiKey}`);
        if (response.ok) {
            const data = await response.json();
            if (data) return data;
        }
    } catch (error) {
        console.error("Fetch Error:", error);
    }
    const localRequests = JSON.parse(localStorage.getItem('nivedan_requests')) || [];
    return localRequests.find(req => req.token === token) || null;
}

// ३. भुक्तानी वा स्थिति अपडेट गर्ने
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
}

// ४. इनपुटहरूबाट डाटा स्वतः सङ्कलन गर्ने (Auto Detect)
function collectPageData() {
    const formData = {};
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach((input, index) => {
        if (input.type !== 'button' && input.type !== 'submit') {
            const key = input.name || input.id || input.placeholder || `फिल्ड_${index + 1}`;
            formData[key] = input.value;
        }
    });
    return formData;
}

// ५. फाराम बुझाउने फङ्क्सन
async function submitPrintRequest() {
    const data = collectPageData();
    const token = await saveRequestToCloud(document.title, data);

    alert(`तपाईंको निवेदन दर्ता भयो!\n\nटोकन नम्बर: ${token}\n\nकार्यालयले स्वीकृत गरेपछि प्रिन्ट गर्न सकिनेछ।`);
    window.location.href = `../request/payment.html?token=${token}`;
}

// ==========================================
// AUTO-ATTACHMENT TO OLD HTML FORMS
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const printToken = urlParams.get('printToken');

    // क. स्वीकृत भएपछि डाटा भरेर अटो-प्रिन्ट गर्ने
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

            // प्रिन्ट गर्दा नचाहिने बटनहरू स्वतः लुकाउने CSS
            const style = document.createElement('style');
            style.innerHTML = '@media print { button, input[type="button"], input[type="submit"], .no-print { display: none !important; } }';
            document.head.appendChild(style);

            setTimeout(() => {
                window.print();
            }, 800);
        }
        return;
    }

    // ख. पुराना फारामको बटन वा Form मा स्वतः Event Listener जोड्ने
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            submitPrintRequest();
        });
    } else {
        const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
        if (buttons.length > 0) {
            const lastBtn = buttons[buttons.length - 1];
            lastBtn.addEventListener('click', function(e) {
                e.preventDefault();
                submitPrintRequest();
            });
        }
    }
});
