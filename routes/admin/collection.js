//采集的业务逻辑
var router = require('koa-router')();
var request=require('request');
var $ =require('cheerio');
var db = require('../../data/data');
var filter=require('./filter'); //过滤、检测危险字符
var moment = require('moment'); //时间格式化
var fs=require('fs');
var path = require("path");
var crypto = require('crypto');  //node.js内置


function view_data(strurl,fn){
    request(strurl, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            (fn)(error, response, body);
        }
    });
}



function md5(str,key){
    var decipher = crypto.createHash('md5',key)
    if(key){
        return decipher.update(str).digest()
    }
    return decipher.update(str).digest('hex')
}




function htmlDecode(str) {   // unicode to  ascill
    str=!!str?str:'';
    // 一般可以先转换为标准 unicode 格式（有需要就添加：当返回的数据呈现太多\\\u 之类的时）
    str = unescape(str.replace(/\\u/g, "%u"));
    // 再对实体符进行转义
    // 有 x 则表示是16进制，$1 就是匹配是否有 x，$2 就是匹配出的第二个括号捕获到的内容，将 $2 以对应进制表示转换
    str = str.replace(/&#(x)?(\w+);/g, function($, $1, $2) {
        return String.fromCharCode(parseInt($2, $1? 16: 10));
    });
    return !!str?str:'';
}




// 单篇文章路由
router.post('/single_collection', async function (ctx, next) {

                var obj={
                    post_title: '',
                    post_time: '',
                    post_category: '',
                    post_content: '',
                    insert_post:null
                }


                //将采集的信息 赋值给 obj
                await new Promise((a,b)=>{
                    request(ctx.request.body.collection_url, {timeout: 5000},function (error, response, body) {
                        if (!error && response.statusCode == 200) {

                            obj.post_title=$(body).find(ctx.request.body.post_title).text();
                            obj.post_time=$(body).find(ctx.request.body.post_time).text();
                            obj.post_category=ctx.request.body.post_category?ctx.request.body.post_category:'其他';
                            obj.post_content=   $(body).find(ctx.request.body.post_content).html();
                            obj.img_arry=obj.post_content.match(/<img.*?(?:>|\/>)/ig);  //收集图片，并储存为数组

                            a();
                        }
                    });

                });



                await
                    new Promise((a,b)=>{
                        var url_arry = (obj.img_arry).map(url => {

                            return  {url:(url.match(/src=[\'\"]?([^\'\"]*)[\'\"]?/i))[1]}

                        });
                        // [ { url: 'http://www.xgllseo.com/wp-content/uploads/2016/09/ssl1.png' },
                        //     { url: 'http://www.xgllseo.com/wp-content/uploads/2016/09/ssl2.png' }]

                        var i=0;

                        function self() {

                            db.get('counters').find().then((docs)=>{
                                var _id=docs[4].media_value;
                                function autoadd() {
                                    return ++_id;
                                }

                                var str='';
                                for(var z=0;z<4;z++){
                                    str=parseInt(  Math.random()*88888+11111 ).toString()+str;
                                }


                                db.get('media').insert({
                                    "_id":autoadd(),
                                    file_name:(new Date().getTime()+str+i+'')+(/\.[^\.]+$/.exec(((obj.img_arry)[i].match(/src=[\'\"]?([^\'\"]*)[\'\"]?/i))[1]))[0],
                                    time:moment().format('YYYY-MM-DD kk:mm:ss')
                                }).then((doc)=>{

                                    db.get('counters').update(   {media_value:docs[4]["media_value"]},{media_value:doc["_id"]}   ).then(()=>{

                                        if( i>=url_arry.length-1 ){
                                            request(url_arry[i].url,{timeout: 5000}).pipe(   fs.createWriteStream(   path.join(process.cwd(), '/public/images/')+ doc.file_name)  ) ;
                                            obj.post_content=htmlDecode(obj.post_content).replace(url_arry[i].url,'/images/'+ doc.file_name);

                                            a();
                                        }else{
                                            request(url_arry[i].url,{timeout: 5000}).pipe(   fs.createWriteStream(   path.join(process.cwd(), '/public/images/')+ doc.file_name)  ) ;
                                            obj.post_content=htmlDecode(obj.post_content).replace(url_arry[i].url,'/images/'+ doc.file_name);
                                            i++;
                                            self();
                                        }

                                    })

                                });
                            })
                        }
                        self()
                    });




                //------------开始插入文章-------------------
                await   //1,获取到post_id
                    db.get('counters').find({$or:[{"_id":new RegExp('postid','ig')}]}).then((docs)=>{

                        db.get('post').insert([    //2，插入文章数据
                            {
                                "_id":docs[0]["post_value"]+1,
                                post_title: filter.html2Escape(obj.post_title),
                                post_con: htmlDecode(obj.post_content),
                                category:obj.post_category,
                                time:moment().format('YYYY-MM-DD kk:mm:ss')
                            }
                        ]).then((docs2)=>{
                            obj.insert_post=docs2;
                        });

                    })




                await db.get('counters').find({$or:[{"_id":new RegExp('postid','ig')}]}).then((docs)=>{  //3,更新post_id索引值
                    db.get('counters').update({post_value:docs[0]["post_value"]},{post_value:docs[0]["post_value"]+1})
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
                //-------------开始插入文章------------------




                await new Promise((a,b)=>{

                    ctx.body=obj;
                    a();
                });

    });






var url_des=[]; //收集每一个要采集的详细页
var lost_url_des=[]; //收集超时的url页码链接
var url_des_switch=true;
var runtime=20000;
//批量采集xx
router.post('/all_collection', async function (ctx, next) {

    var obj={
        url_arry:[], //收集要采集的分页url
        url_des:[], //收集每一个要采集的详细页
        start_page:undefined,
        end_page:undefined
    }


    //1,先收集所有要采集的分页 页面
    await
        new Promise((a,b)=>{
            obj.start_page=parseFloat(ctx.request.body.start_url.split(ctx.request.body.key_word)[1]);
            obj.end_page=parseFloat(ctx.request.body.end_url.split(ctx.request.body.key_word)[1]);


            for(var i=obj.start_page;i<=obj.end_page;i++){   　
                obj.url_arry.push(ctx.request.body.start_url.replace(new RegExp(ctx.request.body.key_word+'[0-9]+','i'),ctx.request.body.key_word+i));
            }
            a();
        });



    //2,开始采集每页中的列表页的url
    await new Promise((a,b)=>{
        var total=0;



        if(url_des_switch){

                   for (const url of obj.url_arry) {

                        //先判断第一页从哪个索引开始采集
                        if(  new RegExp('^'+obj.start_page+'$','i').test(parseFloat(url.split(ctx.request.body.key_word)[1])) ){

                            request({
                                method: 'get',
                                uri: url,
                                timeout:runtime,
                            },function (error, response, body) {
                                if (!error && response.statusCode == 200) {
                                    $(body).find(ctx.request.body.post_a_url).slice(parseFloat(ctx.request.body.start_url_id)).each(function (i, el) {
                                        total++;

                                        if(total>=  ((obj.end_page-obj.start_page+1)*ctx.request.body.page_total_num)-(ctx.request.body.start_url_id)-(ctx.request.body.page_total_num-1-ctx.request.body.end_url_id) ){  //这里的10是一共要采集的详细页url,这里为了测试我只用了，两个分页，每个分页一共5条连接

                                            url_des.push(el.attribs.href);
                                            total=undefined;

                                            url_des_switch=false;
                                            a();
                                        }else{

                                            url_des.push(el.attribs.href);

                                        }

                                    });
                                }else{

                                    (function () {
                                        for(var i=0;i<ctx.request.body.end_url_id-ctx.request.body.start_url_id+1;i++){
                                            total++;
                                        }
                                    })();


                                }
                            });

                            //判断最后一个页从哪个索引结束
                        }else if(  new RegExp('^'+obj.end_page+'$','i').test( parseFloat(url.split(ctx.request.body.key_word)[1])) ){
                            request({
                                method: 'get',
                                uri: url,
                                timeout:runtime,
                            },function (error, response, body) {
                                if (!error && response.statusCode == 200) {
                                    $(body).find(ctx.request.body.post_a_url).slice(0,parseFloat(ctx.request.body.end_url_id)+1).each(function (i, el) {
                                        total++;

                                        if(total>=  ((obj.end_page-obj.start_page+1)*ctx.request.body.page_total_num)-(ctx.request.body.start_url_id)-(ctx.request.body.page_total_num-1-ctx.request.body.end_url_id) ){  //这里的10是一共要采集的详细页url,这里为了测试我只用了，两个分页，每个分页一共5条连接

                                            url_des.push(el.attribs.href);
                                            total=undefined;

                                            url_des_switch=false;
                                            a();
                                        }else{

                                            url_des.push(el.attribs.href);

                                        }
                                    });
                                }else{

                                    (function () {
                                        for(var i=0;i<ctx.request.body.end_url_id;i++){
                                            total++;
                                        }
                                    })();

                                }
                            });
                        }else{
                            request({
                                method: 'get',
                                uri: url,
                                timeout:runtime,
                            },function (error, response, body) {
                                if (!error && response.statusCode == 200) {
                                    $(body).find(ctx.request.body.post_a_url).each(function (i, el) {
                                        total++;

                                        if(total>=  ((obj.end_page-obj.start_page+1)*ctx.request.body.page_total_num)-(ctx.request.body.start_url_id)-(ctx.request.body.page_total_num-1-ctx.request.body.end_url_id) ){  //这里的10是一共要采集的详细页url,这里为了测试我只用了，两个分页，每个分页一共5条连接

                                            url_des.push(el.attribs.href);
                                            total=undefined;

                                            url_des_switch=false;
                                            a();
                                        }else{

                                            url_des.push(el.attribs.href);

                                        }


                                    });
                                }else{

                                    (function () {
                                        for(var i=0;i<5;i++){
                                            total++;
                                        }
                                    })();

                                }
                            });
                        }



                   }
        }else{
            url_des.shift();
            a();
        }


    });


    //3,开始采集每个详细页内容,并插入到数据库中
    await new Promise((a,b)=>{

        var state=true;


       // for(var i=0;i<obj.url_des.length;i++){
            function auto_add() {
                        request({
                            method: 'get',
                            uri: url_des[0],
                            timeout:runtime,
                        },function (error, response, body) {
                            if (!error && response.statusCode == 200) {


                                if(url_des.length<=1){
                                    console.log('-----'+url_des.length+'--开始采集这条url---'+url_des[0]+'------1111');

                                    //console.log($(body).find(ctx.request.body.post_title).text());
                                    db.get('counters').find({$or:[{"_id":new RegExp('postid','ig')}]}).then((docs)=>{

                                        db.get('post').insert([    //2，插入文章数据
                                            {
                                                "_id":docs[0]["post_value"]+1,
                                                post_title: $(body).find(ctx.request.body.post_title).text(),
                                                post_con: htmlDecode($(body).find(ctx.request.body.post_content).html()),
                                                category:ctx.request.body.post_category,
                                                time:moment().format('YYYY-MM-DD kk:mm:ss')
                                            }
                                        ]).then((docs2)=>{
                                            url_des.shift();
                                            db.get('counters').find({$or:[{"_id":new RegExp('postid','ig')}]}).then((docs2)=>{  //3,更新post_id索引值
                                                db.get('counters').update({post_value:docs2[0]["post_value"]},{post_value:docs2[0]["post_value"]+1}).then(()=>{

                                                    url_des_switch=true;
                                                    url_des=[];
                                                    a();
                                                })
                                            });
                                        });
                                    });


                                }else{
                                    console.log('-----'+url_des.length+'--开始采集这条url---'+url_des[0]+'------2222');
                                    //----------------开始将数据插入到数据库中---------------


                                    if(state){
                                        state=false;
                                        db.get('counters').find({$or:[{"_id":new RegExp('postid','ig')}]}).then((docs)=>{

                                            db.get('post').insert([    //2，插入文章数据
                                                {
                                                    "_id":docs[0]["post_value"]+1,
                                                    post_title: $(body).find(ctx.request.body.post_title).text(),
                                                    post_con: htmlDecode($(body).find(ctx.request.body.post_content).html()),
                                                    category:ctx.request.body.post_category,
                                                    time:moment().format('YYYY-MM-DD kk:mm:ss')
                                                }
                                            ]).then((docs2)=>{
                                                url_des.shift();
                                                db.get('counters').find({$or:[{"_id":new RegExp('postid','ig')}]}).then((docs2)=>{  //3,更新post_id索引值
                                                    db.get('counters').update({post_value:docs2[0]["post_value"]},{post_value:docs2[0]["post_value"]+1}).then(()=>{
                                                        state=true;
                                                        //++i;

                                                        auto_add();
                                                    })
                                                });
                                            });

                                        });
                                    }


                                    //-------------开始将数据插入到数据库中---------------------


                                }
                            }else{

                                url_des.shift();  //
                                auto_add();
                            }
                        });
            }
            auto_add();
        //}
    })






   ctx.body=url_des;
});














module.exports = router;
