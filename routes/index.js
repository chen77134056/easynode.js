var router = require('koa-router')();

var filter=require('./admin/filter'); //过滤、检测危险字符
var shell=require('./mongodb_shell'); //封装mongodb获取数据函数


import session from "koa2-cookie-session";
router.use(session({
    key: "SESSIONID", //default "koa:sid"
    expires:1, //default 7
    path:"/" //default "/"
}));


//字符串截取  (字符串,截取长度)
function cutString(str, len) {

    var str1='';
    if(str.length>len){
        str1=str.slice(0,len)+'...';
    }else{
        str1=str;
    }
    return str1;
}









//浅拷贝
function shadowCopy(src,obj,ctx) {

    var dst = { //这里是各个路由公共的属性
        nav:obj.category,
        home_nav:obj.home_nav,
        title: function () {   //网页标题
                if(this.post_title){
                    var post_tile=this.post_title+'|';
                }else if(this.search_name){
                    var post_tile=this.search_name+'|';
                }else{
                    var post_tile='';
                }
                return post_tile+obj.routine.title;
        },
        login_state:undefined
    };
    dst.login_state=ctx.session.user?(ctx.session.user).loginstate:0;   //用户登陆状态
    dst.is_home=function () {   // 判断是否首页
        if(ctx.url=='/'){
            return true;
        }else{
            return false;
        }
    },
    dst.load_time=function () {  //页面加载耗时
        return (parseFloat(new Date().getTime())-parseFloat(obj.start))/1000+'秒';
    }



    for (var prop in src) {
        if (src.hasOwnProperty(prop)) {
            dst[prop] = src[prop];
        }
    }



    return dst;
}







//声明公共变量初始值
function pub_fn(src) {
    var dst={
        category_limit_list_arry:[],//<-------预定空属性
        start:new Date().getTime()
    }


    for (var prop in src) {
        if (src.hasOwnProperty(prop)) {
            dst[prop] = src[prop];
        }
    }

    return dst;
}








//将数据传输给前端页面，而声明的变量 (一般和pub_fn函数配合使用，pub_fn负责声明公共空变量，pub_fn2负责重新再将数据填上)
function pub_fn2(src,obj) {
    var dst={
        category_limit_list_arry:obj.category_limit_list_arry
    }


    for (var prop in src) {
        if (src.hasOwnProperty(prop)) {
            dst[prop] = src[prop];
        }
    }






    return dst;
}





//腾讯云ssl，免费1年验证
router.get('.well-known/pki-validation/fileauth.txt',async function(ctx,next){
    await new Promise((a,b)=>{
        ctx.body='201707091745373ll9y0sq5zysh2k4xz9trs5otq9uijhnhp3kkjrne0xdjz8fp9';
        a();
    })
});





//-------------首页-------------
router
    .get('/', async function (ctx, next) {

            //1,这部分是路由自己私有的对象变量属性
            var temp={
                category:null,  //分类数据
                post_num:null,  //文章总数量
                limit_post:null,  //限制显示文章数量
                currentpage:1,
                routine:null
            };

            var obj=pub_fn(temp);  //和pub_fn函数里面的公共变量合并
            console.log(new Date().getTime());


            //2,这部分是通过 和 数据库的交互后，获取到的值，重新赋值给了obj对象上了

            await new Promise((a,b)=>{
                shell.get_routine(obj); //要先执行，此函数是后台"设置"里面的参数
                a();
            });
            await shell.get_post_num(obj);
            await shell.limit_post(obj);
            await shell.get_category(obj);
            await shell.get_nav(obj);

            await shell.complex_category_limit_list('成人',3,obj,0);//<-------执行程序，将值赋值给obj属性中
            await shell.complex_category_limit_list('其他',5,obj,1);//<-------执行程序，将值赋值给obj属性中
            await shell.complex_category_limit_list('添加分类',5,obj,2);//<-------执行程序，将值赋值给obj属性中

            //3,这部分把obj上的属性值准备打印到前端页面上
            await new Promise((a,b)=>{

                    var person_temp={
                        cutString:cutString,  //字符串截取
                        escape2Html:filter.escape2Html,
                        clearbr:filter.clearbr,
                        post_list:obj.limit_post,  //要显出来的文章列表数据
                        pagenum_total:Math.ceil(obj.post_num/(obj.routine.home_post_num)),   //总共页码数
                        nextpage:obj.currentpage + 1, //下一页
                        prevpage:obj.currentpage - 1,  //上一页
                        currentpage:obj.currentpage, //当前页
                    };
                    var person=pub_fn2(person_temp,obj);  //私有前端对象和共有前端对象合并

                    ctx.state =shadowCopy(person,obj,ctx); //私有前端对象和共有前端对象再次合并
                    console.log(new Date().getTime());
                    a();
            });



            await ctx.render('home_index', {

            });
    })
    //-----------------首页 分页页面------------------
    .get('page/:page_num', async function (ctx, next) {
                var temp={
                    category:null,  //分类数据
                    post_num:null,  //文章总数量
                    limit_post:null,  //限制显示文章数量
                    currentpage:parseFloat(ctx.params.page_num),
                    routine:null
                };

               var obj=pub_fn(temp);

              await new Promise((a,b)=>{
                shell.get_routine(obj); //要先执行，此函数
                a();
              });
              await shell.get_post_num(obj);
              await shell.limit_post(obj);
              await shell.get_category(obj);
              await shell.get_nav(obj);

                await shell.complex_category_limit_list('成人',3,obj,0);//<-------执行程序，将值赋值给obj属性中
                await shell.complex_category_limit_list('其他',5,obj,1);//<-------执行程序，将值赋值给obj属性中
                await shell.complex_category_limit_list('添加分类',5,obj,2);//<-------执行程序，将值赋值给obj属性中


              await new Promise((a,b)=>{
                  var person_temp={
                      cutString:cutString,  //字符串截取
                      escape2Html:filter.escape2Html,
                      clearbr:filter.clearbr,

                      post_list:obj.limit_post,  //要显出来的文章列表数据
                      pagenum_total:Math.ceil(obj.post_num/5),   //总共页码数
                      nextpage:obj.currentpage + 1, //下一页
                      prevpage:obj.currentpage - 1,  //上一页
                      currentpage:obj.currentpage, //当前页
                  }

                  var person=pub_fn2(person_temp,obj);
                  ctx.state =shadowCopy(person,obj,ctx);
                  a();
              })


              await ctx.render('home_index', {
              });
    });






// --------------详细页---------------
router.get('p/:p_id', async function (ctx, next) {

    var temp={
        category:null,  //分类数据
        detailed:null,
        routine:null
    };

    var obj=pub_fn(temp);

    await new Promise((a,b)=>{
        shell.get_routine(obj); //要先执行，此函数
        a();
    });
    await shell.detailed_post(obj,ctx);
    await shell.get_category(obj);
    await shell.get_nav(obj);

    await shell.complex_category_limit_list('成人',3,obj,0);//<-------执行程序，将值赋值给obj属性中
    await shell.complex_category_limit_list('其他',5,obj,1);//<-------执行程序，将值赋值给obj属性中
    await shell.complex_category_limit_list('添加分类',5,obj,2);//<-------执行程序，将值赋值给obj属性中


    await new Promise((a,b)=>{


        var person_temp={
            time:obj.detailed[0].time,
            category:obj.detailed[0].category,
            post_title: obj.detailed[0].post_title ,
            post_con:obj.detailed[0].post_con,
            post_id:parseFloat(ctx.params.p_id)
        };

        var person=pub_fn2(person_temp,obj);

        ctx.state=shadowCopy(person,obj,ctx);

        a();
    });


    await ctx.render('home_detailed', {
    });
});








//------------------搜索页面--------------------
router
    .get('search/:search_name?/:page_num?' ,async function (ctx,next) {


        var temp={
            category:null,  //分类数据
            str:ctx.params.search_name?filter.html2Escape(ctx.params.search_name):'',
            currentpage:(!!parseFloat(ctx.params.page_num))?parseFloat(ctx.params.page_num):1,
            keyword_post:null,
            search_limit_data:null,
            routine:null
        };

        var obj=pub_fn(temp);

        await new Promise((a,b)=>{
            shell.get_routine(obj); //要先执行，此函数
            a();
        });
        await shell.search_str(obj);
        await shell.search_limit_str(obj);
        await shell.get_category(obj);
        await shell.get_nav(obj);

        await shell.complex_category_limit_list('成人',3,obj,0);//<-------执行程序，将值赋值给obj属性中
        await shell.complex_category_limit_list('其他',5,obj,1);//<-------执行程序，将值赋值给obj属性中
        await shell.complex_category_limit_list('添加分类',5,obj,2);//<-------执行程序，将值赋值给obj属性中


        await new Promise((a,b)=>{
            var person_temp={
                cutString:cutString,  //字符串截取
                escape2Html:filter.escape2Html,
                clearbr:filter.clearbr,

                search_name:obj.str,
                post_list:obj.search_limit_data,  //要显出来的文章列表数据
                pagenum_total:Math.ceil((obj.keyword_post).length/5),   //总共页码数
                nextpage:obj.currentpage + 1, //下一页
                prevpage:obj.currentpage - 1,  //上一页
                currentpage:obj.currentpage //当前页
            };

            var person=pub_fn2(person_temp,obj);

            ctx.state=shadowCopy(person,obj,ctx);
            a();
        })



        await ctx.render('home_search', {
        });
    });









//------------------分类页面------------------
router

    .get('cat/:cat_name?/:page_num?' ,async function (ctx,next) {


        var temp={
            category:null,  //分类数据
            currentpage:(!!parseFloat(ctx.params.page_num))?parseFloat(ctx.params.page_num):1,
            category_all_data:null,
            category_cat:ctx.params.cat_name,
            category_limit_list_data:null,
            routine:null
        }

        var obj=pub_fn(temp);

        await new Promise((a,b)=>{
            shell.get_routine(obj); //要先执行，此函数
            a();
        });
        await shell.category_list(obj);
        await shell.category_limit_list(obj);
        await shell.get_category(obj);
        await shell.get_nav(obj);


        await shell.complex_category_limit_list('成人',3,obj,0);//<-------执行程序，将值赋值给obj属性中
        await shell.complex_category_limit_list('其他',5,obj,1);//<-------执行程序，将值赋值给obj属性中
        await shell.complex_category_limit_list('添加分类',5,obj,2);//<-------执行程序，将值赋值给obj属性中


        await new Promise((a,b)=>{
            var person_temp = {
                cutString:cutString,  //字符串截取
                escape2Html:filter.escape2Html,
                clearbr:filter.clearbr,

                search_name:obj.category_cat,
                post_list:obj.category_limit_list_data,  //要显出来的文章列表数据
                pagenum_total:Math.ceil((obj.category_all_data).length/5),   //总共页码数
                nextpage:obj.currentpage + 1, //下一页
                prevpage:obj.currentpage - 1,  //上一页
                currentpage:obj.currentpage //当前页
            };

            var person=pub_fn2(person_temp,obj);

            ctx.state=shadowCopy(person,obj,ctx);
            a();
        })


        await ctx.render('home_category', {
        });
    });




router.get('xxx',async function (ctx,next) {


    await ctx.render('xx', {
    });
});




module.exports = router;
