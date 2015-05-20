window.report = function(counts) {
    var preparserMakesRequests = false;
    var duplicatesRequestsForCachedResponses = false;
    var terminatesRequests = false;

    for (var key in counts) {
        if (counts.hasOwnProperty(key)) {
            if (counts[key] > 1) {
                preparserMakesRequests = true;
            }

            if (/cache/.test(key) && counts[key] > 1) {
                duplicatesRequestsForCachedResponses = true;
            }
        }
    }

    var text = preparserMakesRequests ? "YES" : "NO";
    var color = preparserMakesRequests ? "red" : "green";
    var el = document.createElement("code");
    el.innerText = text;
    el.style.color = color;
    console.log(el.style);
    document.getElementById("preparser-requests").appendChild(el);

    var text = duplicatesRequestsForCachedResponses ? "YES" : "NO";
    var color = duplicatesRequestsForCachedResponses ? "red" : "green";
    var el = document.createElement("code");
    el.innerText = text;
    el.style.color = color;
    document.getElementById("duplicates-requests").appendChild(el);

    var el = document.createElement('pre');
    el.innerText = 'Request Counts for ' + prefix + ':\n' + JSON.stringify(counts, null, 2);
    document.body.appendChild(el);
}

document.addEventListener('DOMContentLoaded', function() {
    var script = document.createElement('script');
    script.src = '/' + window.prefix + '/?callback=report';
    document.body.appendChild(script);
}, false);
