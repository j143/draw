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
					' <div title="Close" id="test_close"><i class="icon ion-ios-close-outline"></i></div>'+
			        ' <div title="Copy to Cliopboard" id="test_clipboard"><i class="icon ion-clipboard"></i></div>'
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

			$("#test_clipboard").off("click").on("click",function(ev){

				var copyElement = document.createElement('textarea');
			//	copyElement.setAttribute('type', 'text');
				copyElement.innerHTML=js;
				console.log(js);
				copyElement = document.body.appendChild(copyElement);
				copyElement.select();
				document.execCommand('copy');
				copyElement.remove();

				toastr.options = {
					"closeButton": false,
					"debug": false,
					"newestOnTop": false,
					"progressBar": false,
					"positionClass": "toast-top-right",
					"preventDuplicates": false,
					"onclick": null,
					"showDuration": "3000",
					"hideDuration": "1000",
					"timeOut": "200",
					"extendedTimeOut": "1000",
					"showEasing": "swing",
					"hideEasing": "linear",
					"showMethod": "fadeIn",
					"hideMethod": "fadeOut"
				}

				toastr.info("Code copied to clipboard");
			});
		});

	}

      
});  