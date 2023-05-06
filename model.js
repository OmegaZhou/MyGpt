exports.get_models  = (user_name)=>{
    return [{name:"gpt-3.5-turbo", source:"openai"}, {name:"gpt-3.5-turbo-0301", source:"openai"}]
}
exports.update_models = (user_name, model_list)=>{

}
exports.delete_user = (user_name)=>{

}
exports.add_user = (user_name, model_list)=>{
    
}
exports.get_total_models= ()=>{
    return [{name:"gpt-3.5-turbo", source:"openai"}, {name:"gpt-3.5-turbo-0301", source:"openai"}, {name:"gpt-35-turbo", source:"azure"}]
}
return exports