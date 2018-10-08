/**
 * 这里是首页 前端的公共 function,跟后台没关系
 */

var db = require('../data/data');


var public_obj={
    routine:null  //存放 设置对象
};


//获取常规设置信息
function get_routine(obj) {
    return db.get('routine').find({},'-_id').then((doc)=>{
        obj.routine=doc[0];   //doc[0]同时把值赋值给public_obj和obj.routine
        public_obj.routine=doc[0].home_post_num;
    });
};


//获取分类目录数据
function get_category(obj) {
    return db.get('category').find({}).then((nav1)=>{
        obj.category=nav1;
    });
}



//获取前端导航
function get_nav(obj) {
    return db.get('nav').find({}).then((nav1)=>{
        obj.home_nav=nav1;
    });
}






//获取文章统计数量
function get_post_num(obj) {
    return db.get('post').count().then((doc1) => {
        obj.post_num=doc1;
    });
}




//限制显示文章
function limit_post(obj) {
    return db.get('post').find({},{
        sort: {"_id": -1},
        limit: parseFloat(public_obj.routine) || 5, //需要显示的个数
        skip: ((obj.currentpage - 1) * (parseFloat(public_obj.routine) || 5))
    }).then((limit_doc1)=>{
        obj.limit_post=limit_doc1;
    });
}




//获取单个详细页数据
function detailed_post(obj,ctx) {
    return db.get('post').find({'_id':parseFloat(ctx.params.p_id)}).then((docs1)=>{
        if(docs1.length<1){
            docs1=[ {
                post_title: '',
                post_con: '页面不存在',
                category: '',
                time: '' } ];
        }



        obj.detailed=docs1;
    });
}



//搜索到 标题或者 内容含有的关键词就显示出所有数据
function search_str(obj) {
    return db.get('post').find({$or:[{"post_title":new RegExp(obj.str,'ig')},{"post_con": new RegExp(obj.str,'ig')}]}).then((doc1)=>{
        obj.keyword_post=doc1;
    });
}


//搜索到 标题或者 内容含有的关键词就显示出的数据加上限制
function search_limit_str(obj) {
    return db.get('post').find({$or:[{"post_title":new RegExp(obj.str,'ig')},{"post_con": new RegExp(obj.str,'ig')}]}
        ,{
            sort: {"_id": -1},
            limit: parseFloat(public_obj.routine), //需要显示的个数
            skip: ((obj.currentpage - 1) * parseFloat(public_obj.routine))
        }
    ).then((limit_doc1)=>{
        obj.search_limit_data=limit_doc1;
    });
}



//显示指定分类的所有内容
function category_list(obj) {
    return db.get('post').find({"category":{"$in":[new RegExp(obj.category_cat,'ig')]}}).then((doc1) => {
        obj.category_all_data=doc1;
    });
}



//显示指定分类的所有内容限制数量
function category_limit_list(obj) {

    return  db.get('post').find({"category":{"$in":[new RegExp(obj.category_cat,'ig')]}}, {
                sort: {"_id": -1},
                limit: parseFloat(public_obj.routine), //需要显示的个数
                skip: ((obj.currentpage - 1) * parseFloat(public_obj.routine))
            }).then((limit_doc1) => {
                obj.category_limit_list_data=limit_doc1;

            });

}


//显示指定分类的最新内容
function complex_category_limit_list(str,num,obj,i) {  //例如：('动画',5,obj,1)  (分类名称,显示数量,obj,指的是出现的顺序0开始)

    return  db.get('post').find({"category":{"$in":[new RegExp(str,'ig')]}}, {
        sort: {"_id": -1},
        limit: parseFloat(num)
    }).then((limit_doc1) => {

        obj.category_limit_list_arry[i]=limit_doc1;

    });

}










module.exports = {
    get_category:get_category,
    get_nav:get_nav,
    get_post_num:get_post_num,
    limit_post:limit_post,
    detailed_post:detailed_post,
    search_str:search_str,
    search_limit_str:search_limit_str,
    category_list:category_list,
    category_limit_list:category_limit_list,
    get_routine:get_routine,
    complex_category_limit_list:complex_category_limit_list
};