shape_designer.dialog.FigureCode = Class.extend(
{
    NAME : "shape_designer.dialog.FigureCode", 

    init:function(){
     },

	show:function(){
		var writer = new shape_designer.FigureWriter();
		
		writer.marshal(app.view, "testShape",function(js){
		   
	        var splash = $(
	                '<pre id="test_code" class="prettyprint">'+
                    js+
	                '</div>'+
	                ' <div id="test_close"><img src="./assets/images/dialog_close.png"/></div>'
	                );
	        splash.hide();
	        $("body").append(splash);

	         var removeDialog = function(){
	             Mousetrap.unbind("esc");
                 splash.fadeOut(function(){
                     splash.remove();
                 });
             };
             
	         $("#test_close").on("click",removeDialog);
	         prettyPrint();
	         
	         splash.fadeIn();	
	         
	         Mousetrap.bind("esc", removeDialog);
		});
	}

      
});  