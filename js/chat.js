class ChatManager
{
    constructor()
    {
        this.messages = []
        this.tokens = []
    }
    addNewMessage(message, token){
        this.messages.push(message)
        this.tokens.push(token)
    }
    clear(){
        this.messages = []
        this.tokens = []
    }
    getAllMessage(max_len){
        if(this.tokens.length == 0){
            return {tokens: 0, messages : []} 
        }
        var i = this.tokens.length-1 
        var sum = 0
        for( ; i>=0; --i){
            if(this.tokens[i] + sum > max_len){
                break
            }
            sum += this.tokens[i]
        }
        ++i
        return {tokens: sum, messages : this.messages.slice(i, this.tokens.length)}
    }
    getSelectedMessage(indices){
        var total_tokens = 0
        var total_messages = []
        for(var i of indices){
            if(i<0||i>=this.tokens.length){
                continue
            }
            total_tokens+=this.tokens[i]
            total_messages.push(this.messages[i]);
        }
        return {tokens: total_tokens, messages : total_messages}
    }
}