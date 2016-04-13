shape_designer.dialog.FigureCodeEdit = Class.extend(
{
    init:function(){
	},

	show:function(){

        var code = app.getConfiguration("code");
        var splash = $(
                '<pre id="code_overlay">'+
                code+
                '</pre>'+
                '<div title="Run"   id="test_run"  ><i class="icon ion-android-arrow-dropright-circle"></i></div>'+
                '<div title="Close" id="code_close"><i class="icon ion-ios-close-outline"></i></div>'
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

        var lines = code.split("\n");
        var last =  lines.length-1;
        var first = lines.findIndex(function(element, index, array){return element.startsWith("testShape");});

        var editor   = ace.edit("code_overlay"),
            session  = editor.getSession(),
            Range    = require("ace/range").Range,
            range    = new Range(0, 0, first, lines[first].length),
            range2   = new Range(last, 0, last, lines[last].length);

        session.addMarker(range, "readonly-highlight");
        session.addMarker(range2, "readonly-highlight");
        session.setMode("ace/mode/javascript");
        session.setUseWrapMode(true);
        editor.moveCursorTo(first+1,0);
        editor.focus();

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

         $("#code_close").on("click",function(){
             var code = editor.getValue();
             app.setConfiguration({code:code});
             splash.fadeOut(function(){
                 splash.remove();
             });
         });

        $("#test_run").on("click",function(){
            var code = editor.getValue();
            app.setConfiguration({code:code});
            new shape_designer.dialog.FigureTest().show();
        });
	}

      
});  