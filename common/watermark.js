// Watermark Enforcement Logic
function applyWatermark(paymentType) {
    const wmElement = document.getElementById('watermarkOverlay');
    if (!wmElement) return;

    if (paymentType === 'FREE') {
        wmElement.style.display = 'block';
        wmElement.innerText = 'FREE COPY - NOT OFFICIAL';
    } else {
        wmElement.style.display = 'none';
    }
}
