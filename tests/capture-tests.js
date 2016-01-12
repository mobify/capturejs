require(["mobifyjs/utils", "capture"], function(Utils, Capture) {
    QUnit.start();

    module('Capturing');

    /**
     * This creates a fake HTML document, then adds the string given to it as the
     * content or defaults to the simple markup provided here.
     * It simply creates an iframe and then grabs the content.
     */
    var makeDocument = function(docHTML, disable) {
        disable = (disable !== undefined) ? disable : true;
        docHTML = docHTML || '<html><head></head><body></body></html>';
        if (disable) {
            docHTML = Capture.disable(docHTML, 'x-');
        }
        var iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        var doc = iframe.contentDocument;
        doc.open();
        doc.write(docHTML);
        doc.close();

        return doc;
    };

    // Test disabling attributes that cause resource loading
    test("disable", function() {
        var html = $("#disable-test-fixture").text();
        var expectedHtml =
            "<html>" +
            "<head>" +
            "  <link x-href='/path/to/stylesheet.css'>" +
            "  <style media='mobify-media' x-media='query'></style>" +
            "</head>" +
            "<body>" +
            "  <img x-src='/path/to/image.png'></img>" +
            "  <iframe x-src='/path/to/page.html'></iframe>" +
            "</body>" +
            "</html>";

        ok(compareHTMLStrings(Capture.disable(html, "x-"), expectedHtml), "Passed!");
    });

    // Test enabling attributes that cause resource loading
    test("enable", function() {
        var html = $("#enable-test-fixture").text();
        var expectedHtml =
            "<html>" +
            "<head>" +
            "  <link href='/path/to/stylesheet.css'>" +
            "  <style media='query'></style>" +
            "</head>" +
            "<body>" +
            "  <img src='/path/to/image.png'></img>" +
            "  <iframe src='/path/to/page.html'></iframe>" +
            "</body>" +
            "</html>";

        ok(compareHTMLStrings(Capture.enable(html, "x-"), expectedHtml), "Passed!");
    });

    test("openTag", function() {
        var element = $("#foo-element");
        var openTag = Capture.openTag(element);
        ok((openTag === "<div id=\"foo-element\" foo=\"bar\">") ||
            openTag === "<div foo=\"bar\" id=\"foo-element\">");
    });

    asyncTest("createDocumentFromSource", function() {
        var iframe = $("<iframe>", {id: "plaintext-example"});
        iframe.attr("src", "/tests/fixtures/plaintext-example.html")
        iframe.one('load', function() {
            var doc = this.contentDocument;

            // We remove the webdriver attribute set when running tests on selenium (typically done through SauceLabs)
            var htmlEl = doc.getElementsByTagName("html")[0].removeAttribute("webdriver")

            Capture.init(function(capture) {
                var capturedDoc = capture.capturedDoc;

                var expectedHtml =
                    "<!DOCTYPE HTML>" +
                    "<html class=testclass>" +
                    "<head foo=bar>" +
                    "    <link rel=stylesheet href=/path/to/stylesheet.css>" +
                    "</head>" +
                    "<body bar=baz>" +
                    "  <!-- comment with <head> -->" +
                    "  <p>Plaintext example page!</p>" +
                    "  <script src=/path/to/script.js><\/script>" +
                    "</body>" +
                    "</html>";

                var html = capture.enabledHTMLString(capturedDoc);
                ok(compareHTMLStrings(html, expectedHtml), "Passed!");
                start();
            }, doc);
        });
        $("#qunit-fixture").append(iframe);
    });

    // Shared expected output for the next two tests
    var expectedCapture = {
        doctype: "<!DOCTYPE HTML>",
        htmlOpenTag: "<html class=\"testclass\">",
        headOpenTag: "<head foo=\"bar\">",
        bodyOpenTag: "<body bar=\"baz\">",
        headContent: "\n    \n    <link rel=\"stylesheet\" href=\"/path/to/stylesheet.css\">\n</head>\n",
        bodyContent: "\n    <!-- comment with <head> -->\n    <p>Plaintext example page!</p>\n    <script src=\"/path/to/script.js\"><\/script>\n</body>\n</html>\n\n"
    };

    var captureCompare = function(actual, expected) {
        ok(compareHTMLStrings(actual.headContent, expected.headContent), "head content does not match");
        ok(compareHTMLStrings(actual.bodyContent, expected.bodyContent), "body content does not match");

        var actualToCompare = $.extend({}, actual);
        delete actualToCompare.headContent;
        delete actualToCompare.bodyContent;

        var expectedToCompare = $.extend({}, expected);
        delete expectedToCompare.headContent;
        delete expectedToCompare.bodyContent;

        deepEqual(actualToCompare, expectedToCompare);
    }

    test("removeCommentedHeadEls", function() {
        var expectedResults = {
            "<head></head>": "<head></head>",
            "<head>": "<head>",
            "<head>\n\n<!-- some text --></head>": "<head>\n\n<!-- some text --></head>",
            "<head>\n\n<!-- <head>some text --></head>": "<head>\n\n</head>",
            "<head>\n\n<!-- <head> --><!-- <head> --></head>": "<head>\n\n</head>",
            "<head>\n\n<!-- some text <head> --></head>": "<head>\n\n</head>",
            "<head>\n\n<!-- <head blah blah>some text --></head>": "<head>\n\n</head>",
            "<head>\n\n<!-- <header>some text --></head>": "<head>\n\n<!-- <header>some text --></head>",
            // Ignore the <head> in the comment if it's closed
            "<head>\n\n<!-- <head>some text</head> --></head>": "<head>\n\n<!-- <head>some text</head> --></head>"
        };

        for (var key in expectedResults) {
            if (!expectedResults.hasOwnProperty(key)) {
                return;
            }
            equal(Capture.removeCommentedHeadEls(key), expectedResults[key]);
        }
    });

    asyncTest("createDocumentFragmentsStrings - head in comment tag", function() {
        var expectedCapture = {
            doctype: "<!DOCTYPE HTML>",
            htmlOpenTag: "<html class=\"testclass\">",
            headOpenTag: "<head foo=\"bar\">",
            bodyOpenTag: "<body bar=\"baz\">",
            headContent: "\n\n    \n    <link rel=\"stylesheet\" href=\"/path/to/stylesheet.css\">\n<!-- </head> end -->\n</head>\n",
            bodyContent: "\n    <!-- comment with <head> -->\n    <p>Plaintext example page!</p>\n    <script src=\"/path/to/script.js\"><\/script>\n</body>\n</html>\n\n"
        };
        var iframe = $("<iframe>", {id: "plaintext-head-in-comment"});
        iframe.attr("src", "/tests/fixtures/plaintext-head-in-comment.html")
        iframe.one('load', function() {
            var doc = this.contentDocument;
            // We remove the webdriver attribute set when running tests on selenium (typically done through SauceLabs)
            var htmlEl = doc.getElementsByTagName("html")[0].removeAttribute("webdriver")
            var capture = Capture.createDocumentFragmentsStrings(doc);
            // We're not testing the all function here, let's remove it
            delete capture.all;
            captureCompare(capture, expectedCapture);
            console.dir(capture);
            console.dir(expectedCapture);

            start();
        });
        $("#qunit-fixture").append(iframe);
    });

    asyncTest("createDocumentFragmentsStrings - body in comment tag", function() {
        var expectedCapture = {
            doctype: "<!DOCTYPE HTML>",
            htmlOpenTag: "<html class=\"testclass\">",
            headOpenTag: "<head foo=\"bar\">",
            bodyOpenTag: "<body bar=\"baz\">",
            headContent: "\n    \n    <link rel=\"stylesheet\" href=\"/path/to/stylesheet.css\">\n</head>\n<!-- <body class=\"bad\"> -->\n",
            bodyContent: "\n    <!-- comment with <head> -->\n    <p>Plaintext example page!</p>\n    <script src=\"/path/to/script.js\"><\/script>\n</body>\n</html>\n\n"
        };
        var iframe = $("<iframe>", {id: "plaintext-body-in-comment"});
        iframe.attr("src", "/tests/fixtures/plaintext-body-in-comment.html")
        iframe.one('load', function() {
            var doc = this.contentDocument;
            // We remove the webdriver attribute set when running tests on selenium (typically done through SauceLabs)
            var htmlEl = doc.getElementsByTagName("html")[0].removeAttribute("webdriver")
            var capture = Capture.createDocumentFragmentsStrings(doc);
            // We're not testing the all function here, let's remove it
            delete capture.all;
            captureCompare(capture, expectedCapture);

            start();
        });
        $("#qunit-fixture").append(iframe);
    });

    asyncTest("createDocumentFragmentsStrings - below head tag", function() {
        var iframe = $("<iframe>", {id: "plaintext-example9"});
        iframe.attr("src", "/tests/fixtures/plaintext-example.html")
        iframe.one('load', function() {
            var doc = this.contentDocument;

            // We remove the webdriver attribute set when running tests on selenium (typically done through SauceLabs)
            var htmlEl = doc.getElementsByTagName("html")[0].removeAttribute("webdriver")
            // alert(doc.getElementsByTagName("html")[0].innerHTML);
            var capture = Capture.createDocumentFragmentsStrings(doc);
            // We're not testing the all function here, let's remove it
            delete capture.all;
            captureCompare(capture, expectedCapture);
            start();
        });
        $("#qunit-fixture").append(iframe);
    });

    asyncTest("createDocumentFragmentsStrings - above head tag", function() {
        var iframe = $("<iframe>", {id: "plaintext-example2"});
        iframe.attr("src", "/tests/fixtures/plaintext-above-head-example.html")
        iframe.one('load', function() {
            var doc = this.contentDocument;
            //alert(doc.getElementsByTagName("html")[0].innerHTML);
            // We remove the webdriver attribute set when running tests on selenium (typically done through SauceLabs)
            var htmlEl = doc.getElementsByTagName("html")[0].removeAttribute("webdriver")
            var capture = Capture.createDocumentFragmentsStrings(doc);
            // We're not testing the all function here, let's remove it
            delete capture.all;
            captureCompare(capture, expectedCapture)
            start();
        });
        $("#qunit-fixture").append(iframe);
    });

    asyncTest("createDocumentFragmentsStrings - malformed markup", function() {
        var iframe = $("<iframe>", {id: "plaintext-example4"});
        iframe.attr("src", "/tests/fixtures/plaintext-malformed-markup-example.html")
        iframe.one('load', function() {
            var doc = this.contentDocument;
            //alert(doc.getElementsByTagName("html")[0].innerHTML);
            // We remove the webdriver attribute set when running tests on selenium (typically done through SauceLabs)
            var htmlEl = doc.getElementsByTagName("html")[0].removeAttribute("webdriver")

            var expectedCaptureClone = Utils.clone(expectedCapture);
            expectedCaptureClone.bodyOpenTag = "<body foo=\"bar>\" bar='>baz'>";
            expectedCaptureClone.headOpenTag = "<head foo=\"bar>\" bar='>baz'>";
            var capture = Capture.createDocumentFragmentsStrings(doc);
            // We're not testing the all function here, let's remove it
            delete capture.all;
            captureCompare(capture, expectedCaptureClone)
            start();
        });
        $("#qunit-fixture").append(iframe);
    });

    asyncTest("createDocumentFragmentsStrings - no end head tag", function() {
        var iframe = $("<iframe>", {id: "plaintext-example5"});
        iframe.attr("src", "/tests/fixtures/plaintext-no-end-head-example.html")
        iframe.one('load', function() {
            var doc = this.contentDocument;

            // We remove the webdriver attribute set when running tests on selenium (typically done through SauceLabs)
            var htmlEl = doc.getElementsByTagName("html")[0].removeAttribute("webdriver")
            var expectedCaptureClone = Utils.clone(expectedCapture);
            expectedCaptureClone.headContent = "\n    \n    <link rel=\"stylesheet\" href=\"/path/to/stylesheet.css\">\n"
            var capture = Capture.createDocumentFragmentsStrings(doc);
            // We're not testing the all function here, let's remove it
            delete capture.all;
            captureCompare(capture, expectedCaptureClone)
            start();
        });
        $("#qunit-fixture").append(iframe);
    });

    asyncTest("createDocumentFragmentsStrings - script with opening body", function() {
        var iframe = $("<iframe>", {id: "plaintext-example5"});
        iframe.attr("src", "/tests/fixtures/plaintext-script-with-opening-body.html")
        iframe.one('load', function() {
            var doc = this.contentDocument;

            // @jb: I don't get this?
            // We remove the webdriver attribute set when running tests on selenium (typically done through SauceLabs)
            var htmlEl = doc.getElementsByTagName("html")[0].removeAttribute("webdriver")

            var expectedCaptureClone = Utils.clone(expectedCapture);

            expectedCaptureClone.headContent = "\n    \n    <link rel=\"stylesheet\" href=\"/path/to/stylesheet.css\">\n    <script type=\"text/javascript>\">\"<body foo=\"fail\">\"</script>\n</head>\n"

            var capture = Capture.createDocumentFragmentsStrings(doc);

            // @jb: Cheat
            // We're not testing the all function here, let's remove it
            delete capture.all;
            captureCompare(capture, expectedCaptureClone)

            start();
        });

        $("#qunit-fixture").append(iframe);
    });

    /**
     * Ensure rendering executes scripts in order.
     */
    asyncTest("scriptsCorrectOrder", function() {
        var opts = {
            id: "script-order-test",
            src: "/tests/fixtures/blank-example.html"
        };
        var $iframe = $("<iframe>", opts);
        var el = $iframe[0];

        var html = '<html><head></head>\
                    <body>\
                    <script>var verify=[1];<\/script>\
                    <script x-src="/tests/resources/bigscript.js"><\/script>\
                    <script>verify.push(3);<\/script>\
                    <script x-src="/tests/resources/smallscript.js"><\/script>\
                    <script>verify.push(5);<\/script>\
                    <script>parent.postMessage(verify.join(), "*");<\/script>\
                    </body></html>';

        window.addEventListener("message", function onMessage(event) {
            if (event.source != el.contentWindow) return;
            window.removeEventListener("message", onMessage, false);
            equal(event.data, "1,2,3,4,5");
            start();
        }, false);

        $iframe.one('load', function onLoad() {
            Capture.init(function(capture) {
                capture.render(html);
            }, this.contentDocument);
        });

        $("#qunit-fixture").append($iframe);
    });

    // Ensure that a meta viewport tag is added to the document with width = device-width
    asyncTest("ios8_0ScrollFix", function() {
        var doc = makeDocument();

        Capture.ios8AndGreaterScrollFix(doc, function() {
            var meta = doc.getElementsByTagName('meta')[0];

            ok(true,
                'meta tag is appended');
            equal(meta.getAttribute('name'), 'viewport',
                'meta name is viewport');
            equal(meta.getAttribute('content'), 'width=device-width', 'content is width=device-width');

            start();
        });
    });

    // Do not be alarmed about "Error: INVALID_CHARACTER_ERR: DOM Exception 5"
    // during this test --- this is an indication the function is working as
    // intended, i.e. it should not clone invalid attributes
    test("cloneAttributes", function() {
        var el = document.createElement("div");
        Capture.cloneAttributes("<div class=\"test1 test2\"></div>", el);

        equal(el.className, "test1 test2");

        // Regression test cases for messed up attributes

        // Extra stray " character
        Capture.cloneAttributes("<div class=\"\"test1 test2\"></div>", el);

        equal(el.className, "");

        // No space between div and class attribute
        Capture.cloneAttributes("<divclass=\"\"test1 test2\"></div>", el);

        equal(el.className, "");

    });


    test("removeCloseEndTagsAtEndOfString", function() {
        var html = "</div><div>";
        equal(Capture.removeClosingTagsAtEndOfString(html), html);

        var html = "<html><head>\n</head>\n<body><h1></h1></body ></html>";
        var expectedHtml = "<html><head>\n</head>\n<body><h1>";
        ok(compareHTMLStrings(Capture.removeClosingTagsAtEndOfString(html), expectedHtml));
    });

    test("removeTargetSelf", function() {
        var html = "<a href='' target=\"_self\" target='_self'>";
        var expectedHtml = "<a href=''  >";
        ok(compareHTMLStrings(Capture.removeTargetSelf(html), expectedHtml));
    });

    /**
     * Ensure the complete document is captured.
     */
    asyncTest("capture captures the complete document", 0, function() {
        var opts = {
            id: "capture-complete",
            src: "/tests/fixtures/split.html"
        };
        var $iframe = $("<iframe>", opts);
        var el = $iframe[0];

        // Begin capturing on message. Restoring sends "complete".
        $(window).on("message", function onMessage(event) {
            event = event.originalEvent;
            if (event.source != el.contentWindow) return;
            $(window).unbind("message", onMessage);
            start();
        });

        $("#qunit-fixture").append($iframe);
    });

    /*
     * Ensure that the mobify library is re-inserted into the
     * document, as well that the main function is inserted.
     */
    asyncTest("integration - scripts are re-inserted", function() {
        var opts = {
            src: "/tests/fixtures/integration-example.html"
        };
        var $iframe = $("<iframe>", opts);
        var el = $iframe[0];

        window.addEventListener("message", function onMessage(event) {
            if (event.source != el.contentWindow) return;
            window.removeEventListener("message", onMessage, false);
            ok(el.contentDocument.getElementById('mobify-js'));
            ok(el.contentDocument.getElementById('main-executable'));
            start();
        }, false);

        $("#qunit-fixture").append($iframe);
    });

    /*
     * Most browsers create a new global javascript namespace in the new document,
     * except webkit, which preserves the namespace as it was before the call to
     * document.open(). We reinject the library to ensure `Capture` can be used
     * after the namespace is cleared.
     */
    asyncTest("integration - capture survives flood", function() {
        var opts = {
            id: "flood-test",
            src: "/tests/fixtures/integration-example.html"
        };
        var $iframe = $("<iframe>", opts);
        var el = $iframe[0];

        window.addEventListener("message", function onMessage(event) {
            if (event.source != el.contentWindow) return;
            window.removeEventListener("message", onMessage, false);
            ok(el.contentWindow.Capture);
            start();
        }, false);

        $("#qunit-fixture").append($iframe);
    });

    /**
     * Ensure that no meta tags get added to the document. This is a
     * regression test to make sure meta tags within noscript tags
     * do not get moved into the "head" in older browsers (Safari 4/5)
     */
    asyncTest("meta tags don't get moved into head", function() {
        var opts = {
            src: "/tests/fixtures/meta.html"
        };
        var $iframe = $("<iframe>", opts);
        var el = $iframe[0];

        window.addEventListener("message", function onMessage(event) {
            if (event.source != el.contentWindow) return;
            window.removeEventListener("message", onMessage, false);
            // Make sure that there are no meta tags in the document at all
            equal(el.contentDocument.getElementsByTagName('meta').length, 0, "Meta tags moved into the head are removed");
            start();
        }, false);

        $("#qunit-fixture").append($iframe);
    });

    asyncTest("Capture.restore", function() {
        var $iframe = $("<iframe>", {
            id: "plaintext-example201",
            src: "/tests/fixtures/plaintext-restore-example.html"
        });
        var el = $iframe[0];

        var expectedHTML =
            '<!DOCTYPE HTML>' +
            '<html class="testclass">' +
            '<head foo="bar">' +
            '  <script>parent.postMessage("done!", "*");<\/script>' +
            '</head>' +
            '<body bar="baz">' +
            '  <!-- comment with <head> -->' +
            '  <p>Plaintext example page!</p>' +
            '  <script src="/path/to/script.js"><\/script>' +
            '</body>' +
            '</html>';

        window.addEventListener("message", function onMessage(event) {
            if (event.source != el.contentWindow) return;
            window.removeEventListener("message", onMessage, false);
            var doc = el.contentDocument;

            // Make sure that there are no meta tags in the document at all
            var html = Utils.getDoctype(doc) + Utils.outerHTML(doc.documentElement);

            ok(compareHTMLStrings(html, expectedHTML), "HTML Restored to original state + injected script");
            start();
        }, false);

        $iframe.one('load', function() {
            var doc = this.contentDocument;

            // We remove the webdriver attribute set when running tests on selenium (typically done through SauceLabs)
            var htmlEl = doc.getElementsByTagName("html")[0].removeAttribute("webdriver")

            Capture.init(function(capture) {
                capture.restore('<script>parent.postMessage("done!", "*");<\/script>');
            }, doc);
        });
        $("#qunit-fixture").append($iframe);
    });

    /**
     * Regressions test for iOS8 where sibling forms got written out
     * as children of each other.
     */
    asyncTest("createDocumentSiblingForms", function() {
        var iframe = $("<iframe>", {
            id: "plaintext-sibling-forms",
            src: "/tests/fixtures/plaintext-sibling-forms.html"
        });
        iframe.one('load', function() {
            var doc = this.contentDocument;

            Capture.init(function(capture) {
                var capturedDoc = capture.capturedDoc;

                var bodyChildren = capturedDoc.body.children;
                equal(bodyChildren.length, 2);
                equal(bodyChildren[0].nodeName, 'FORM', 'first child element is a form');
                equal(bodyChildren[1].nodeName, 'FORM', 'second child element is a form');
                start();
            }, doc);
        });
        $("#qunit-fixture").append(iframe);
    });

    /**
     * Test for ADJS-92: iOS 8.0 smart banner issue.
     * Ensure that smart banners above the tag are removed during capturing.
     **/
    asyncTest("Remove smart banner when above the tag - iOS8_0 only", function() {
        var $iframe = $("<iframe>", {
            id: "smart-banner-above-tag",
            src: "/tests/fixtures/smart-banner-above-tag.html"
        });
        var el = $iframe[0];

        window.addEventListener("message", function onMessage(e) {
            if (event.source != el.contentWindow) return;
            window.removeEventListener("message", onMessage, false);
            equal(el.contentDocument.querySelectorAll("meta[name='apple-itunes-app']").length, 0, "Smart banner meta tag has been removed.");
            start();
        }, false);

        $("#qunit-fixture").append($iframe);
    });

    /**
     * Test for ADJS-92: iOS 8.0 smart banner issue.
     * Ensure that smart banners below the tag are not removed on IOS8
     **/
    asyncTest("Leave smart banner in place when below the tag - iOS8_0 only", function() {
        var $iframe = $("<iframe>", {
            id: "smart-banner-below-tag",
            src: "/tests/fixtures/smart-banner-below-tag.html"
        });
        var el = $iframe[0];

        window.addEventListener("message", function onMessage(e) {
            if (event.source != el.contentWindow) return;
            window.removeEventListener("message", onMessage, false);
            equal(el.contentDocument.querySelectorAll("meta[name='apple-itunes-app']").length, 1, "Smart banner meta tag is still in place.");
            start();
        }, false);

        $("#qunit-fixture").append($iframe);
    });

    test("isIOS8OrGreater returns true for iOS agents running iOS 8 or greater only", function() {
        // iOS
        var iOS7 = 'Mozilla/5.0 (iPhone; CPU iPhone OS 7_0 like Mac OS X; en-us) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53';
        var iOS8 = 'Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.3 (KHTML, like Gecko) Version/8.0 Mobile/12A4345d Safari/600.1.4';
        var iOS9 = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_0 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13A340 Safari/601.1';
        var fauxIOS9_1 = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.1 Mobile/13A340 Safari/601.1';
        var fauxIOS10 = 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_0 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/10.0 Mobile/13A340 Safari/601.1';

        // Android
        var nexus4 = 'Mozilla/5.0 (Linux; Android 4.4.2; Nexus 4 Build/KOT49H) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.122 Mobile Safari/537.36';
        var galaxyS6 = 'Mozilla/5.0 (Linux; Android 5.0.2; SAMSUNG SM-G925F Build/LRX22G) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/3.0 Chrome/38.0.2125.102 Mobile Safari/537.36';

        // Windows Phone
        var lumia520 = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch; NOKIA; Lumia 520)';
        var windowsPhone10 = 'Mozilla/5.0 (Windows Phone 10.0; Android 4.2.1; DEVICE INFO) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Mobile Safari/537.36 Edge/12';

        ok(!Capture.isIOS8OrGreater(iOS7), 'iOS 7.0');
        ok(Capture.isIOS8OrGreater(iOS8), 'iOS 8.0');
        ok(Capture.isIOS8OrGreater(iOS9), 'iOS 9.0');
        ok(Capture.isIOS8OrGreater(fauxIOS9_1), 'iOS 9.1');
        ok(Capture.isIOS8OrGreater(fauxIOS10), 'iOS 10.0');

        ok(!Capture.isIOS8OrGreater(nexus4), 'Nexus 4 - Android 4.4');
        ok(!Capture.isIOS8OrGreater(galaxyS6), 'Galaxy S6 - Android 5.0.2');

        ok(!Capture.isIOS8OrGreater(windowsPhone10), 'Lumia 520 - Windows Phone 8');
        ok(!Capture.isIOS8OrGreater(windowsPhone10), 'Windows Phone 10');

        ok(!Capture.isIOS8OrGreater('lorem ipsum mobile browser 9.0'), 'Nonsense');
    });

});
