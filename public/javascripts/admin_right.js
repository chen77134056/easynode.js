$(function () {

    //类似将&nbsp;转化为空格
    function escape2Html(str) {
        var arrEntities={'lt':'<','gt':'>','nbsp':' ','amp':'&','quot':'"'};
        return str.replace(/&(lt|gt|nbsp|amp|quot);/ig,function(all,t){return arrEntities[t];});
    }


    //类似将空格转化&nbsp;
    function html2Escape(sHtml) {
        return sHtml.replace(/[<>&"]/g,function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c];});
    }



    //显示管理员页面
    $('#manager').datagrid({
        url : 'admin_right_data',
        fit : true,
        fitColumns : true,
        striped : true,
        rownumbers : true,
        border : false,
        pagination : true,
        pageSize : 20,
        pageList : [10, 20, 30, 40, 50],
        pageNumber : 1,
        sortName : 'date',
        sortOrder : 'desc',
        toolbar : '#manager_tool',
        columns : [[
            {
                field : '_id',
                title : '自动编号',
                width : 100,
                checkbox : true,
            },
            {
                field : 'user',
                title : '管理员帐号',
                width : 100,
            },
            {
                field : 'pass',
                title : '密码',
                width : 100,
            }
        ]],
    });



    //修改管理密码
    $('#manager_edit').dialog({
        title : '修改密码',
        iconCls : 'icon-user-add',
        modal : true,
        width:260,
        closed : true,
        buttons :[{
            text:'更新',
            iconCls : 'icon-add-new',
            handler : function () {
                    $.ajax({
                        url : 'edit_adminpass',
                        type : 'post',
                        data : {
                            adminpass : $('#adminpass').val(),
                        },
                        beforeSend : function () {
                            $.messager.progress({
                                text : '正在新增中...',
                            });
                        },
                        success : function (data, response, status) {
                            $.messager.progress('close');
                            console.log(data);
                            if (data > 0) {
                                $.messager.show({
                                    title : '提示',
                                    msg : '修改密码成功',
                                });
                                $('#manager_edit').dialog('close').form('reset');
                                $('#manager').datagrid('reload');
                                $('#admin_out').click();
                            } else {
                                $.messager.alert('新增失败！', '未知错误导致失败，请重试！', 'warning');
                            }
                        }
                    });
            }
        },{
            text:'取消',
            iconCls : 'icon-redo',
            handler : function () {
                $('#manager_edit').dialog('close');
            }
        }]
    });



    manager_tool = {
         edit: function () {

             var rows = $('#manager').datagrid('getSelections');

             if (rows.length > 0) {

                 $('#manager_edit').dialog('open');

             } else {
                 $.messager.alert('提示', '请选择要编辑的记录！', 'info');
             }

        },
    };












    //前端显示文章列表
   $('#post_list').datagrid({
        url : 'postlist_data',
        fit : true,
        fitColumns : true,
        striped : true,
        rownumbers : true,
        border : false,
        pagination : true,
        pageSize : 5,
        pageList : [5,10, 20, 30, 40, 50],
        pageNumber : 1,
        sortName : 'date',
        sortOrder : 'desc',
        toolbar : '#post_list_tool',
        remoteSort:true,
        columns : [[
            {
                field : '_id',
                title : '自动编号',
                //width : 100,
                checkbox : true
            },
            {
                field : '1',
                title : '操作',
                formatter: function(value,row,index){

                    var str='<a style="color: blue;cursor: pointer" id="'+row._id+'" onclick=" post_list_tool.edit(this.id) ">编辑</a>'

                    return str;
                }
                //width : 100
            },
            {
                field : 'post_title',
                title : '标题',
                //width : 100
            },
            {
                field : 'category',
                title : '分类',
                //width : 80
            },

            {
                field : 'time',
                title : '发布时间',
                //width : 60,
                sortable:true
            }
        ]]
    });




    //添加文章弹窗
    $('#post_add').dialog({
        title : '添加文章',
        iconCls : 'icon-user-add',
        modal : true,
        closed : true,
        onClose:function () {
            $('#time_p').hide();
            $('.upload_list').text(' ');
        },
        buttons :[{
            text:'提交',
            iconCls : 'icon-add-new',
            handler : function () {
               // reload_media(); //刷新媒体列表

                console.log();
                console.log($('#future_time').datebox('getValue'));

                if(!$("#future_time_switch").get(0).checked){  //不能让用户设置定时发布时间完全一样
                        var category_str=/(^$)/.test( $('#category2').combotree('getText') )?'\u5176\u4ed6':$('#category2').combotree('getText');
                        $.ajax({
                            url : 'add_post',
                            type : 'post',
                            async:false,
                            data : {
                                post_title : $('input[name="post_title"]').val(),
                                post_con:editor.$txt.html(), //获取编辑器里面的内容
                                category:category_str,
                                future_time_switch:$("#future_time_switch").get(0).checked
                            },
                            beforeSend : function () {
                                $.messager.progress({
                                    text : '正在新增中...',
                                });
                            },
                            success : function (data, response, status) {
                                $.messager.progress('close');
                                console.log(data);
                                if (data[0]['_id'] > 0) {
                                    $.messager.show({
                                        title : '提示',
                                        msg : '添加文章成功',
                                    });
                                    //$('#post_add').dialog('close').form('reset');
                                    $('#post_list').datagrid('reload');
                                    $('#category_list').datagrid('reload');
                                    $('.add_post_iframe').attr('src', $('.add_post_iframe').attr('src')); //父页面刷新子页面
                                    // $('.upload_list').html('');
                                } else {
                                    $.messager.alert('新增失败！', '未知错误导致失败，请重试！', 'warning');
                                }
                            }
                        });

                }else{

                    if( !(/(^$)/.test($('#future_time').datebox('getValue'))) && !(/(\<)|(\")|(\')|(\/)/ig.test($('#future_time').datebox('getValue'))) ){  //验证用户传过来的时间是否为空或者时间格式是否正确 2017-5-25 14:09:47

                        window.localStorage.post_time_old=new Date( $('#future_time').datebox('getValue') ).getTime();

                        if(typeof window.localStorage.post_time_new1 == 'undefined'){
                            window.localStorage.post_time_new1=0;
                        }
                        if(window.localStorage.post_time_old > window.localStorage.post_time_new1){  //启动定时发布功能，并且时间不一样
                            var category_str=/(^$)/.test( $('#category2').combotree('getText') )?'\u5176\u4ed6':$('#category2').combotree('getText');
                            $.ajax({
                                url : 'add_post',
                                type : 'post',
                                async:false,
                                data : {
                                    post_title : $('input[name="post_title"]').val(),
                                    post_con:editor.$txt.html(), //获取编辑器里面的内容
                                    category:category_str,
                                    future_time:$('#future_time').datebox('getValue'),
                                    future_time_switch:$("#future_time_switch").get(0).checked
                                },
                                beforeSend : function () {
                                    $.messager.progress({
                                        text : '正在新增中...',
                                    });
                                },
                                success : function (data, response, status) {
                                    $.messager.progress('close');
                                    console.log(data);
                                    if (data > 0) {
                                        $.messager.show({
                                            title : '提示',
                                            msg : '添加文章成功',
                                        });
                                        $('#post_add').dialog('close').form('reset');
                                        $('#post_list').datagrid('reload');
                                        $('#category_list').datagrid('reload');
                                        $('.add_post_iframe').attr('src', $('.add_post_iframe').attr('src')); //父页面刷新子页面
                                        // $('.upload_list').html('');
                                    } else {
                                        $.messager.alert('新增失败！', '未知错误导致失败，请重试！', 'warning');
                                    }
                                }
                            });
                            window.localStorage.post_time_new1=window.localStorage.post_time_old;

                        }
                    }else{
                        $.messager.alert('新增失败！', '不能设置发布时间完全一样，且时间只能递增,注意时间格式也要正确', 'warning');
                    }


                }

                $('.upload_list').text(' ');

            }
        },{
            text:'取消',
            iconCls : 'icon-redo',
            handler : function () {
                $('#post_add').dialog('close');
                $('#time_p').hide();
                $('.upload_list').text(' ');
            }
        }]
    });


$(window).resize(function () {
    $('#post_add,#post_edit').parents('.panel.window').width( $(this).width()-10  );
    $('#post_add .dialog-content,#post_edit .dialog-content').width( $(this).width()-40  );
    $('#post_add,#post_edit').prev('.window-header').width( $(this).width()-10  );
    $('#post_add .panel,#post_edit .panel').width( $(this).width()-10  );
});



//编辑文章弹窗
    $('#post_edit').dialog({
        title : '编辑文章',
        iconCls : 'icon-user-add',
        modal : true,
        closed : true,
        onClose:function () {
            $('.upload_list').text(' ');
        },
        buttons :[{
            text:'提交',
            iconCls : 'icon-add-new',
            handler : function () {
                $.ajax({
                    url : 'edit_post',
                    type : 'post',
                    data : {
                        post_id:$('#post_id').val(),
                        post_title : $('#edit_title').val(),
                        post_con:editor2.$txt.html(), //获取编辑器里面的内容
                        category:$('#category3').combotree('getText'),
                        time:$('#post_time').val()
                    },
                    beforeSend : function () {
                        $.messager.progress({
                            text : '正在新增中...',
                        });
                    },
                    success : function (data, response, status) {
                        $.messager.progress('close');
                        console.log(data);
                        if (data > 0) {
                            $.messager.show({
                                title : '提示',
                                msg : '修改成功',
                            });
                            //$('#post_edit').dialog('close').form('reset');
                            $('#post_list').datagrid('reload');
                            $('#category_list').datagrid('reload');
                            $('.upload_list').html('');
                        } else {
                            $.messager.alert('新增失败！', '未知错误导致失败，请重试！', 'warning');
                        }
                        $('.upload_list').text(' ');
                    }
                });
            }
        },{
            text:'取消',
            iconCls : 'icon-redo',
            handler : function () {
                $('#post_edit').dialog('close');
                $('.upload_list').text(' ');
            }
        }]
    });




    post_list_tool = {
        add : function () {  //点击添加按钮触发
            $('#post_add').dialog('refresh').dialog('open').form('reset');
            editor.$txt.html('');
        },
        edit:function (value) {   //点击修改按钮触发

           //var rows = $('#post_list').datagrid('getSelections');

           //if (rows.length > 0) {
           if (!!value) {

                $('#post_edit').dialog('open');
                $.ajax({
                    async: false,
                    type : 'post',
                    url : 'edit_data',
                    data:{post_id:value},
                    dataType : 'json',
                    success:function (data) {
                        console.log(data);
                        $('input[name="post_id"]').val(data[0]["_id"]);
                        $('#edit_title').val( escape2Html(data[0].post_title) );
                        //$('#category3').combotree('setValues',{text: data[0].category});
                        // $('#category3').combotree({});
                        $('#category3').combotree('setValues',[data[0].category]);

                        $('#post_time').val(data[0].time.replace('&nbsp;',' '));
                        editor2.$txt.html(data[0].post_con);
                    }
                });
            } else {
                $.messager.alert('提示', '请选择要编辑的记录！', 'info');
            }
            //$('#post_list').datagrid('reload');
        },
        remove:function () {
            var rows = $('#post_list').datagrid('getSelections');
            console.log( rows  );
            if (rows.length > 0) {
                $.messager.confirm('确定操作', '您正在要删除所选的记录吗？', function (flag) {
                    if (flag) {
                        var ids = [];
                        for (var i = 0; i < rows.length; i ++) {
                            ids.push(rows[i]["_id"]);
                        }

                        $.ajax({
                            url:"remove_post",
                            type:'post',
                            async:false,
                            dataType : 'json',
                            data:{remove_id:ids},
                            success:function (data) {
                                   if(data>0){
                                       $.messager.show({
                                           title : '提示',
                                           msg : '删除成功',
                                       });
                                       $('#post_list').datagrid('reload');
                                       $('#category_list').datagrid('reload');
                                       $('.datagrid-header-check').prop('checked',false);
                                   }else{
                                       $.messager.alert('删除失败！', '删除文章失败，请重试！', 'warning');
                                   }
                                   $('#post_list').datagrid("clearSelections");  //全选，并删除后。全选按钮初始化
                            }
                        })
                    }
                });
            } else {
                $.messager.alert('提示', '请选择要删除的记录！', 'info');
            }
        },
        search:function () {
            $('#post_list').datagrid('load',{
                search_title:   $.trim( html2Escape( $('input[name="search_title"]').val() )  ).replace(' ','*')
            });
        },
        reload:function () {
            $('#post_list').datagrid('reload');
        }
    };






    //管理员弹窗中的分类
    $('#category').combotree({
        url : '/admin/nav',
        required : true,
        lines : true,
        multiple : true,
        checkbox : true,
        onlyLeafCheck : true,
        onLoadSuccess : function (node, data) {
            var _this = this;
            if (data) {
                $(data).each(function (index, value) {
                    if (this.state == 'closed') {
                        $(_this).tree('expandAll');
                    }
                });
            }
        },
    });



   //添加文章弹窗中的分类
    $('#category2').combotree({
        url : '/admin/categorizes',
        lines : true,
        multiple : true,
        checkbox : true,
        onlyLeafCheck : true,
        onLoadSuccess : function (node, data) {
            var _this = this;
            if (data) {
                $(data).each(function (index, value) {
                    if (this.state == 'closed') {
                        $(_this).tree('expandAll');
                    }
                });
            }
        },
    });

    //编辑弹窗的分类
    $('#category3').combotree({
        url : '/admin/categorizes',
        lines : true,
        multiple : true,
        checkbox : true,
        onlyLeafCheck : true,
        onLoadSuccess : function (node, data) {
            var _this = this;
            if (data) {
                $(data).each(function (index, value) {
                    console.log(value)
                    if (this.state == 'closed') {
                        $(_this).tree('expandAll');
                    }
                });
            }
        },
    });

	
});







//显示文章分类
$('#category_list').datagrid({
    url : 'category_data',
    fit : true,
    fitColumns : true,
    striped : true,
    rownumbers : true,
    border : false,
    pagination : true,
    pageSize : 10,
    pageList : [10, 20, 30, 40, 50],
    pageNumber : 1,
    sortName : 'date',
    sortOrder : 'desc',
    toolbar : '#category_list_tool',
    remoteSort:true,
    columns : [[
        {
            field : '_id',
            title : '自动编号',
            width : 100,
            checkbox : true,
        },
        {
            field : 'text',
            title : '分类名称'
        },
        {
            field : 'count',
            title : '文章总数'
        }
    ]]
});





//文章分类 添加、修改、删除
category_list_tool={
    add:function () {
        $('#add_category').dialog('open').form('reset').dialog('refresh');
        $('#cat_title').focus();

    },
    remove:function () {
        var rows = $('#category_list').datagrid('getSelections');
        console.log(rows)
        if (rows.length > 0) {
            $.messager.confirm('确定操作', '您正在要删除所选的记录吗？', function (flag) {
                if (flag) {
                    var ids = [];
                    for (var i = 0; i < rows.length; i ++) {
                        if(rows[i].text=='\u5176\u4ed6'){  //禁止把'其他'这个分类删除
                            continue;
                        }else{
                            ids.push(rows[i]["_id"]);
                        }

                    }

                    $.ajax({
                        url:"remove_category",
                        type:'post',
                        async:false,
                        dataType : 'json',
                        data:{remove_id:ids},
                        success:function (data) {
                            if(data>0){
                                $.messager.show({
                                    title : '提示',
                                    msg : '删除成功',
                                });
                                $('#category_list').datagrid('reload');
                                reload_category();
                            }else{
                                $.messager.alert('删除失败！', '删除文章失败，请重试！', 'warning');
                            }
                            $('#category_list').datagrid("clearSelections");
                        }
                    })
                }
            });
        } else {
            $.messager.alert('提示', '请选择要删除的记录！', 'info');
        }
    },
    edit:function () {
        var rows = $('#category_list').datagrid('getSelections');

        if (rows.length > 0) {

            $('#edit_category').dialog('open');
            $.ajax({
                async: false,
                type : 'post',
                url : 'edit_category',
                data:{
                    post_id:rows[0]["_id"]
                },
                dataType : 'json',
                success:function (data) {

                   $('#cat_title2').val( data[0].text );
                   $('#cat_id').val(data[0]._id);
                }
            });
        } else {
            $.messager.alert('提示', '请选择要编辑的记录！', 'info');
        }
    },
    search:function () {
        window.location.href='/admin/postlist'
    },
    showall:function () {
                $('#category_list').datagrid({
                    url : 'category_data',
                    fit : true,
                    fitColumns : true,
                    striped : true,
                    rownumbers : true,
                    border : false,
                    pagination : true,
                    pageSize : 10,
                    pageList : [10, 20, 30, 40, 50],
                    pageNumber : 1,
                    sortName : 'date',
                    sortOrder : 'desc',
                    toolbar : '#category_list_tool',
                    remoteSort:true,
                    columns : [[
                        {
                            field : '_id',
                            title : '自动编号',
                            width : 100,
                            checkbox : true,
                        },
                        {
                            field : 'text',
                            title : '分类名称'
                        },
                        {
                            field : 'count',
                            title : '文章总数'
                        }
                    ]]
                });
                $('#category_list').datagrid('reload');
    }
}



//添加 文章分类 弹窗
$('#add_category').dialog({
    title : '添加分类',
    iconCls : 'icon-user-add',
    modal : true,
    width:260,
    closed : true,
    buttons :[{
        text:'提交',
        iconCls : 'icon-add-new',
        handler : function () {
            $.ajax({
                url : 'add_category',
                type : 'post',
                data : {
                    cat_title:$('#cat_title').val()
                },
                beforeSend : function () {
                    $.messager.progress({
                        text : '正在新增中...',
                    });
                },
                success : function (data, response, status) {
                    $.messager.progress('close');
                    console.log(data);
                    if (data > 0) {
                        $.messager.show({
                            title : '提示',
                            msg : '修改成功',
                        });
                        $('#add_category').dialog('close').form('reset');
                        $('#category_list').datagrid('reload');
                        $('#post_list').datagrid('reload');
                        reload_category();
                    } else {
                        $.messager.alert('新增失败！', '未知错误导致失败，请重试！', 'warning');
                    }
                }
            });
        }
    },{
        text:'取消',
        iconCls : 'icon-redo',
        handler : function () {
            $('#add_category').dialog('close');
        }
    }]
});




//修改 文章分类 弹窗
$('#edit_category').dialog({
    title : '修改分类',
    iconCls : 'icon-user-add',
    modal : true,
    width:260,
    closed : true,
    buttons :[{
        text:'提交',
        iconCls : 'icon-add-new',
        handler : function () {
            $.ajax({
                url : 'updata_category',
                type : 'post',
                data : {
                    cat_title:$('#cat_title2').val(),
                    cat_id:$('#cat_id').val()
                },
                beforeSend : function () {
                    $.messager.progress({
                        text : '正在新增中...',
                    });
                },
                success : function (data, response, status) {
                    $.messager.progress('close');
                    console.log(data);
                    if (data > 0) {
                        $.messager.show({
                            title : '提示',
                            msg : '修改成功',
                        });
                        $('#edit_category').dialog('close').form('reset');
                        $('#category_list').datagrid('reload');
                        $('#post_list').datagrid('reload');

                    } else {
                        $.messager.alert('新增失败！', '未知错误导致失败，请重试！', 'warning');
                    }
                }
            });
        }
    },{
        text:'取消',
        iconCls : 'icon-redo',
        handler : function () {
            $('#edit_category').dialog('close');
        }
    }]
});






//批量上传按钮
$('#upload_bt').click(function () {
    $.ajax({
        type:'post',
        url:'/admin/upload'
    })
});






//下拉显示单个分类所有列表
reload_category();
function reload_category() {
    $('#single_category').combotree({
        url : '/admin/categorizes',
        lines : true,
        //multiple : true,
        //checkbox : true,
        //onlyLeafCheck : true,
        onSelect:function(node, data){
            console.log(node.text);
            $('#category_list').datagrid({
                url : 'single_category',
                queryParams: {
                    cat_text:node.text
                },
                fit : true,
                fitColumns : true,
                striped : true,
                rownumbers : true,
                border : false,
                pagination : true,
                pageSize : 5,
                pageList : [5,10, 20, 30, 40, 50],
                pageNumber : 1,
                sortName : 'date',
                sortOrder : 'desc',

                remoteSort:true,
                columns : [[
                    {
                        field : '_id',
                        title : '自动编号',
                        //width : 100,
                        checkbox : true
                    },

                    {
                        field : 'post_title',
                        title : '标题',
                        //width : 100
                    },
                    {
                        field : 'category',
                        title : '分类',
                        //width : 80
                    },
                    {
                        field : 'post_con',
                        title : '内容',
                        //width : 100
                    },
                    {
                        field : 'time',
                        title : '发布时间',
                        //width : 60,
                        sortable:true
                    }
                ]]
            });
        },
        onLoadSuccess : function (node, data) {
            var _this = this;
            if (data) {
                $(data).each(function (index, value) {
                    if (this.state == 'closed') {
                        $(_this).tree('expandAll');
                    }
                });
            }
        },
    });
}








// ---------链接分类--------------


//显示链接列表

$('#link_list').datagrid({
    url : 'get_link',
    fit : true,
    fitColumns : true,
    striped : true,
    rownumbers : true,
    border : false,
    pagination : true,
    pageSize : 5,
    pageList : [5,10, 20, 30, 40, 50],
    pageNumber : 1,
    sortName : 'date',
    sortOrder : 'desc',
    toolbar : '#link_list_tool',
    remoteSort:true,
    columns : [[
        {
            field : '_id',
            title : '自动编号',
            //width : 100,
            checkbox : true
        },
        {
            title : '_id',
            formatter:function(value,row){
                return row._id
            }
        },
        {
            field : 'title',
            title : '名称',
            //width : 100
        },
        {
            field : 'url',
            title : '地址',
            //width : 80
        },
        {
            field : 'img',
            title : '图片',
            align : 'center',
            formatter:function(value,row){
                var time=new Date();
                var update_time=''+time.getFullYear()+(time.getMonth()+1)+time.getDate()+time.getHours()+time.getMinutes()+time.getSeconds();
                var str = "";
                if(value!="" || value!=null){

                      str = "<img style=\"height: 80px;\" src=\""+window.location.protocol+"//"+window.location.host+"/images/"+row.img+"?"+update_time+"\"/>";
                      return str;
                }
            },
            width : 'auto'
        }
    ]]
});










//添加链接
$('#add_link').dialog({
    title : '添加链接',
    iconCls : 'icon-user-add',
    modal : true,
    width:260,
    closed : true,
    buttons :[{
        text:'提交',
        iconCls : 'icon-add-new',
        handler : function () {
            //$('#link_img').val($($("#iframe")[0].contentDocument).find('body').text());
            $.ajax({
                url : 'add_link',
                type : 'post',
                data : {
                    url:$('#link_url').val(),
                    title:$('#link_title').val(),
                    img:$('#link_img').val()
                },
                beforeSend : function () {
                    $.messager.progress({
                        text : '正在新增中...',
                    });
                },
                success : function (data, response, status) {
                    $.messager.progress('close');
                    console.log(data);
                    if (data > 0) {
                        $.messager.show({
                            title : '提示',
                            msg : '修改成功',
                        });
                        $('#add_link').dialog('close').form('reset');
                        $('#link_list').datagrid('reload');
                        $('.prompt_span').text('');
                    } else {
                        $.messager.alert('新增失败！', '未知错误导致失败，请重试！', 'warning');
                    }
                }
            });
            console.log($('#link_img').val())
        }
    },{
        text:'取消',
        iconCls : 'icon-redo',
        handler : function () {
            $('#add_link').dialog('close').form('reset');
            $('.prompt_span').text('');
        }
    }]
});







//编辑链接
$('#edit_link').dialog({
    title : '编辑链接',
    iconCls : 'icon-user-add',
    modal : true,
    width:260,
    closed : true,
    buttons :[{
        text:'提交',
        iconCls : 'icon-add-new',
        handler : function () {
           // $('#link_img2').val($($("#iframe2")[0].contentDocument).find('body').text());

            $.ajax({
                url : 'update_link',
                type : 'post',
                data : {
                    post_id:$('#link_id').val(),
                    url:$('#link_url2').val(),
                    title:$('#link_title2').val(),
                    img:$('#link_img2').val()
                },
                beforeSend : function () {
                    $.messager.progress({
                        text : '正在新增中...',
                    });
                },
                success : function (data, response, status) {
                    $.messager.progress('close');
                    console.log(data);
                    if (data > 0) {
                        $.messager.show({
                            title : '提示',
                            msg : '修改成功',
                        });
                        $('#edit_link').dialog('close').form('reset');
                        $('#link_list').datagrid('reload');
                        $('.prompt_span').text('');
                    } else {
                        $.messager.alert('新增失败！', '未知错误导致失败，请重试！', 'warning');
                    }
                }
            });
        }
    },{
        text:'取消',
        iconCls : 'icon-redo',
        handler : function () {
            $('#edit_link').dialog('close').form('reset');
            $('.prompt_span').text('');
        }
    }]
});







link_list_tool={
    add:function () {
        $('#add_link').dialog('open').form('reset');
    },
    edit:function () {
        var rows = $('#link_list').datagrid('getSelections');

        if (rows.length > 0) {

            $('#edit_link').dialog('open');
            $.ajax({
                async: false,
                type : 'post',
                url : 'edit_link',
                data:{
                    post_id:rows[0]["_id"]
                },
                dataType : 'json',
                success:function (data) {
                    console.log(data)
                    // $('#cat_title2').val(data[0].text);
                    // $('#cat_id').val(data[0]._id);
                    $('#link_id').val(data[0]._id);
                    $('#link_url2').val(data[0].url);
                    $('#link_title2').val(data[0].title);
                    $('#link_img2').val(data[0].img);
                }
            });
        } else {
            $.messager.alert('提示', '请选择要编辑的记录！', 'info');
        }
    },
    remove:function () {
        var rows = $('#link_list').datagrid('getSelections');
        if (rows.length > 0) {
            $.messager.confirm('确定操作', '您正在要删除所选的记录吗？', function (flag) {
                if (flag) {
                    var ids = [];
                    for (var i = 0; i < rows.length; i ++) {
                        ids.push(rows[i]["_id"]);
                    }

                    $.ajax({
                        url:"remove_link",
                        type:'post',
                        async:false,
                        dataType : 'json',
                        data:{remove_id:ids},
                        success:function (data) {
                            if(data>0){
                                $.messager.show({
                                    title : '提示',
                                    msg : '删除成功',
                                });
                                $('#link_list').datagrid('reload');

                            }else{
                                $.messager.alert('删除失败！', '删除文章失败，请重试！', 'warning');
                            }
                            $('#link_list').datagrid("clearSelections");
                        }
                    })
                }
            });
        } else {
            $.messager.alert('提示', '请选择要删除的记录！', 'info');
        }
    },
    search:function () {

    },
    reload:function () {
        $('#link_list').datagrid('reload');
    }
};






// //添加文章弹窗中的媒体弹窗
// $.modalDialogTwo = function(options) {
//
//     $('#media_list2').datagrid('reload');
//         var opts = $.extend({
//             title : '媒体库',
//             iconCls : 'icon-user-add',
//             width : 840,
//             height : 680,
//             modal : true,
//
//             onClose : function() {
//                 // $.modalDialogTwo.handler = undefined;
//                 // $(this).dialog('destroy');
//
//
//
//             },
//             onOpen : function() {
//                 // parent.$.messager.progress({
//                 // title : '提示',
//                 // text : '数据加载中，请稍后....'
//                 // });
//             }
//         }, options);
//
//         return $.modalDialogTwo.handler = $('#media2').dialog(opts);
//     //}
// };



//媒体显示列表
reload_media();
function reload_media(){
    $('#media_list').datagrid({
        url : 'media_list',
        fit : true,
        fitColumns : true,
        striped : true,
        rownumbers : true,
        border : false,
        pagination : true,
        pageSize : 5,
        pageList : [5,10, 20, 30, 40, 50],
        pageNumber : 1,
        sortName : 'date',
        sortOrder : 'desc',
        toolbar : '#media_list_tool',
        remoteSort:true,
        columns : [[
            {
                field : '_id',
                title : '自动编号',
                width:'auto',
                checkbox : true
            },
            {
                field : 'img',
                title : '图片',
                align : 'center',
                width:'auto',
                formatter:function(value,row){



                    var type=row.file_name.split('.')[1];
                    switch (true)
                    {
                        case type=='rar':
                            return  "<img style=\"height: 80px;width: auto\" src=\""+window.location.protocol+"//"+window.location.host+"/icons/rar.png \"/>";
                            break;
                        case type=='zip':
                            return  "<img style=\"height: 80px;width: auto\" src=\""+window.location.protocol+"//"+window.location.host+"/icons/zip.png \"/>";
                            break;
                        case type=='html':
                            return  "<img style=\"height: 80px;width: auto\" src=\""+window.location.protocol+"//"+window.location.host+"/icons/html.png \"/>";
                            break;
                        case type=='css':
                            return  "<img style=\"height: 80px;width: auto\" src=\""+window.location.protocol+"//"+window.location.host+"/icons/css.png \"/>";
                            break;
                        case type=='gif':
                            return  "<img style=\"height: 80px;width: auto\" src=\""+window.location.protocol+"//"+window.location.host+"/icons/gif.png \"/>";
                            break;
                        case type=='text':
                            return  "<img style=\"height: 80px;width: auto\" src=\""+window.location.protocol+"//"+window.location.host+"/icons/text.png \"/>";
                            break;
                        case type=='pptx':
                            return  "<img style=\"height: 80px;width: auto\" src=\""+window.location.protocol+"//"+window.location.host+"/icons/pptx.png \"/>";
                            break;
                        case type=='ppt':
                            return  "<img style=\"height: 80px;width: auto\" src=\""+window.location.protocol+"//"+window.location.host+"/icons/pptx.png \"/>";
                            break;
                        case type=='docx':
                            return  "<img style=\"height: 80px;width: auto\" src=\""+window.location.protocol+"//"+window.location.host+"/icons/docx.png \"/>";
                            break;
                        case type=='jpg' || type=='gif' || type=='png' || type=='bmp' || type=='jpeg':
                            return "<img style=\"height: 80px;width: auto\" src=\""+window.location.protocol+"//"+window.location.host+"/images/"+row.file_name+"\"/>";
                            break;
                        default:
                            return  "<img style=\"height: 80px;width: auto\" src=\""+window.location.protocol+"//"+window.location.host+"/icons/other.png \"/>";
                            break;
                    }


                }

            },

            {
                field : 'file_name',
                title : '地址',
                //width : 80
            },


            {
                field : 'time',
                title : '时间',
                //width : 80
            }
        ]]
    });
}





media_list_tool={
    add:function () {
        $('#media_add').dialog('open').form('reset');
        $('#iframe3').attr('src', $('#iframe3').attr('src')); //父页面刷新子页面

    },
    remove:function () {

        var rows = $('#media_list').datagrid('getSelections');
        if (rows.length > 0) {
            $.messager.confirm('确定操作', '您正在要删除所选的记录吗？', function (flag) {
                if (flag) {
                    var ids = [];
                    for (var i = 0; i < rows.length; i ++) {
                        ids.push(rows[i]["_id"]);
                    }

                    $.ajax({
                        url:"remove_media",
                        type:'post',
                        async:false,
                        dataType : 'json',
                        data:{remove_id:ids},
                        success:function (data) {
                            if(data>0){
                                $.messager.show({
                                    title : '提示',
                                    msg : '删除成功',
                                });
                                $('#media_list').datagrid('reload');


                                $('#link_list').datagrid('reload');


                            }else{
                                $.messager.alert('删除失败！', '删除文章失败，请重试！', 'warning');
                            }
                            $('#media_list').datagrid("clearSelections");
                        }
                    })
                }
            });
        } else {
            $.messager.alert('提示', '请选择要删除的记录！', 'info');
        }
    },
    reload:function () {
        $('#media_list').datagrid('reload');
    }
}



//添加媒体文件弹窗
$('#media_add').dialog({
    title : '添加文件',
    iconCls : 'icon-user-add',
    modal : true,
    width:260,
    closed : true,
    buttons :[{
        text:'提交',
        iconCls : 'icon-add-new',
        handler : function () {

            $('#upfile_info').val($($("#iframe3")[0].contentDocument).find('body').text());
            $.ajax({
                url : 'media_upfile',
                type : 'post',
                data : {
                    upfile_info:$('#upfile_info').val()
                },
                beforeSend : function () {
                    $.messager.progress({
                        text : '正在新增中...',
                    });
                },
                success : function (data, response, status) {
                    $.messager.progress('close');
                    console.log(data);
                    if (data > 0) {
                        $.messager.show({
                            title : '提示',
                            msg : '修改成功',
                        });
                        $('#media_add').dialog('close').form('reset');
                        $('#media_list').datagrid('reload');

                    } else {
                        $.messager.alert('新增失败！', '未知错误导致失败，请重试！', 'warning');
                    }
                }
            });


        }
    },{
        text:'取消',
        iconCls : 'icon-redo',
        handler : function () {
            $('#media_add').dialog('close').form('reset');
        }
    }]
});




//
//
// //添加文章里面的媒体显示列表
// $('#media_list2').datagrid({
//     url : 'media_list',
//     fit : true,
//     fitColumns : true,
//     striped : true,
//     rownumbers : true,
//     border : false,
//     pagination : true,
//     pageSize : 5,
//     pageList : [5,10, 20, 30, 40, 50],
//     pageNumber : 1,
//     sortName : 'date',
//     sortOrder : 'desc',
//     toolbar : '#media_list_tool2',
//     remoteSort:true,
//     columns : [[
//         {
//             field : '_id',
//             title : '自动编号',
//             //width : 100,
//             checkbox : true
//         },
//         {
//             field : 'title',
//             title : '名称',
//             //width : 100
//         },
//         {
//             field : 'url',
//             title : '地址',
//             //width : 80
//         },
//         {
//             field : 'img',
//             title : '图片',
//             align : 'center',
//             formatter:function(value,row){
//
//                 var str = "";
//                 if(value!="" || value!=null){
//                     str = "<img style=\"height: 80px;\" src=\""+window.location.protocol+"//"+window.location.host+"/images/"+row.img+"\"/>";
//
//                     return str;
//                 }
//             },
//             width : 'auto'
//         }
//     ]]
// });


