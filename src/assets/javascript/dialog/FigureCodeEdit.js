shape_designer.dialog.FigureCodeEdit = Class.extend(
{
    init:function(){
	},

	show:function(){

		var writer = new shape_designer.FigureWriter();
		
		writer.marshal(app.view, "testShape",function(js){
		    var code = $.extend({},{code:"testShape = testShape.extend({\n});"},app.getConfiguration()).code;
	        var splash = $(
	                '<pre id="test_code">'+
                    code+
	                '</pre>'+
					'<div title="Close" id="test_close"><i class="icon ion-ios-close-outline"></i></div>'
	                );
	        splash.hide();
	        $("body").append(splash);
			splash.fadeIn();

			var before=function(obj, method, wrapper) {
				var orig = obj[method];
				obj[method] = function() {
					var args = Array.prototype.slice.call(arguments);
					return wrapper.call(this, function(){
						return orig.apply(obj, args);
					}, args);
				};

				return obj[method];
			};

			var intersects=function(range) {
				return editor.getSelectionRange().intersects(range);
			};

			var preventReadonly=function(next, args) {
				if (intersects(range)) return;
				next();
			};

            lines = code.split("\n");
            last =  lines.length-1;
            console.log(last);
			var   editor   = ace.edit("test_code")
				, session  = editor.getSession()
				, Range    = require("ace/range").Range
                , range    = new Range(0, 0, 0, code.indexOf('\n'))
                , range2   = new Range(last, 0, last, lines[last].length);

            session.addMarker(range, "readonly-highlight");
            session.addMarker(range2, "readonly-highlight");
			session.setMode("ace/mode/javascript");
			session.setUseWrapMode(true);


			editor.keyBinding.addKeyboardHandler({
				handleKeyboard : function(data, hash, keyString, keyCode, event) {
					if (hash === -1 || (keyCode <= 40 && keyCode >= 37)) return false;

					if (intersects(range) ||intersects(range2)) {
						return {command:"null", passEvent:false};
					}
				}
			});

			before(editor, 'onPaste', preventReadonly);
			before(editor, 'onCut',   preventReadonly);

			range.start  = session.doc.createAnchor(range.start);
			range.end    = session.doc.createAnchor(range.end);
			range.end.$insertRight = true;

            range2.start  = session.doc.createAnchor(range2.start);
            range2.end    = session.doc.createAnchor(range2.end);
            range2.end.$insertRight = true;

	         $("#test_close").on("click",function(){
				 var code = editor.getValue();
				 app.setConfiguration({code:code});
				 splash.fadeOut(function(){
					 splash.remove();
				 });
			 });

		});
	}

      
});  