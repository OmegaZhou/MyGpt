const fs = require("fs")
var openai_model_map
var azure_model_map
const ModelInfoPath = "./data/model/models.json"
ModelInfo = JSON.parse(fs.readFileSync(ModelInfoPath))
var user_models =  JSON.parse(fs.readFileSync("./data/model/user_models.json"))
var user_maps;
const AzureSource = "Azure"
const OpenaiSource = "Openai"
exports.AzureSource = AzureSource
exports.OpenaiSource = OpenaiSource
function updateUserMap()
{
    user_maps = new Map()
    for(var user of user_models)
    {
        var s = {azure: new Set(), openai: new Set()}
        for(var item of user.azure_models){
            if(azure_model_map.has(item)){
                s.azure.add(item)
            }
        }
        for(var item of user.openai_models){
            if(openai_model_map.has(item)){
                s.openai.add(item)
            }
        }
        user_maps.set(user.name, s)
    }
}
function init(){
    openai_model_map = new Map()
    azure_model_map = new Map()
    for(var item of ModelInfo.azure_models){
        azure_model_map.set(item.name, item.model)
    }
    for(var item of ModelInfo.openai_models){
        openai_model_map.set(item.name, item.model)
    }
    for(var user of user_models)
    {
        var azure_models = []
        var openai_models = []
        for(var item of user.azure_models){
            if(azure_model_map.has(item)){
                azure_models.push(item)
            }
        }
        for(var item of user.openai_models){
            if(openai_model_map.has(item)){
                openai_models.push(item)
            }
        }
        user.azure_models = azure_models
        user.openai_models = openai_models
    }
    updateUserMap()
    fs.writeFile("./data/model/user_models.json", JSON.stringify(user_models), ()=>{})
}
init()
exports.get_models  = (user_name)=>{
    var ret = []
    for(var user of user_models){
        if(user_name == user.name){
            for(var item of user.azure_models){
                ret.push({name:item, source:AzureSource})
            }
            for(var item of user.openai_models){
                ret.push({name:item, source:OpenaiSource})
            }
        }
    }
    return ret
}
exports.update_user_models = (user_name, model_list)=>{
    for(var user of user_models){
        var azure_models = []
        var openai_models = []
        if(user.name==user_name){
            for(var model of model_list){
                if(model.source == AzureSource && azure_model_map.has(model.model)){
                    azure_models.push(model.model)
                }
                if(model.source == OpenaiSource && openai_model_map.has(model.model)){
                    openai_models.push(model.model)
                }
            }
            user.azure_models = azure_models
            user.openai_models = openai_models
            fs.writeFile("./data/model/user_models.json", JSON.stringify(user_models), ()=>{})
            break
        }
    }
    updateUserMap()
}
exports.delete_user = (user_name)=>{
    var new_info = []
    for(var item of user_models){
        if(item.name!=user_name){
            new_info.push(item)
        }
    }
    user_models = new_info
    fs.writeFile("./data/model/user_models.json", JSON.stringify(user_models), ()=>{})
    updateUserMap()
}
exports.add_user = (user_name)=>{
    user_models.push({name:user_name, openai_models:[], azure_models:[]})
    //console.log(user_models)
    fs.writeFile("./data/model/user_models.json", JSON.stringify(user_models), ()=>{})
    updateUserMap()
}
exports.get_total_models= ()=>{
    var ret = []
    for(var item of ModelInfo.azure_models){
        ret.push({name:item.name, source:AzureSource, deployment: item.model})
    }
    for(var item of ModelInfo.openai_models){
        ret.push({name:item.name, source:OpenaiSource, deployment: item.model})
    }
    return ret
}
exports.update_models = (new_models)=>{
    var tmp = {}
    tmp.azure_models=[]
    tmp.openai_models=[]
    console.log(new_models)
    for(var item of new_models){
        if(item.name && item.deployment){
            if(item.source==OpenaiSource){
                tmp.openai_models.push({name:item.name, model:item.deployment})
            }else if(item.source==AzureSource){
                tmp.azure_models.push({name:item.name, model:item.deployment})
            }
        }
        
    }
    ModelInfo = tmp
    fs.writeFile(ModelInfoPath, JSON.stringify(ModelInfo), ()=>{})
    init()
}
exports.get_azure_deployment =(name)=>
{
    return azure_model_map.get(name)
}
exports.get_openai_model =(name)=>
{
    return openai_model_map.get(name)
}
exports.get_azure_deployment_by_user =(name, user)=>
{
    if(user_maps.get(user).azure.has(name)){
        return azure_model_map.get(name)
    }
    return null
}
exports.get_openai_model_by_user =(name, user)=>
{
    if(user_maps.get(user).openai.has(name)){
        return openai_model_map.get(name)
    }
    return null
    
}