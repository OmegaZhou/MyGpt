// JavaScript代码
function getModalSelectId(index)
{
    return "edit_modal_user_type"+index
}
function getModalTextareaId(index)
{
    return "edit_modal_input"+index
}
function swapTwoModalChat(i, j)
{
    var type1 = $("#"+getModalSelectId(i))
    var type2 = $("#"+getModalSelectId(j))
    var tmp = type1.val()
    type1.val(type2.val())
    type2.val(tmp)

    var content1 = $("#"+getModalTextareaId(i))
    var content2 = $("#"+getModalTextareaId(j))
    tmp = content1.val()
    content1.val(content2.val())
    content2.val(tmp)
}
function generateDialogues(a, modalId, getUserTypeFromChat, getContentFromChat) {
    var modalBody = document.getElementById(modalId + "_body");
    modalBody.innerHTML = ""; // 清空modal内的内容
    for (var i = 0; i < a.length; i++) {
        // 创建一个新的对话元素
        var dialogue = document.createElement("div");
        dialogue.className = "form-group row";


        // 创建下拉框元素，并设置id、选项、当前选中值和事件监听器
        var select_col_div = document.createElement("div")
        select_col_div.className = "col-7 mt-1"
        var select_div = document.createElement("div");
        select_div.className = "input-group"

        var id_label = document.createElement('span')
        id_label.className = "input-group-text"
        id_label.innerHTML = "Chat Index: "

        var id = document.createElement('input')
        id.type = "text"
        id.className = "form-control"
        id.disabled = true
        id.value = a[i].toString()

        var label = document.createElement('span')
        label.className = "input-group-text"
        label.innerHTML = "Role:"
        var select = document.createElement("select");
        select.className = "form-select "
        select.id = getModalSelectId(a[i]);
        var options = ["user", "system", "assistant"];
        for (var j = 0; j < options.length; j++) {
            var option = document.createElement("option");
            option.value = options[j];
            option.innerText = options[j];
            if (options[j] === getUserTypeFromChat(i)) {
                option.selected = true;
            }
            select.appendChild(option);
        }

        var up_down_div = document.createElement("div")
        up_down_div.className = "col-3 mt-1 row"
        var up_button = null
        var up_button_div = null
        if(i!=0){
            up_button_div = $("<div class='col-6'> </div>")[0]
            up_button = document.createElement("button");
            up_button.className = "btn btn-default-sm"
            up_button.innerHTML = "<span>上移</span>"
            up_button.onclick = (function(i,j){
                return (e)=>{
                    swapTwoModalChat(i,j)
                }
            })(a[i], a[i-1]);
            up_button_div.append(up_button)
        }
        var down_button_div = null
        var down_button = null
        if(i!=a.length-1){
            down_button_div = $("<div class='col-6'> </div>")[0]
            down_button = document.createElement("button");
            down_button.className = "btn btn-default-sm"
            down_button.innerHTML = "<span>下移</span>"
            down_button.onclick = (function(i,j){
                return (e)=>{
                    swapTwoModalChat(i,j)
                }
            })(a[i], a[i+1]);
            down_button_div.append(down_button)
        }

        // 创建textarea元素，并设置id和内容
        var textarea = document.createElement("textarea");
        textarea.id = getModalTextareaId(a[i]);
        textarea.value = getContentFromChat(i);
        textarea.className = "form-control";
        // 把下拉框和textarea元素加入到对话元素中
        select_div.append(id_label)
        select_div.append(id)
        select_div.append(label)
        select_div.appendChild(select)
        if(up_button){
            up_down_div.append(up_button_div)
        }
        if(down_button){
            up_down_div.append(down_button_div)
        }
        select_col_div.append(select_div)
        dialogue.appendChild(select_col_div);
        dialogue.appendChild(up_down_div)
        dialogue.appendChild(textarea);
        // 把对话元素加入到modal的body元素中
        modalBody.appendChild(dialogue);
    }
}