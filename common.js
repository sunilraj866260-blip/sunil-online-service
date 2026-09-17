// --- common.js ---

// १. Firebase कन्फिगरेसन र इनिसाइजेसन
const firebaseConfig = {
    apiKey: "AIzaSyAVKcK8eTv1W0FtJZX_0vRQ5Vvq52f7BIM",
    authDomain: "sunil-online-service.firebaseapp.com",
    databaseURL: "https://sunil-online-service-default-rtdb.firebaseio.com",
    projectId: "sunil-online-service",
    storageBucket: "sunil-online-service.appspot.com"
};

let db = null;
let allNivedansData = {};
let currentAddress = {};

try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    
    // रेफरेन्स फोल्डर तपाईंको प्रोजेक्ट अनुसार राख्न सक्नुहुन्छ (जस्तै 'rochini_nivedans')
    db.ref('rochini_nivedans').on('value', (snapshot) => {
        allNivedansData = snapshot.val() || {};
    });
} catch(e) {
    console.error("Firebase init error:", e);
}

// २. ठेगाना लोड गर्ने फंक्सन
function loadSavedAddress() {
    const saved = localStorage.getItem('savedAddress');
    if(saved) {
        currentAddress = JSON.parse(saved);
        const fullStr = `${currentAddress.palikaName}-${currentAddress.ward}, ${currentAddress.district}`;
        const bpInput = document.getElementById('default_birthplace');
        if(bpInput) bpInput.value = fullStr;
    } else {
        window.location.href = 'address.html';
    }
}

// ३. मिति सेट गर्ने फंक्सन
function setInitialDate() {
    try {
        const options = { year: 'numeric', month: 'numeric', day: 'numeric', calendar: 'nepali' };
        const todayInput = document.getElementById('in_today');
        if(todayInput) {
            todayInput.value = new Intl.DateTimeFormat('ne-NP-u-ca-nepali', options).format(new Date());
        }
    } catch (e) { 
        const todayInput = document.getElementById('in_today');
        if(todayInput) todayInput.value = "२०८३/०३/२७"; 
    }
}

// ४. eSewa भुक्तानी कोड बुझाउने फंक्सन
function submitPayment(id) {
    const codeInput = document.getElementById(`esewa_in_${id}`);
    if(!codeInput) return;
    const code = codeInput.value.trim();
    
    if(!code) return alert('कृपया eSewa Code हाल्नुहोस्');

    if(db) {
        db.ref('rochini_nivedans/' + id).update({
            paymentType: 'PAID',
            esewaCode: code,
            status: 'Payment Pending Admin Verification'
        }).then(() => {
            if(allNivedansData[id]) {
                allNivedansData[id].esewaCode = code;
                allNivedansData[id].status = 'Payment Pending Admin Verification';
            }
            alert('भुक्तानी कोड सफलतापूर्वक पठाइयो!');
            if(typeof openPrintModal === 'function') {
                openPrintModal(id);
            }
        });
    }
}

// ५. प्रिन्ट र ब्याक बटन फंक्सन्स
function triggerPrint() {
    const printBtn = document.getElementById('mainPrintBtn');
    if(printBtn && !printBtn.disabled) {
        window.print();
    }
}

function backToForm() {
    window.location.href = 'address.html';
}
