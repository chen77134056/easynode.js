
const Koa = require('koa');
const app = new Koa();
const router = require('koa-router')();
const views = require('koa-views');
const co = require('co');
const convert = require('koa-convert');
const json = require('koa-json');
const onerror = require('koa-onerror');
const bodyparser = require('koa-bodyparser')();
const logger = require('koa-logger');


const index = require('./routes/index');
const collection = require('./routes/admin/collection');  //后台的采集功能
const admin = require('./routes/admin/admin_login'); //后台登陆页面
const admin_default = require('./routes/admin/admin_default'); //后台登陆页面后的业务逻辑

const koaBody = require('koa-body')();

// middlewares
app.use(convert(bodyparser));
app.use(convert(json()));
app.use(convert(logger()));
app.use(require('koa-static')(__dirname + '/public'));



app.use(views(__dirname + '/views', {
  extension: 'ejs'
}));







router.use('/', index.routes(), index.allowedMethods());
router.use('/admin', collection.routes(), collection.allowedMethods()); //后台的采集功能
router.use('/admin', admin.routes(), admin.allowedMethods()); //后台登陆页面
router.use('/admin', admin_default.routes(), admin_default.allowedMethods()); //后台登陆页面后的业务逻辑



// router.post('/users', koaBody,
//     function *(next) {
//         console.log(this.request.body);
//         // => POST body
//         this.body = JSON.stringify(this.request.body);
//     }
// );

app.use(router.routes(), router.allowedMethods());
// response





app.on('error',async function(err, ctx){
  console.log(err);

 // logger.error('server error', err, ctx);
});


app.use(async (ctx, next) => {
    if (ctx.status === 404){
        ctx.state = {
            title:'404页面'
        };
    }else{
        ctx.state = {
            title:'500页面'
        };
    }


    await ctx.render('error', {
    });
});






module.exports = app;