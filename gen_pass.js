const crypto = require('crypto');
const fs = require("fs")
const readline = require("readline")
function gen_pass_data(){
    const io = readline.createInterface(
        {
            input:process.stdin,
            output:process.stdout
        }
    )
    data = []
    const read_pass = ()=>{
        io.question("用户名:\n",user=>{
            if(user.length==0){
                fs.writeFileSync("./data/user/user_info.json", JSON.stringify(data))
                return
            }
            io.question("密码:\n",password=>{
                if(password.length==0){
                    fs.writeFileSync("./data/user/user_info.json", JSON.stringify(data))
                    return
                }
                const hash = crypto.createHash('sha256');
                data.push({user:user, password: hash.update(password).digest("hex")})
                read_pass()
            })
        })
    }
    read_pass()
    
}

gen_pass_data()
