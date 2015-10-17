var storage = 'storage';
var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer({ dest: storage });
var path = require('path');
var fs = require('fs');
var im = require('imagemagick');

router.get('/', function (req, res, next) {
    res.render('index', { title: 'jpg2pdf' });
});

router.post('/upload', upload.array('images', 10), function (req, res, next) {
    var result = null;
    var uuid = +new Date();
    var dest = pdf(uuid);
    convert(req.files, dest)
        .then(function () {
            return clear(req.files);
        }, function () {
            return clear(req.files);
        })
        .then(function () {
            res.json({ data: { uuid: uuid } });
        }, function (reason) {
            next(reason);
        })
    ;
});

router.get('/download/:uuid', function (req, res, next) {
    var uuid = req.params['uuid'];
    var dest = pdf(uuid);
    var name = ((req.query && req.query.name) ? req.query.name : uuid) + '.pdf';
    fs.exists(dest, function (exists) {
        if (!exists) return next(new Error('File does not exists'));
        res.download(dest, name, function (err) {
            if (err) return next(err);
            clear([{ path: dest }]).then(function () {
                res.end();
            }, next);
        });
    });
});

var files = fs.readdirSync(storage);
files.forEach(function (file) {
    if (file[0] != '.') fs.unlinkSync(storage + '/' + file);
});

module.exports = router;

function pdf(uuid) {
    return path.join(storage, uuid + '.pdf');
}

function convert(files, dest) {
    var params = files.map(function (file) { return file.path; });
    params.push(dest);
    return new Promise(function (resolve, reject) {
        im.convert(params, function (err) {
            if (err) return reject(err);
            resolve();
        });
    });
}

function clear(files) {
    var promises = [];
    files.forEach(function (file) {
        console.log(file);
        promises.push(new Promise(function (resolve, reject) {
            fs.unlink(file.path, function (err) {
                if (err) return reject(err);
                resolve();
            });
        }));
    });
    return Promise.all(promises);
}
