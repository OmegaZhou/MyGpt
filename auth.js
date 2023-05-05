const fs = require("fs")
const readline = require("readline")
const crypto = require('crypto');
const express = require("express");
var user_info = []
var user_map = {}
var user_info_path;
const UserType = {
    AdminType: 1,
    UserType: 2,
    GuestType: 4
}

exports.UserType = UserType

exports.read_user_info = (path)=>{
    user_info_path = path
    data = fs.readFileSync(path, {encoding:"utf-8"})
    user_info = JSON.parse(data)
    for(item of user_info){
        user_map[item.user] = {password: item.password, type: item.type, models: item.models}
    }
}

exports.check_user = (user, password)=>{
    if(!user in user_map){
        return false
    }
    const hash = crypto.createHash('sha256');
    return hash.update(password).digest("hex")==user_map[user].password
}

exports.get_type = (user)=>{
    return user_map[user].type
}
exports.use_models = (user)=>{
    return user_map[user].models
}
exports.update_user=(user)=>
{
    user_map[user.user] = {password: user.password, type: user.type}
    var flag = true;
    for(var item of user_info){
        if(item.user==user.user){
            item.password = user.password
            item.type = user.type
            item.models = user.models
            flag = false
            break
        }
    }
    if(flag){
        user_info.append(user)
    }
    fs.writeFileSync("./data/user/user_info.json", JSON.stringify(user_info))
}

exports.get_users=()=>{
    return user_info
}
return module.exports