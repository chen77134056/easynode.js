/**
 * 过滤危险字符
 */



//如果输出危险字符就返回true
function stripscript_prompt(s) {
    var pattern = new RegExp("[`~!@#$%^&*()+=|{}':;',\\[\\].<>/?~！@#￥%……&*（）——+|{}【】‘；：”“’。，、？]");
    // var rs = "";
    // for (var i = 0; i < s.length; i++) {
    //     rs = rs + s.substr(i, 1).replace(pattern, '');
    // }
    return !!pattern.exec(s);
}




//直接过滤掉、并返回过滤后的字符串
function stripscript(s) {
    var pattern = new RegExp("[`~!@#$%^&*()+=|{}':;',\\[\\].<>/?~！@#￥%……&*（）——+|{}【】‘；：”“’。，、？]");
    var rs = "";
    for (var i = 0; i < s.length; i++) {
        rs = rs + s.substr(i, 1).replace(pattern, '');
    }
    return rs;
}


//将危险的字符串转化成 转义字符
function html2Escape(sHtml) {
    return sHtml.replace(/[<>&"]/g,function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c];});
}

// &nbsp;转成空格
function nbsp2Space(str) {
    var arrEntities = {'nbsp' : ' '};
    return str.replace(/&(nbsp);/ig, function(all, t){return arrEntities[t]})
}


//转意符换成普通字符
function escape2Html(str) {
    var arrEntities={'lt':'<','gt':'>','nbsp':' ','amp':'&','quot':'"'};
    return str.replace(/&(lt|gt|nbsp|amp|quot);/ig,function(all,t){return arrEntities[t];});
}



//去除换行
function clearbr(key) {
    key = key.replace(/<\/?.+?>/g,"");
    key = key.replace(/[\r\n]/g, "");
    return key;
}



module.exports={
    stripscript_prompt:stripscript_prompt,
    stripscript:stripscript,
    html2Escape:html2Escape,
    nbsp2Space:nbsp2Space,
    escape2Html:escape2Html,
    clearbr:clearbr
};





