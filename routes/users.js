var express = require('express');
var router = express.Router();

var WsServer = require("../model/api");



/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send({ErrCode:0,ErrMessage:""});
});

/* POST users listing. */
router.post('/', function(req, res, next) {
  res.send({ErrCode:0,ErrMessage:""});
});

module.exports = router;
