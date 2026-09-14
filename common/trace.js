// Search and Trace Application Engine
function searchNivedan(query, callback) {
    db.ref('nivedans').once('value').then((snapshot) => {
        const data = snapshot.val() || {};
        const results = Object.values(data).filter(item => 
            item.id === query || item.mobileNumber === query || item.esewaCode === query
        );
        callback(results);
    });
}
