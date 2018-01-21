/**
 * Created by xgllseo on 2017/8/25.
 */
var crypto = require('crypto');  //node.js内置
module.exports = function(pwd) {
    var hash = crypto.createHash('sha256').update(pwd).digest('base64');
    return hash;
};