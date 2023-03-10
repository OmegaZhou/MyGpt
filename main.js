const auth = require("./auth")
const express = require('express')
const session = require('express-session')
const body_parser = require('body-parser')
const requestIp = require('request-ip');
const api = require('./api')
const createRes = api.createRes;
const API_PATH = '/chat/api/'
var app = express();
api.init(app, {max_age : 1000*60*1, max_try : 3})
app.use(session({
    secret: 'mygpt',
    cookie: {
        maxAge: 60 * 1000 * 30
    },
    saveUninitialized: false,
    resave: false,

}))
app.use(requestIp.mw())
app.use(API_PATH+'login',api.limitLoginTime)
app.use('/chat/img', express.static(__dirname + '/img'))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/chat/js', express.static(__dirname + '/js'))


app.get('/chat', function (req, res) {
    res.redirect('/chat/login.html');
})


app.get('/chat/login.html', function (req, res) {

    if (req.session.login) {
        res.redirect('/chat/index.html')
        return;
    }
    res.sendFile(__dirname + '/login.html');

})

app.get('/chat/index.html', function (req, res) {
    if (!req.session.login) {
        res.redirect('/chat/login.html');
        return;
    }
    res.sendFile(__dirname + '/index.html');
})

app.post(API_PATH + 'login', api.login)
app.post(API_PATH + 'chat', api.chat)
app.post(API_PATH + 'clear', api.clear)
app.get(API_PATH + "pub_rsa", api.get_pub_rsa)

app.listen(20217, function () {
    console.log('listen to port 20217');
})