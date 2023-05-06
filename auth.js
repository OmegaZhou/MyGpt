const fs = require("fs")
const readline = require("readline")
const crypto = require('crypto');
const express = require("express");
var user_info = []
var user_map = new Map()
var user_info_path;
const UserType = {
    AdminType: 1,
    UserType: 2,
    GuestType: 4
}

exports.UserType = UserType
function update_user(user)
{
    user_map.set(user.user, {password: user.password, type: user.type})
    var flag = true;
    for(var item of user_info){
        if(item.user==user.user){
            item.password = user.password
            item.type = user.type
            flag = false
            break
        }
    }
    if(flag){
        user_info.push(user)
    }
    fs.writeFile("./data/user/user_info.json", JSON.stringify(user_info), ()=>{})
}
exports.read_user_info = (path)=>{
    user_info_path = path
    data = fs.readFileSync(path, {encoding:"utf-8"})
    user_info = JSON.parse(data)
    for(item of user_info){
        user_map.set(item.user,  {password: item.password, type: item.type})
    }
}

exports.check_user = (user, password)=>{
    if(!user_map.has(user)){
        return false
    }
    const hash = crypto.createHash('sha256');
    return hash.update(password).digest("hex")==user_map.get(user).password
}

exports.get_type = (user)=>{
    return user_map.get(user).type
}
exports.has_user = (name)=>{
    return user_map.has(name)
}
exports.update_password = (user_name, new_password)=>{
    if(!user_map.has(user_name)){
        return;
    }
    const hash = crypto.createHash('sha256');
    var hash_password = hash.update(new_password).digest("hex")
    update_user({user:user_name, password:hash_password, type:user_map.get(user_name).type })
}
exports.add_user = (user_name, password, type)=>{
    if(user_map.has(user_name) || (type!=UserType.UserType && type!=UserType.GuestType)){
        return;
    }
    const hash = crypto.createHash('sha256');
    var hash_password = hash.update(password).digest("hex")
    update_user({user:user_name, password:hash_password, type:type })
}
exports.get_users=()=>{
    var ret = []
    for(var item of user_info){
        ret.push({name:item.user, type: item.type})
    }
    return ret
}
return module.exports