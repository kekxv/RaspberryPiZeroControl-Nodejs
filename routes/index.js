var express = require('express');
const session = require("express-session");
let config = require('../config');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {

    // if (typeof req.session.name === "undefined"){
    //     res.redirect("login");
    //     // next();
    //     return;
    // }

    res.render('index', {
        PublicStatic: '/',
        title: 'Raspberry Status',
    });
});
/* GET home page. */
router.get('/Main.js', function (req, res, next) {
    res.set('Content-Type', 'application/javascript; charset=UTF-8');
    res.render('javascript/main', {
        wsPort: config.WsJsPort,
        wsType: config.wsType
    });
});

/* GET home page. */
router.get('/Main.css', function (req, res, next) {
    res.set('Content-Type', 'text/css; charset=UTF-8');
    res.render('style/main', {});
});

module.exports = router;
