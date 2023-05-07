const NodeRSA = require("node-rsa")
const fs = require('fs')
const auth = require("./auth");
const modelManager = require('./model')
const axios = require("axios").default
const private_key = new NodeRSA(fs.readFileSync("./data/key/rsa_pri.rsa"),{ encryptionScheme: 'pkcs1' });
const socks = require("socks-proxy-agent")
const pub_key = fs.readFileSync("./data/key/rsa_pub.rsa")
auth.read_user_info("./data/user/user_info.json")
API_KEY = fs.readFileSync("./data/key/api_key")
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
            //console.log(key)
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
        req.session.user = user.user
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

exports.get_user_info = (req, res)=>{
    var result = {}
    result.name = req.session.user
    result.type = auth.get_type(req.session.user)
    result.models = [{name:"gpt-3.5-turbo", source:"openai"}, {name:"gpt-3.5-turbo-0301", source:"openai"}]
    result.total_models = []
    result.log = null
    if(auth.get_type(req.session.user) == auth.UserType.AdminType){
        result.user_list = auth.get_users()
        for(var item of result.user_list){
            item.models = modelManager.get_models(item.name)
            item.log = null
        }
        result.total_models = modelManager.get_total_models()
    }
    res.json(createRes("success", result))
}

exports.update_password = (req, res)=>{
    var data = decrypt(req.body)
    var user_name = data.user
    var new_password = data.password
    console.log(data)
    if(user_name=="" || new_password=="" || !auth.has_user(user_name)){
        res.json(createRes("error", {code:"invalid_parameter", message:"用户名或密码错误"}))
    }
    if(user_name==req.session.user){
        //auth.update_password(user_name, new_password
        res.json(createRes("success"))
    }else{
        if(auth.get_type(user_name)==auth.UserType.AdminType){
            res.json(createRes("error", {code:"no_permission", message:"无修改权限"}))
        }else if(auth.get_type(req.user)== auth.UserType.AdminType){
            //auth.update_password(user_name, new_password)
            res.json(createRes("success"))
        }
    }
}
exports.add_user = (req, res)=>{
    var data = decryptNewUser(req.body)
    var user_name = data.user
    var new_password = data.password
    var user_type = data.type
    console.log(data)
    if(user_name=="" || new_password==""){
        res.json(createRes("error", {code:"invalid_parameter", message:"用户名或密码不可用"}))
        return
    }
    if(user_type!=auth.UserType.GuestType && user_type!=auth.UserType.UserType){
        res.json(createRes("error", {code:"wrong_type", message:"用户类型错误"}))
    }else{
        if(auth.has_user(user_name)){
            res.json(createRes("error", {code:"user_exits", message:"用户已存在"}))
        }else{
            auth.add_user(user_name, new_password, user_type)
            res.json(createRes("success"))
        }
    }
}
exports.delete_user = (req, res)=>{
    var data = req.body
    var name = data.user
    if(!auth.has_user(name)){
        res.json(createRes("error", {code:"user_not_exits", message:"用户不存在"}))
    }else{
        if(auth.get_type(req.session.user)!=auth.UserType.AdminType || auth.get_type(name) == auth.UserType.AdminType){
            res.json(createRes("error", {code:"no_permission", message:"无权限"}))
        }else{
            auth.delete_user(name)
        }
    }
    
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
function decryptNewUser(user){
    var ret = {}
    ret.user = private_key.decrypt(user.user).toString()
    ret.password = private_key.decrypt(user.password).toString()
    ret.type = parseInt(private_key.decrypt(user.type).toString()) 
    return ret
}
exports.createRes = createRes