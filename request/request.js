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

// १. क्लाउडमा डाटा सेभ गर्ने
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

    try {
        const response = await fetch(`${API_BASE_URL}/requests/${token}.json?key=${firebaseConfig.apiKey}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRequest)
        });

        if (response.ok) return token;
        throw new Error('Firebase DB Error');
    } catch (error) {
        console.error("Cloud Error, LocalStorage Backup Used:", error);
        let localRequests = JSON.parse(localStorage.getItem('nivedan_requests')) || [];
        localRequests.push(newRequest);
        localStorage.setItem('nivedan_requests', JSON.stringify(localRequests));
        return token;
    }
}

// २. टोकन अनुसार डाटाहरू ल्याउने
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

// ३. फिल्ड अपडेट गर्ने (भुक्तानी कोड वा स्टाटस अपडेट)
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

// ४. फारामबाट डाटाहरू सङ्कलन गर्ने
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

// ५. फाराम सबमिट गरेर भुक्तानीमा पठाउने मुख्य फङ्क्सन
async function handleFormSubmission(event) {
    if (event) event.preventDefault();
    
    const data = collectPageData();
    const token = await saveRequestToCloud(document.title, data);

    alert(`तपाईंको विवरण दर्ता भयो!\n\nटोकन नम्बर: ${token}\n\nअब भुक्तानी गरेर eSewa/Khalti Code प्रविष्ट गर्नुहोस्।`);
    
    // सिधै payment.html मा पठाउने
    window.location.href = `../request/payment.html?token=${token}`;
}

// ==========================================
// PRINT INTERCEPTION & AUTO DETECT LOGIC
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const printToken = urlParams.get('printToken');

    // क. एडमिनले 'Approved' गरेपछि मात्र प्रिन्ट गर्न पाइने सेक्युरिटी
    if (printToken) {
        const req = await getRequestByToken(printToken);
        
        if (req && req.status === 'स्वीकृत (Approved)') {
            // डाटा फाराममा भर्ने
            const inputs = document.querySelectorAll('input, select, textarea');
            inputs.forEach((input, index) => {
                const key = input.name || input.id || input.placeholder || `फिल्ड_${index + 1}`;
                if (req.data && req.data[key] !== undefined) {
                    input.value = req.data[key];
                }
            });

            // प्रिन्ट गर्दा बटनहरू लुकाउने CSS
            const style = document.createElement('style');
            style.innerHTML = '@media print { button, input[type="button"], input[type="submit"], .no-print { display: none !important; } }';
            document.head.appendChild(style);

            setTimeout(() => {
                window.print();
            }, 800);
        } else {
            alert('⚠️ यो निवेदन अझै कार्यालयबाट स्वीकृत (Verify) भएको छैन। भुक्तानी गरेपछि एडमिनले स्वीकृत गरेपछि मात्र प्रिन्ट गर्न पाइनेछ।');
            window.location.href = `../request/track.html?token=${printToken}`;
        }
        return;
    }

    // ख. सिधै window.print() हुनबाट रोक्ने (Override System Print)
    window.print = function() {
        handleFormSubmission();
    };

    // ग. सबै फाराम वा प्रिन्ट बटनहरूमा 'handleFormSubmission' जोड्ने
    const form = document.querySelector('form');
    if (form) {
        form.onsubmit = handleFormSubmission;
    }

    const printButtons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
    printButtons.forEach(btn => {
        // यदि बटनमा Print शब्द छ वा मुख्य बटन हो भने
        btn.addEventListener('click', function(e) {
            if (!printToken) {
                e.preventDefault();
                e.stopPropagation();
                handleFormSubmission(e);
            }
        }, true);
    });
});
