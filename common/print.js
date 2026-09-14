// Print Controller & Permission Logic
function printDocument(nivedanId) {
    db.ref('nivedans/' + nivedanId).once('value').then((snapshot) => {
        const data = snapshot.val();
        if (!data) return alert("डाटा भेटिएन!");

        if (data.status === 'Rejected') {
            alert("अस्वीकृत (Rejected) निवेदन प्रिन्ट गर्न मिल्दैन!");
            return;
        }

        applyWatermark(data.paymentType);
        
        // Update printed status in Firebase if Admin Print
        db.ref('nivedans/' + nivedanId).update({ isPrinted: true });
        
        setTimeout(() => {
            window.print();
        }, 300);
    });
}
