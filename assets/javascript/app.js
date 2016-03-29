if(typeof String.prototype.endsWith ==="undefined") {
    String.prototype.endsWith = function (suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}



// the smallest jquery plugin ever
//
jQuery.fn.reverse = [].reverse;


// date parser
(function (Date, undefined) {
    var origParse = Date.parse, numericKeys = [ 1, 4, 5, 6, 7, 10, 11 ];
    Date.parse = function (date) {
        var timestamp, struct, minutesOffset = 0;

        // ich liebe Regexpr.... :-)
        //
        //              1 YYYY                2 MM       3 DD           4 HH    5 mm       6 ss        7 msec        8 Z 9 ±    10 tzHH    11 tzmm
        if ((struct = /^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/.exec(date))) {
            // avoid NaN timestamps caused by “undefined” values being passed to Date.UTC
            for (var i = 0, k; (k = numericKeys[i]); ++i) {
                struct[k] = +struct[k] || 0;
            }

            // allow undefined days and months
            struct[2] = (+struct[2] || 1) - 1;
            struct[3] = +struct[3] || 1;

            if (struct[8] !== 'Z' && struct[9] !== undefined) {
                minutesOffset = struct[10] * 60 + struct[11];

                if (struct[9] === '+') {
                    minutesOffset = 0 - minutesOffset;
                }
            }

            timestamp = Date.UTC(struct[1], struct[2], struct[3], struct[4], struct[5] + minutesOffset, struct[6], struct[7]);
        }
        else {
            timestamp = origParse ? origParse(date) : NaN;
        }

        return timestamp;
    };
}(Date));


var conf=null;
if (window.location.hostname === "localhost") {
    conf = {
        githubClientId: "4ec60d86b7e1eef385b3",
        githubAuthenticateCallback: "https://localhost/~andherz/githubCallback.php?code="
    };
}
else{
    conf = {
        githubClientId: "20a3f1473dd7d17fcbcf",
        githubAuthenticateCallback: "https://draw2d.herokuapp.com/authenticate/"
    };
}

conf.fileSuffix = ".shape";
// declare the namespace for this example
var shape_designer = {
		figure:{
			
		},
		filter:{
			
		},
		dialog:{
			
		},
		policy:{
			
		},
		storage:{
			
		}
};

/**
 * 
 * The **GraphicalEditor** is responsible for layout and dialog handling.
 * 
 * @author Andreas Herz
 */

shape_designer.Application = Class.extend(
{
    NAME : "shape_designer.Application", 

    
    /**
     * @constructor
     * 
     * @param {String} canvasId the id of the DOM element to use as paint container
     */
    init : function()
    {
        this.currentFile = null;
        
        this.storage = new shape_designer.storage.BackendStorage();
        this.view    = new shape_designer.View(this, "canvas");
        this.toolbar = new shape_designer.Toolbar(this, "toolbar",  this.view );
        this.layer   = new shape_designer.Layer(this, "layer_elements", this.view );
        this.filter  = new shape_designer.FilterPane(this, "filter_actions", this.view );
        this.view.installEditPolicy(new shape_designer.policy.SelectionToolPolicy());

        // Get the authorization code from the url that was returned by GitHub
        var _this = this;
        var url = window.location.href;
        var code = this.getParam("code");
        if (code!==null) {
           $.getJSON(conf.githubAuthenticateCallback+code, function(data) {
               _this.storage.login(data.token, $.proxy(function(success){
                   _this.toolbar.onLogginStatusChanged(success);
               },this));
           });
        }
        about.hide();
 	},
 	
    getParam: function( name )
    {
      name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
      var regexS = "[\\?&]"+name+"=([^&#]*)";
      var regex = new RegExp( regexS );
      var results = regex.exec( window.location.href );
      if( results === null )
        return null;
      
      return results[1];
    },
 	
	fileNew: function( successCallback, errorCallback, abortCallback)
    {
        this.view.clear();
        this.storage.currentFileHandle = null;
    },

    fileOpen: function()
    {
        new shape_designer.dialog.FileOpen(this.storage).show(

            // success callback
            $.proxy(function(fileData){
                try{
                    this.view.clear();
                    var reader = new draw2d.io.json.Reader();
                    reader.unmarshal(this.view, fileData);
                    this.view.getCommandStack().markSaveLocation();
                }
                catch(e){
                    this.view.reset();
                }
            },this));
    },

	fileSave: function()
    {
        if(this.storage.currentFileHandle===null) {
            new shape_designer.dialog.FileSaveAs(this.storage).show(this.view);
        }
        else{
            new shape_designer.dialog.FileSave(this.storage).show(this.view);
        }
	}
});



shape_designer.View = draw2d.Canvas.extend({
	
	init:function(app, id){
        var _this = this;

		this._super(id, 2000,2000);
		this.clippboardFigure=null;
        this.grid =  new draw2d.policy.canvas.ShowGridEditPolicy(20);

		this.setScrollArea("#"+id);
		
		this.currentDropConnection = null;
		
        this.installEditPolicy( this.grid);
        this.installEditPolicy( new draw2d.policy.canvas.SnapToGeometryEditPolicy());
        this.installEditPolicy( new draw2d.policy.canvas.SnapToCenterEditPolicy());
        this.installEditPolicy( new draw2d.policy.canvas.SnapToInBetweenEditPolicy());

        Mousetrap.bind(['ctrl+c', 'command+c'], $.proxy(function (event) {
            var primarySelection = this.getSelection().getPrimary();
            if(primarySelection!==null){
                this.clippboardFigure = primarySelection.clone();
                this.clippboardFigure.translate(5,5);
            }
            return false;
        },this));

        Mousetrap.bind(['ctrl+v', 'command+v'], $.proxy(function (event) {
           if(this.clippboardFigure!==null){
               var cloneToAdd = this.clippboardFigure.clone();
               var command = new draw2d.command.CommandAdd(this, cloneToAdd, cloneToAdd.getPosition());
               this.getCommandStack().execute(command);
               this.setCurrentSelection(cloneToAdd);
           }
           return false;
        },this));

        var setZoom = $.proxy(function(factor){
            var newZoom = this.getZoom()*factor;
            $("#canvas_zoom_normal").text((parseInt((1.0/newZoom)*100))+"%");
            this.setZoom(newZoom,true);
        },this);
        
        // Inject the ZoomIn Button and the callbacks
        //
        $("#canvas_zoom_in").on("click",function(){
            setZoom(1.2);
        });
 
        // Inject the OneToOne Button
        //
        $("#canvas_zoom_normal").on("click",$.proxy(function(){
            this.setZoom(1.0, true);
            $("#canvas_zoom_normal").text("100%");
        },this));
      
        // Inject the ZoomOut Button and the callback
        //
        $("#canvas_zoom_out").on("click",$.proxy(function(){
            setZoom(0.8);
        },this));

  //      $('#canvas_config_grid').bootstrapToggle();
        $('#canvas_config_grid').on('change', function (e) {
           if($(this).prop('checked')){
                _this.installEditPolicy( _this.grid);
            }
            else{
                _this.uninstallEditPolicy( _this.grid);
            }
          });

        $("#canvas_config_items").on("click",$.proxy(function(e){
            e.stopPropagation();
        },this));

        this.reset();
	},

	setCursor:function(cursor){
	    if(cursor!==null){
	        this.html.css("cursor","url(assets/images/cursors/"+cursor+") 0 0, default");
	    }
	    else{
            this.html.css("cursor","default");
	    }
	},
	
	/**
	 * @method
	 * Reset the view/canvas and starts with a clean and new document with default decorations
	 * 
	 * 
	 */
	reset: function(){
        this.clear();
	},
	
	/**
	 * Reset the view without any decorations. This is good before loading a document
	 * 
	 */
	clear: function(){
	    this._super();
	},
	
    getExtFigure: function(id){
        var figure = null;
        this.getExtFigures().each(function(i,e){
            if(e.id===id){
                figure=e;
                return false;
             }
        });
        return figure;
    },

    getExtFigures: function(){
	    var figures = this.getFigures().clone();
	    
	    // the export rectangles are not part of the document itself. In this case we
	    // filter them out
	    //
	    figures.grep(function(figure){
	        return (typeof figure.isExtFigure  !=="undefined");
	    });
	    
	    var lines = this.getLines().clone();
	    lines.grep(function(line){
            return (typeof line.isExtFigure  !=="undefined");
        });
	    
	    figures.addAll(lines);
	    
	    return figures;
	},
	
	
	getBoundingBox: function(){
        var xCoords = [];
        var yCoords = [];
        this.getExtFigures().each(function(i,f){
            var b = f.getBoundingBox();
            xCoords.push(b.x, b.x+b.w);
            yCoords.push(b.y, b.y+b.h);
        });
        var minX   = Math.min.apply(Math, xCoords);
        var minY   = Math.min.apply(Math, yCoords);
        var width  = Math.max(10,Math.max.apply(Math, xCoords)-minX);
        var height = Math.max(10,Math.max.apply(Math, yCoords)-minY);
        
        return new draw2d.geo.Rectangle(minX,minY,width,height);
	},
	
	add: function(figure, x,y){
	    this._super(figure, x,y);
	},

	hideDecoration: function(){
        this.uninstallEditPolicy( new draw2d.policy.canvas.ShowDotEditPolicy());
        this.getFigures().each( function(index, figure){ 
            figure.unselect();
        });
    },
    
    showDecoration: function(){
        this.installEditPolicy( new draw2d.policy.canvas.ShowDotEditPolicy());
    }
});



shape_designer.Layer = Class.extend({
	
	NAME: "shape_designer.Layer",

	init:function(app, elementId, view){
		this.html = $("#"+elementId);
		this.view = view;
		
		// register this class as event listener for the canvas
		// CommandStack. This is required to update the state of 
		// the Undo/Redo Buttons.
		//
		view.getCommandStack().addEventListener(this);

		// Register a Selection listener for the state hnadling
		// of the Delete Button
		//
        view.on("select", $.proxy(this.onSelectionChanged,this));
	},

	/**
	 * @method
	 * Called if the selection in the cnavas has been changed. You must register this
	 * class on the canvas to receive this event.
	 * 
	 * @param {draw2d.Figure} figure
	 */
	onSelectionChanged : function(emitter, event){
        this._updateSelection();
	},
	
	/**
	 * @method
	 * Sent when an event occurs on the command stack. draw2d.command.CommandStackEvent.getDetail() 
	 * can be used to identify the type of event which has occurred.
	 * 
	 * @template
	 * 
	 * @param {draw2d.command.CommandStackEvent} event
	 **/
	stackChanged:function(event)
	{
	    this.html.html('');
	    var figures = this.view.getExtFigures();
	    figures.each($.proxy(function(i, figure){
	        this.html.append(
	                '<div class="layerElement" data-figure="'+figure.id+'" id="layerElement_'+figure.id+'" >'+
	                   figure.getUserData().name +
	                   '<img data-figure="'+figure.id+'" class="layer_visibility pull-right" src="./assets/images/layer_visibility_'+figure.isVisible()+'.png">'+
                       '<img data-figure="'+figure.id+'" class="layer_edit pull-right" src="./assets/images/layer_edit.png">'+
	        		'</div>');
	    },this),true);
	    
	    this.html.sortable({
	        axis:"y",
	        update: $.proxy(function( event, ui ) {
	            $(".layerElement").reverse().each($.proxy(function(i,e){
	                this.view.getExtFigure($(e).data("figure")).toFront();
	            },this));
                this.view.exportFramesToFront();
	        },this)
	    });
 
	    $(".layerElement img.layer_edit").on("click", $.proxy(function(event){
            var figure =this.view.getExtFigure($(event.target).data("figure"));
            bootbox.prompt({
                title: "Shape Name",
                value: figure.getUserData().name,
                callback: $.proxy(function(result) {
                    if (result !== null) {
                        figure.getUserData().name = result;
                        this.stackChanged(null);
                    }
                },this)
            });
 	    },this));

	    
	    $(".layerElement img.layer_visibility").on("click", $.proxy(function(event){
            var figure =this.view.getExtFigure($(event.target).data("figure"));
            figure.setVisible(!figure.isVisible());
            this.view.setCurrentSelection(null);
            $(event.target).attr({"src": "./assets/images/layer_visibility_"+figure.isVisible()+".png"});
        },this));

        $(".layerElement").on("click", $.proxy(function(event){
           var figure =this.view.getExtFigure($(event.target).data("figure"));
           if(figure.isVisible()){
               this.view.setCurrentSelection(figure);
           }
        },this));

        this._updateSelection();
	},
	
	_updateSelection: function(){
        $(".layerElement").removeClass("layerSelectedElement");
	    var selection = this.view.getSelection();
	    selection.each(function(i,e){
	        $("#layerElement_"+e.id).addClass("layerSelectedElement");
	    });
	}
});
/* jshint evil:true */

shape_designer.FilterPane = Class.extend({
	
    DEFAULT_LABEL : "Properties",
    
	init:function(app, elementId, view){
		this.html = $("#"+elementId);
		this.view = view;
		this.currentFigure = null;

		// Register a Selection listener for the state handling
		// of the Delete Button
		//
        view.on("select", $.proxy(this.onSelectionChanged,this));
	},

	/**
	 * @method
	 * Called if the selection in the canvas has been changed. You must register this
	 * class on the canvas to receive this event.
	 * 
     * @param {draw2d.Canvas} canvas the emitter of the event. In this case it is the canvas.
     * @param {draw2d.Figure} figure
	 */
	onSelectionChanged : function(canvas, event){
	    var figure = event?event.figure:null;

	    this.html.html('');
	    $('#add_filter_button').addClass('disabled');
	    
	    if(this.currentFigure!==null && typeof this.currentFigure.isExtFigure !=="undefined"){
	        this.currentFigure.filters.each($.proxy(function(i,filter){
	            filter.removePane();
	        },this));
	    }
	    $("#add_filter_action_menu").html("");
	    
	    if(figure!==null &&  typeof figure.isExtFigure  !=="undefined"){
            figure.filters.each($.proxy(function(i,filter){
                filter.insertPane(figure,this.html);
            },this));
            $('#add_filter_button').removeClass('disabled');

            $.each(figure.getPotentialFilters(), function(i,e){
                $("#add_filter_action_menu").append("<li><a href='#' data-filter='"+e.impl+"' >"+e.label+"</a></li>");
            });
                    
            var _this = this;
            $("#add_filter_action_menu a").on("click", function(){
                var $this = $(this);
                var filterName = $this.data("filter");
                var filter = eval("new "+filterName+"()");
                _this.currentFigure.addFilter(filter);
                _this.onSelectionChanged(_this.view,{figure:_this.currentFigure});
            });
	    }

	    this.currentFigure = figure;	    
	}
});
/* jshint evil:true */

shape_designer.Toolbar = Class.extend({
    
    init:function(app, elementId, view){
        this.html = $("#"+elementId);
        this.view = view;
        this.app = app;

        // register this class as event listener for the canvas
        // CommandStack. This is required to update the state of 
        // the Undo/Redo Buttons.
        //
        view.getCommandStack().addEventListener(this);

        // Register a Selection listener for the state hnadling
        // of the Delete Button
        //
        view.on("select", $.proxy(this.onSelectionChanged,this));
        
        this.fileName = null;

        this.html.append(
                '<span id="currentTool_container" class="media pull-left">'+
                ' <span class="pull-left" >'+
                '    <img id="currentTool_image" class="media-object" src="" >'+
                ' </span>'+
                ' <div class="media-body">'+
                '   <h4 id="currentTool_heading" class="media-heading">Media heading</h4>'+
                '    <div id="currentTool_message"></div>'+
                '  </div>'+
                '</span>');
          

        this.toolbarDiv=$("<div class=\"toolbarGroup pull-right\"></div>");
        this.html.append(this.toolbarDiv);


        var buttonGroup=$("<div class=\"btn-group\"></div>");
        this.toolbarDiv.append(buttonGroup);


        this.loginButton  = $('<button class="btn" data-toggle="modal" id="githubButton"><img height="32" src="assets/images/octocat.svg">Login with Github</button>');
        buttonGroup.append(this.loginButton);
        this.loginButton.on("click",function(){
            window.location.href='https://github.com/login/oauth/authorize?client_id='+conf.githubClientId+'&scope=public_repo';
        });


        this.openButton  = $('<button  data-toggle="tooltip" data-size="xs" data-style="zoom-in" title="Load <span class=\'highlight\'> [ Ctrl+O ]</span>" class=\"btn btn-default\" ><img src="./assets/images/toolbar_download.png"></button>');
        buttonGroup.append(this.openButton);
        this.openButton.on("click",$.proxy(function(){
            var button = this.openButton;
            button.tooltip("hide");
            app.fileOpen();
        },this));
        Mousetrap.bind("ctrl+o", $.proxy(function (event) {this.openButton.click();return false;},this));
        this.openButton.hide();
        
        this.saveButton  = $('<button data-toggle="tooltip" data-size="xs" data-style="zoom-in" title="Save <span class=\'highlight\'> [ Ctrl+S ]</span>" class=\"btn btn-default\" ><img src="./assets/images/toolbar_upload.png"></button>');
        buttonGroup.append(this.saveButton);
        this.saveButton.on("click",$.proxy(function(){
            var button = this.saveButton;
            button.tooltip("hide");
        	app.fileSave();
        },this));
        Mousetrap.bind("ctrl+s", $.proxy(function (event) {this.saveButton.click();return false;},this));
        this.saveButton.hide();

        this.newButton  = $('<button  data-toggle="tooltip" title="New Document <span class=\'highlight\'> [ Ctrl+N ]</span>" class=\"btn btn-default\" ><img src="./assets/images/toolbar_file_new.png"></button>');
        buttonGroup.append(this.newButton);
        this.newButton.on("click",$.proxy(function(){
            app.fileNew();
        },this));
        Mousetrap.bind("ctrl+n", $.proxy(function (event) {this.undoButton.click();return false;},this));
        this.newButton.hide();


        // Inject the UNDO Button and the callbacks
        //
        buttonGroup=$('<div class="btn-group" ></div>');
        this.toolbarDiv.append(buttonGroup);
        this.undoButton  = $('<button  data-toggle="tooltip" title="Undo <span class=\'highlight\'> [ Ctrl+Z ]</span>" class=\"btn btn-default\" ><img src="./assets/images/toolbar_undo.png"></button>');
        buttonGroup.append(this.undoButton);
        this.undoButton.on("click",$.proxy(function(){
               this.view.getCommandStack().undo();
        },this)).button( "option", "disabled", true );
        Mousetrap.bind("ctrl+z", $.proxy(function (event) {this.undoButton.click();return false;},this));

        
        // Inject the REDO Button and the callback
        //
        this.redoButton  = $('<button data-toggle="tooltip" title="Redo <span class=\'highlight\'> [ Ctrl+Y ]</span>"  class=\"btn btn-default\" ><img src="./assets/images/toolbar_redo.png"></button>');
        buttonGroup.append(this.redoButton);
        this.redoButton.on("click",$.proxy(function(){
            this.view.getCommandStack().redo();
        },this)).button( "option", "disabled", true );
        Mousetrap.bind("ctrl+y", $.proxy(function (event) {this.redoButton.click();return false;},this));
        
        this.delimiter  = $("<span class='toolbar_delimiter'>&nbsp;</span>");
        this.toolbarDiv.append(this.delimiter);
        
        this.testButton  = $('<button  data-toggle="tooltip" title="Test</span>" class=\"btn btn-default\" ><img src="./assets/images/toolbar_test.png"></button>');
        this.toolbarDiv.append(this.testButton);
        this.testButton.on("click",$.proxy(function(){
            new shape_designer.dialog.FigureTest().show();
        },this));
  
        this.codeButton  = $('<button  data-toggle="tooltip" title="JS Code</span>" class=\"btn btn-default\" ><img src="./assets/images/toolbar_js.png"></button>');
        this.toolbarDiv.append(this.codeButton);
        this.codeButton.on("click",$.proxy(function(){
            new shape_designer.dialog.FigureCode().show();
        },this));

        this.delimiter  = $("<span class='toolbar_delimiter'>&nbsp;</span>");
        this.toolbarDiv.append(this.delimiter);

        // Inject the DELETE Button
        //
        this.deleteButton  = $('<button  data-toggle="tooltip" title="Delete <span class=\'highlight\'> [ Del ]</span>" class=\"btn btn-default\" ><img src="./assets/images/toolbar_delete.png"></button>');
        this.toolbarDiv.append(this.deleteButton);
        this.deleteButton.on("click",$.proxy(function(){
            var node = this.view.getPrimarySelection();
            var command= new draw2d.command.CommandDelete(node);
            this.view.getCommandStack().execute(command);
        },this)).button( "option", "disabled", true );
        Mousetrap.bind(["del"], $.proxy(function (event) {this.deleteButton.click();return false;},this));

        
        this.delimiter  = $("<span class='toolbar_delimiter'>&nbsp;</span>");
        this.toolbarDiv.append(this.delimiter);



        buttonGroup=$('<div class="btn-group" data-toggle="buttons"></div>');
        this.toolbarDiv.append(buttonGroup);


        this.selectButton = $('<label data-toggle="tooltip" title="Select mode <span class=\'highlight\'> [ spacebar ]</span>" class="btn btn-sm btn-primary active"><input type="radio" name="selected_tool" id="tool1" class="btn-default btn" ><img src="./assets/images/tools/SELECT_TOOL_032.png"></label>');
        buttonGroup.append(this.selectButton);
        this.selectButton.on("click",$.proxy(function(){
            this.view.installEditPolicy(new shape_designer.policy.SelectionToolPolicy());
        },this));
        Mousetrap.bind("space", $.proxy(function (event) {this.selectButton.click();return false;},this));

        this.shapeButton = $(
                             '<label id="tool_shape" class="dropdown btn btn-sm btn-primary">'+
                             '    <input id="tool_shape_button"  data-policy="shape_designer.policy.RectangleToolPolicy" class="btn-default btn"  type="radio">'+
                             '    <img   id="tool_shape_image" data-toggle="tooltip" title="Rectangle <span class=\'highlight\'> [ R ]</span>"  src="./assets/images/tools/POLYGON_DIAGONALS_032.png">'+
                             '    <span data-toggle="dropdown" role="button" href="#" id="tool_shape_caret"><span class="caret">&nbsp;</span></span>'+
                             '    <ul class="dropdown-menu" role="menu" >'+
                             '       <li class="tool_shape_entry" data-policy="shape_designer.policy.RectangleToolPolicy" data-toggle="tooltip" title="Rectangle <span class=\'highlight\'> [ R ]</span>"><a href="#"><img  src="./assets/images/tools/POLYGON_DIAGONALS_032.png">Rectangle</a></li>'+
                             '       <li class="tool_shape_entry" data-policy="shape_designer.policy.CircleToolPolicy"    data-toggle="tooltip" title="Circle <span class=\'highlight\'> [ C ]</span>">   <a href="#"><img  src="./assets/images/tools/CIRCLE_1_032.png">Circle</a></li>'+
                             '       <li class="tool_shape_entry" data-policy="shape_designer.policy.LineToolPolicy"      data-toggle="tooltip" title="Line <span class=\'highlight\'> [ L ]</span>">     <a href="#"><img  src="./assets/images/tools/LINE_032.png">Line</a></li>'+
                             '       <li class="tool_shape_entry" data-policy="shape_designer.policy.TextToolPolicy"      data-toggle="tooltip" title="Text <span class=\'highlight\'> [ T ]</span>">     <a href="#"><img  src="./assets/images/tools/TEXT_032.png">Text</a></li>'+
                             '       <li class="tool_shape_entry" data-policy="shape_designer.policy.PortToolPolicy"      data-toggle="tooltip" title="Port <span class=\'highlight\'> [ P ]</span>">     <a href="#"><img  src="./assets/images/tools/PORT_032.png">Port</a></li>'+
                             '    </ul>'+
                             '</label>'
                          );
        buttonGroup.append(this.shapeButton);
        $(".tool_shape_entry").on("click",$.proxy(function(event){
           var $target = $(event.currentTarget);
           $("#tool_shape_image").attr("src", $target.find("img").attr("src"));
           $("#tool_shape_button").data("policy", $target.data("policy"));
           $("#tool_shape_image").click();
           
           $("#tool_shape_image")
               .attr('data-original-title', $target.data("original-title"))
               .tooltip('fixTitle');
        },this));
       
        $("#tool_shape_image").on("click",$.proxy(function(){
            this.view.installEditPolicy(eval("new "+$("#tool_shape_button").data("policy")+"()"));
        },this));
        Mousetrap.bind(["R","r"], $.proxy(function (event) {
            $('*[data-policy="shape_designer.policy.RectangleToolPolicy"]').click();
            return false;
        },this));
        Mousetrap.bind(["C","c"], $.proxy(function (event) {
            $('*[data-policy="shape_designer.policy.CircleToolPolicy"]').click();
            return false;
        },this));
        Mousetrap.bind(["T","t"], $.proxy(function (event) {
            $('*[data-policy="shape_designer.policy.TextToolPolicy"]').click();
            return false;
        },this));
        Mousetrap.bind(["P","p"], $.proxy(function (event) {
            $('*[data-policy="shape_designer.policy.PortToolPolicy"]').click();
            return false;
        },this));
        Mousetrap.bind(["L","l"], $.proxy(function (event) {
            $('*[data-policy="shape_designer.policy.LineToolPolicy"]').click();
            return false;
        },this));

        this.unionButton = $('<label data-toggle="tooltip" title="Polygon Union <span class=\'highlight\'> [ U ]</span>" class="btn btn-sm btn-primary"><input type="radio" name="selected_tool" id="tool1" class="btn-default btn" ><img src="./assets/images/toolbar_union.png"></label>');
        buttonGroup.append(this.unionButton);
        this.unionButton.on("click",$.proxy(function(){
           var selection = this.view.getSelection().getAll();
           var policy = new shape_designer.policy.GeoUnionToolPolicy();
           this.view.installEditPolicy(policy);
           policy.execute(this.view, selection);
        },this));
        Mousetrap.bind(["U", "u"], $.proxy(function (event) {this.unionButton.click();return false;},this));

       this.differenceButton = $('<label data-toggle="tooltip" title="Polygon Difference <span class=\'highlight\'> [ D ]</span>"  class="btn btn-sm btn-primary"><input type="radio" name="selected_tool" id="tool2" class="btn-default btn" ><img src="./assets/images/toolbar_difference.png"></label>');
       buttonGroup.append(this.differenceButton);
       this.differenceButton.on("click",$.proxy(function(){
           this.view.installEditPolicy(new shape_designer.policy.GeoDifferenceToolPolicy());
       },this));
       Mousetrap.bind(["D", "d"], $.proxy(function (event) {this.differenceButton.click();return false;},this));
        
       this.intersectionButton = $('<label data-toggle="tooltip" title="Polygon Intersection <span class=\'highlight\'> [ I ]</span>"  class="btn btn-sm btn-primary"><input type="radio" name="selected_tool" id="too3" class="btn-default btn" ><img src="./assets/images/toolbar_intersect.png"></label>');
       buttonGroup.append(this.intersectionButton);
       this.intersectionButton.on("click",$.proxy(function(){
           this.view.installEditPolicy(new shape_designer.policy.GeoIntersectionToolPolicy());
       },this));
       Mousetrap.bind(["I", "i"], $.proxy(function (event) {this.intersectionButton.click();return false;},this));

       buttonGroup.find(".btn").button();
       
       // enable the tooltip for all buttons
       //
       $('*[data-toggle="tooltip"]').tooltip({placement:"bottom", container:"body",delay: { show: 1000, hide: 10 }, html:true});

    },

    // update the visibility of the button regarding to the login state
    onLogginStatusChanged: function(result){
        if(result===true){
            this.loginButton.hide();
            this.openButton.show();
            this.saveButton.show();
            this.newButton.show();
        }
        else{
            this.loginButton.show();
            this.openButton.hide();
            this.saveButton.hide();
            this.newButton.hide();
        }
    },

    /**
     * @method
     * Called if the selection in the cnavas has been changed. You must register this
     * class on the canvas to receive this event.
     * 
     * @param {draw2d.Figure} figure
     */
    onSelectionChanged : function(emitter, event){
        this.deleteButton.button( "option", "disabled", event===null || event.figure===null );
    },
    
    /**
     * @method
     * Sent when an event occurs on the command stack. draw2d.command.CommandStackEvent.getDetail() 
     * can be used to identify the type of event which has occurred.
     * 
     * @template
     * 
     * @param {draw2d.command.CommandStackEvent} event
     **/
    stackChanged:function(event)
    {
        this.undoButton.button( "option", "disabled", !event.getStack().canUndo() );
        this.redoButton.button( "option", "disabled", !event.getStack().canRedo() );
    }
    
});
shape_designer.dialog.About = Class.extend(
{
    NAME : "shape_designer.dialog.About", 

    init:function(){
     },

	show:function(){
		
	    this.splash = $(
	            '<div id="splash">'+
	            '<div>Draw2D Designer<br>'+
	            '@VERSION@'+
	            '</div>'+
	            '</div>');
	    this.splash.hide();
	    $("body").append(this.splash);
	    
	    this.splash.fadeIn("fast");
	    
	},
	
	hide: function(){
        this.splash.delay(2500)
        .fadeOut( "slow", $.proxy(function() {
            this.splash.remove();
        },this));
	}

      
});  
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
				};

				toastr.info("Code copied to clipboard");
			});
		});

	}

      
});  
shape_designer.dialog.FileOpen = Class.extend({

    /**
     * @constructor
     *
     */
    init:function(storage){
        this.storage=storage;

    },

    /**
     * @method
     *
     * Open the file picker and load the selected file.<br>
     *
     * @param {Function} successCallback callback method if the user select a file and the content is loaded
     * @param {Function} errorCallback method to call if any error happens
     *
     * @since 4.0.0
     */
    show: function(successCallback)
    {
        $('#githubFileSelectDialog').modal('show');

        // Select first a ROOT repository if we didn'T have before
        if(this.storage.currentRepository===null) {
            this.fetchRepositories(successCallback);
        }
        // else reopen the already selected directory
        else{
            this.fetchPathContent(this.storage.currentPath, successCallback);
        }
    },

    /**
     * @private
     *
     * @param successCallback
     * @param errorCallback
     * @param abortCallback
     */
    fetchRepositories: function(successCallback)
    {
        var _this = this;

        // fetch all repositories of the related user
        //
        this.storage.octo.user.repos.fetch(function(param, repos){

            repos.sort(function(a, b)
            {
                if ( a.name.toLowerCase() < b.name.toLowerCase() )
                    return -1;
                if ( a.name.toLowerCase() > b.name.toLowerCase() )
                    return 1;
                return 0;
            });

            _this.storage.repositories = repos;
            var compiled = Hogan.compile(
                '         {{#repos}}'+
                '         <a href="#" class="list-group-item repository text-nowrap" data-type="repository" data-id="{{id}}">'+
                '         <span class="fa fa-github"></span>'+
                '         {{{name}}}'+
                '         </a>'+
                '         {{/repos}}'
            );

            var output = compiled.render({
                repos: repos
            });
            console.log("here");
            $("#githubFileSelectDialog .githubNavigation").html($(output));
            $("#githubFileSelectDialog .githubNavigation").scrollTop(0);

            $(".repository").on("click", function(){
                var $this = $(this);
                var repositoryId = $this.data("id");
                _this.storage.currentRepository = $.grep(_this.storage.repositories, function(repo){return repo.id === repositoryId;})[0];
                _this.fetchPathContent("",successCallback);
            });
        });
    },

    fetchPathContent: function( newPath, successCallback )
    {
        var _this = this;

        this.storage.currentRepository.contents(newPath).fetch(function(param, files){
            // sort the reusult
            // Directories are always on top
            //
            files.sort(function(a, b)
            {
                if(a.type===b.type) {
                    if (a.name.toLowerCase() < b.name.toLowerCase())
                        return -1;
                    if (a.name.toLowerCase() > b.name.toLowerCase())
                        return 1;
                    return 0;
                }
                if(a.type==="dir"){
                    return -1;
                }
                return 1;
            });

            _this.storage.currentPath = newPath;
            var compiled = Hogan.compile(
                '         <a href="#" class="list-group-item githubPath" data-type="{{parentType}}" data-path="{{parentPath}}" >'+
                '             <span class="glyphicon glyphicon-menu-left"></span>'+
                '             ..'+
                '         </a>'+
                '         {{#files}}'+
                '           <a href="#" data-draw2d="{{draw2d}}" class="list-group-item githubPath text-nowrap" data-type="{{type}}" data-path="{{currentPath}}{{name}}" data-id="{{id}}" data-sha="{{sha}}">'+
                '              <span class="glyphicon {{icon}}"></span>'+
                '              {{{name}}}'+
                '           </a>'+
                '         {{/files}}'
            );


            var parentPath =  _this.dirname(newPath);
            var output = compiled.render({
                parentType: parentPath===newPath?"repository":"dir",
                parentPath: parentPath,
                currentPath: _this.storage.currentPath.length===0?_this.storage.currentPath:_this.storage.currentPath+"/",
                files: files,
                draw2d:function(){
                    return this.name.endsWith(conf.fileSuffix);
                },
                icon: function(){
                    if(this.name.endsWith(conf.fileSuffix)){
                        return "fa fa-object-group";
                    }
                    return this.type==="dir"?"fa fa-folder-o":"fa fa-file-o";
                }
            });

            $("#githubFileSelectDialog .githubNavigation").html($(output));
            $("#githubFileSelectDialog .githubNavigation").scrollTop(0);

            $(".githubPath[data-type='repository']").on("click", function(){
                _this.fetchRepositories(successCallback);
            });

            $(".githubPath[data-type='dir']").on("click", function(){
                _this.fetchPathContent( $(this).data("path"), successCallback);
            });

            $('.githubPath*[data-draw2d="true"][data-type="file"]').on("click", function(){
                var path = $(this).data("path");
                var sha  = $(this).data("sha");
                _this.storage.currentRepository.contents(path).read(function(param, content){
                    _this.storage.currentFileHandle={
                        path : path,
                        title: path.split(/[\\/]/).pop(), // basename
                        sha  : sha,
                        content : content
                    };
                    successCallback(content);
                    $('#githubFileSelectDialog').modal('hide');
                });
            });
        });
    },




    dirname: function(path)
    {
        if (path.length === 0)
            return "";

        var segments = path.split("/");
        if (segments.length <= 1)
            return "";
        return segments.slice(0, -1).join("/");
    }

});
shape_designer.dialog.FileSave = Class.extend({

    /**
     * @constructor
     *
     */
    init:function(storage){
        this.storage=storage;
    },

    /**
     * @method
     *
     * Open the file picker and load the selected file.<br>
     *
     * @param {Function} successCallback callback method if the user select a file and the content is loaded
     * @param {Function} errorCallback method to call if any error happens
     *
     * @since 4.0.0
     */
    show: function(canvas)
    {
        var _this = this;

        if(this.storage.currentFileHandle===null){
            this.storage.currentFileHandle= {
                title:"DocumentName",
                sha:null
            };
        }

        new draw2d.io.png.Writer().marshal(canvas, function (imageDataUrl) {

            $("#githubSaveFileDialog .githubFilePreview").attr("src", imageDataUrl);
            $("#githubSaveFileDialog .githubFileName").val(_this.storage.currentFileHandle.title);

            $('#githubSaveFileDialog').on('shown.bs.modal', function () {
                $(this).find('input:first').focus();
            });
            $("#githubSaveFileDialog").modal("show");

            // Button: Commit to GitHub
            //
            $("#githubSaveFileDialog .okButton").on("click", function () {
                var writer = new draw2d.io.json.Writer();
                writer.marshal(canvas, function (json, base64) {
                    var config = {
                        message: $("#githubSaveFileDialog .githubCommitMessage").val(),
                        content: base64,
                        sha: _this.storage.currentFileHandle.sha
                    };

                    _this.storage.currentRepository.contents(_this.storage.currentFileHandle.path).add(config)
                        .then(function (info) {
                            _this.storage.currentFileHandle.sha = info.content.sha;
                            $('#githubSaveFileDialog').modal('hide');
                        });
                });
            });

        }, canvas.getBoundingBox().scale(10, 10));
    }

});
shape_designer.dialog.FileSaveAs = Class.extend({

    /**
     * @constructor
     *
     */
    init:function(storage)
    {
        this.storage=storage;

        this.sha = null;
    },

    /**
     * @method
     *
     * Open the file picker and load the selected file.
     *
     * @since 4.0.0
     */
    show: function(canvas)
    {
        var _this = this;

        if(this.storage.currentFileHandle===null){
            this.storage.currentFileHandle = {
                title:"DocumentName"+conf.fileSuffix,
                sha:null
            };
        }

        new draw2d.io.png.Writer().marshal(canvas, function (imageDataUrl) {
            // Select first a ROOT repository if we didn'T have before
            if(_this.storage.currentRepository===null) {
                $("#githubFileSaveAsDialog .okButton").prop( "disabled", true );
                _this.fetchRepositories();
            }
            // else reopen the already selected directory
            else{
                $("#githubFileSaveAsDialog .okButton").prop( "disabled", false );
                _this.fetchPathContent(_this.storage.currentPath);
            }

            $('#githubFileSaveAsDialog').modal('show');

            $("#githubFileSaveAsDialog .githubFilePreview").attr("src", imageDataUrl);
            $("#githubFileSaveAsDialog .githubFileName").val(_this.storage.currentFileHandle.title);

            $('#githubFileSaveAsDialog').off('shown.bs.modal').on('shown.bs.modal', function () {
                $(this).find('input:first').focus();
            });
            $("#githubFileSaveAsDialog").modal("show");

            // Button: Commit to GitHub
            //
            $("#githubFileSaveAsDialog .okButton").off('click').on("click", function () {
                var writer = new draw2d.io.json.Writer();
                writer.marshal(canvas, function (json, base64) {
                    var title = $("#githubFileSaveAsDialog .githubFileName").val();
                    // get the SHA if any exists....or null
                    var sha  =$("*[data-title='"+title+"']").data("sha");
                    var config = {
                        message: $("#githubSaveFileDialog .githubCommitMessage").val(),
                        content: base64,
                        sha: sha
                    };

                    _this.storage.currentRepository.contents(_this.storage.currentPath+"/"+title).add(config)
                        .then(function (info) {
                            _this.storage.currentFileHandle = {
                                sha  : info.content.sha,
                                path :_this.storage.currentPath+"/"+title,
                                title: title,
                                content: json
                            };
                            $('#githubFileSaveAsDialog').modal('hide');
                        });
                });
            });

        }, canvas.getBoundingBox().scale(10, 10));
    },

    /**
     * @private
     *
     */
    fetchRepositories: function()
    {
        var _this = this;

        // fetch all repositories of the related user
        //
        this.storage.octo.user.repos.fetch(function(param, repos){

            repos.sort(function(a, b)
            {
                if ( a.name.toLowerCase() < b.name.toLowerCase() )
                    return -1;
                if ( a.name.toLowerCase() > b.name.toLowerCase() )
                    return 1;
                return 0;
            });

            _this.storage.repositories = repos;
            var compiled = Hogan.compile(
                '         {{#repos}}'+
                '         <a  href="#" class="list-group-item repository text-nowrap" data-type="repository" data-id="{{id}}">'+
                '         <span title="GitHub Repository" class="fa fa-github"></span>'+
                '         {{{name}}}'+
                '         </a>'+
                '         {{/repos}}'
            );

            var output = compiled.render({
                repos: repos
            });
            $("#githubFileSaveAsDialog .githubNavigation").html($(output));
            $("#githubFileSaveAsDialog .githubNavigation").scrollTop(0);

            $(".repository").on("click", function(){
                var $this = $(this);
                var repositoryId = $this.data("id");
                _this.storage.currentRepository = $.grep(_this.storage.repositories, function(repo){return repo.id === repositoryId;})[0];
                _this.fetchPathContent("");
            });
        });
    },

    fetchPathContent: function( newPath )
    {
        var _this = this;

        this.storage.currentRepository.contents(newPath).fetch(function(param, files){
            // sort the result
            // Directories are always on top
            //
            files.sort(function(a, b)
            {
                if(a.type===b.type) {
                    if (a.name.toLowerCase() < b.name.toLowerCase())
                        return -1;
                    if (a.name.toLowerCase() > b.name.toLowerCase())
                        return 1;
                    return 0;
                }
                if(a.type==="dir"){
                    return -1;
                }
                return 1;
            });

            _this.storage.currentPath = newPath;
            var compiled = Hogan.compile(
                '         <a href="#" class="list-group-item githubPath" data-type="{{parentType}}" data-path="{{parentPath}}" >'+
                '             <span class="glyphicon glyphicon-menu-left"></span>'+
                '             ..'+
                '         </a>'+
                '         {{#files}}'+
                '           <a href="#" data-draw2d="{{draw2d}}" class="list-group-item githubPath text-nowrap" data-type="{{type}}" data-path="{{currentPath}}{{name}}" data-title="{{name}}" data-id="{{id}}" data-sha="{{sha}}">'+
                '              <span class="glyphicon {{icon}}"></span>'+
                '              {{{name}}}'+
                '           </a>'+
                '         {{/files}}'
            );


            var parentPath =  _this.dirname(newPath);
            var output = compiled.render({
                parentType: parentPath===newPath?"repository":"dir",
                parentPath: parentPath,
                currentPath: _this.storage.currentPath.length===0?_this.storage.currentPath:_this.storage.currentPath+"/",
                files: files,
                draw2d:function(){
                    return this.name.endsWith(conf.fileSuffix);
                },
                icon: function(){
                    if(this.name.endsWith(conf.fileSuffix)){
                        return "fa fa-object-group";
                    }
                    return this.type==="dir"?"fa fa-folder-o":"fa fa-file-o";
                }
            });
            $("#githubFileSaveAsDialog .githubNavigation").html($(output));
            $("#githubFileSaveAsDialog .githubNavigation").scrollTop(0);

            //we are in a folder. Create of a file is possible now
            //
            $("#githubFileSaveAsDialog .okButton").prop( "disabled", false );

            $(".githubPath[data-type='repository']").on("click", function(){
                _this.fetchRepositories();
            });

            $(".githubPath[data-type='dir']").on("click", function(){
                _this.fetchPathContent( $(this).data("path"));
            });

            $('.githubPath*[data-draw2d="true"][data-type="file"]').on("click", function(){
                var path = $(this).data("path");
                var sha  = $(this).data("sha");
                var title= path.split(/[\\/]/).pop(); // basename
                $("#githubFileSaveAsDialog .githubFileName").val(title);
            });
        });
    },




    dirname: function(path)
    {
        if (path.length === 0)
            return "";

        var segments = path.split("/");
        if (segments.length <= 1)
            return "";
        return segments.slice(0, -1).join("/");
    }

});

shape_designer.filter.Filter = Class.extend({
    NAME : "shape_designer.filter.Filter",
	
	init:function(){
	},

	/**
	 * @method
	 * Sent when an event occurs on the command stack. draw2d.command.CommandStackEvent.getDetail() 
	 * can be used to identify the type of event which has occurred.
	 * 
	 * @template
	 * 
	 **/
	apply:function(figure, attributes)
    {
	},
	
	onInstall: function(figure)
    {
	    
	},
	
	insertPane: function(figure, $parent)
    {

    },
   
    removePane:function(){
    },
    
    getPersistentAttributes : function(relatedFigure)
    {

        var memento = {};
        memento.name = this.NAME;
        
        return memento;
    },
    
    setPersistentAttributes : function(relatedFigure, memento)
    {

    }

});






shape_designer.filter.StrokeFilter = shape_designer.filter.Filter.extend({
    NAME :"shape_designer.filter.StrokeFilter",
    
	init:function(){
	    this._super();
	    this.colorPicker = null;
	},
	
	insertPane: function(figure, $parent){
       var cssScope = this.NAME.replace(/[.]/g, "_");
	    
	   $parent.append('<div id="'+cssScope+'_container" class="panel panel-default">'+
                	   ' <div class="panel-heading filter-heading" data-toggle="collapse" data-target="#'+cssScope+'_width_panel">'+
                	   '     Stroke'+
                       '    <span id="button_remove_'+cssScope+'" class="btn btn-mini glyphicon glyphicon-remove-circle pull-right" ></span>'+
                	   '</div>'+
                	   
                	   ' <div class="panel-body collapse in" id="'+cssScope+'_width_panel">'+
                	   '   <div class="form-group">'+
                       '      <div class="input-group" ></div> '+ // required to ensure the correct width of the siblings
                 	   '       <input id="filter_'+cssScope+'_width" type="text" value="'+figure.getStroke()+'" name="filter_'+cssScope+'_width" class="form-control" />'+
                       '       <div class="input-group">'+
                       '          <span class="input-group-addon">#</span>'+
                       '          <input id="filter_'+cssScope+'_color" type="text" value="" name="stroke_'+cssScope+'_color" class="form-control color"/>'+
                       '       </div>'+
                       '   </div>'+
                       ' </div>'+
                	   '</div>');

	       $("input[name='filter_"+cssScope+"_width']").TouchSpin({
	           min: 0,
	           max: 50,
	           step: 1,
	           maxboostedstep: 1,
	           postfix: 'px'
	       });
           $("input[name='filter_"+cssScope+"_width']").on("change", $.proxy(function(){
               this.setStroke(parseInt($("input[name='filter_"+cssScope+"_width']").val()));
           },figure));

           
           var picker = this.colorPicker  = new jscolor.color(document.getElementById('filter_'+cssScope+'_color'), {});
           this.colorPicker.fromString(figure.getColor().hash());
           this.colorPicker.onImmediateChange= $.proxy(function(){
              this.setColor("#"+picker.toString());
           },figure);
           
           $("#button_remove_"+cssScope).on("click",$.proxy(function(){
               figure.removeFilter(this);
               figure.setStroke(0);
               $("#"+cssScope+"_container").animate({"height" : "0", "opacity":0, "margin-bottom":0}, 500, function(){$('#'+cssScope+'_container').remove();});
           },this));

	   },
	   
	   removePane:function(){
	       if(this.colorPicker !==null){
	           this.colorPicker.hidePicker();
	       }
	   },
	   
	    onInstall:function(figure){
	        figure.setStroke(1);
	    }

});






shape_designer.filter.OutlineStrokeFilter = shape_designer.filter.Filter.extend({
    NAME :"shape_designer.filter.OutlineStrokeFilter",
    
	init:function(){
	    this._super();
	    this.colorPicker = null;
	},
	
	insertPane: function(figure, $parent){
	    
	   $parent.append('<div id="outlinestroke_filter_conainer" class="panel panel-default">'+
                	   ' <div class="panel-heading filter-heading" data-toggle="collapse" data-target="#outlinestroke_width_panel">'+
                	   '     Outline Stroke'+
                       '    <span id="button_remove_OutlineStrokeFilter" class="btn btn-mini glyphicon glyphicon-remove-circle pull-right" ></span>'+
                	   '</div>'+
                	   
                	   ' <div class="panel-body collapse in" id="outlinestroke_width_panel">'+
                	   '   <div class="form-group">'+
                       '      <div class="input-group" ></div> '+ // required to ensure the correct width of the siblings
                 	   '       <input id="filter_outlinestroke" type="text" value="'+figure.getOutlineStroke()+'" name="filter_outlinestroke" class="form-control" />'+
                       '       <div class="input-group">'+
                       '          <span class="input-group-addon">#</span>'+
                       '          <input id="filter_outlinestroke_color" type="text" value="" name="outlinestroke-color" class="form-control color"/>'+
                       '       </div>'+
                       '   </div>'+
                       ' </div>'+
                	   '</div>');

	       $("input[name='filter_outlinestroke']").TouchSpin({
	           min: 0,
	           max: 50,
	           step: 1,
	           boostat: figure.getOutlineStroke(),
	           maxboostedstep: 10,
	           postfix: 'px'
	       });
           $("input[name='filter_outlinestroke']").on("change", $.proxy(function(){
               this.setOutlineStroke(parseFloat($("input[name='filter_outlinestroke']").val()));
           },figure));

           
           var picker = this.colorPicker  = new jscolor.color(document.getElementById('filter_outlinestroke_color'), {});
           this.colorPicker.fromString(figure.getOutlineColor().hash());
           this.colorPicker.onImmediateChange= $.proxy(function(){
              this.setOutlineColor("#"+picker.toString());
           },figure);
           
           $("#button_remove_OutlineStrokeFilter").on("click",$.proxy(function(){
               figure.removeFilter(this);
               figure.setOutlineStroke(0);
               $("#outlinestroke_filter_conainer").animate({"height" : "0", "opacity":0, "margin-bottom":0}, 500, function(){$('#outlinestroke_filter_conainer').remove();});
           },this));

	   },
	   
	   removePane:function(){
	       if(this.colorPicker !==null){
	           this.colorPicker.hidePicker();
	       }
	   },
	   
	    onInstall:function(figure){
	        figure.setOutlineStroke(1);
	        figure.setOutlineColor("#ff0000");
	    }

});






shape_designer.filter.BlurFilter = shape_designer.filter.Filter.extend({
    NAME :"shape_designer.filter.BlurFilter",
    
	init:function(){
	    this._super();
        this.cssScope = this.NAME.replace(/[.]/g, "_");
	},
	
	insertPane: function(figure, $parent){
	   $parent.append('<div id="'+this.cssScope+'_filter_container" class="panel panel-default">'+
                	   ' <div class="panel-heading filter-heading" data-toggle="collapse" data-target="#'+this.cssScope+'_width_panel">'+
                	   '     Blur'+
                       '    <span id="button_remove_'+this.cssScope+'" class="btn btn-mini glyphicon glyphicon-remove-circle pull-right" ></span>'+
                	   '</div>'+
                	   
                	   ' <div class="panel-body collapse in" id="'+this.cssScope+'_blur_panel">'+
                	   '   <div class="form-group">'+
                       '      <div class="input-group" ></div> '+ // required to ensure the correct width of the siblings
                 	   '       <input id="filter_blur" type="text" value="'+figure.getBlur()+'"  name="filter_blur" class="form-control" />'+
                       '   </div>'+
                       ' </div>'+
                	   '</div>');

           $("#filter_blur").TouchSpin({
               min:  0,
               max:  5,
               step: 1
           });

           $("#filter_blur").on("change", $.proxy(function(){
               this.setBlur(parseInt($("#filter_blur").val()));
           },figure));

           
           $("#button_remove_"+this.cssScope).on("click",$.proxy(function(){
               figure.removeFilter(this);
               figure.setBlur(0);
               $('#'+this.cssScope+'_filter_container').animate({"height" : "0", "opacity":0, "margin-bottom":0}, 500, function(){$('#'+this.cssScope+'_filter_container').remove();});
           },this));

	   }

});






shape_designer.filter.FillColorFilter = shape_designer.filter.Filter.extend({
	NAME : "shape_designer.filter.FillColorFilter",
	
	init:function(){
	    this._super();
	    this.colorPicker = null;
	},
	
	insertPane: function(figure, $parent){
	    
	   $parent.append('<div id="fill_color_container" class="panel panel-default">'+
                	   ' <div class="panel-heading filter-heading" data-toggle="collapse" data-target="#color_fill_panel">'+
                	   '    Color Fill'+
                       '    <span id="button_remove_FillColorFilter" class="btn btn-mini glyphicon glyphicon-remove-circle pull-right" ></span>'+
                	   ' </div>'+
                	   
                	   ' <div class="panel-body collapse in" id="color_fill_panel">'+
                       '   <div class="form-group">'+
                       '      <div class="input-group" ></div> '+ // required to ensure the correct width of the siblings
                       '      <div class="input-group">'+
                       '          <span class="input-group-addon">#</span>'+
                       '          <input id="filter_color_fill" type="text" value="" name="filter_color_fill" class="form-control color"/>'+
                       '       </div>'+
                       '    </div>'+
                       ' </div>'+
                	   '</div>');
           
           var picker = this.colorPicker  = new jscolor.color(document.getElementById('filter_color_fill'), {});
           this.colorPicker.fromString(figure.getBackgroundColor().hash());
           this.colorPicker.onImmediateChange= $.proxy(function(){
              this.setBackgroundColor("#"+picker.toString());
           },figure);
           
           $("#button_remove_FillColorFilter").on("click",$.proxy(function(){
               figure.removeFilter(this);
               figure.setBackgroundColor(null);
               $("#fill_color_container").animate({"height" : "0", "opacity":0, "margin-bottom":0}, 500, function(){$('#fill_color_container').remove();});
           },this));
	},
	  
	onInstall:function(figure){
        figure.setBackgroundColor("#f0f3f3");
	},
	
	removePane:function(){
	    if(this.colorPicker !==null){
	        this.colorPicker.hidePicker();
	    }
	}
	

});






shape_designer.filter.FontColorFilter = shape_designer.filter.Filter.extend({
	NAME : "shape_designer.filter.FontColorFilter",
	
	init:function(){
	    this._super();
	    this.colorPicker = null;
	},
	
	insertPane: function(figure, $parent){
	    
	   $parent.append('<div id="fill_color_container" class="panel panel-default">'+
                	   ' <div class="panel-heading filter-heading" data-toggle="collapse" data-target="#color_fill_panel">'+
                	   '    Font Color'+
                       '    <span id="button_remove_FillColorFilter" class="btn btn-mini glyphicon glyphicon-remove-circle pull-right" ></span>'+
                	   ' </div>'+
                	   
                	   ' <div class="panel-body collapse in" id="color_fill_panel">'+
                       '   <div class="form-group">'+
                       '      <div class="input-group" ></div> '+ // required to ensure the correct width of the siblings
                       '      <div class="input-group">'+
                       '          <span class="input-group-addon">#</span>'+
                       '          <input id="filter_color_fill" type="text" value="" name="filter_color_fill" class="form-control color"/>'+
                       '       </div>'+
                       '    </div>'+
                       ' </div>'+
                	   '</div>');
           
           var picker = this.colorPicker  = new jscolor.color(document.getElementById('filter_color_fill'), {});
           this.colorPicker.fromString(figure.getFontColor().hash());
           this.colorPicker.onImmediateChange= $.proxy(function(){
              this.setFontColor("#"+picker.toString());
           },figure);
           
           $("#button_remove_FillColorFilter").on("click",$.proxy(function(){
               figure.removeFilter(this);
               figure.setFontColor(null);
               $("#fill_color_container").animate({"height" : "0", "opacity":0, "margin-bottom":0}, 500, function(){$('#fill_color_container').remove();});
           },this));
	},
	  
	onInstall:function(figure){
        figure.setFontColor("#000000");
	},
	
	removePane:function(){
	    if(this.colorPicker !==null){
	        this.colorPicker.hidePicker();
	    }
	}
	

});






shape_designer.filter.FontSizeFilter = shape_designer.filter.Filter.extend({
    NAME :"shape_designer.filter.FontSizeFilter",
    
	init:function(){
	    this._super();
	},
	
	insertPane: function(figure, $parent){
	    
	   $parent.append('<div id="fontsize_filter_container" class="panel panel-default">'+
                	   ' <div class="panel-heading filter-heading" data-toggle="collapse" data-target="#fontsize_width_panel">'+
                	   '     Font Size'+
                       '    <span id="button_remove_FontSizeFilter" class="btn btn-mini glyphicon glyphicon-remove-circle pull-right" ></span>'+
                	   '</div>'+
                	   
                	   ' <div class="panel-body collapse in" id="fontsize_width_panel">'+
                	   '   <div class="form-group">'+
                       '      <div class="input-group" ></div> '+ // required to ensure the correct width of the siblings
                 	   '       <input id="filter_fontsize" type="text" value="'+figure.getFontSize()+'" name="filter_fontsize" class="form-control" />'+
                       '   </div>'+
                       ' </div>'+
                	   '</div>');

           $("#filter_fontsize").TouchSpin({
               min: 4,
               max: 300,
               step: 1,
               boostat: figure.getFontSize(),
               maxboostedstep: 10,
               postfix: 'px'
           });

           $("input[name='filter_fontsize']").on("change", $.proxy(function(){
               this.setFontSize(parseInt($("input[name='filter_fontsize']").val()));
           },figure));

           
           $("#button_remove_FontSizeFilter").on("click",$.proxy(function(){
               figure.removeFilter(this);
               figure.setFontSize(12);
               $("#fontsize_filter_container").animate({"height" : "0", "opacity":0, "margin-bottom":0}, 500, function(){$('#fontsize_filter_container').remove();});
           },this));

	   },
	   
	   removePane:function(){
	   },
	   
	    onInstall:function(figure){
	     //   figure.setFontSize(1);
	    }

});






shape_designer.filter.OpacityFilter = shape_designer.filter.Filter.extend({
    NAME : "shape_designer.filter.OpacityFilter",
	
	init:function(){
	    this._super();
	},
	
	insertPane: function(figure, $parent){
	    
	       $parent.append('<div id="opacity_container" class="panel panel-default">'+
                   ' <div class="panel-heading filter-heading" data-toggle="collapse" data-target="#opacity_panel">'+
                   '    Opacity'+
                   '    <span id="button_remove_OpacityFilter" class="btn btn-mini glyphicon glyphicon-remove-circle pull-right" ></span>'+
                   '</div>'+
                   ' <div class="panel-body collapse in" id="opacity_panel">'+
                   '   <div class="form-group">'+
                   '      <div class="input-group" ></div> '+ // required to ensure the correct width of the siblings
                   '      <div class="input-group">'+
                   '         <input class="form-control" id="filter_opacity" type="text" value="'+parseInt(figure.getAlpha()*100)+'" />'+
                   '      </div>'+
                   '   </div>'+
                   ' </div>'+
                   '</div>');

           $("#filter_opacity").TouchSpin({
               min: 0,
               max: 100,
               step: 5,
               boostat: parseInt(figure.getAlpha()*100),
               maxboostedstep: 10,
               postfix: '%'
           });
           $("#filter_opacity").on("change", $.proxy(function(){
               this.setAlpha(parseInt($("#filter_opacity").val())/100.0);
           },figure));
           
           $("#button_remove_OpacityFilter").on("click",$.proxy(function(){
               figure.removeFilter(this);
               figure.setAlpha(1);
               $("#opacity_container").animate({"height" : "0", "opacity":0, "margin-bottom":0}, 500, function(){$('#opacity_container').remove();});
           },this));
	   },
	   
	   removePane:function(){
	   }
	

});






shape_designer.filter.LinearGradientFilter = shape_designer.filter.Filter.extend({
    NAME :"shape_designer.filter.LinearGradientFilter",
    
	init:function(){
	    this._super();
	    this.colorPicker1 = null;
	    this.colorPicker2 = null;
	    
	    this.startColor ="#f0f0f0";
	    this.endColor   ="#3f3f3f";
	    this.angle      =0;
        this.cssScope = this.NAME.replace(/[.]/g, "_");
	},
	
	insertPane: function(figure, $parent){
	    
	   $parent.append('<div id="'+this.cssScope+'_container" class="panel panel-default">'+
                	   ' <div class="panel-heading filter-heading" data-toggle="collapse" data-target="#'+this.cssScope+'_panel">'+
                	   '     Linear Gradient'+
                       '    <span id="button_remove_'+this.cssScope+'" class="btn btn-mini glyphicon glyphicon-remove-circle pull-right" ></span>'+
                	   '</div>'+
                	   
                	   ' <div class="panel-body collapse in" id="'+this.cssScope+'_panel">'+
                	   '   <div class="form-group">'+
                       '      <div class="input-group" ></div> '+ // required to ensure the correct width of the siblings
                       '      <div class="input-group text-center" style="width:100%" >'+
                 	   '           <div id="'+this.cssScope+'_angle" />'+
                       '      </div> '+ 
                       '       <div class="input-group">'+
                       '          <span class="input-group-addon">#</span>'+
                       '          <input id="'+this.cssScope+'_color1" type="text" value="'+this.startColor+'" class="form-control color"/>'+
                       '       </div>'+
                       '       <div class="input-group">'+
                       '          <span class="input-group-addon">#</span>'+
                       '          <input id="'+this.cssScope+'_color2" type="text" value="'+this.endColor+'" class="form-control color"/>'+
                       '       </div>'+
                       '   </div>'+
                       ' </div>'+
                	   '</div>');

    	   $('#'+this.cssScope+'_angle').anglepicker({
    	       start: function(e, ui) {
    
    	       },
    	       change: $.proxy(function(e, ui) {
    	           this.angle = ui.value;
    	              figure.repaint();
     	       },this),
    	       stop: function(e, ui) {
    
    	       },
    	       value: this.angle
    	   });
          
           var picker1 = this.colorPicker1  = new jscolor.color($("#"+this.cssScope+'_color1')[0], {});
           this.colorPicker1.fromString(this.startColor);
           this.colorPicker1.onImmediateChange= $.proxy(function(){
              this.startColor= "#"+picker1.toString();
              figure.repaint();
           },this);
           
           var picker2 = this.colorPicker2  = new jscolor.color($("#"+this.cssScope+'_color2')[0], {});
           this.colorPicker2.fromString(this.endColor);
           this.colorPicker2.onImmediateChange= $.proxy(function(){
              this.endColor ="#"+picker2.toString();
              figure.repaint();
           },this);
 
           
           $("#button_remove_"+this.cssScope).on("click",$.proxy(function(){
               figure.removeFilter(this);
               $('#'+this.cssScope+'_container').animate({"height" : "0", "opacity":0, "margin-bottom":0}, 500, function(){$('#'+this.cssScope+'_container').remove();});
           },this));

	   },
	   
	    apply:function(figure, attributes){
	        attributes.fill = this.angle+"-"+this.endColor+"-"+this.startColor;    
	    },
	    
	   removePane:function(){
	       if(this.colorPicker1 !==null){
	           this.colorPicker1.hidePicker();
	       }
	       if(this.colorPicker2 !==null){
	           this.colorPicker2.hidePicker();
	       }
	   },
	   
	    onInstall:function(figure){
	        figure.setStroke(1);
	    },
	    
	    getPersistentAttributes : function(relatedFigure){   
	        var memento = this._super(relatedFigure);
	        
            memento.startColor = this.startColor;
            memento.endColor = this.endColor;
	        memento.angle = this.angle;
	        
	        return memento;
	    },
	    
	    setPersistentAttributes : function(relatedFigure, memento){
	        this._super(relatedFigure, memento);
	        
            this.startColor = memento.startColor;
            this.endColor = memento.endColor;
	        this.angle = memento.angle;
	        
	        return memento;
	    }

	

});






shape_designer.filter.TextLinearGradientFilter = shape_designer.filter.Filter.extend({
    NAME :"shape_designer.filter.TextLinearGradientFilter",
    
	init:function(){
	    this._super();
	    this.colorPicker1 = null;
	    this.colorPicker2 = null;
	    
	    this.startColor ="#f0f0f0";
	    this.endColor   ="#3f3f3f";
	    this.angle      =0;
        this.cssScope = this.NAME.replace(/[.]/g, "_");
	},
	
	insertPane: function(figure, $parent){
	    
	   $parent.append('<div id="'+this.cssScope+'_container" class="panel panel-default">'+
                	   ' <div class="panel-heading filter-heading" data-toggle="collapse" data-target="#'+this.cssScope+'_panel">'+
                	   '     Linear Gradient'+
                       '    <span id="button_remove_'+this.cssScope+'" class="btn btn-mini glyphicon glyphicon-remove-circle pull-right" ></span>'+
                	   '</div>'+
                	   
                	   ' <div class="panel-body collapse in" id="'+this.cssScope+'_panel">'+
                	   '   <div class="form-group">'+
                       '      <div class="input-group" ></div> '+ // required to ensure the correct width of the siblings
                       '      <div class="input-group text-center" style="width:100%" >'+
                 	   '           <div id="'+this.cssScope+'_angle" />'+
                       '      </div> '+ 
                       '       <div class="input-group">'+
                       '          <span class="input-group-addon">#</span>'+
                       '          <input id="'+this.cssScope+'_color1" type="text" value="'+this.startColor+'" class="form-control color"/>'+
                       '       </div>'+
                       '       <div class="input-group">'+
                       '          <span class="input-group-addon">#</span>'+
                       '          <input id="'+this.cssScope+'_color2" type="text" value="'+this.endColor+'" class="form-control color"/>'+
                       '       </div>'+
                       '   </div>'+
                       ' </div>'+
                	   '</div>');

    	   $('#'+this.cssScope+'_angle').anglepicker({
    	       start: function(e, ui) {
    
    	       },
    	       change: $.proxy(function(e, ui) {
    	           this.angle = ui.value;
    	              figure.repaint();
     	       },this),
    	       stop: function(e, ui) {
    
    	       },
    	       value: this.angle
    	   });
          
           var picker1 = this.colorPicker1  = new jscolor.color($("#"+this.cssScope+'_color1')[0], {});
           this.colorPicker1.fromString(this.startColor);
           this.colorPicker1.onImmediateChange= $.proxy(function(){
              this.startColor= "#"+picker1.toString();
              figure.repaint();
           },this);
           
           var picker2 = this.colorPicker2  = new jscolor.color($("#"+this.cssScope+'_color2')[0], {});
           this.colorPicker2.fromString(this.endColor);
           this.colorPicker2.onImmediateChange= $.proxy(function(){
              this.endColor ="#"+picker2.toString();
              figure.repaint();
           },this);
 
           
           $("#button_remove_"+this.cssScope).on("click",$.proxy(function(){
               figure.removeFilter(this);
               $('#'+this.cssScope+'_container').animate({"height" : "0", "opacity":0, "margin-bottom":0}, 500, function(){$('#'+this.cssScope+'_container').remove();});
           },this));

	   },
	   
	    apply:function(figure, attributes, lattr){
	        lattr.fill= this.angle+"-"+this.endColor+"-"+this.startColor;    
	        console.log("ddd");
	    },
	    
	   removePane:function(){
	       if(this.colorPicker1 !==null){
	           this.colorPicker1.hidePicker();
	       }
	       if(this.colorPicker2 !==null){
	           this.colorPicker2.hidePicker();
	       }
	   },
	   
	    onInstall:function(figure){
	     
	    },
	    
	    getPersistentAttributes : function(relatedFigure){   
	        var memento = this._super(relatedFigure);
	        
            memento.startColor = this.startColor;
            memento.endColor = this.endColor;
	        memento.angle = this.angle;
	        
	        return memento;
	    },
	    
	    setPersistentAttributes : function(relatedFigure, memento){
	        this._super(relatedFigure, memento);
	        
            this.startColor = memento.startColor;
            this.endColor = memento.endColor;
	        this.angle = memento.angle;
	        
	        return memento;
	    }

	

});






shape_designer.filter.PortTypeFilter = shape_designer.filter.Filter.extend({
    NAME :"shape_designer.filter.PortTypeFilter",
    
	init:function(){
	    this._super();
	    
	    this.type   =0;
        this.cssScope = this.NAME.replace(/[.]/g, "_");
	},
	
	insertPane: function(figure, $parent){

	   var _this = this;
	   $parent.append('<div id="'+this.cssScope+'_container" class="panel panel-default">'+
                	   ' <div class="panel-heading filter-heading" data-toggle="collapse" data-target="#'+this.cssScope+'_panel">'+
                	   '     Port Type'+
                	   '</div>'+
                	   
                	   ' <div class="panel-body collapse in" id="'+this.cssScope+'_panel">'+
                	   '   <div class="form-group">'+
                       '      <div class="input-group" ></div> '+ // required to ensure the correct width of the siblings
                       '      <div class="btn-group dropdown">'+
                       '         <button id="'+this.cssScope+'_button" class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown">'+
                       '              <span id="'+this.cssScope+'_label">'+figure.getInputType()+'</span>        '+
                       '              <span class="caret"></span></button>     '+
                       '              <ul class="dropdown-menu" id="select_'+this.cssScope+'_menu">'+
                       '                 <li><a href="#" data-type="Input"  >Input </a></li>'+
                       '                 <li><a href="#" data-type="Output" >Output</a></li>'+
                       '                 <li><a href="#" data-type="Hybrid" >Hybrid</a></li>'+
                       '              </ul>'+
                       '         </button>'+
                       '       </div>'+
                       '   </div>'+
                       ' </div>'+
                	   '</div>');

	       $('#select_'+this.cssScope+'_menu a').on("click", function(){
	           var $this = $(this);
	           var typeName = $this.data("type");
	           figure.setInputType(typeName);
	           $('#'+_this.cssScope+'_label').text(typeName);
	       });
	   },
	   
	    

		removePane : function() {
		},

		onInstall : function(figure) {
		},

		getPersistentAttributes : function(relatedFigure) {
			var memento = this._super(relatedFigure);

			return memento;
		},

		setPersistentAttributes : function(relatedFigure, memento) {
			this._super(relatedFigure, memento);

			return memento;
		}
});






shape_designer.filter.PortDirectionFilter = shape_designer.filter.Filter.extend({
    NAME :"shape_designer.filter.PortDirectionFilter",
    
	init:function(){
	    this._super();
	    
	    this.type   =0;
        this.cssScope = this.NAME.replace(/[.]/g, "_");
	},
	
	insertPane: function(figure, $parent){
	   var _this = this;
	   var dir = figure.getConnectionDirection();
	   $parent.append('<div id="'+this.cssScope+'_container" class="panel panel-default">'+
                	   ' <div class="panel-heading filter-heading" data-toggle="collapse" data-target="#'+this.cssScope+'_panel">'+
                	   '     Connection Direction'+
                	   '</div>'+
                	   
                	   ' <div class="panel-body collapse in" id="'+this.cssScope+'_panel">'+
                	   '   <div class="form-group portDirectionOption">'+
                       '      <div class="input-group" ></div> '+ // required to ensure the correct width of the siblings

		               '<label>'+
					   '  <input '+(dir===0?' checked="checked"':'')+' type="radio" value="" name="'+this.cssScope+'_label" name="'+this.cssScope+'_label" data-dir="0" />'+
		               '  <span  title="up" class="glyphicon glyphicon-arrow-up"></span>'+
					   '</label>'+

                       '<br>'+

                       '<label>'+
                       '  <input '+(dir===3?' checked="checked"':'')+'type="radio" value="" name="'+this.cssScope+'_label" name="'+this.cssScope+'_label" data-dir="3" />'+
                       '  <span  title="left" class="glyphicon glyphicon-arrow-left"></span>'+
                       '</label>'+

                       '<label>'+
                       '  <input '+(dir===null?' checked="checked"':'')+'type="radio" value="" name="'+this.cssScope+'_label" name="'+this.cssScope+'_label" data-dir="null" />'+
                       '  <span title="automatic" class="glyphicon glyphicon-screenshot"></span>'+
                       '</label>'+

					   '<label>'+
					   '  <input '+(dir===1?' checked="checked"':'')+'type="radio" value="" name="'+this.cssScope+'_label" name="'+this.cssScope+'_label" data-dir="1" />'+
					   '  <span title="right"  class="glyphicon glyphicon-arrow-right"></span>'+
					   '</label>'+

                       '<br>'+

					   '<label>'+
					   '  <input '+(dir==2?' checked="checked"':'')+'type="radio" value="" name="'+this.cssScope+'_label" name="'+this.cssScope+'_label" data-dir="2" />'+
					   '  <span  title="down" class="glyphicon glyphicon-arrow-down"></span>'+
					   '</label>'+


		               '       </div>'+
                       '   </div>'+
                       ' </div>'+
                	   '</div>');

		   $("#"+_this.cssScope+"_panel .portDirectionOption input").on("change", function(){
			   var $this = $(this);
			   var dir = $this.data("dir");
			   figure.setConnectionDirection(dir);
		   });
	   },
	   
	    

		removePane : function() {
		},

		onInstall : function(figure) {
		},

		getPersistentAttributes : function(relatedFigure) {
			var memento = this._super(relatedFigure);

			return memento;
		},

		setPersistentAttributes : function(relatedFigure, memento) {
			this._super(relatedFigure, memento);

			return memento;
		}
});






shape_designer.filter.PositionFilter = shape_designer.filter.Filter.extend({
    NAME :"shape_designer.filter.PositionFilter",
    
	init:function(){
	    this._super();
	    this.block = false;
	},
	
	insertPane: function(figure, $parent){
	    
	   $parent.append('<div id="position_filter_container" class="panel panel-default">'+
                	   ' <div class="panel-heading filter-heading" data-toggle="collapse" data-target="#position_width_panel">'+
                	   '     Position'+
                	   '</div>'+
                	   ' <div class="panel-body" id="position_width_panel">'+
                	   '   <div class="form-group">'+
                       '      <div class="input-group" ></div> '+ // required to ensure the correct width of the siblings
                       '       <input id="filter_position_x" type="text" value="'+figure.getPosition().x+'" name="filter_position_x" class="form-control" />'+
                       '       <input id="filter_position_y" type="text" value="'+figure.getPosition().y+'" name="filter_position_y" class="form-control" />'+
                       '   </div>'+
                       ' </div>'+
                	   '</div>');

           $("#filter_position_x").TouchSpin({
               min: 0,
               max: 3000,
               step: 1,
               maxboostedstep: 10,
               postfix: 'X'
           });

           $("#filter_position_y").TouchSpin({
               min: 0,
               max: 3000,
               step: 1,
               maxboostedstep: 10,
               postfix: 'Y'
           });

           $("input[name='filter_position_x']").on("change", $.proxy(function(){
               try{
                   this.block = true;
                   var pos = figure.getPosition();
                   figure.setPosition(parseInt($("input[name='filter_position_x']").val()), pos.y);
               }
               finally{
                   this.block = false;
               }
               
           },this));

           $("input[name='filter_position_y']").on("change", $.proxy(function(){
               try{
                   this.block = true;
                   var pos = figure.getPosition();
                   figure.setPosition(pos.x,parseInt($("input[name='filter_position_y']").val()));
               }
               finally{
                   this.block = false;
               }
           },this));
	   },

	   apply:function(figure, attributes){
	       if(this.block===true){
	           return;
	       }
           var pos = figure.getPosition();
           $("input[name='filter_position_y']").val(pos.y);
           $("input[name='filter_position_x']").val(pos.x);
	   },

	   removePane:function(){
	   },
	   
	   onInstall:function(figure){
	     //   figure.setFontSize(1);
	   }

});






shape_designer.filter.RadiusFilter = shape_designer.filter.Filter.extend({
    NAME : "shape_designer.filter.RadiusFilter",
	
	init:function(){
	    this._super();
	},
	
	insertPane: function(figure, $parent){
	    
	       $parent.append('<div id="radius_container" class="panel panel-default">'+
                   ' <div class="panel-heading filter-heading" data-toggle="collapse" data-target="#radius_panel">'+
                   '    Corner Radius'+
                   '    <span id="button_remove_RadiusFilter" class="btn btn-mini glyphicon glyphicon-remove-circle pull-right" ></span>'+
                   '</div>'+
                   ' <div class="panel-body collapse in" id="radius_panel">'+
                   '   <div class="form-group">'+
                   '      <div class="input-group" ></div> '+ // required to ensure the correct width of the siblings
                   '      <div class="input-group">'+
                   '         <input class="form-control" id="filter_radius" type="text" value="'+figure.getRadius()+'" />'+
                   '      </div>'+
                   '   </div>'+
                   ' </div>'+
                   '</div>');

           $("#filter_radius").TouchSpin({
               min: 0,
               max: 200,
               step: 1,
               maxboostedstep: 10,
               postfix: 'px'
           });
           $("#filter_radius").on("change", $.proxy(function(){
               this.setRadius(parseInt($("#filter_radius").val()));
           },figure));
           
           $("#button_remove_RadiusFilter").on("click",$.proxy(function(){
               figure.removeFilter(this);
               figure.setRadius(0);
               $("#radius_container").animate({"height" : "0", "opacity":0, "margin-bottom":0}, 500, function(){$('#radius_container').remove();});
           },this));
	   },
	   
	   removePane:function(){
	   }
	

});





/* jshint evil:true */
shape_designer.figure.ExtLabel = draw2d.shape.basic.Label.extend({
    
    NAME: "shape_designer.figure.ExtLabel",
    

    init:function()
    {
      this.blur = 0;
      this.isExtFigure = true;

      this._super();
 
     
      this.setUserData({name:"Label"});
      
      this.filters   = new draw2d.util.ArrayList();
      this.filters.add( new shape_designer.filter.PositionFilter());
      this.filters.add( new shape_designer.filter.FontSizeFilter());
      this.filters.add( new shape_designer.filter.FontColorFilter());
      
      this.installEditor(new draw2d.ui.LabelInplaceEditor());
      
    },
    
    getPotentialFilters: function(){
        return [
                {label:"Opacity", impl:"shape_designer.filter.OpacityFilter"},
                {label:"Blur", impl:"shape_designer.filter.BlurFilter"},
                {label:"Outline", impl:"shape_designer.filter.OutlineStrokeFilter"},
                {label:"Gradient", impl:"shape_designer.filter.TextLinearGradientFilter"},
                {label:"Font Size", impl:"shape_designer.filter.FontSizeFilter"},
                {label:"Font Color", impl:"shape_designer.filter.FontColorFilter"}
                ];
    },
    
    setBlur: function( value){
        this.blur = value;
        this.repaint();
    },
    
    getBlur: function(){
      return this.blur;  
    },
    
    removeFilter:function(filter){
      this.filters.remove(filter);  
      
      return this;
    },

    addFilter:function(filter){
        var alreadyIn = false;
        
        this.filters.each($.proxy(function(i,e){
            alreadyIn = alreadyIn || (e.NAME===filter.NAME);
        },this));
        if(alreadyIn===true){
            return; // silently
        }
        
        this.filters.add(filter);  
        filter.onInstall(this);
        this.repaint();
        
        return this;
    },
    
    
    /**
     * @method
     * Trigger the repaint of the element.
     * 
     */
    repaint:function(attributes)
    {
        if(this.shape===null){
            return;
        }

        if(typeof attributes === "undefined"){
            attributes = {};
        }
 
        // style the label
        var lattr = {};
        lattr.text = this.text;
        lattr["font-weight"] = (this.bold===true)?"bold":"normal";
        lattr["text-anchor"] = "start";
        lattr["font-size"] = this.fontSize;
        if(this.fontFamily!==null){
            lattr["font-family"] = this.fontFamily;
        }
        lattr.fill = this.fontColor.hash();
        // since 4.2.1
        lattr.stroke = this.outlineColor.hash();
        lattr["stroke-width"] = this.outlineStroke;
        
        this.filters.each($.proxy(function(i,filter){
            filter.apply(this, attributes, lattr);
        },this));

        this.svgNodes.attr(lattr);
        // set of the x/y must be done AFTER the font-size and bold has been set.
        // Reason: the getHeight method needs the font-size for calculation because
        //         it redirects the calculation to the SVG element.
        this.svgNodes.attr({x:this.padding.left,y: this.getHeight()/2});

        // jump over the normal Label implementation
        draw2d.SetFigure.prototype.repaint.call(this,attributes);
    },

    getPersistentAttributes : function()
    {   
        var memento = this._super();
        
        memento.filters = [];
        this.filters.each($.proxy(function(i,e){
            var filterMemento = e.getPersistentAttributes(this);
            memento.filters.push(filterMemento);
        },this));
 
        return memento;
    },
    
    setPersistentAttributes : function( memento)
    {
        this._super(memento);
        

        if(typeof memento.filters !=="undefined"){
            this.filters = new draw2d.util.ArrayList();
            $.each(memento.filters, $.proxy(function(i,e){
                var filter = eval("new "+e.name+"()");
                filter.setPersistentAttributes(this, e);
                this.filters.add(filter);
            },this));
        }
    }
});

/* jshint evil:true */

shape_designer.figure.ExtPolygon = draw2d.shape.basic.Polygon.extend({
    
    NAME: "shape_designer.figure.ExtPolygon",
    

    init:function(attr, setter, getter)
    {
      this.blur=0;
      this.isExtFigure = true;

      this._super(attr, setter, getter);
 
      this.setUserData({name:"Polygon"});
      
      this.filters   = new draw2d.util.ArrayList();
      this.filters.add( new shape_designer.filter.PositionFilter());
      this.filters.add( new shape_designer.filter.StrokeFilter());
      this.filters.add( new shape_designer.filter.FillColorFilter());
      
      
      this.installEditPolicy(new draw2d.policy.figure.RectangleSelectionFeedbackPolicy());
    },
    
    setBlur: function( value){
        this.blur = parseInt(value);
        this.repaint();
    },
    
    getBlur: function(){
      return this.blur;  
    },
    
    getPotentialFilters: function(){
        return [
                {label:"Stroke", impl:"shape_designer.filter.StrokeFilter"},
                {label:"Opacity", impl:"shape_designer.filter.OpacityFilter"},
                {label:"Blur", impl:"shape_designer.filter.BlurFilter"},
                {label:"Corner Radius", impl:"shape_designer.filter.RadiusFilter"},
                {label:"Linear Gradient", impl:"shape_designer.filter.LinearGradientFilter"},
                {label:"Fill Color", impl:"shape_designer.filter.FillColorFilter"}
                ];
    },
    
    removeFilter:function(filter){
      this.filters.remove(filter);  
    },

    addFilter:function(filter){
        var alreadyIn = false;
        
        this.filters.each($.proxy(function(i,e){
            alreadyIn = alreadyIn || (e.NAME===filter.NAME);
        },this));

        if(alreadyIn===true){
            return; // silently
        }
        
        this.filters.add(filter);  
        filter.onInstall(this);
        this.repaint();
    },
      
    onDoubleClick: function(){
        this.installEditPolicy(new draw2d.policy.figure.VertexSelectionFeedbackPolicy());
    },
    
    /**
     * @method
     * Unselect the figure and propagete this event to all edit policies.
     * 
     * @final
     * @private
     **/
    unselect:function()
    {
        this._super();
        
        this.installEditPolicy(new draw2d.policy.figure.RectangleSelectionFeedbackPolicy());
        return this;
    },
    
    
    /**
     * @method
     * Trigger the repaint of the element.
     * 
     */
    repaint:function(attributes)
    {
        if(this.shape===null){
            return;
        }

        if(this.svgPathString===null){
            this.calculatePath();
        }
        
        if(typeof attributes === "undefined"){
            attributes = {};
        }
        
         
        attributes.path = this.svgPathString;
        
        this.filters.each($.proxy(function(i,filter){
            filter.apply(this, attributes);
        },this));

        //this.shape.blur(this.blur===0?-1:this.blur);
/*
        if(this.filter)
        this.filter = this.canvas.paper.createFilter();
        filter.addShiftToColor("red");
        filter.addBlur(7);
        this.shape.filter(filter);
*/
        this._super(attributes);
    },

    getPersistentAttributes : function()
    {   
        var memento = this._super();
        
        memento.blur = this.blur;
        memento.filters = [];
        this.filters.each($.proxy(function(i,e){
            var filterMemento = e.getPersistentAttributes(this);
            memento.filters.push(filterMemento);
        },this));
 
        return memento;
    },
    
    setPersistentAttributes : function( memento)
    {
        this._super(memento);
        
        if(typeof memento.blur !=="undefined")
            this.setBlur(memento.blur);
        
        if(typeof memento.filters !=="undefined"){
            this.filters = new draw2d.util.ArrayList();
            $.each(memento.filters, $.proxy(function(i,e){
                var filter = eval("new "+e.name+"()");
                filter.setPersistentAttributes(this, e);
                this.filters.add(filter);
            },this));
        }
    }
});

/* jshint evil:true */

shape_designer.figure.ExtPort = draw2d.shape.basic.Circle.extend({
    
    NAME: "shape_designer.figure.ExtPort",
    

    init:function()
    {
      this.isExtFigure = true;
      this.decoration = null;
      this._super({diameter:10});


      this.setUserData({
    	  name:"Port",
    	  type:"Hybrid",
    	  direction:null
    		  });
      
      this.filters   = new draw2d.util.ArrayList();
      this.filters.add( new shape_designer.filter.PositionFilter());
      this.filters.add( new shape_designer.filter.PortDirectionFilter());
      this.filters.add( new shape_designer.filter.PortTypeFilter());

      this.installEditPolicy(new draw2d.policy.figure.AntSelectionFeedbackPolicy());
    },
    

    setInputType: function(type){
    	this.getUserData().type = type;
    },
    
    getInputType: function(){
    	return this.getUserData().type;
    },

    setConnectionDirection: function(direction){
        this.getUserData().direction = direction;
        this.updateDecoration();
    },
    
    getConnectionDirection: function(){
        return this.getUserData().direction;
    },

    
    updateDecoration:function(){
        if(this.decoration!==null){
            this.remove(this.decoration);
            this.decoration = null;
        }
        var figure =null;
        var locator = null;
        switch(this.getConnectionDirection()){
            case 0:
                figure = new draw2d.shape.icon.ArrowUp({width:8, height:8, opacity:0.5});
                locator= new draw2d.layout.locator.TopLocator();
                break;
            case 1:
                figure = new draw2d.shape.icon.ArrowRight({width:8, height:8, opacity:0.5});
                locator= new draw2d.layout.locator.RightLocator();
                break;
            case 2:
                figure = new draw2d.shape.icon.ArrowDown({width:8, height:8, opacity:0.5});
                locator= new draw2d.layout.locator.BottomLocator();
                break;
            case 3:
                figure = new draw2d.shape.icon.ArrowLeft({width:8, height:8, opacity:0.5});
                locator= new draw2d.layout.locator.LeftLocator();
                break;
        }
        if(figure!==null){
            this.add(figure, locator);
            this.decoration = figure;
        }
    },
    
    getPotentialFilters: function(){
        return [
                {label:"Port Type",      impl:"shape_designer.filter.PortTypeFilter"},
                {label:"Port Direction", impl:"shape_designer.filter.PortDirectionFilter"},
                {label:"Color",          impl:"shape_designer.filter.FillColorFilter"},
                
                ];
    },

    removeFilter:function(filter){
      this.filters.remove(filter);  
    },

    addFilter:function(filter){
        var alreadyIn = false;
        
        this.filters.each($.proxy(function(i,e){
            alreadyIn = alreadyIn || (e.NAME===filter.NAME);
        },this));
        if(alreadyIn===true){
            return; // silently
        }
        
        this.filters.add(filter);  
        filter.onInstall(this);
        this.repaint();
    },
      
    
    /**
     * @method
     * Trigger the repaint of the element.
     * 
     */
    repaint:function(attributes)
    {
        if(this.shape===null){
            return;
        }

        if(typeof attributes === "undefined"){
            attributes = {};
        }
        
         
        
        this.filters.each($.proxy(function(i,filter){
            filter.apply(this, attributes);
        },this));
        
        this._super(attributes);
    },

    getPersistentAttributes : function()
    {   
        var memento = this._super();
        
        memento.filters = [];
        this.filters.each($.proxy(function(i,e){
            var filterMemento = e.getPersistentAttributes(this);
            memento.filters.push(filterMemento);
        },this));
 
        return memento;
    },
    
    setPersistentAttributes : function( memento)
    {
        this._super(memento);
        

        if(typeof memento.filters !=="undefined"){
            this.filters = new draw2d.util.ArrayList();
            $.each(memento.filters, $.proxy(function(i,e){
                var filter = eval("new "+e.name+"()");
                filter.setPersistentAttributes(this, e);
                this.filters.add(filter);
            },this));
        }
        this.updateDecoration();
    }
});

/* jshint evil:true */
shape_designer.figure.ExtLine = draw2d.shape.basic.PolyLine.extend({
    
    NAME: "shape_designer.figure.ExtLine",
    

    init:function()
    {
      this._super();
 
      this.blur = 0;
      this.isExtFigure = true;

      this.setUserData({name:"Line"});
      
      this.filters   = new draw2d.util.ArrayList();
      this.filters.add( new shape_designer.filter.StrokeFilter());
      
      this.setRouter(new draw2d.layout.connection.VertexRouter());
      this.installEditPolicy(new draw2d.policy.line.VertexSelectionFeedbackPolicy());
    },

    setBlur: function( value){
        this.blur = parseInt(value);
        this.repaint();
    },
    
    getBlur: function(){
      return this.blur;  
    },
    
    getPotentialFilters: function(){
        return [
                {label:"Opacity", impl:"shape_designer.filter.OpacityFilter"},
                {label:"Blur", impl:"shape_designer.filter.BlurFilter"},
                {label:"Outline", impl:"shape_designer.filter.OutlineStrokeFilter"},
                {label:"Corner Radius", impl:"shape_designer.filter.RadiusFilter"},
                {label:"Stroke", impl:"shape_designer.filter.StrokeFilter"}
               ];
    },
     
    removeFilter:function(filter){
      this.filters.remove(filter);  
      
      return this;
    },

    addFilter:function(filter){
        var alreadyIn = false;
        
        this.filters.each($.proxy(function(i,e){
            alreadyIn = alreadyIn || (e.NAME===filter.NAME);
        },this));
        if(alreadyIn===true){
            return; // silently
        }
        
        this.filters.add(filter);  
        filter.onInstall(this);
        this.repaint();
        
        return this;
    },
    
    
    /**
     * @method
     * Trigger the repaint of the element.
     * 
     */
    repaint:function(attributes)
    {
        if(this.shape===null){
            return;
        }

        if(typeof attributes === "undefined"){
            attributes = {};
        }
        
        this.filters.each($.proxy(function(i,filter){
            filter.apply(this, attributes);
        },this));
        
//        this.shape.blur(this.blur);
        this._super(attributes);
    },

    getPersistentAttributes : function()
    {   
        var memento = this._super();
        
        memento.filters = [];
        this.filters.each($.proxy(function(i,e){
            var filterMemento = e.getPersistentAttributes(this);
            memento.filters.push(filterMemento);
        },this));
 
        return memento;
    },
    
    setPersistentAttributes : function( memento)
    {
        this._super(memento);
        

        if(typeof memento.filters !=="undefined"){
            this.filters = new draw2d.util.ArrayList();
            $.each(memento.filters, $.proxy(function(i,e){
                var filter = eval("new "+e.name+"()");
                filter.setPersistentAttributes(this, e);
                this.filters.add(filter);
            },this));
        }
    }
});

shape_designer.figure.PolyRect = shape_designer.figure.ExtPolygon.extend({

    NAME: "shape_designer.figure.PolyRect",

    init:function(topLeft, bottomRight)
    {
      this._super();
    
      if(typeof topLeft === "undefined"){
          this.vertices   = new draw2d.util.ArrayList();
          this.addVertex(new draw2d.geo.Point(100,100) );
          this.addVertex(new draw2d.geo.Point(140,100) );
          this.addVertex(new draw2d.geo.Point(140,140) );
          this.addVertex(new draw2d.geo.Point(100,140) );
      }
      else{
          this.vertices   = new draw2d.util.ArrayList();
          this.addVertex(new draw2d.geo.Point(topLeft.x,topLeft.y) );
          this.addVertex(new draw2d.geo.Point(bottomRight.x,topLeft.y) );
          this.addVertex(new draw2d.geo.Point(bottomRight.x,bottomRight.y) );
          this.addVertex(new draw2d.geo.Point(topLeft.x,bottomRight.y));
      }
      
      this.setUserData({name:"Rectangle"});
    }
});

/* jshint evil:true */
shape_designer.figure.PolyCircle = draw2d.shape.basic.Oval.extend({

    NAME: "shape_designer.figure.PolyCircle",


    init:function(center, radius)
    {
      this.blur=0;
      this.isExtFigure = true;

        // set some good defaults
      if(typeof radius==="undefined" ){
          radius = 10;
      }
      
      this._super({stroke:0, bgColor:"95C06A", width:radius*2, height:radius*2});
      
      // center must be set after the width/height...bug
      if(typeof center!=="undefined"){
          this.setCenter(center);
      }
      
      this.setUserData({name:"Circle"});
      
      this.filters = new draw2d.util.ArrayList();
      this.filters.add( new shape_designer.filter.PositionFilter());
      this.filters.add( new shape_designer.filter.FillColorFilter());
    },

    getPotentialFilters: function(){
        return [
                {label:"Stroke", impl:"shape_designer.filter.StrokeFilter"},
                {label:"Opacity", impl:"shape_designer.filter.OpacityFilter"},
                {label:"Blur", impl:"shape_designer.filter.BlurFilter"},
                {label:"Linear Gradient", impl:"shape_designer.filter.LinearGradientFilter"},
                {label:"Fill Color", impl:"shape_designer.filter.FillColorFilter"}
                ];
    },
    
    removeFilter:function(filter){
      this.filters.remove(filter);  
    },

    addFilter:function(filter){
        var alreadyIn = false;
        
        this.filters.each($.proxy(function(i,e){
            alreadyIn = alreadyIn || (e.NAME===filter.NAME);
        },this));
        
        if(alreadyIn===true){
            return; // silently
        }
        
        this.filters.add(filter);  
        filter.onInstall(this);
        this.repaint();
    },
   
    
    setBlur: function( value){
        this.blur = parseInt(value);
        this.repaint();
    },
    
    getBlur: function(){
      return this.blur;  
    },
    
    /**
     * @method
     * Trigger the repaint of the element.
     * 
     */
    repaint:function(attributes)
    {
        if(this.shape===null){
            return;
        }

        this.filters.each($.proxy(function(i,filter){
            filter.apply(this, attributes);
        },this));
        
//        this.shape.blur(this.blur);
        this._super(attributes);
    },

    getVertices: function(){

    	var w2 = this.getWidth()/2;
    	var h2 = this.getHeight()/2;
    	var center = this.getCenter();
        var sides = 36;

        var vertices   = new draw2d.util.ArrayList();
        for (var i = 0; i < sides; i++){
            var radian = 2 * Math.PI * i / sides;
            var x = Math.cos( radian )*w2+center.x;
            var y = Math.sin( radian )*h2+center.y;
            vertices.add(new draw2d.geo.Point(x,y) );
        }
        return vertices;	
    },
    
    getPersistentAttributes : function()
    {   
        var memento = this._super();
        
        memento.blur = this.blur;
        memento.filters = [];
        this.filters.each($.proxy(function(i,e){
            var filterMemento = e.getPersistentAttributes(this);
            memento.filters.push(filterMemento);
        },this));
 
        return memento;
    },
    
    setPersistentAttributes : function( memento)
    {
        this._super(memento);
        
        if(typeof memento.blur !=="undefined")
            this.setBlur(memento.blur);
        
        if(typeof memento.filters !=="undefined"){
            this.filters = new draw2d.util.ArrayList();
            $.each(memento.filters, $.proxy(function(i,e){
                var filter = eval("new "+e.name+"()");
                filter.setPersistentAttributes(this, e);
                this.filters.add(filter);
            },this));
        }
    }
});

shape_designer.storage.BackendStorage = Class.extend({

    /**
     * @constructor
     * 
     */
    init:function(){
        this.octo=null;
        this.repositories = null;
        this.currentRepository = null;
        this.currentPath = "";
        this.currentFileHandle = null;
    },
    

    login: function(token, callback)
    {
        this.octo = new Octokat({
            token: token
        });

        this.octo.user.fetch(function(param0, user){
            if(user){
                callback(true);
            }
            else {
                callback(false);
            }
        });
    }
});

shape_designer.FigureWriter = draw2d.io.Writer.extend({
    
    init:function(){
        this._super();
    },
   
    /**
     * @method
     * Export the content to the implemented data format. Inherit class implements
     * content specific writer.
     * <br>
     * <br>
     * 
     * Method signature has been changed from version 2.10.1 to version 3.0.0.<br>
     * The parameter <b>resultCallback</b> is required and new. The method calls
     * the callback instead of return the result.
     * 
     * @param {draw2d.Canvas} canvas
     * @parma {String} className
     * @param {Function} resultCallback the method to call on success. The first argument is the result object, the second the base64 representation of the file content
     */
    marshal: function(canvas, className, resultCallback){
       
        var figures = canvas.getExtFigures();
        var b = canvas.getBoundingBox();

     
        var x = b.x;
        var y = b.y;
        
        var ports  = [];
        var shapes = [];
        
        shapes.push({constructor: 'this.canvas.paper.path("M0,0 L'+(b.w)+',0 L'+(b.w)+','+(b.h)+' L0,'+(b.h)+ '")',
                     attr       : '{"stroke":"none","stroke-width":0,"fill":"none"}',
                     name       : "BoundingBox"
                    });
        
        figures.each(function(i,figure){
            var attr = {};
            figure.svgPathString=null;
            figure.translate(-x,-y);
            // paint the element and fill the "attr" object with the current
            // settings
            figure.repaint(attr);
            delete attr.path;
            delete attr.x;
            delete attr.y;
            if((figure instanceof shape_designer.figure.ExtPolygon)){
                shapes.push({
                    constructor:"this.canvas.paper.path('"+figure.svgPathString+"')", 
                    attr:JSON.stringify(attr) ,
                    extra:figure.getBlur()===0?"": "shape.blur("+figure.getBlur()+");\n",
                    name: figure.getUserData().name
                    });
            } else if((figure instanceof shape_designer.figure.PolyCircle)){
                shapes.push({
                    constructor:"this.canvas.paper.ellipse()", 
                    attr:JSON.stringify(attr) ,
                    extra:figure.getBlur()===0?"": "shape.blur("+figure.getBlur()+");\n",
                    name: figure.getUserData().name
                    });
            }else if((figure instanceof shape_designer.figure.ExtLine)){
                // drop shadow
                shapes.push({
                    constructor:"this.canvas.paper.path('"+figure.svgPathString+"')", 
                    attr:JSON.stringify($.extend({},attr,{"stroke-width": attr["stroke-width"]+figure.getOutlineStroke(), "stroke": figure.getOutlineColor().hash()})),
                    extra:figure.getBlur()===0?"": "shape.blur("+figure.getBlur()+");\n",
                    name: figure.getUserData().name+"_shadow"
                    });
                
                // the line itself
                shapes.push({
                    constructor:"this.canvas.paper.path('"+figure.svgPathString+"')", 
                    attr:JSON.stringify(attr) ,
                    extra:figure.getBlur()===0?"": "shape.blur("+figure.getBlur()+");\n",
                    name: figure.getUserData().name
                    });
            }else if(figure instanceof shape_designer.figure.ExtLabel){
                attr = figure.svgNodes[0].attr();
                attr.x = attr.x+figure.getAbsoluteX();
                attr.y = attr.y+figure.getAbsoluteY();
                delete attr.transform;
                shapes.push({
                    constructor:"this.canvas.paper.text(0,0,'"+figure.getText()+"')", 
                    attr:JSON.stringify(attr) ,
                    extra :"",
                    name: figure.getUserData().name
                    });
            }else if(figure instanceof shape_designer.figure.ExtPort){
                ports.push({
                    type:figure.getInputType().toLowerCase(), 
                    direction:figure.getConnectionDirection(), 
                    x    : 100/b.w*figure.getCenter().x,
                    y    : 100/b.h*figure.getCenter().y,
                    color: figure.getBackgroundColor().hash(),
                    name : figure.getUserData().name
                    });
            }
            figure.translate(x,y);
        });
        
        var template =
         '// Generated Code for the Draw2D touch HTML5 lib          \n'+       
         '//                                                        \n'+       
         '// http://www.draw2d.org                                  \n'+       
         '//                                                        \n'+       
         '// '+new Date()+'                                         \n'+       
         '//                                                        \n'+       
         '// Go to the Designer http://www.draw2d.org               \n'+
         '// to design your own shape or download user generated    \n'+       
         '//                                                        \n'+
         'var {{{className}}} = draw2d.SetFigure.extend({           \n'+
         '                                                          \n'+       
         '       NAME: "{{{className}}}",                           \n'+
         '                                                          \n'+       
         '       init:function(attr, setter, getter)                \n'+
         '       {                                                  \n'+
         '         this._super( $.extend({width:{{width}},height:{{height}}},attr), setter, getter);\n'+
         '         var port;                                        \n'+
         '         {{#ports}}                                       \n'+
         '         // {{{name}}}                                    \n'+
         '         port = this.createPort("{{type}}", new draw2d.layout.locator.XYRelPortLocator({{x}}, {{y}})); \n'+       
         '         port.setConnectionDirection({{direction}});      \n'+       
         '         port.setBackgroundColor("{{color}}");            \n'+       
         '         {{/ports}}                                       \n'+
         '       },                                                 \n'+
         '                                                          \n'+       
         '       createShapeElement : function()                    \n'+       
         '       {                                                  \n'+       
         '          var shape = this._super();                      \n'+       
         '          this.originalWidth = {{width}};                 \n'+       
         '          this.originalHeight= {{height}};                \n'+       
         '          return shape;                                   \n'+       
         '       },                                                 \n'+       
         '                                                          \n'+       
         '       createSet: function(){                             \n'+
         '            var set= this.canvas.paper.set();             \n'+
         '                                                          \n'+
         '            {{#figures}}                                  \n'+
         '            // {{{name}}}                                 \n'+
         '            shape = {{{constructor}}};                    \n'+
         '            shape.attr({{{attr}}});                       \n'+
         '            set.push(shape);                              \n'+
         '            {{{extra}}}                                   \n'+       
         '            {{/figures}}                                  \n'+
         '            return set;                                   \n'+
         '       },                                                 \n'+
         '                                                          \n'+       
         '       applyAlpha: function(){                            \n'+
         '       }                                                  \n'+
       '});                                                         \n'+
         '                                                          \n';
        
        
        var compiled = Hogan.compile(template);
        var output = compiled.render({
            className: className,
            figures: shapes,
            ports: ports,
            width: b.w,
            height: b.h
        });
        
        resultCallback(output,  draw2d.util.Base64.encode(output));
    }
});
shape_designer.policy.AbstractToolPolicy = draw2d.policy.canvas.SelectionPolicy.extend({
	
	init:function(){
	    this._super();
	},
	
   
    setToolHeader: function(heading, icon ){
        $('#currentTool_image').fadeOut(200, function() {
            $("#currentTool_image").attr({"src": "./assets/images/tools/"+icon});
            $('#currentTool_image').fadeIn(200);
        });
        $('#currentTool_heading').fadeOut(200, function() {
            $("#currentTool_heading").html(heading);
            $('#currentTool_heading').fadeIn(200);
        });
    },

    setToolText: function( message ){
        $('#currentTool_message').fadeOut(200, function() {
            $("#currentTool_message").html(message);
            $('#currentTool_message').fadeIn(200);
        });
    }
});





/* jshint evil: true */
shape_designer.policy.AbstractGeoToolPolicy = shape_designer.policy.AbstractToolPolicy.extend({
	
	init:function(){
	    this._super();
	    this.firstFigure = null;
	    this.operation =null;
	},
	
    
    onInstall: function(canvas){
        this.setToolHeader("");
        this.setToolMessage("Select first figure..");
    },
    
    select: function(canvas, figure){
        console.log(figure);
        if(canvas.getSelection().getAll().contains(figure)){
            return; // nothing to to
        }
        
        // check if the element an valid polygon. otherwise an boolean operation
        // isn't possible
        if(!(figure instanceof shape_designer.figure.ExtPolygon)){
            return;
        }
        
        if(canvas.getSelection().getPrimary()!==null){
            this.unselect(canvas, canvas.getSelection().getPrimary());
        }
      
        if(figure !==null) {
            figure.select(true); // primary selection
        }
        
        canvas.getSelection().setPrimary(figure);

        // inform all selection listeners about the new selection.
        //
        canvas.fireEvent("select",{figure:figure});
    },
    
    
    execute: function(canvas, firstFigure, figure){
        if(firstFigure instanceof draw2d.util.ArrayList){
            if(firstFigure.getSize()<2){
                return; // silently
            }
            figure = firstFigure.get(1);
            firstFigure = firstFigure.get(0);
        }
        this.executeGeometryOperation(canvas, firstFigure, figure, this.operation);
    },
    
    executeGeometryOperation: function(canvas, figure1, figure2, operationFunc){
        var p1 = this.getGeometry(figure1);
        var p2 = this.getGeometry(figure2);
        var union = eval("p1."+operationFunc+"(p2)");
        var geo = new jsts.io.GeoJSONWriter().write(union);
        var memento = figure1.getPersistentAttributes();
        var cmd =new draw2d.command.CommandCollection();
        cmd.add(new draw2d.command.CommandDelete(figure1));
        cmd.add(new draw2d.command.CommandDelete(figure2));
        $.each(geo.coordinates, $.proxy(function(i,poly){
            var figure = new shape_designer.figure.ExtPolygon();
            figure.setPersistentAttributes(memento);
            figure.vertices   = new draw2d.util.ArrayList();
            $.each(poly, function(i,vertex){
                figure.addVertex(vertex[0],vertex[1]);
            });
            var command = new draw2d.command.CommandAdd(canvas, figure, figure.getX(), figure.getY());
            cmd.add(command);
        },this));
        canvas.getCommandStack().execute(cmd);

    },
    
    getGeometry: function(figure){
        var reader = new jsts.io.WKTReader();  
        var v= figure.getVertices().clone().asArray();
        v.push(v[0]);
        return reader.read("POLYGON(("+$.map(v, function(e){return e.x+" "+e.y;}).join(", ")+"))");
    }
   
});






shape_designer.policy.GeoUnionToolPolicy = shape_designer.policy.AbstractGeoToolPolicy.extend({
	
	init:function(){
	    this._super();
	    this.operation = "union";
	},
	
    
    onInstall: function(canvas){
        this.setToolHeader("Add Polygon", "SURFACE_BOOL_ADD_064.png");
    	this.setToolText( "Select polygon to add to");
    },
    
    
    /**
     * @method
     * 
     * @param {draw2d.Canvas} canvas
     * @param {Number} x the x-coordinate of the mouse down event
     * @param {Number} y the y-coordinate of the mouse down event
     * @param {Boolean} shiftKey true if the shift key has been pressed during this event
     * @param {Boolean} ctrlKey true if the ctrl key has been pressed during the event
     */
    onMouseDown:function(canvas, x, y, shiftKey, ctrlKey){
 
        var figure = canvas.getBestFigure(x, y);

        // check if the user click on a child shape. DragDrop and movement must redirect
        // to the parent
        // Exception: Port's
        while((figure!==null && figure.getParent()!==null) && !(figure instanceof draw2d.Port)){
            figure = figure.getParent();
        }

        if (figure !== canvas.getSelection().getPrimary() && figure !== null && figure.isSelectable() === true) {
            if(this.firstFigure===null){
                this.firstFigure = figure;
                this.select(canvas,figure);
            	this.setToolText( "Select polygon to add");
            }
            else{
                this.execute(canvas, this.firstFigure, figure);
                this.firstFigure = null;
            	this.setToolText("Select polygon to add to");
            }
        }
    }    
    
});






shape_designer.policy.GeoDifferenceToolPolicy = shape_designer.policy.AbstractGeoToolPolicy.extend({
	
	init:function(){
	    this._super();
	    this.operation ="difference";
	},
	
    
    onInstall: function(canvas){
        this.setToolHeader("Subtract Polygon", "SURFACE_BOOL_SUBTRACT_064.png");
    	this.setToolText( "Select polygon to subtract from");
    },
    
    
    /**
     * @method
     * 
     * @param {draw2d.Canvas} canvas
     * @param {Number} x the x-coordinate of the mouse down event
     * @param {Number} y the y-coordinate of the mouse down event
     * @param {Boolean} shiftKey true if the shift key has been pressed during this event
     * @param {Boolean} ctrlKey true if the ctrl key has been pressed during the event
     */
    onMouseDown:function(canvas, x, y, shiftKey, ctrlKey){
        var figure = canvas.getBestFigure(x, y);

        // check if the user click on a child shape. DragDrop and movement must redirect
        // to the parent
        // Exception: Port's
        while((figure!==null && figure.getParent()!==null) && !(figure instanceof draw2d.Port)){
            figure = figure.getParent();
        }

        if (figure !== canvas.getSelection().getPrimary() && figure !== null && figure.isSelectable() === true) {
            if(this.firstFigure===null){
                this.firstFigure = figure;
                this.select(canvas,figure);
            	this.setToolText("Select polygon to subtract");
            }
            else{
                this.execute(canvas, this.firstFigure, figure);
                this.firstFigure = null;
            	this.setToolText("Select polygon to subtract from");
            }
        }
    }

});






shape_designer.policy.GeoIntersectionToolPolicy = shape_designer.policy.AbstractGeoToolPolicy.extend({
	
	init:function(){
	    this._super();
	    this.operation="intersection";
	},
	
    
    onInstall: function(canvas){
        this.setToolHeader("Intersect Polygon", "SURFACE_BOOL_INTERSECT_064.png");
    	this.setToolText( "Select polygon to intersect with");
    },
    
    
    /**
     * @method
     * 
     * @param {draw2d.Canvas} canvas
     * @param {Number} x the x-coordinate of the mouse down event
     * @param {Number} y the y-coordinate of the mouse down event
     * @param {Boolean} shiftKey true if the shift key has been pressed during this event
     * @param {Boolean} ctrlKey true if the ctrl key has been pressed during the event
     */
    onMouseDown:function(canvas, x, y, shiftKey, ctrlKey){
 
        var figure = canvas.getBestFigure(x, y);

        // check if the user click on a child shape. DragDrop and movement must redirect
        // to the parent
        // Exception: Port's
        while((figure!==null && figure.getParent()!==null) && !(figure instanceof draw2d.Port)){
            figure = figure.getParent();
        }

        if (figure !== canvas.getSelection().getPrimary() && figure !== null && figure.isSelectable() === true) {
            if(this.firstFigure===null){
                this.firstFigure = figure;
                this.select(canvas,figure);
            	this.setToolText( "Select polygon to intersect");
            }
            else{
                this.execute(canvas, this.firstFigure, figure);
                this.firstFigure = null;
            	this.setToolText( "Select polygon to intersect with");
            }
        }
    }
    
    
});






shape_designer.policy.SelectionToolPolicy = draw2d.policy.canvas.BoundingboxSelectionPolicy.extend({
	
	init:function(){
	    this._super();
	},
	
    onInstall: function(canvas){
        this.setToolHeader("Selection", "SELECT_TOOL_064.png");
    	this.setToolText("Click on shape to select<br>Double click to edit");
    },


    setToolHeader: function(heading, icon ){
        $("#currentTool_image").attr({"src": "./assets/images/tools/"+icon});
        $("#currentTool_heading").text(heading);
    },

    setToolText: function( message ){
        $("#currentTool_message").html(message);
	}
});


shape_designer.policy.RectangleToolPolicy = shape_designer.policy.AbstractToolPolicy.extend({
	
	init:function(){
	    this._super();
	    
	    this.topLeftPoint = null;
        this.boundingBoxFigure1 = null;
        this.boundingBoxFigure2 = null;
	},

    
    onInstall: function(canvas){
        this.setToolHeader("Diagonal Polygon", "POLYGON_DIAGONALS_064.png");
        this.setToolText("Select first corner of rectangle");
        canvas.setCursor("cursor_rectangle.png");
    },
    
    onUninstall: function(canvas){
        if(this.boundingBoxFigure1 !==null){
            this.boundingBoxFigure1.setCanvas(null);
            this.boundingBoxFigure1 = null;
            this.boundingBoxFigure2.setCanvas(null);
            this.boundingBoxFigure2 = null;
        }
        canvas.setCursor(null);
    },
   
    /**
     * @method
     * 
     * @param {draw2d.Canvas} canvas
     * @param {Number} x the x-coordinate of the mouse down event
     * @param {Number} y the y-coordinate of the mouse down event
     * @param {Boolean} shiftKey true if the shift key has been pressed during this event
     * @param {Boolean} ctrlKey true if the ctrl key has been pressed during the event
     */
    onMouseDown:function(canvas, x, y, shiftKey, ctrlKey){

    },
    
    /**
     * @method
     * 
     * @param {draw2d.Canvas} canvas
     * @param {Number} x the x-coordinate of the mouse event
     * @param {Number} y the y-coordinate of the mouse event
     * @template
     */
    onMouseMove:function(canvas, x, y){
       
        if (this.boundingBoxFigure1!==null) {
            var dx = this.topLeftPoint.x -x;
            var dy = this.topLeftPoint.y -y;
            this.boundingBoxFigure1.setDimension(Math.abs(dx),Math.abs(dy));
            this.boundingBoxFigure1.setPosition(x + Math.min(0,dx), y + Math.min(0,dy));
            this.boundingBoxFigure2.setDimension(Math.abs(dx),Math.abs(dy));
            this.boundingBoxFigure2.setPosition(x + Math.min(0,dx), y + Math.min(0,dy));
        }
    },
    
    
    /**
     * @method
     * 
     * @param {draw2d.Canvas} canvas
     * @param {Number} dx The x diff between start of dragging and this event
     * @param {Number} dy The y diff between start of dragging and this event
     * @param {Number} dx2 The x diff since the last call of this dragging operation
     * @param {Number} dy2 The y diff since the last call of this dragging operation
     * @template
     */
    onMouseDrag:function(canvas, dx, dy, dx2, dy2){
    },
    
    /**
     * @method
     * 
     * @param {draw2d.Canvas} canvas
     * @param {Number} x the x-coordinate of the mouse down event
     * @param {Number} y the y-coordinate of the mouse down event
     * @template
     */
    onMouseUp: function(canvas, x, y){
        if(this.topLeftPoint===null){
            this.topLeftPoint = new draw2d.geo.Point(x,y);
            this.setToolText("Select second corner of rectangle");

            this.boundingBoxFigure1 = new draw2d.shape.basic.Rectangle({width:1,height:1});
            this.boundingBoxFigure1.setPosition(x,y);
            this.boundingBoxFigure1.setCanvas(canvas);
            this.boundingBoxFigure1.setBackgroundColor("#333333");
            this.boundingBoxFigure1.setAlpha(0.1);
            
            this.boundingBoxFigure2 = new draw2d.shape.basic.Rectangle({width:1,height:1});
            this.boundingBoxFigure2.setPosition(x,y);
            this.boundingBoxFigure2.setCanvas(canvas);
//            this.boundingBoxFigure2.setDashArray("- ");
            this.boundingBoxFigure2.setStroke(1);
            this.boundingBoxFigure2.setColor(new draw2d.util.Color("#333333"));
            this.boundingBoxFigure2.setBackgroundColor(null);
        }
        else{
            var bottomRight = new draw2d.geo.Point(x,y);
            var rect =new shape_designer.figure.PolyRect(this.topLeftPoint, bottomRight);
            var command = new draw2d.command.CommandAdd(canvas, rect, rect.getX(), rect.getY());
            canvas.getCommandStack().execute(command);
            canvas.setCurrentSelection(rect);
            this.topLeftPoint = null;
            this.setToolText("Select first corner of rectangle");

            this.boundingBoxFigure1.setCanvas(null);
            this.boundingBoxFigure1 = null;
            this.boundingBoxFigure2.setCanvas(null);
            this.boundingBoxFigure2 = null;
}
    }
});






shape_designer.policy.CircleToolPolicy = shape_designer.policy.AbstractToolPolicy.extend({
	
    TITLE: "Circle",
    MESSAGE_STEP1 : "Select center of the circle",
    MESSAGE_STEP2 : "Select outer bound",
    
	init:function(){
	    this._super();
	    
	    this.center = null;
        this.boundingBoxFigure1 = null;
        this.boundingBoxFigure2 = null;
	},

    
    onInstall: function(canvas){
        this.setToolHeader(this.TITLE, "CIRCLE_1_064.png");
        this.setToolText(this.MESSAGE_STEP1);
        canvas.setCursor("cursor_circle.png");
    },
    
    onUninstall: function(canvas){
        if(this.boundingBoxFigure1 !==null){
            this.boundingBoxFigure1.setCanvas(null);
            this.boundingBoxFigure1 = null;
            this.boundingBoxFigure2.setCanvas(null);
            this.boundingBoxFigure2 = null;
        }
        canvas.setCursor(null);
    },
    

    /**
     * @method
     * 
     * @param {draw2d.Canvas} canvas
     * @param {Number} x the x-coordinate of the mouse down event
     * @param {Number} y the y-coordinate of the mouse down event
     * @param {Boolean} shiftKey true if the shift key has been pressed during this event
     * @param {Boolean} ctrlKey true if the ctrl key has been pressed during the event
     */
    onMouseDown:function(canvas, x, y, shiftKey, ctrlKey){

    },
    
    /**
     * @method
     * 
     * @param {draw2d.Canvas} canvas
     * @param {Number} x the x-coordinate of the mouse event
     * @param {Number} y the y-coordinate of the mouse event
     * @template
     */
    onMouseMove:function(canvas, x, y){
       
        if (this.boundingBoxFigure1!==null) {
            var dx = Math.abs(this.center.x -x);
            this.boundingBoxFigure1.setRadius(dx);
            this.boundingBoxFigure2.setRadius(dx);
        }
    },
    
    
    /**
     * @method
     * 
     * @param {draw2d.Canvas} canvas
     * @param {Number} dx The x diff between start of dragging and this event
     * @param {Number} dy The y diff between start of dragging and this event
     * @param {Number} dx2 The x diff since the last call of this dragging operation
     * @param {Number} dy2 The y diff since the last call of this dragging operation
     * @template
     */
    onMouseDrag:function(canvas, dx, dy, dx2, dy2){
    },
    
    /**
     * @method
     * 
     * @param {draw2d.Canvas} canvas
     * @param {Number} x the x-coordinate of the mouse down event
     * @param {Number} y the y-coordinate of the mouse down event
     * @template
     */
    onMouseUp: function(canvas, x, y){
        if(this.center===null){
            this.center = new draw2d.geo.Point(x,y);
            this.setToolText(this.MESSAGE_STEP2);

            this.boundingBoxFigure1 = new draw2d.shape.basic.Circle({radius:1});
            this.boundingBoxFigure1.setCenter(x,y);
            this.boundingBoxFigure1.setCanvas(canvas);
            this.boundingBoxFigure1.setBackgroundColor("#333333");
            this.boundingBoxFigure1.setAlpha(0.1);
            
            this.boundingBoxFigure2 = new draw2d.shape.basic.Circle({radius:1});
            this.boundingBoxFigure2.setCenter(x,y);
            this.boundingBoxFigure2.setCanvas(canvas);
            this.boundingBoxFigure2.setStroke(1);
            this.boundingBoxFigure2.setColor(new draw2d.util.Color("#333333"));
            this.boundingBoxFigure2.setBackgroundColor(null);
        }
        else{
            var dx = Math.abs(this.center.x -x);
            var rect =new shape_designer.figure.PolyCircle(this.center,dx);
            var command = new draw2d.command.CommandAdd(canvas, rect, rect.getX(), rect.getY());
            canvas.getCommandStack().execute(command);
            canvas.setCurrentSelection(rect);
            this.center = null;
            this.setToolText(this.MESSAGE_STEP1);

            this.boundingBoxFigure1.setCanvas(null);
            this.boundingBoxFigure1 = null;
            this.boundingBoxFigure2.setCanvas(null);
            this.boundingBoxFigure2 = null;
        }
    }
});






shape_designer.policy.TextToolPolicy = shape_designer.policy.AbstractToolPolicy.extend({
    
    TITLE: "Text",
    MESSAGE_STEP1 : "Select location for text",
    MESSAGE_STEP2 : "Enter Text",
    
    init:function(){
        this._super();
        
        this.topLeft = null;
        this.newFigure = null;
    },

    
    onInstall: function(canvas){
        this.setToolHeader(this.TITLE, "TEXT_064.png");
        this.setToolText(this.MESSAGE_STEP1);
        canvas.setCursor("cursor_text.png");
    },
    
    onUninstall: function(canvas){
        canvas.setCursor(null);
    },
    
    
     /**
     * @method
     * 
     * @param {draw2d.Canvas} canvas
     * @param {Number} x the x-coordinate of the mouse down event
     * @param {Number} y the y-coordinate of the mouse down event
     * @param {Boolean} shiftKey true if the shift key has been pressed during this event
     * @param {Boolean} ctrlKey true if the ctrl key has been pressed during the event
     */
    onMouseDown:function(canvas, x, y, shiftKey, ctrlKey){

    },
    
    /**
     * @method
     * 
     * @param {draw2d.Canvas} canvas
     * @param {Number} x the x-coordinate of the mouse event
     * @param {Number} y the y-coordinate of the mouse event
     * @template
     */
    onMouseMove:function(canvas, x, y){
    },
    
    
    /**
     * @method
     * 
     * @param {draw2d.Canvas} canvas
     * @param {Number} dx The x diff between start of dragging and this event
     * @param {Number} dy The y diff between start of dragging and this event
     * @param {Number} dx2 The x diff since the last call of this dragging operation
     * @param {Number} dy2 The y diff since the last call of this dragging operation
     * @template
     */
    onMouseDrag:function(canvas, dx, dy, dx2, dy2){
    },
    
    /**
     * @method
     * 
     * @param {draw2d.Canvas} canvas
     * @param {Number} x the x-coordinate of the mouse down event
     * @param {Number} y the y-coordinate of the mouse down event
     * @template
     */
    onMouseUp: function(canvas, x, y){
        if(this.topLeft===null){
            this.topLeft = new draw2d.geo.Point(x,y);
            this.setToolText(this.MESSAGE_STEP2);

            this.newFigure = new shape_designer.figure.ExtLabel();
            this.newFigure.setText("Text");
            this.newFigure.setStroke(0);
            this.newFigure.setPadding(5);
            this.newFigure.setFontSize(16);
           
            var command = new draw2d.command.CommandAdd(canvas, this.newFigure, parseInt(x),parseInt(y));
            canvas.getCommandStack().execute(command);
            canvas.setCurrentSelection(this.newFigure);
            
            // start inplace editing
            //
            setTimeout($.proxy(function(){this.newFigure.onDoubleClick();},this),100);
        }
        else{
            this.topLeft=null;
        }
    }
});






shape_designer.policy.PortToolPolicy = shape_designer.policy.SelectionToolPolicy.extend({
    
    TITLE: "Port",
    MESSAGE_STEP1 : "Select location to add port.<br>Click on port to move.",
    
    init:function(){
        this._super();
        
    },

    
    onInstall: function(canvas){
        this.setToolHeader(this.TITLE, "PORT_064.png");
        this.setToolText(this.MESSAGE_STEP1);
        canvas.setCursor("cursor_port.png");
    },
    
    onUninstall: function(canvas){
        canvas.setCursor(null);
    },
    
    
    select: function(canvas, figure){
      // check if the element an valid polygon. otherwise an boolean operation
        // isn't possible
        if(!(figure instanceof shape_designer.figure.ExtPort)){
            return;
        }

        this._super(canvas, figure);
    },
    
    onMouseDown:function(canvas, x, y, shiftKey, ctrlKey){
        var figure = canvas.getBestFigure(x, y);
        
        if(figure===null || figure instanceof shape_designer.figure.ExtPort){
            this._super(canvas,x,y,shiftKey, ctrlKey);
        }
    },
    
    /**
     * @method
     * 
     * @param {draw2d.Canvas} canvas
     * @param {Number} x the x-coordinate of the mouse down event
     * @param {Number} y the y-coordinate of the mouse down event
     * @template
     */
    onMouseUp: function(canvas, x, y){
        if(this.mouseDownElement===null || !(this.mouseDownElement instanceof shape_designer.figure.ExtPort)){
            var command = new draw2d.command.CommandAdd(canvas, new shape_designer.figure.ExtPort(), x, y);
            canvas.getCommandStack().execute(command);
            canvas.setCurrentSelection(command.figure);
        }
        else{
            this._super(canvas,x,y);
        }
    }   
});






shape_designer.policy.LineToolPolicy = shape_designer.policy.AbstractToolPolicy.extend({
	
    MESSAGE_STEP1 : "Select start point of the line.",
    MESSAGE_STEP2 : "Click to add additional vertex.<br>Double click to finish line.",

	init:function(){
	    this._super();
	    
        this.lineFigure = null;
        this.canvas = null;
	},

    
    onInstall: function(canvas){
        this.setToolHeader("Line", "LINE_064.png");
        this.setToolText(this.MESSAGE_STEP1);
        this.canvas = canvas;
        canvas.setCursor("cursor_line.png");
    },
    
    onUninstall: function(canvas){
        if(this.lineFigure !==null){
            if(this.lineFigure.getVertices().getSize()<2){
                canvas.remove(this.lineFigure);
                this.lineFigure = null;
            }
            else{
                // stay in the canvas and finalize the stroke if a doubleClick
                var last = this.lineFigure.vertices.last();
                this.onDoubleClick(this.lineFigure, last.x, last.y, false, false);
            }
        }
        this.canvas = null;
        canvas.setCursor(null);
    },
   
    /**
     * @method
     * 
     * @param {draw2d.Canvas} canvas
     * @param {Number} x the x-coordinate of the mouse down event
     * @param {Number} y the y-coordinate of the mouse down event
     * @param {Boolean} shiftKey true if the shift key has been pressed during this event
     * @param {Boolean} ctrlKey true if the ctrl key has been pressed during the event
     */
    onMouseDown:function(canvas, x, y, shiftKey, ctrlKey){

    },
    
    /**
     * @method
     * 
     * @param {draw2d.Canvas} canvas
     * @param {Number} x the x-coordinate of the mouse event
     * @param {Number} y the y-coordinate of the mouse event
     * @template
     */
    onMouseMove:function(canvas, x, y){
       
        if (this.lineFigure!==null) {
            this.lineFigure.setEndPoint(x,y);
        }
    },
    
    
    /**
     * @method
     * 
     * @param {draw2d.Canvas} canvas
     * @param {Number} dx The x diff between start of dragging and this event
     * @param {Number} dy The y diff between start of dragging and this event
     * @param {Number} dx2 The x diff since the last call of this dragging operation
     * @param {Number} dy2 The y diff since the last call of this dragging operation
     * @template
     */
    onMouseDrag:function(canvas, dx, dy, dx2, dy2){
    },
    

    
    onDoubleClick: function(figure, x, y, shiftKey, ctrlKey){
        this.onClick(figure, x, y, shiftKey, ctrlKey);

        // Remove duplicate points at the end of the polyLine. This happens during the DoubleClick.
        // Reason: before the double click is fired the two "single click" comes before. In this case we
        // added three vertex for a doubleClick event
        //
        
        // don't use the shortcut and assign the this.lineFigure.vertices to a local var.
        // the vertices are recreated in the "calculatePath" mnethod of the polygon and
        // the reference is in this case invalid...design flaw!
        //
        var last = this.lineFigure.vertices.last();
        var beforeLast = this.lineFigure.vertices.get(this.lineFigure.vertices.getSize()-2);
        while(last.equals(beforeLast)){
            this.lineFigure.removeVertexAt(this.lineFigure.vertices.getSize()-2);
            beforeLast = this.lineFigure.vertices.get(this.lineFigure.vertices.getSize()-2);
        }
               
        this.lineFigure = null;
    },
    
    
    /**
     * @method
     * 
     * @param {draw2d.Canvas} canvas
     * @param {Number} x the x-coordinate of the mouse down event
     * @param {Number} y the y-coordinate of the mouse down event
     * @param {Boolean} shiftKey true if the shift key has been pressed during this event
     * @param {Boolean} ctrlKey true if the ctrl key has been pressed during the event
     * @template
     */
    onClick: function(figure, x, y, shiftKey, ctrlKey){
        if (this.lineFigure === null) {
            this.setToolText(this.MESSAGE_STEP2);

            this.lineFigure = new shape_designer.figure.ExtLine();
            this.lineFigure.setStartPoint(x, y);
            this.lineFigure.setEndPoint(x, y);
            var command = new draw2d.command.CommandAdd(this.canvas, this.lineFigure, x, y);
            this.canvas.getCommandStack().execute(command);
            canvas.setCurrentSelection(this.lineFigure);
        }
        else {
            this.lineFigure.addVertex(x, y);
        }
    }
});




