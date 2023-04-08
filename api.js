const NodeRSA = require("node-rsa")
const fs = require('fs')
const auth = require("./auth");
const axios = require("axios").default
const private_key = new NodeRSA(fs.readFileSync("./rsa_pri.rsa"),{ encryptionScheme: 'pkcs1' });
const socks = require("socks-proxy-agent")
const pub_key = fs.readFileSync("./rsa_pub.rsa")
auth.read_user_info("password.json")
API_KEY = fs.readFileSync("./api_key")
const torProxyAgent = new socks.SocksProxyAgent("socks5://127.0.0.1:10808");
class AccessRecord
{
    constructor()
    {
        this.latest_access_time = Date.now()
        this.try_time = 0
    }
    canAccess(max_try)
    {
        return Math.max(0, max_try - this.try_time) 
    }
    tryFail()
    {
        this.try_time += 1
        this.latest_access_time = Date.now()
    }
    isExpired(max_age)
    {
        return this.latest_access_time + max_age < Date.now()
    }
    remainTime(max_age)
    {
        return this.latest_access_time + max_age - Date.now()
    }
}
class IpRecordManager
{
    // 单位:毫秒
    constructor(max_age, max_try) {
        this.access_info = new Map()
        this.max_age = max_age
        this.max_try = max_try
    }
    get(ip){
        return this.access_info.get(ip)
    }
    expireRecord(ip)
    {
        var record = this.access_info.get(ip)
        if(!record){
            return true 
        }else{
            if(record.isExpired(this.max_age)){
                this.access_info.delete(ip)
                return true
            }else{
                return false
            }
        } 
    }
    tryFail(ip){
        if(this.expireRecord(ip)){
            this.access_info.set(ip, new AccessRecord())
        }
        var record = this.get(ip)
        record.tryFail()
    }
    canAccess(ip){
        if(this.expireRecord(ip)){
            return this.max_try;
        }else{
            var record = this.get(ip)
            return record.canAccess(this.max_try)
        }
    }
    clearExpiredRecord(){
        var keys = []
        for(var item of this.access_info){
            var key = item[0]
            var value = item[1]
            console.log(key)
            if(value.isExpired(this.max_age)){
                keys.push(key)
            }
        }
        for(key of keys){
            this.access_info.delete(key)
        }
    }
    remainTime(ip){
        if(this.expireRecord(ip)){
            return 0;
        }else{
            var record = this.get(ip)
            return record.remainTime(this.max_age)
        }
    }
}
exports.init = (app, ip_access_config)=>{
    app.locals.ip_record = new IpRecordManager(ip_access_config.max_age, ip_access_config.max_try)
}


exports.limitLoginTime = (req,res,next)=>{
    var ip_record = req.app.locals.ip_record
    const clientIp = req.clientIp; 
    if(ip_record.canAccess(clientIp)){
        next()
    }else{
        var remain_time = (ip_record.remainTime(clientIp) / 1000 / 60)
        res.json(createRes(`Please login after ${remain_time} min`))
    }
}

exports.login = function (req, res) {
    var user = req.body;
    user = decrypt(user)
    if(auth.check_user(user.user, user.password)){
        req.session.login = true
        res.json(createRes("success"))
    }else{
        req.app.locals.ip_record.tryFail(req.clientIp)
        var remain = req.app.locals.ip_record.canAccess(req.clientIp)
        res.json(createRes(`login fail, remain ${remain} times`))
    }
    
}

exports.chat = async function(req, res){
    var data = req.body
    var messages = data.messages
    chat_data = {
        model:data.model,
        messages:messages
    }
    header = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + API_KEY,
    }
    //var req_config = {headers: header, httpsAgent: torProxyAgent,httpAgent: torProxyAgent}
    var req_config =  {headers: header}
    return axios.post("https://api.openai.com/v1/chat/completions", chat_data, req_config).then(chat_res=>{
        var usage = chat_res.data['usage']
        var res_messages = []
        for(var message of chat_res.data.choices){
            res_messages.push(message.message)
        }
        res.json(createRes("success", {messages:chat_res.data.choices, tokens:usage}))
    }).catch(err=>{
        var real_error;
        if(err.response && err.response.data && err.response.data.error){
            real_error = err.response.data.error
        }else{
            real_error = {code: err.code, message:err.message}
        }
         
        res.json(createRes("error",{code: real_error.code, message:real_error.message, data: real_error, server_error_data: {code: err.code, message:err.message}}))
    })

}

exports.get_pub_rsa=function(req,res){
    res.send(pub_key)
}

function createRes(message, result) {
    var res = new Object();
    if (message) {
        res.message = message;
    }
    if (result) {
        res.result = result;
    }
    return res;
}
function decrypt(user){
    var ret = {}
    ret.user = private_key.decrypt(user.user).toString()
    ret.password = private_key.decrypt(user.password).toString()
    return ret
}

exports.createRes = createRes