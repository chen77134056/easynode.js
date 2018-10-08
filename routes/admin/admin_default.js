/**
 * Created by xgllseo on 2017/4/6.
 */
var router = require('koa-router')();
var db = require('../../data/data');
var fs=require('fs');
var path = require("path");
var filter=require('./filter'); //过滤、检测危险字符
const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);
var set_system_time = require('child_process');
var cryptopass=require('./crypto');
var koaBody   = require('koa-body');


// var tinify = require("tinify");
// tinify.key = "3PRqo0CI_x3WIELpUD_-Eu1H1ItBb_Fc";


import session from "koa2-cookie-session";
router.use(session({
    key: "SESSIONID", //default "koa:sid"
    expires:1, //default 7
    path:"/" //default "/"
}));
var moment = require('moment'); //时间格式化


//*****验证只有登陆成功后才能访问此页*****
var check_admin_login=function (ctx) {
    return new Promise((a,b)=>{

         if(!ctx.session.user){
             ctx.redirect('/admin/');

             a();
         }else{
             if(!(ctx.session.user.loginstate==1)){
                 ctx.redirect('/admin/'); //没登陆，就跳转到登陆页面
                 a();
             }else{
                 a(); //登陆过就直接跳转管理页面
             }
         }


    })
};







//新模板首台首页,概况页面
router.get('/a/:page_name?', async function (ctx,next) {
    //*****验证只有登陆成功后才能访问此页*****
    await check_admin_login(ctx);
    //*****验证只有登陆成功后才能访问此页*****




    var obj={
        post_num:undefined
    }

    await db.get('post').count().then((doc)=>{
       obj.post_num=doc;
    });

    await db.get('category').count().then((doc)=>{
        obj.category_num=doc;
    });

    await db.get('media').count().then((doc)=>{
        obj.media_num=doc;
    });

    await db.get('routine').find({}).then((doc)=>{
        obj.title=doc[0].title;
    });

    await new Promise((a,b)=>{
        ctx.state={
            title:obj.title,
            post_num:(obj.post_num).toLocaleString(),
            category_num:(obj.category_num).toLocaleString(),
            media_num:(obj.media_num).toLocaleString(),
            time:ctx.query.id,
            page_name:ctx.params.page_name || 'index'
        };

        a();
    });

    await ctx.render('adminlte_index', {

    });

});








//点击编辑文章是，返回指定文章的数据
router.post('/a/p/:page_name?', async function (ctx,next) {


    // await db.get('post').find({"_id":parseInt(ctx.query.id)}).then((doc)=>{
    //
    //     ctx.body=doc;
    // })



    await new Promise((a,b)=>{
        db.get('post').find({"_id":parseInt(ctx.query.id)}).then((doc)=>{

            db.get('category').find({}).then((doc2)=>{

                ctx.body='['+JSON.stringify(doc[0])+','+JSON.stringify(doc2)+']';
                a();
            })
        });

    })

});






//*****显示文章列表 和 搜索显示文章列表*****
router.get('/post_json', async function (ctx,next) {
    //*****验证只有登陆成功后才能访问此页*****
    await check_admin_login(ctx);
    //*****验证只有登陆成功后才能访问此页*****
    var obj={str:undefined};


    await new Promise((a,b)=>{


        if(!!ctx.query['search[value]']){

            db.get('post').find({$or:[{"post_title":new RegExp(ctx.query['search[value]'],'ig')},{"post_con": new RegExp(ctx.query['search[value]'],'ig')}]}).then((doc)=>{

                db.get('post').find({$or:[{"post_title":new RegExp(ctx.query['search[value]'],'ig')},{"post_con": new RegExp(ctx.query['search[value]'],'ig')}]}, {
                    fields: { post_con: 0 },
                    sort: {"_id": -1},
                    limit: (parseFloat(((ctx.url).split('&length='))[1])),
                    skip: ( ((((parseFloat(((ctx.url).split('&start='))[1]))/((parseFloat(((ctx.url).split('&length='))[1]))))+1) - 1) * 10 )
                }).then((limit_doc) => {

                    obj.str='{"recordsTotal": '+doc.length+',"recordsFiltered": '+doc.length+',"data":'+JSON.stringify(limit_doc)+'}';
                    a();

                })

            });
        }else{
            db.get('post').count().then((doc)=>{
                //ctx.body = '{"data":'+JSON.stringify(doc)+'}';

                db.get('post').find({}, {
                    fields: { post_con: 0 },
                    sort: {"_id": -1},
                    limit: (parseFloat(((ctx.url).split('&length='))[1])),
                    skip: ( ((((parseFloat(((ctx.url).split('&start='))[1]))/((parseFloat(((ctx.url).split('&length='))[1]))))+1) - 1) * 10 )
                }).then((limit_doc) => {

                    obj.str='{"recordsTotal": '+doc+',"recordsFiltered": '+doc+',"data":'+JSON.stringify(limit_doc)+'}';
                    a();

                })

            });
        }

    });


    await ctx.render('adminlte_json', {
         body:obj.str
    });
});









//*****显示管理员和用户列表 和 搜索显示管理员和用户列表列表*****
router.get('/user_json', async function (ctx,next) {
    //*****验证只有登陆成功后才能访问此页*****
    await check_admin_login(ctx);
    //*****验证只有登陆成功后才能访问此页*****
    var obj={str:undefined};


    await new Promise((a,b)=>{


        if(!!ctx.query['search[value]']){

            db.get('admin').find({$or:[{"user":new RegExp(ctx.query['search[value]'],'ig')}]}).then((doc)=>{

                db.get('admin').find({$or:[{"user":new RegExp(ctx.query['search[value]'],'ig')}]}, {

                    sort: {"_id": -1},
                    limit: (parseFloat(((ctx.url).split('&length='))[1])),
                    skip: ( ((((parseFloat(((ctx.url).split('&start='))[1]))/((parseFloat(((ctx.url).split('&length='))[1]))))+1) - 1) * 10 )
                }).then((limit_doc) => {

                    obj.str='{"recordsTotal": '+doc.length+',"recordsFiltered": '+doc.length+',"data":'+JSON.stringify(limit_doc)+'}';
                    a();

                })

            });
        }else{
            db.get('admin').count().then((doc)=>{
                //ctx.body = '{"data":'+JSON.stringify(doc)+'}';

                db.get('admin').find({}, {

                    sort: {"_id": -1},
                    limit: (parseFloat(((ctx.url).split('&length='))[1])),
                    skip: ( ((((parseFloat(((ctx.url).split('&start='))[1]))/((parseFloat(((ctx.url).split('&length='))[1]))))+1) - 1) * 10 )
                }).then((limit_doc) => {

                    obj.str='{"recordsTotal": '+doc+',"recordsFiltered": '+doc+',"data":'+JSON.stringify(limit_doc)+'}';
                    a();

                })

            });
        }

    });


    await ctx.render('adminlte_json', {
        body:obj.str
    });
});




//*****显示文章分类*****
router.get('/category_json', async function (ctx,next) {
    //*****验证只有登陆成功后才能访问此页*****
    await check_admin_login(ctx);
    //*****验证只有登陆成功后才能访问此页*****
    var obj={str:undefined};

    await new Promise((a,b)=>{
        var paixu = ctx.request.body.order == 'desc' ? -1 : 1;

        if(  !!ctx.query['search[value]'] ){

            db.get('category').find({$or:[{"text":new RegExp(ctx.query['search[value]'],'ig')}]}).then((doc)=>{

                db.get('category').find({$or:[{"text":new RegExp(ctx.query['search[value]'],'ig')}]}, {
                    sort: {"_id": -1},
                    limit: (parseFloat(((ctx.url).split('&length='))[1])),
                    skip: ( ((((parseFloat(((ctx.url).split('&start='))[1]))/((parseFloat(((ctx.url).split('&length='))[1]))))+1) - 1) * 10 )
                }).then((limit_doc) => {

                    obj.str='{"recordsTotal": '+doc.length+',"recordsFiltered": '+doc.length+',"data":'+JSON.stringify(limit_doc)+'}';
                    //obj.str='{"recordsTotal": '+doc+',"recordsFiltered": '+doc+',"data":'+JSON.stringify(limit_doc)+'}';
                    a();

                })

            });

        }else{

            db.get('category').count().then((doc)=>{
                db.get('category').find({}
                    ,{
                        sort: {"_id": paixu},
                        limit: (parseFloat(((ctx.url).split('&length='))[1])),
                        skip: ( ((((parseFloat(((ctx.url).split('&start='))[1]))/((parseFloat(((ctx.url).split('&length='))[1]))))+1) - 1) * 10 )
                    }
                ).then((limit_doc)=>{
                    // ctx.body=JSON.stringify(docs);
                    // a();
                    obj.str='{"recordsTotal": '+doc+',"recordsFiltered": '+doc+',"data":'+JSON.stringify(limit_doc)+'}';

                    a()
                })
            });
        }

    });

    await ctx.render('adminlte_json', {
        body:obj.str
    });
});









//*****显示链接列表*****
router.get('/link_json', async function (ctx,next) {
    //*****验证只有登陆成功后才能访问此页*****
    await check_admin_login(ctx);
    //*****验证只有登陆成功后才能访问此页*****
    var obj={str:undefined};

    await new Promise((a,b)=>{
        var paixu = ctx.request.body.order == 'desc' ? -1 : 1;

        if(  !!ctx.query['search[value]'] ){

            db.get('link').find({$or:[{"title":new RegExp(ctx.query['search[value]'],'ig')},{"url": new RegExp(ctx.query['search[value]'],'ig')}]}).then((doc)=>{

                db.get('link').find({$or:[{"title":new RegExp(ctx.query['search[value]'],'ig')},{"url": new RegExp(ctx.query['search[value]'],'ig')}]}, {
                    sort: {"_id": -1},
                    limit: (parseFloat(((ctx.url).split('&length='))[1])),
                    skip: ( ((((parseFloat(((ctx.url).split('&start='))[1]))/((parseFloat(((ctx.url).split('&length='))[1]))))+1) - 1) * 10 )
                }).then((limit_doc) => {

                    obj.str='{"recordsTotal": '+doc.length+',"recordsFiltered": '+doc.length+',"data":'+JSON.stringify(limit_doc)+'}';
                    a();

                })

            });

        }else{

            db.get('link').count().then((doc)=>{
                db.get('link').find({}
                    ,{
                        sort: {"_id": paixu},
                        limit: (parseFloat(((ctx.url).split('&length='))[1])),
                        skip: ( ((((parseFloat(((ctx.url).split('&start='))[1]))/((parseFloat(((ctx.url).split('&length='))[1]))))+1) - 1) * 10 )
                    }
                ).then((limit_doc)=>{
                    // ctx.body=JSON.stringify(docs);
                    // a();
                    obj.str='{"recordsTotal": '+doc+',"recordsFiltered": '+doc+',"data":'+JSON.stringify(limit_doc)+'}';

                    a()
                })
            });
        }

    });

    await ctx.render('adminlte_json', {
        body:obj.str
    });
});






//*****显示多媒体库列表*****
router.get('/media_json', async function (ctx,next) {
    //*****验证只有登陆成功后才能访问此页*****
    await check_admin_login(ctx);
    //*****验证只有登陆成功后才能访问此页*****
    var obj={str:undefined};

    await new Promise((a,b)=>{
        var paixu = ctx.request.body.order == 'desc' ? -1 : 1;

        if(  !!ctx.query['search[value]'] ){

            db.get('media').find({$or:[{"file_name":new RegExp(ctx.query['search[value]'],'ig')}]}).then((doc)=>{

                db.get('media').find({$or:[{"file_name":new RegExp(ctx.query['search[value]'],'ig')}]}, {
                    sort: {"_id": -1},
                    limit: (parseFloat(((ctx.url).split('&length='))[1])),
                    skip: ( ((((parseFloat(((ctx.url).split('&start='))[1]))/((parseFloat(((ctx.url).split('&length='))[1]))))+1) - 1) * 10 )
                }).then((limit_doc) => {

                    obj.str='{"recordsTotal": '+doc.length+',"recordsFiltered": '+doc.length+',"data":'+JSON.stringify(limit_doc)+'}';
                    a();

                })

            });

        }else{

            db.get('media').count().then((doc)=>{
                db.get('media').find({}
                    ,{
                        sort: {"_id": paixu},
                        limit: (parseFloat(((ctx.url).split('&length='))[1])),
                        skip: ( ((((parseFloat(((ctx.url).split('&start='))[1]))/((parseFloat(((ctx.url).split('&length='))[1]))))+1) - 1) * 10 )
                    }
                ).then((limit_doc)=>{
                    // ctx.body=JSON.stringify(docs);
                    // a();
                    obj.str='{"recordsTotal": '+doc+',"recordsFiltered": '+doc+',"data":'+JSON.stringify(limit_doc)+'}';

                    a()
                })
            });
        }

    });

    await ctx.render('adminlte_json', {
        body:obj.str
    });
});





//*****弹窗媒体库*****
router.get('/media_json2/:page', async function (ctx,next) {
    //*****验证只有登陆成功后才能访问此页*****
    await check_admin_login(ctx);
    //*****验证只有登陆成功后才能访问此页*****
    var obj={
        pagenum_total:''
    };

    await new Promise((a,b)=>{


        db.get('media').count().then((doc)=>{
            db.get('media').find({}
                ,{
                    sort: {"_id":-1},  //排序方式
                    limit: 6,  //一页中需要显示的条数
                    skip:(ctx.params.page-1)*6  // (当前页-1)*5
                }
            ).then((limit_doc)=>{
                // ctx.body=JSON.stringify(docs);
                // a();

                limit_doc.unshift(Math.ceil(doc/6));

                ctx.body=limit_doc;

                //obj.str='{"recordsTotal": '+doc+',"recordsFiltered": '+doc+',"data":'+JSON.stringify(limit_doc)+'}';

                a()
            })
        });

    });

});







//后台常规设置的数据填充
router.get('/routine',async function (ctx,next) {
    await db.get('routine').find({}).then((doc)=>{
        doc.push(moment().format('YYYY-MM-DD kk:mm:ss'))
        ctx.body=doc;
    });
});


//后台常规设置的数据修改
router.post('/routine',async function (ctx,next) {

    await new Promise((a,b)=>{
        db.get('routine').find({},'-_id').then((doc)=>{

            db.get('routine').update(doc[0],{
                title:filter.html2Escape(ctx.request.body.title),  //修改首页标题
                home_post_num:parseFloat(ctx.request.body.home_post_num)  //设置首页显示文章数目
            }).then((doc2)=>{
                ctx.body=doc2;
                a();
            });

        });
    })


});


//设置系统时间
router.post('/routine_time',async function (ctx,next) {
   await new Promise((a,b)=>{
       set_system_time.exec("date -s '"+ctx.request.body.system_time+"'", function (error, stdout, stderr) {
           if (error) {

           }else{
               ctx.body='set system time ok';
               a();
           }

       });
   });

});





// router.get('/main/user_list', async function (ctx,next) {
//     ctx.state={
//         title:'1',
//         page_name:ctx.params.page_name
//     }
//     await ctx.render('adminlte_user', {
//
//     });
// });




    //验证管理员帐号密码是否正确
    router.post('/checklogin',async function (ctx,next) {
        await new Promise((a,b)=>{

            db.get('admin').find({}).then((doc)=>{

                    if(ctx.request.body.pass.length==44){
                        if(doc[0].user==filter.html2Escape(ctx.request.body.user) && doc[0].pass==ctx.request.body.pass && filter.html2Escape(ctx.request.body.code_img)==(ctx.session.captcha).toLowerCase()){
                            ctx.session.user = {loginstate: "1"};

                            ctx.body=doc[0].pass; //这里返回的是密码加密后的字符串，说明验证成功

                            a();
                        }else{
                            ctx.session.user = {loginstate: "0"};
                            b();
                        }
                    }else{
                        if(doc[0].user==filter.html2Escape(ctx.request.body.user) && doc[0].pass==cryptopass(filter.html2Escape(ctx.request.body.pass)) && filter.html2Escape(ctx.request.body.code_img)==(ctx.session.captcha).toLowerCase()){
                            ctx.session.user = {loginstate: "1"};

                            ctx.body=doc[0].pass; //这里返回的是密码加密后的字符串，说明验证成功

                            a();
                        }else{
                            ctx.session.user = {loginstate: "0"};
                            b();
                        }
                    }

            })
        }).catch(()=>{

            ctx.body='0';
        })
    });




    //管理员退出
    router.get('/admin_out',async function (ctx,next) {
        ctx.session.user = {loginstate: "0"};
        ctx.redirect('/admin/');
    });






    //帐号密码正确后，登陆的首页
    router.get('/admin_default',async function (ctx,next) {
        //*****验证只有登陆成功后才能访问此页*****
        await check_admin_login(ctx);
        //*****验证只有登陆成功后才能访问此页*****

        await new Promise((a,b)=>{
            ctx.state = {
                title:'标题'
            };
            a();
        })
        await ctx.render('admin_default', {});
    });



    //后台树形导航
    router.post('/nav',async function (ctx,next) {
        await new Promise((a,b)=>{
            fs.readFile(path.join(__dirname,'tree.txt'),{encoding:'utf8',flag:'r'},function (err,data) {
                ctx.body= data;
                a();
            })
        });
    });




    //下拉显示文章分类
    router.post('/categorizes',async function (ctx,next) {
        await new Promise((a,b)=>{

                db.get('category').find({}).then((docs)=>{

                    ctx.body = docs;
                    a()
                })
        });
    });






    //显示管理员列表
    router.get('/post',async function (ctx,next) {

        //*****验证只有登陆成功后才能访问此页*****
        await check_admin_login(ctx);
        //*****验证只有登陆成功后才能访问此页*****
        await ctx.render('admin_right', {});
    });

    //查询并返回管理员数据
    router.post('/admin_right_data',async function (ctx,next) {
        await new Promise((a,b)=>{
            db.get('admin').find({}).then((doc)=>{

                ctx.body=JSON.stringify(doc);
                a();
            })
        }).catch(()=>{

        })
    });




    //修改管理员密码
    router.post('/edit_adminpass',async function (ctx,next) {
        await new Promise((a,b)=>{

            db.get('admin').find({user:'admin'}).then((doc)=>{
                db.get('admin').update(doc[0],{"_id":doc[0]._id,user:doc[0].user,pass:cryptopass(filter.html2Escape(ctx.request.body.password)) });
                ctx.body='1';
                a();
            })
        })
    });




//文本编辑器
router.get('/post_edit',async function (ctx,next) {
    //*****验证只有登陆成功后才能访问此页*****
    await check_admin_login(ctx);
    //*****验证只有登陆成功后才能访问此页*****
    await ctx.render('admin_edit', {});
});







//显示文章列表
router.get('/postlist',async function (ctx,next) {
    //*****验证只有登陆成功后才能访问此页*****
    await check_admin_login(ctx);
    //*****验证只有登陆成功后才能访问此页*****
    await ctx.render('admin_postlist', {});
});

//查询并返回文章列表、分页处理 以及 搜索功能返回的数据
router.post('/postlist_data',async function (ctx,next) {
    await new Promise((a,b)=>{

        if(!!ctx.request.body.search_title){

            var str=ctx.request.body.search_title;
            var paixu = ctx.request.body.order == 'desc' ? -1 : 1;
            db.get('post').find({$or:[{"post_title":new RegExp(str,'ig')},{"post_con": new RegExp(str,'ig')}]}).then((doc)=>{
                db.get('post').find({$or:[{"post_title":new RegExp(str,'ig')},{"post_con": new RegExp(str,'ig')}]}
                    ,{
                        sort: {"_id": paixu},
                        limit: parseInt(ctx.request.body.rows),
                        skip: ((parseInt(ctx.request.body.page) - 1) * parseInt(ctx.request.body.rows))
                    }
                ).then((limit_doc)=>{

                    ctx.body = '{"total":' + doc.length + ',"rows":' + JSON.stringify(limit_doc) + '}';
                    a();
                });
            });
        } else {
            db.get('post').count().then((doc) => {
                var paixu = ctx.request.body.order == 'desc' ? -1 : 1;
                db.get('post').find({}, {
                    sort: {"_id": paixu},
                    limit: parseInt(ctx.request.body.rows),
                    skip: ((parseInt(ctx.request.body.page) - 1) * parseInt(ctx.request.body.rows))
                }).then((limit_doc) => {
                    ctx.body = '{"total":' + doc + ',"rows":' + JSON.stringify(limit_doc) + '}';

                    a()
                })
            });
        }

    }).catch(()=>{

    })
});




//文章分类显示
// router.get('/categorizes',async function (ctx,next) {
//     //*****验证只有登陆成功后才能访问此页*****
//     await check_admin_login(ctx);
//     //*****验证只有登陆成功后才能访问此页*****
//
//
//     await new Promise((a,b)=>{
//         ctx.body='1';
//         a();
//     })
// });









////用户点击编辑文章时候，把数据填充到编辑文章弹窗中
router.post('/edit_data',async function (ctx,next) {
    await new Promise((a,b)=>{

        db.get('post').find({"_id":parseInt(ctx.request.body.post_id)}).then((doc)=>{

            ctx.body=  doc;
            a()
        })

    }).catch(()=>{

    })
});


//提交更新修改的文章数据
router.post('/edit_post',async function (ctx,next) {
    //post_id
    //post_title
    //post_con
    //category
    //time
    var num=0;
    await new Promise((a,b)=>{
        //1,获取当前要修改文章的id
        db.get('post').find({"_id":parseInt(ctx.request.body.post_id)},'-_id').then((doc)=>{

                //2,获取并遍历当前文章所有分类，并逐一删除。
                for(let y=0;y<((doc[0].category).split(',')).length;y++){
                    db.get('category').find({$or:[{"text":new RegExp((doc[0].category).split(',')[y],'i')}]}).then((cat_data)=>{

                        let _id=cat_data[0]._id;
                        let text=cat_data[0].text;
                        let count=cat_data[0].count;
                        db.get('category').update(cat_data[0] ,{ _id: _id, text:text, count: --count } ).then((doc_cat)=>{
                            ++num;

                            if(num==((doc[0].category).split(',')).length){
                                 num=0;
                                 a();
                            }
                        });
                    });
                }


        })

    });



    await new Promise((a,b)=>{

            db.get('post').find({"_id":parseInt(ctx.request.body.post_id)},'-_id').then((doc)=>{
                //3,更新修改的文章
                db.get('post').findOneAndUpdate(doc[0], {
                    post_title:filter.html2Escape(ctx.request.body.post_title) ,
                    post_con:ctx.request.body.post_con,
                    category:ctx.request.body.category,
                    time:ctx.request.body.time
                })
                    .then((doc)=>{
                        //4,重新添加统计该文章分类
                        for(let y=0;y<((doc.category).split(',')).length;y++){
                            db.get('category').find({$or:[{"text":new RegExp((doc.category).split(',')[y],'i')}]}).then((cat_data)=>{

                                let _id=cat_data[0]._id;
                                let text=cat_data[0].text;
                                let count=cat_data[0].count;
                                db.get('category').update(cat_data[0] ,{ _id: _id, text:text, count: ++count } ).then(()=>{

                                    ++num;

                                    if(num=>((doc.category).split(',')).length){
                                        ctx.body='1';
                                        a();
                                    }
                                })
                            });
                        }

                    })
            });

    })


});







//插入文章到数据库
router.post('/add_post',async function (ctx,next) {
    var obj={
        insert_post:null
    }

    if(ctx.request.body.future_time_switch=='true'){  //判断是否开启定时发布功能，这里是开启逻辑


        await new Promise((a,b)=>{    //以下定时器使用了 v8.1.0新增方法
            setTimeoutPromise((((new Date((ctx.request.body.future_time).replace('T',' '))).getTime())-(new Date().getTime())), '').then((value) => {
                                db.get('counters').find({}).then((docs) => {

                                    var _id=docs[1].post_value;
                                    function autoadd() {
                                        return ++_id;
                                    }


                                    db.get('post').insert([
                                        {
                                            "_id":autoadd(),
                                            post_title: filter.html2Escape(ctx.request.body.post_title),
                                            post_con: ctx.request.body.post_con,
                                            category:ctx.request.body.category,
                                            time:moment().format('YYYY-MM-DD kk:mm:ss')
                                        }
                                    ]).then((docs2)=>{

                                        db.get('counters').find({$or:[{"_id":new RegExp('postid','ig')}]}).then((docs3)=>{

                                            db.get('counters').update({post_value:docs3[0]["post_value"]},{post_value:docs2[0]["_id"]}).then(()=>{

                                                if( /(^$)/.test(docs2[0].category) ){ //当用户添加文章没选择  文章分类 时统一归类到'其他'分类中
                                                    db.get('category').find({text:'\u5176\u4ed6'}).then((cat_data)=>{
                                                        let _id=cat_data[0]._id;
                                                        let text=cat_data[0].text;
                                                        let count=cat_data[0].count;
                                                        db.get('category').update(cat_data[0] ,{ _id: _id, text:text, count: ++count } ).then(()=>{
                                                            a();
                                                        })
                                                    });
                                                }else{
                                                    for(let i=0;i<((docs2[0].category).split(',')).length;i++){
                                                        db.get('category').find({$or:[{"text":new RegExp((docs2[0].category).split(',')[i],'i')}]}).then((cat_data)=>{

                                                            let _id=cat_data[0]._id;
                                                            let text=cat_data[0].text;
                                                            let count=cat_data[0].count;
                                                            db.get('category').update(cat_data[0] ,{ _id: _id, text:text, count: ++count } )

                                                        });
                                                    }
                                                    a();
                                                }


                                            })

                                        });
                                    });
                                });

            });
            a();
        })


    }else{
          // await new Promise((a,b)=>{
          //
          //             db.get('counters').find({}).then((docs) => {
          //
          //                 var _id=docs[1].post_value; //1，获取文章id，为下篇文章分配新id
          //                 function autoadd() {
          //                     return ++_id;
          //                 }
          //
          //
          //                 db.get('post').insert([    //2，插入文章数据
          //                     {
          //                         "_id":autoadd(),
          //                         post_title: filter.html2Escape(ctx.request.body.post_title),
          //                         post_con: ctx.request.body.post_con,
          //                         category:ctx.request.body.category,
          //                         time:moment().format('YYYY-MM-DD kk:mm:ss')
          //                     }
          //                 ]).then((docs2)=>{
          //
          //                                 db.get('counters').find({$or:[{"_id":new RegExp('postid','ig')}]}).then((docs3)=>{  //3,获取最新post_id
          //
          //                                     db.get('counters').update({post_value:docs3[0]["post_value"]},{post_value:docs2[0]["_id"]}).then(()=>{  //4,post_id累加1
          //
          //                                             if( /(^$)/.test(docs2[0].category) ){ //当用户添加文章没选择  文章分类 时统一归类到'其他'分类中
          //                                                 db.get('category').find({text:'\u5176\u4ed6'}).then((cat_data)=>{
          //                                                     let _id=cat_data[0]._id;
          //                                                     let text=cat_data[0].text;
          //                                                     let count=cat_data[0].count;
          //                                                     db.get('category').update(cat_data[0] ,{ _id: _id, text:text, count: ++count } ).then(()=>{
          //                                                         obj.docs2=docs2;
          //                                                         a();
          //                                                     })
          //                                                 });
          //                                             }else{
          //                                                 for(let i=0;i<((docs2[0].category).split(',')).length;i++){
          //                                                     db.get('category').find({$or:[{"text":new RegExp((docs2[0].category).split(',')[i],'i')}]}).then((cat_data)=>{
          //
          //                                                         let _id=cat_data[0]._id;
          //                                                         let text=cat_data[0].text;
          //                                                         let count=cat_data[0].count;
          //                                                         db.get('category').update(cat_data[0] ,{ _id: _id, text:text, count: ++count } )
          //
          //                                                     });
          //                                                 }
          //                                                 obj.docs2=docs2;
          //                                                 a();
          //                                             }
          //
          //                                     })
          //
          //                                 });
          //                 });
          //             });
          //
          //
          //
          // });

        //---------------------------------------------------------------------------

          await new Promise((a,b)=>{
              //1,获取到post_id
              db.get('counters').find({$or:[{"_id":new RegExp('postid','ig')}]}).then((docs)=>{

                  db.get('post').insert([    //2，插入文章数据
                      {
                          "_id":docs[0]["post_value"]+1,
                          post_title: filter.html2Escape(ctx.request.body.post_title),
                          post_con: ctx.request.body.post_con,
                          category:ctx.request.body.category,
                          time:moment().format('YYYY-MM-DD kk:mm:ss')
                      }
                  ]).then((docs2)=>{
                      obj.insert_post=docs2;
                      a();
                  });

              })
          });




          await new Promise((a,b)=>{
              db.get('counters').find({$or:[{"_id":new RegExp('postid','ig')}]}).then((docs)=>{  //3,更新post_id索引值
                  db.get('counters').update({post_value:docs[0]["post_value"]},{post_value:docs[0]["post_value"]+1}).then(()=>{
                      a();
                  });
              });
          });



          await new Promise((a,b)=>{   //4,分类统计
                          var ok=0;

                          for(let i=0;i<((obj.insert_post[0].category).split(',')).length;i++){
                              db.get('category').find({$or:[{"text":new RegExp((obj.insert_post[0].category).split(',')[i],'i')}]}).then((cat_data)=>{

                                  let _id=cat_data[0]._id;
                                  let text=cat_data[0].text;
                                  let count=cat_data[0].count;
                                  db.get('category').update(cat_data[0] ,{ "_id": _id, text:text, count: count+1 } ).then(()=>{

                                      ++ok
                                      if( ((obj.insert_post[0].category).split(',')).length == ok){a();}
                                  })

                              });
                          }




                });


    }


    await new Promise((a,b)=>{
        ctx.body=obj.insert_post;
        //ctx.body='1';
        a();
    })


});



//上传页面
router.get('/haha',async function (ctx,next) {
    //*****验证只有登陆成功后才能访问此页*****
    await check_admin_login(ctx);
    //*****验证只有登陆成功后才能访问此页*****
    await ctx.render('upload', {});
});




//链接 单选上传页面
router.get('/link_upfile',async function (ctx,next) {
    //*****验证只有登陆成功后才能访问此页*****
    await check_admin_login(ctx);
    //*****验证只有登陆成功后才能访问此页*****
    await ctx.render('link_upfile', {});
});










//编辑器中的上传，支持单、多文件上传
router.post('/upload',
    koaBody({
        multipart: true,
        formidable: {

            uploadDir:path.join(process.cwd(), '/public/uploads/'+moment().format('YYYY')+'/'+moment().format('MM'))
        }
    }),
   async function (ctx,next) {


       await new Promise((a,b)=>{

           fs.renameSync( (ctx.request.body.files["file"]).path,((ctx.request.body.files["file"]).path)+'.'+((((ctx.request.body.files["file"])).name).split('.'))[(((((ctx.request.body.files["file"])).name).split('.')).length-1)]  ); //重命名

           // var source = tinify.fromFile(  (ctx.request.body.files["file"]).path  );
           // source.toFile(((ctx.request.body.files["file"]).path)+'_tinypng_'+'.'+((((ctx.request.body.files["file"])).name).split('.'))[(((((ctx.request.body.files["file"])).name).split('.')).length-1)]);

           a();

       });




       await new Promise((a,b)=>{
               db.get('counters').find().then((docs)=>{
                   var _id=docs[4].media_value;

                   function autoadd() {
                       return ++_id;
                   }
                   db.get('media').insert({
                       "_id":autoadd(),
                       file_name:moment().format('YYYY')+'/'+moment().format('MM')+'/'+(((ctx.request.body.files["file"]).path).split('/'))[(((ctx.request.body.files["file"]).path).split('/')).length-1]+'.'+((((ctx.request.body.files["file"])).name).split('.'))[(((((ctx.request.body.files["file"])).name).split('.')).length-1)],
                       time:moment().format('YYYY-MM-DD kk:mm:ss')
                   }).then((doc)=>{

                       db.get('counters').update(   {media_value:docs[4]["media_value"]},{media_value:doc["_id"]}   ).then(()=>{

                           //ctx.body = ctx.protocol+'://'+ctx.host+'/images/'+(((ctx.request.body.files["file"]).path).split('/'))[(((ctx.request.body.files["file"]).path).split('/')).length-1]+'.'+((((ctx.request.body.files["file"])).name).split('.'))[(((((ctx.request.body.files["file"])).name).split('.')).length-1)];
                           ctx.body = (((ctx.request.body.files["file"]).path).split('/'))[(((ctx.request.body.files["file"]).path).split('/')).length-1]+'.'+((((ctx.request.body.files["file"])).name).split('.'))[(((((ctx.request.body.files["file"])).name).split('.')).length-1)];

                           a();
                       })
                   });

               });
       });



    }
)





//上传文件之前  判断相应的年份目录是否生成
router.get('/is_folder',async function (ctx,next) {
    await new Promise((a,b)=>{

            fs.exists(path.join(process.cwd(), '/public/uploads/'+moment().format('YYYY')),function(exists){  //判断年份目录是否存在


                            if(!exists){
                                //如果年份不存在，就一次性把年和月的目录都创建了
                                fs.mkdir(path.join(process.cwd(), '/public/uploads/'+moment().format('YYYY')),function (err) {
                                    fs.mkdir(path.join(process.cwd(), '/public/uploads/'+moment().format('YYYY')+'/'+moment().format('MM')),function (err2) {
                                        ctx.body='1';
                                        a();
                                    });
                                });
                                // fs.existsSync(  path.join(process.cwd(), '/public/images/'+moment().format('YYYY')+'/'+moment().format('MM')) ,function (exists2) {
                                //       if(!exists2){
                                //           fs.mkdirSync(path.join(process.cwd(), '/public/images/'+moment().format('YYYY')+'/'+moment().format('MM')));
                                //           ctx.body='1';
                                //           a();
                                //       }else{
                                //           ctx.body='1';
                                //           a();
                                //       }
                                // } )

                            }else{


                                fs.exists(path.join(process.cwd(), '/public/uploads/'+moment().format('YYYY')+'/'+moment().format('MM')),function (err3) {
                                      if(!err3){
                                          fs.mkdir(path.join(process.cwd(), '/public/uploads/'+moment().format('YYYY')+'/'+moment().format('MM')),function (err2) {
                                              ctx.body='1';
                                              a();
                                          });
                                      }else{
                                          ctx.body='1';
                                          a();
                                      }
                                });

                            }
            });
    });
});



//批量图片上传处理
router.post('/upload2',
        koaBody({
            multipart: true,
            formidable: {
                uploadDir:path.join(process.cwd(), '/public/uploads/'+moment().format('YYYY')+'/'+moment().format('MM'))  //根据系统时间也相应生成目录，如2019/10/11的目录
            }
        }),
    async function (ctx,next) {

                await new Promise((a,b)=>{

                    if((ctx.request.body.files['uploads']).length>1){


                        //var str ='uploads'+((ctx.request.body.files['uploads']).path).split('uploads')[1]+'.'+(((ctx.request.body.files['uploads']).name).split('.'))[(((ctx.request.body.files['uploads']).name).split('.')).length-1];


                        var url_arry = (ctx.request.body.files['uploads']).map(url => {
                             //console.log(url);

                            if(  /(.rar)|(.zip)|(.gif)|(.pptx)|(.ppt)|(.docx)|(.jpg)|(.png)|(.bmp)|(.jpeg)$/.test(url.name) ){
                                return  {
                                    src0:url.path,  //E:\\xxx\\\upload_f5235b695ebb64c179d65e78d1c06041
                                    src1:url.path+'.'+((url.name).split('.'))[((url.name).split('.')).length-1]
                                }
                            }else{
                                ctx.body='0';
                                a();
                            }

                        });


                        var i=0;
                        var arr=[]; //将上传成功的文件插入数组
                        function self() {
                            

                            db.get('counters').find().then((docs)=>{
                                var _id=docs[4].media_value;
                                function autoadd() {
                                    return ++_id;
                                }
                                db.get('media').insert({
                                    "_id":autoadd(),
                                    file_name:url_arry[i].src1.split('public')[1].slice(1),
                                    time:moment().format('YYYY-MM-DD kk:mm:ss')
                                }).then((doc)=>{

                                    db.get('counters').update(   {media_value:docs[4]["media_value"]},{media_value:doc["_id"]}   ).then(()=>{
                                        fs.renameSync(  url_arry[i].src0 ,url_arry[i].src1); //重命名
                                        if(i==url_arry.length-1){
                                            arr[i]=((url_arry[i].src1).split('/'))[((url_arry[i].src1).split('/')).length-1];
                                            ctx.body=arr;
                                            a();
                                        }else{
                                            arr[i]=((url_arry[i].src1).split('/'))[((url_arry[i].src1).split('/')).length-1];
                                            i++;
                                            self();

                                        }

                                    })

                                });
                            })
                        }
                        self()


                    }else{

                       // var str =(ctx.request.body.files['uploads']).path+'.'+(((ctx.request.body.files['uploads']).name).split('.'))[(((ctx.request.body.files['uploads']).name).split('.')).length-1];
                        var str ='uploads'+((ctx.request.body.files['uploads']).path).split('uploads')[1]+'.'+(((ctx.request.body.files['uploads']).name).split('.'))[(((ctx.request.body.files['uploads']).name).split('.')).length-1];
                       // console.log( 'uploads'+((ctx.request.body.files['uploads']).path).split('uploads')[1]+'.'+(((ctx.request.body.files['uploads']).name).split('.'))[(((ctx.request.body.files['uploads']).name).split('.')).length-1] );


                        db.get('counters').find().then((docs)=>{

                            var _id=docs[4].media_value;
                            function autoadd() {
                                return ++_id;
                            }
                            db.get('media').insert({
                                "_id":autoadd(),
                                file_name:str,
                                time:moment().format('YYYY-MM-DD kk:mm:ss')
                            }).then((doc)=>{

                                db.get('counters').update(   {media_value:docs[4]["media_value"]},{media_value:doc["_id"]}   ).then(()=>{
                                    fs.renameSync(  (ctx.request.body.files['uploads']).path ,(ctx.request.body.files['uploads']).path+'.'+(((ctx.request.body.files['uploads']).name).split('.'))[(((ctx.request.body.files['uploads']).name).split('.')).length-1]); //重命名
                                    ctx.body=((str).split('/'))[((str).split('/')).length-1];

                                    a();
                                })

                            });
                        });

                    }

                });
    }
)




//删除文章操作
router.post('/remove_post',async function (ctx,next) {
    await new Promise((a,b)=>{   //删除文章分类的统计数量


        var z=0; //累加删除文章的次数
        var y=0; //累加删除单个文章 分类的次数

        function remove_category_id() {

             //1,查询删除文章 的 分类
            db.get('post').find({"_id":parseFloat((ctx.request.body.remove_id)[z])}).then((doc)=>{ //获取到删除第一篇文章的id
                function each_category() {

                    //2,先删除第一篇文章的分类
                    db.get('category').find({$or:[{"text":new RegExp((doc[0].category).split(',')[y],'i')}]}).then((cat_data)=>{ //查询第一篇文章 中的第一个分类

                                if(cat_data.length>0){  //这个判断是防止，某分类不存在时，删除某篇文章时该文章又归类属于不存在的分类
                                    let _id=cat_data[0]._id;
                                    let text=cat_data[0].text;
                                    let count=cat_data[0].count;
                                    db.get('category').update(cat_data[0] ,{ _id: _id, text:text, count: --count } ).then(()=>{  //递减删除第一篇文章 的分类

                                        if((doc[0].category).split(',').length-1==y){

                                            if((ctx.request.body.remove_id).length-1==z){
                                                a();
                                            }else{
                                                ++z;
                                                y=0;
                                                remove_category_id();
                                            }

                                        }else{
                                            ++y;
                                            each_category();
                                        }
                                    });
                                }else{
                                    a();
                                }
                    });
                }
                each_category();
            });

        }
        remove_category_id()

    });



    await new Promise((a,b)=>{  //删除选定的文章
        for(let i=0;i<(ctx.request.body.remove_id).length;i++){
            db.get('post').remove({ "_id": parseFloat((ctx.request.body.remove_id)[i]) });
        }
        a();
    });




    await new Promise((a,b)=>{
        ctx.body='1';
        a();
    })
});






//分类页面
router.get('/category',async function (ctx,next) {

    //*****验证只有登陆成功后才能访问此页*****
    await check_admin_login(ctx);
    //*****验证只有登陆成功后才能访问此页*****


    await ctx.render('category', {});
});


//返回分类信息列表给前端页面
router.post('/category_data',async function (ctx,next) {
    await new Promise((a,b)=>{
        var paixu = ctx.request.body.order == 'desc' ? -1 : 1;
        db.get('category').count().then((doc)=>{
            db.get('category').find({}
                ,{
                    sort: {"_id": paixu},
                    limit: parseInt(ctx.request.body.rows),
                    skip: ((parseInt(ctx.request.body.page) - 1) * parseInt(ctx.request.body.rows))
                }
            ).then((limit_doc)=>{
                // ctx.body=JSON.stringify(docs);
                // a();
                ctx.body = '{"total":' + doc + ',"rows":' + JSON.stringify(limit_doc) + '}';
                a()
            })
        });

    });
});


//弹窗添加文章分类名称
router.post('/add_category',async function (ctx,next) {
    await new Promise((a,b)=>{
                db.get('counters').find({}).then((docs) => {

                    var _id=docs[2].cat_value;
                    function autoadd() {
                        return ++_id;
                    }


                    db.get('category').insert([
                        {
                            "_id":autoadd(),
                            text:filter.html2Escape(ctx.request.body.cat_title) ,
                            count:0
                        }
                    ]).then((docs2)=>{
                        db.get('counters').find({$or:[{"_id":new RegExp('categoryid','ig')}]}).then((docs3)=>{
                            db.get('counters').update({cat_value:docs3[0]["cat_value"]},{cat_value:docs2[0]["_id"]}).then(()=>{
                                ctx.body='1';
                                a();
                            })
                        })
                    });
                });
    });
});



//将文章分类名称返回 编辑窗口
router.post('/edit_category',async function (ctx,next) {
    await new Promise((a,b)=>{

        db.get('category').find( {"_id":parseInt(ctx.request.body.post_id)} ).then((doc)=>{
            ctx.body=doc;
            a();
        });

    })
});



//更新修改的文章分类名称
router.post('/updata_category',async function (ctx,next) {
    await new Promise((a,b)=>{
        db.get('category').find({$or:[{"_id":parseInt(ctx.request.body.cat_id)}]}).then((doc)=>{

            db.get('category').update(doc[0],{'_id':doc[0]._id,'text':ctx.request.body.cat_title,count:doc[0].count}).then(()=>{
                ctx.body='1';
                a();
            })

        })
    })
});



//删除文章分类名称  remove_category
router.post('/remove_category',async function (ctx,next) {
    await new Promise((a,b)=>{
        for(let i=0;i<(ctx.request.body.remove_id).length;i++){
            db.get('category').remove({"_id":parseInt((ctx.request.body.remove_id)[i])});
        }
        ctx.body='1';a();
    });
});







//---------------链接-------------------

//返回 某个分类名称的所有数据给前端
router.post('/single_category',async function (ctx,next) {   //这里接受  分类名
    await new Promise((a,b)=>{


        db.get('post').find({"category":{"$in":[new RegExp(ctx.request.body.cat_text,'ig')]}}).then((doc) => {
                        var paixu = ctx.request.body.order == 'desc' ? -1 : 1;
                        db.get('post').find({"category":{"$in":[new RegExp(ctx.request.body.cat_text,'ig')]}}, {
                            sort: {"_id": paixu},
                            limit: parseInt(ctx.request.body.rows),
                            skip: ((parseInt(ctx.request.body.page) - 1) * parseInt(ctx.request.body.rows))
                        }).then((limit_doc) => {

                            ctx.body='{"total":' + doc.length + ',"rows":' + JSON.stringify(limit_doc) + '}';

                            a()
                        })
        });


    })

});






//链接页面
router.get('/link',async function (ctx,next) {
    //*****验证只有登陆成功后才能访问此页*****
    await check_admin_login(ctx);
    //*****验证只有登陆成功后才能访问此页*****



    await ctx.render('link', {
    });
});


//获取链接数据
router.post('/get_link',async function (ctx,next) {

    await new Promise((a,b)=>{
        db.get('link').find().then((docs)=>{
            var paixu = ctx.request.body.order == 'desc' ? -1 : 1;
            db.get('link').find({}, {
                sort: {"_id": paixu},
                limit: parseInt(ctx.request.body.rows),
                skip: ((parseInt(ctx.request.body.page) - 1) * parseInt(ctx.request.body.rows))
            }).then((limit_doc) => {

                ctx.body='{"total":' + docs.length + ',"rows":' + JSON.stringify(limit_doc) + '}';

                a()
            })
        });
    })

});



//添加链接数据
router.post('/add_link',async function (ctx,next) {

    await new Promise((a,b)=>{


                db.get('counters').find().then((docs)=>{
                    var _id=docs[3].link_value;
                    function autoadd() {
                        return ++_id;
                    }
                    db.get('link').insert({
                        "_id":autoadd(),
                        url:ctx.request.body.url,
                        title:ctx.request.body.title,
                        img:ctx.request.body.img
                    }).then((doc)=>{

                        db.get('counters').update(   {link_value:docs[3]["link_value"]},{link_value:doc["_id"]}   ).then(()=>{
                            ctx.body='1';
                            a();
                        })

                    });
                });

    })

});




//编辑链接 ，返回信息给 编辑弹窗
router.post('/edit_link',async function (ctx,next) {
    await new Promise((a,b)=>{
        db.get('link').find({"_id":parseInt(ctx.request.body.post_id)}).then((docs)=>{
              ctx.body=JSON.stringify(docs);
              a();
        })
    })
});




//更新修改的链接
router.post('/update_link',async function (ctx,next) {
    await new Promise((a,b)=>{
        db.get('link').find({"_id":parseInt(ctx.request.body.post_id)}).then((docs)=>{

              db.get('link').update(docs[0],{ _id: parseInt(ctx.request.body.post_id),
                  url: ctx.request.body.url,
                  title: ctx.request.body.title,
                  img: ctx.request.body.img
              }).then((doc)=>{

                  ctx.body='1';
                  a();
              });
        })
    })
});





//删除链接
router.post('/remove_link',async function (ctx,next) {
    await new Promise((a,b)=>{


        for(let i=0;i<(ctx.request.body.remove_id).length;i++){
            db.get('link').remove({"_id":parseInt((ctx.request.body.remove_id)[i])});
        }
        ctx.body='1';a();
    });


});
//---------------链接-------------------






//---------------媒体库-------------------


router.get('/media',async function (ctx,next) {
    //*****验证只有登陆成功后才能访问此页*****
    await check_admin_login(ctx);
    //*****验证只有登陆成功后才能访问此页*****
    await ctx.render('media',{});
});



//显示媒体库列表
router.post('/media_list',async function (ctx,next) {
    await new Promise((a,b)=>{
        db.get('media').find().then((docs)=>{
            var paixu = ctx.request.body.order == 'desc' ? -1 : 1;
            db.get('media').find({}, {
                sort: {"_id": paixu},
                limit: parseInt(ctx.request.body.rows),
                skip: ((parseInt(ctx.request.body.page) - 1) * parseInt(ctx.request.body.rows))
            }).then((limit_doc) => {

                ctx.body='{"total":' + docs.length + ',"rows":' + JSON.stringify(limit_doc) + '}';

                a()
            })
        });
    })
});


//上传媒体库文件
router.post('/media_upfile',async function (ctx,next) {
    await new Promise((a,b)=>{
        ctx.body='1';
        a();
    });
})



//删除媒体库文件
router.post('/remove_media',async function (ctx,next) {

    await new Promise((a,b)=>{
        for(let i=0;i<(ctx.request.body.remove_id).length;i++){
            db.get('media').find({"_id":parseInt((ctx.request.body.remove_id)[i])}).then((docs)=>{

                fs.realpath('./public/uploads/'+docs[0].file_name,function (err,file_path) {
                    if(err){
                        throw err;
                    }else {

                       fs.unlink(file_path,function (err) {

                       })
                    }
                })
            })
        }
        a();
    });


    await new Promise((a,b)=>{


        for(let i=0;i<(ctx.request.body.remove_id).length;i++){
            db.get('media').remove({"_id":parseInt((ctx.request.body.remove_id)[i])});
        }
        ctx.body='1';a();
    });



});






//常规选项

router.get('/routine',async function (ctx,next) {
    //*****验证只有登陆成功后才能访问此页*****
     await check_admin_login(ctx);
    //*****验证只有登陆成功后才能访问此页*****
    await ctx.render('routine',{});
});





//插入、修改导航
router.post('/home_nav',async function (ctx,next) {
    // [ { pa: '3', son: [ '1', '2', '3' ] },
    //     { pa: '6', son: [ '4', '5', '6' ] },
    //     { pa: '9', son: [ '7', '8', '9' ] } ]


    await new Promise((a,b)=>{
        db.get('nav').remove().then(()=>{
            a();
        });
    });



    await new Promise((a,b)=>{
        var i=0;

        edit_nav();
        function edit_nav() {
            db.get('nav').insert([
                {
                    pa:ctx.request.body.obj_json[i].pa,
                    son:ctx.request.body.obj_json[i].son
                }
            ]).then(function (doc) {
                ++i;
                if(i>=ctx.request.body.obj_json.length){
                    a();
                }else{
                    edit_nav();
                }
            });
        }



    });

    await new Promise((a,b)=>{
       // setTimeout(function () {
            ctx.body=ctx.request.body.obj_json;
            a();
       // },5000)
    })


});



//获取前端导航数据
router.post('/get_nav',async function (ctx,next) {
    await new Promise((a,b)=>{
        db.get('nav').find({}).then((doc)=>{

            ctx.body=doc;
            a();
        });



    })
});








module.exports =router;