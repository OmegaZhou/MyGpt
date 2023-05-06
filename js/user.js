var my_user_info;
var cur_user_info;
var user_types = {1:"Admin", 2:"User", 4:"Guest"}
function getModelName(model){
    return `${model.name}(${model.source})`
}
function setUserInfo(user_info, cur_info)
{
    $("#user_info_name").html(cur_info.name)
    $("#user_info_type").html(user_types[cur_info.type])
    if(user_types[user_info.type]=="Guest"){
        $('#new_password1').attr("placeholder", "Guest不允许修改密码")
        $('#new_password2').attr("placeholder", "Guest不允许修改密码")
        $('#new_password1').prop("disabled", true)
        $('#new_password2').prop("disabled", true)
        $('#change_password_button').prop("disabled", true)
    }
    $("#model_can_used").html('')
    if(user_types[user_info.type]=="Admin"){
        var tmp =new Set()
        for(var item of cur_info.models){
            tmp.add(getModelName(item))
        }
        for(var i=0;i<user_info.total_models.length;++i){
            var check_box = $('<div class="form-check form-check-inline">')
            var name = getModelName(user_info.total_models[i])
            var checked_str = tmp.has(name)?"checked":""
            check_box.html(`<input class="form-check-input" type="checkbox" id="${name}" value="${i}" ${checked_str}><label  class="form-check-label" for="${name}">${name}</label>`)
            $("#model_can_used").append(check_box)
        }
    }else{
        for(var i=0;i<user_info.models.length;++i){
            var check_box = $('<div class="form-check form-check-inline">')
            var name = getModelName(user_info.models[i])
            check_box.html(`<input class="form-check-input" type="checkbox" id="${name}" value="${i}" checked disabled><label   class="form-check-label" for="${name}">${name}</label>`)
            $("#model_can_used").append(check_box)
        }
    }
}
function getUserInfo()
{
    $.get("/chat/api/get_user_info", (success)=>{
        if(success.message == 'success'){
            my_user_info = success.result
            cur_user_info = my_user_info
            console.log(success)
            setUserInfo(my_user_info, cur_user_info)
        }else{
            console.log(success.result)
        }
    })
}