// Payment Code Update Logic
function processPayment(nivedanId, esewaCode) {
    if (!esewaCode || esewaCode.length < 4) {
        alert("कृपया सहि eSewa Transaction Code हाल्नुहोस्!");
        return Promise.reject("Invalid code");
    }

    return db.ref('nivedans/' + nivedanId).update({
        paymentType: 'PAID',
        esewaCode: esewaCode
    });
}
