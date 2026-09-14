// Generic Nivedan Handler - Dynamic Form Submission
function handleNivedanSubmission(formElement, formTypeName) {
    formElement.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(formElement);
        const detailsObj = {};
        formData.forEach((value, key) => {
            detailsObj[key] = value;
        });

        const id = 'NIV-' + Date.now();
        const payload = {
            id: id,
            formType: formTypeName,
            applicantName: detailsObj['applicantName'] || detailsObj['fullName'] || 'N/A',
            mobileNumber: detailsObj['mobileNumber'] || detailsObj['phone'] || 'N/A',
            details: JSON.stringify(detailsObj),
            status: 'Pending',
            paymentType: 'FREE',
            esewaCode: '',
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            date: new Date().toLocaleDateString('ne-NP')
        };

        db.ref('nivedans/' + id).set(payload, function(error) {
            if (error) {
                alert("निवेदन सेभ गर्न सकिएन! पून: प्रयास गर्नुहोस्।");
            } else {
                alert("निवेदन सफलतापुर्वक दर्ता भयो! Tracking ID: " + id);
                window.location.href = '../trace/trace.html?id=' + id;
            }
        });
    });
}
