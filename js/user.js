var my_user_info;
var cur_user_info;
var user_types = { 1: "Admin", 2: "User", 4: "Guest" }
function getModelName(model) {
    return `${model.name}(${model.source})`
}
function setStandardUserInfo(user_info, cur_info) {
    $("#user_info_name").html(cur_info.name)
    $("#user_info_type").html(user_types[cur_info.type])
    if (user_types[user_info.type] == "Guest") {
        $('#new_password1').attr("placeholder", "Guest不允许修改密码")
        $('#new_password2').attr("placeholder", "Guest不允许修改密码")
        $('#new_password1').prop("disabled", true)
        $('#new_password2').prop("disabled", true)
        $('#change_password_button').prop("disabled", true)
    }
    $("#model_can_used").html('')
    if(user_types[cur_info.type] == "Admin" || user_types[user_info.type]!="Admin"){
        $("#delete_user_button").addClass("d-none")
    }else{
        $("#delete_user_button").removeClass("d-none")
    }
    if (user_types[user_info.type] == "Admin") {
        var tmp = new Set()
        for (var item of cur_info.models) {
            tmp.add(getModelName(item))
        }
        for (var i = 0; i < user_info.total_models.length; ++i) {
            var check_box = $('<div class="form-check form-check-inline">')
            var name = getModelName(user_info.total_models[i])
            var checked_str = tmp.has(name) ? "checked" : ""
            check_box.html(`<input class="form-check-input" type="checkbox" id="${name}" value="${i}" ${checked_str}><label  class="form-check-label" for="${name}">${name}</label>`)
            $("#model_can_used").append(check_box)
        }
    } else {
        for (var i = 0; i < user_info.models.length; ++i) {
            var check_box = $('<div class="form-check form-check-inline">')
            var name = getModelName(user_info.models[i])
            check_box.html(`<input class="form-check-input" type="checkbox" id="${name}" value="${i}" checked disabled><label   class="form-check-label" for="${name}">${name}</label>`)
            $("#model_can_used").append(check_box)
        }
    }
}
function setUserInfo(user_info, cur_info) {
    setStandardUserInfo(user_info, cur_info)
    console.log(user_info)
    if (user_types[user_info.type] == "Admin") {
        $(".admin_panel").removeClass("d-none")
        $("#user_selected").html('')
        for(var i=0; i< user_info.user_list.length;++i){
            var select_str = ""
            if(cur_info.name==user_info.user_list[i].name){
                select_str = "selected"
            }
            var item = $(`<option value="${i}" ${select_str}>${user_info.user_list[i].name}</option>`)
            $("#user_selected").append(item)
        }
        //changeCurUser()
    }
}
function changeCurUser() {
    var i = parseInt($("#user_selected").val()) 
    cur_user_info = my_user_info.user_list[i]
    setStandardUserInfo(my_user_info, cur_user_info)
}
function getUserInfo() {
    $.get("/chat/api/get_user_info", (success) => {
        if (success.message == 'success') {
            my_user_info = success.result
            cur_user_info = my_user_info
            console.log(success)
            setUserInfo(my_user_info, cur_user_info)
        } else {
            console.log(success.result)
        }
    })
}

function changePassword(data)
{
    $.post("/chat/api/change_password",data, (success) => {
        console.log(success)
        if (success.message == 'success') {
            alert("修改密码成功")
        } else {
            alert(success.result.message)
        }
    })
}

function addUser(data)
{
    $.post("/chat/api/admin/add_user",data, (success) => {
        console.log(success)
        if (success.message == 'success') {
            getUserInfo()
            alert("创建用户成功")
        } else {
            alert(success.result.message)
        }
    })
}