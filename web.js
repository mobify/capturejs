/**
 * Server for testing the number of requests made by browsers using capturing.
 *
 * Provides "counter" views for resources, including the ability to simulate slow
 * and cached responses.
 */
var express = require('express');

var mimeMap = {
    'js': 'application/javascript',
    'css': 'text/css',
    'jpg': 'image/jpg',
}

var counters = {};

// Views

var report = function(req, res) {
    var prefix = req.params.prefix;
    res.jsonp(counters[prefix]);
}

var increment = function(req, res) {
    var prefix = req.params.prefix;
    var key = req.params.key;

    var counter = counters[prefix] = counters[prefix] || {};
    if (!counter[key]) {
        counter[key] = 1;
    } else {
        counter[key]++;
    }

    // Correct mime to avoid console warnings.
    var extension = req.path.split('.').pop(-1) || 'js';
    res.append('Content-Type', mimeMap[extension]);

    res.send('/* ' + counter[key] + ' */');
};

var incrementSlow = function(req, res) {
    setTimeout(function() {
        increment(req, res);
    }, 1000);
};

var incrementCached = function(req, res) {
    res.append('Cache-Control', 'max-age=3600');
    increment(req, res);
};

var index = function(req, res) {
    res.render('index.html', {prefix: +new Date});
};

// App Setup

var app = express();

// Remove headers that may interfere with caching.
app.disable('etag');
app.disable('x-powered-by');

app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');

app.use(express.static(__dirname + '/public'));

app.get('/slow/:prefix/:key', incrementSlow);
app.get('/cache/:prefix/:key', incrementCached);
app.get('/:prefix/:key', increment);
app.get('/:prefix/', report);
app.get('/', index);

var srv = app.listen(process.env.PORT || 3000, '0.0.0.0', function() {
    var addr = srv.address()
    console.log('http://%s:%d/', addr.address, addr.port);
});