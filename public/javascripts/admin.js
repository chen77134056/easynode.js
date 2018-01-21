$(function () {
	
	$('#nav').tree({
		url : '/admin/nav',
		lines : true,
        formatter:function(node){
            var s = node.text;
            if (node.children){
                s += ' <span style=\'color:blue\'>(' + node.children.length + ')</span>';
            }
            return s;
        },
		onLoadSuccess : function (node, data) {
			if (data) {
				$(data).each(function (index, value) {
					if (this.state == 'closed') {
						$('#nav').tree('expandAll');
					}
				});
			}
		},
		onClick : function (node) {
			if (node.url) {
				if ($('#tabs').tabs('exists', node.text)) {
					$('#tabs').tabs('select', node.text);
				} else {
					$('#tabs').tabs('add', {
						title : node.text,
						iconCls : node.iconCls,
						closable : true,
						href :'/admin'+ node.url,
					});
				}
			}
		}
	});
	
	$('#tabs').tabs({
		fit : true,
		border : false,
        onSelect:function(title){
            //alert(title+' is selected');
        }
    });
	
});


// var pp = $('#tabs').tabs('getSelected');
// var tab = pp.panel('options').tab; // 相应的 tab 对象
// console.log(tab)