
var router = require('koa-router')();

import session from "koa2-cookie-session";
router.use(session({
    key: "SESSIONID", //default "koa:sid"
    expires:1, //default 7
    path:"/" //default "/"
}));


var fs = require('fs');
var BMP24 = require('gd-bmp');//gd-bmp





//仿PHP的rand函数
function rand(min, max) {
    return Math.random()*(max-min+1) + min | 0; //特殊的技巧，|0可以强制转换为整数
}

//制造验证码图片
function makeCapcha() {
    var img = new BMP24(100, 40);
    img.drawCircle(rand(0, 100), rand(0, 40), rand(10 , 40), rand(0, 0x00ff00));
    //边框
    img.drawRect(0, 0, img.w-1, img.h-1, rand(0, 0xffffff));
    img.fillRect(rand(0, 100), rand(0, 40), rand(10, 35), rand(10, 35), rand(0, 0xffffff));
    img.drawLine(rand(0, 100), rand(0, 40), rand(0, 100), rand(0, 40), rand(0, 0xffffff));
    //return img;

    // //画曲线
    // var w=img.w/2;
    // var h=img.h;
    // var color = rand(0, 0xff0000);
    // var y1=rand(-5,5); //Y轴位置调整
    // var w2=rand(10,15); //数值越小频率越高
    // var h3=rand(4,6); //数值越小幅度越大
    // var bl = rand(1,5);
    // for(var i=-w; i<w; i+=0.1) {
    //     var y = Math.floor(h/h3*Math.sin(i/w2)+h/2+y1);
    //     var x = Math.floor(i+w);
    //     for(var j=0; j<bl; j++){
    //         img.drawPoint(x, y+j, color);
    //     }
    // }

    var p = "ABCDEFGHKMNPQRSTUVWXYZ3456789";
    var str = '';
    for(var i=0; i<5; i++){
        str += p.charAt(Math.random() * p.length |0);
    }

    var fonts = [BMP24.font12x24];
    var x = 15, y=8;
    for(var i=0; i<str.length; i++){
        var f = fonts[Math.random() * fonts.length |0];
        y = 8 + rand(-10, 10);
        img.drawChar(str[i], x, y, f, rand(0, 0xffffff));
        x += f.w + rand(2, 8);
    }
    return {img:img,font:str};
}















    router.get('/', async function (ctx, next) {


        await new Promise((a,b)=>{
            if((ctx.session.user).loginstate==1){
                ctx.redirect('/admin/a/index');
                a();
            }else{
                b();
            }
        }).catch(()=>{
            console.log('之前没登陆过，需要登陆一次');
        });

        await new Promise((a,b)=>{
            ctx.state = {
                title:'标题'
            };
            a();
        });


        await ctx.render('admin_login', {});

    })








router.get('/code_img', async function (ctx, next) {

    return next().then(() => {
        var img = makeCapcha();
        ctx.body = img.img.getFileData();
        ctx.type = 'image/bmp';
        ctx.session.captcha = img.font;

    });

})




module.exports = router;
