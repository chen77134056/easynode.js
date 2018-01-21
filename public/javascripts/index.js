$(function () {
	
	//登录界面
	$('#login').dialog({
		title : '登录后台',
		width : 300,
		height : 220,
		modal : true,
		iconCls : 'icon-login',
		buttons : '#btn',
	});
	
	//管理员帐号验证
	$('#manager').validatebox({
		required : true,
		missingMessage : '请输入管理员帐号',
		invalidMessage : '管理员帐号不得为空',
	});
	
	//管理员密码验证
	$('#password').validatebox({
		required : true,
		validType : 'length[6,50]',
		missingMessage : '请输入管理员密码',
		invalidMessage : '管理员密码不得为空',
	});
	
	//加载时判断验证
	if (!$('#manager').validatebox('isValid')) {
		$('#manager').focus();
	} else if (!$('#password').validatebox('isValid')) {
		$('#password').focus();
	}
	
	
	//单击登录
	$('#btn').click(function () {
		if (!$('#manager').validatebox('isValid')) {
			$('#manager').focus();
		} else if (!$('#password').validatebox('isValid')) {
			$('#password').focus();
		} else {

            $.ajax({
                url : '/admin/checklogin',
                type : 'post',
                data : {
                    user : $('#manager').val(),
                    pass : $('#password').val(),
                    code_img:$('#code_num').val()
                },
                beforeSend : function () {
                    $.messager.progress({
                        text : '正在登录中...',
                    });
                },
                success : function (data, response, status) {



                    $.messager.progress('close');

                    if ( data.length>2 ) {  //这里的data返回来的是 密码加密后的乱码

                        if( $('.icheck .icheckbox_square-blue').attr('aria-checked')=='true' ){
                            $.cookie('username', $('#manager').val(), { expires: 3 });
                            $.cookie('pass', data, { expires: 3 });
                            $.cookie('remember', '1', { expires: 3 });
                        }

                        location.href = '/admin/a/index';
                    } else {
                        // $.messager.alert('登录失败！', '用户名或密码错误！', 'warning', function () {
                        //     $('#password').select();
                        // });
                        $('#message_info_error').show();
                        setTimeout(function () {
                            $('#message_info_error').fadeOut();
                        },2000);
                        $('#code_img').click();

                    }
                }
            });

		}
	});





    if( !!$.cookie('username') &&  !!$.cookie('pass')){
        $('#manager').val($.cookie('username'));
        $('#password').val($.cookie('pass'));
    }



    input_listen($('#manager'));
    input_listen($('#password'));

    //input监听、并且过滤
    function input_listen(ele) {
        $.data(ele[0],'old',ele.val()); //默认为了一个元素设置了一个临时变量并获取当前值
        ele.bind('input propertychange', function() {
            var old= $.data(ele[0],'old'); //获取临时的值
            var newvalue=$(this).val(); //获取到当前值
            if(old !== newvalue){ //当前值和临时值不一样时
                $.data(ele[0],'old',$(this).val()); //将当前值赋值给临时值，让临时值成为最新的，如果值还是一样时什么都不变
            }
            //console.log(old); //如果临时值变化了，虽然old获取到的是临时值，但old还是保持上一个值不变，因为是传递赋值保持着独立性
            //console.log(  stripscript(newvalue)+'<---'  );


            if(stripscript_prompt(newvalue)){
                ele.val(stripscript(newvalue));
                console.log(stripscript(newvalue)+'<---危险字符并过滤');
                //管理员帐号验证

            }else{
                ele.val(newvalue);
                console.log(newvalue+'<---没危险')
            }

        });
    }




    //如果输出危险字符就返回true
    function stripscript_prompt(s) {
        var pattern = new RegExp("[`~+=|{}':;',\\[\\].<>/?~——+|{}【】‘；：”“’。，、？]");
        // var rs = "";
        // for (var i = 0; i < s.length; i++) {
        //     rs = rs + s.substr(i, 1).replace(pattern, '');
        // }
        return !!pattern.exec(s);
    }




    //直接过滤掉、并返回过滤后的字符串
    function stripscript(s) {
        var pattern = new RegExp("[`~+=|{}':;',\\[\\].<>/?~——+|{}【】‘；：”“’。，、？]");
        var rs = "";
        for (var i = 0; i < s.length; i++) {
            rs = rs + s.substr(i, 1).replace(pattern, '');
        }
        return rs;
    }







	
});








