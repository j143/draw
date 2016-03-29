/* jshint evil: true */

shape_designer.dialog.FigureTest = Class.extend(
{
    NAME : "shape_designer.dialog.FigureTest", 

    init:function(){
     },

	show:function(){
		var writer = new shape_designer.FigureWriter();
		
		writer.marshal(app.view, "testShape",function(js){
		    eval(js);
	        var splash = $(
				'<div>'+
	                '<div id="test_canvas">'+
	                '</div>'+
	                ' <div title="Close" id="test_close"><i class="icon ion-ios-close-outline"></i></div>'+
				'<div>'
	                );
	        splash.hide();
	        // fadeTo MUSS leider sein. Man kann mit raphael keine paper.text elemente einfügen
	        // wenn das canvas nicht sichtbar sit. In diesen Fall mach ich das Canvas "leicht" sichtbar und raphael ist
	        // zufrieden.
	        $("body").append(splash);
	        splash.fadeIn( function(){
	            var canvas    = new draw2d.Canvas("test_canvas");
	            canvas.installEditPolicy( new draw2d.policy.canvas.ShowDotEditPolicy(20,1,"#FF4981"));
				var router = new draw2d.layout.connection.InteractiveManhattanConnectionRouter();
				canvas.installEditPolicy( new draw2d.policy.connection.ComposedConnectionCreatePolicy(
						[
							// create a connection via Drag&Drop of ports
							//
							new draw2d.policy.connection.DragConnectionCreatePolicy({
								createConnection:function(){
									return new draw2d.Connection({
										radius:3,
										stroke:2,
										color: "#129CE4",
										outlineStroke:1,
										outlineColor:"#ffffff",
										router: router});
								}
							}),
							// or via click and point
							//
							new draw2d.policy.connection.OrthogonalConnectionCreatePolicy({
								createConnection:function(){
									return new draw2d.Connection({
										radius:3,
										stroke:2,
										color: "#129CE4",
										outlineStroke:1,
										outlineColor:"#ffffff",
										router: router});
								}
							})
						])
				);
	            var test = new testShape();
	            canvas.add( test,400,160);
	          
	            // create and add two nodes which contains Ports (In and OUT)
	            //
	             var start = new draw2d.shape.node.Start();
	             var end   = new draw2d.shape.node.End();
	            
	             // ...add it to the canvas 
	             canvas.add( start, 50,250);
	             canvas.add( end, 630,250);
	             
	             canvas.setCurrentSelection(test);
	             var removeDialog = function(){
	                Mousetrap.unbind("esc");
                    splash.fadeOut(function(){
                        splash.remove();
                    });
                 };
                 
                 $("#test_close").on("click",removeDialog);
                 Mousetrap.bind("esc", removeDialog);

             });
		});
	}

      
});  