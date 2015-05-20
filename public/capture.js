(function(doc) {
    var capture = function() {
        return ([
            "<!doctype html>",
            "<html>",
                "<head>",
                    "<title>Hold onto your butts</title>",
                    "<meta name='viewport' content='width=device-width'>",
                    "<script>window.prefix = " + prefix + "</script>",
                    "<script src='/report.js'></script>",
                    "</script>",
                    document.getElementsByTagName('plaintext')[0].textContent
        ]).join('\n');
    };

    var render = function() {
        output(capture());
    }

    var output = function(html) {
        doc.open();
        doc.write(html);
        doc.close();
    };

    var init = function() {
        if (doc.attachEvent ? doc.readyState == "complete" : doc.readyState != "loading") {
            return render();
        }

        doc.addEventListener("DOMContentLoaded", render, false);
    };

    init();

})(document);