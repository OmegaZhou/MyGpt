const auth = require("./auth")
const express = require('express')
const session = require('express-session')
const body_parser = require('body-parser')
const requestIp = require('request-ip');
const MemoryStore = require('memorystore')(session)
const api = require('./api')
const createRes = api.createRes;
const API_PATH = '/chat/api/'
const ADMIN_PATH = '/chat/api/admin/'
var app = express();
api.init(app, {max_age : 1000*60*1, max_try : 3})
app.use(session({
    secret: 'mygpt',
    cookie: {
        maxAge: 60 * 1000 * 30
    },
    saveUninitialized: false,
    resave: false,
    rolling: true,
    store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
    })
}))
app.use(requestIp.mw())
app.use(API_PATH+'login',api.limitLoginTime)
app.use('/chat/img', express.static(__dirname + '/img'))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/chat/js', express.static(__dirname + '/ext'))
app.use('/chat/js', express.static(__dirname + '/js'))
app.use('/chat/css', express.static(__dirname + '/css'))
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
app.get(API_PATH + "pub_rsa", api.get_pub_rsa)
app.post(API_PATH + 'login', api.login)

app.use(API_PATH, (req, res, next)=>{

    if(!req.session.login){
        res.json(createRes("error",{code: "not_login", message:"请先登录"}))
    }else{
        if(!auth.has_user(req.session.user)){
            delete req.session.login;
            delete req.session.user
            res.json(createRes("error",{code: "not_login", message:"请先登录"}))
        }else{
            next()
        }
        
    }
})
app.post(API_PATH + 'chat', api.chat)
app.get(API_PATH + "get_user_info", api.get_user_info)
app.post(API_PATH + "change_password", api.update_password)
app.use(ADMIN_PATH , (req,res, next)=>{
    if(auth.get_type(req.session.user) != auth.UserType.AdminType){
        res.json(createRes("error",{code: "not_permission", message:"No permission"}))
    }else{
        next()
    }
})
app.post(ADMIN_PATH+"add_user", api.add_user)
app.post(ADMIN_PATH+"delete_user", api.deltete_user)
app.listen(20217, function () {
    console.log('listen to port 20217');
})