// ==========================================
// SUNIL PHOTOS STUDIO - FIREBASE CONFIG & API
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
        paymentStatus: 'Unpaid',
        paymentCode: '',
        status: 'प्रक्रियामा (Pending)',
        timestamp: Date.now(),
        date: new Date().toLocaleDateString('ne-NP')
    };

    let localRequests = JSON.parse(localStorage.getItem('nivedan_requests')) || [];
    localRequests.push(newRequest);
    localStorage.setItem('nivedan_requests', JSON.stringify(localRequests));

    try {
        await fetch(`${API_BASE_URL}/requests/${token}.json?key=${firebaseConfig.apiKey}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRequest)
        });
    } catch (error) {
        console.warn("Firebase Fetch Error, Offline Storage Active:", error);
    }

    return token;
}

// २. टोकनबाट डाटा तान्ने फङ्क्सन
async function getRequestByToken(token) {
    if (!token) return null;
    try {
        const response = await fetch(`${API_BASE_URL}/requests/${token}.json?key=${firebaseConfig.apiKey}`);
        if (response.ok) {
            const data = await response.json();
            if (data) return data;
        }
    } catch (error) {
        console.warn("Firebase Fetch Failed, Local Storage used:", error);
    }
    const localRequests = JSON.parse(localStorage.getItem('nivedan_requests')) || [];
    return localRequests.find(req => req.token === token) || null;
}

// ३. eSewa Code / Status अपडेट गर्ने फङ्क्सन
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

// ४. फारामको डाटा सङ्कलन गर्ने
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

// ५. नयाँ निवेदन सेभ गरी QR भुक्तानीमा पठाउने
async function handleFormSubmission(event) {
    if (event) event.preventDefault();
    
    const data = collectPageData();
    const token = await saveRequestToCloud(document.title, data);

    alert(`तपाईंको विवरण दर्ता भयो!\n\nटोकन नम्बर: ${token}\n\nअब QR स्क्यान गरी भुक्तानी गर्नुहोस्।`);
    window.location.href = `../request/payment.html?token=${token}`;
}

// ==========================================
// STRICT PAGE AUTO-DETECT LOGIC
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const printToken = urlParams.get('printToken');
    const currentPath = window.location.pathname.toLowerCase();

    // track.html, payment.html, वा admin ड्यासबोर्डमा फाराम सेभ गर्ने लोजिक चलाउँदै नचलाउने
    if (currentPath.includes('track.html') || currentPath.includes('payment.html') || currentPath.includes('admin')) {
        return; 
    }

    // स्वीकृत भएपछि फाराममा डाटा भरेर प्रिन्ट गर्ने
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

    // निवेदन भर्ने HTML हरूमा मात्र Form submit रोक्ने
    const form = document.querySelector('form');
    if (form) {
        form.onsubmit = handleFormSubmission;
    }
});
