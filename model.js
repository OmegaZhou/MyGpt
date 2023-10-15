const fs = require("fs")
var openai_model_map
var azure_model_map
const ModelInfoPath = "./data/model/models.json"
ModelInfo = JSON.parse(fs.readFileSync(ModelInfoPath))
var user_models =  JSON.parse(fs.readFileSync("./data/model/user_models.json"))
const AzureSource = "Azure"
const OpenaiSource = "Openai"
exports.AzureSource = AzureSource
exports.OpenaiSource = OpenaiSource
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
exports.update_models = (user_name, model_list)=>{
    for(var user of user_models){
        var azure_models = []
        var openai_models = []
        if(user.name==user_name){
            for(var model of model_list){
                if(model.source == AzureSource && azure_model_map.has(model.name)){
                    azure_models.push(model.name)
                }
                if(model.source == OpenaiSource && openai_model_map.has(model.name)){
                    openai_models.push(model.name)
                }
            }
            user.azure_models = azure_models
            user.openai_models = openai_models
            fs.writeFile("./data/model/user_models.json", JSON.stringify(user_models), ()=>{})
            break
        }
    }
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
}
exports.add_user = (user_name, model_list)=>{
    user_models.push(user_name)
    update_models(user_name, model_list)
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
    return openai_model_map_model_map.get(name)
}
return exports