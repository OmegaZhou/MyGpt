const fs = require("fs")
const readline = require("readline")
const crypto = require('crypto');
var user_info = []
var user_map = {}
exports.read_user_info = (path)=>{
    data = fs.readFileSync(path, {encoding:"utf-8"})
    user_info = JSON.parse(data)
    for(item of user_info){
        user_map[item.user] = item.password
    }
} 
exports.check_user = (user, password)=>{
    if(!user in user_map){
        return false
    }
    const hash = crypto.createHash('sha256');
    return hash.update(password).digest("hex")==user_map[user]
}
return module.exports