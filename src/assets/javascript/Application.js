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
        var _this = this;
        this.currentFile = null;
        // attached to the very first shape
        this.documentConfiguration = {
            baseClass:"draw2d.SetFigure"
        };

        this.storage = new shape_designer.storage.BackendStorage();
        this.view    = new shape_designer.View(this, "canvas");
        this.toolbar = new shape_designer.Toolbar(this, "toolbar",  this.view );
        this.layer   = new shape_designer.Layer(this, "layer_elements", this.view );
        this.filter  = new shape_designer.FilterPane(this, "filter_actions", this.view );
        this.breadcrumb  = new shape_designer.Breadcrumb(this,"breadcrumb" );
        this.view.installEditPolicy(new shape_designer.policy.SelectionToolPolicy());

        // Get the authorization code from the url that was returned by GitHub
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

        this.breadcrumb.update(this.storage);

        $.getJSON("./assets/shapes/Basic.shape",function(document){
            _this.fileNew(document);
        });
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
 	
	fileNew: function(shapeTemplate)
    {
        this.view.clear();
        this.storage.currentFileHandle = null;
        this.documentConfiguration = {
            baseClass:"draw2d.SetFigure"
        };
        if(shapeTemplate){
            var reader = new draw2d.io.json.Reader();
            reader.unmarshal(this.view, shapeTemplate);
        }
    },

    fileOpen: function()
    {
        this.fileNew();

        new shape_designer.dialog.FileOpen(this.storage).show(

            // success callback
            $.proxy(function(fileData){
                try{
                    this.view.clear();
                    var reader = new draw2d.io.json.Reader();
                    reader.unmarshal(this.view, fileData);
                    this.getConfiguration();
                    this.view.getCommandStack().markSaveLocation();
                    this.breadcrumb.update(this.storage);
                }
                catch(e){
                    this.view.reset();
                }
            },this));
    },

	fileSave: function()
    {
        this.setConfiguration();
        if(this.storage.currentFileHandle===null) {
            new shape_designer.dialog.FileSaveAs(this.storage).show(this.view);
        }
        else{
            new shape_designer.dialog.FileSave(this.storage).show(this.view);
        }
	},


    getConfiguration: function()
    {
        var figures = this.view.getExtFigures();
        if(figures.getSize()>0){
            this.documentConfiguration = $.extend({},  this.documentConfiguration, figures.first().getUserData());
        }

        return this.documentConfiguration;
    },

    setConfiguration: function(conf )
    {
        this.documentConfiguration = $.extend({},  this.documentConfiguration, conf);
        var figures = this.view.getExtFigures();
        if(figures.getSize()>0) {
            figures.first().setUserData( this.documentConfiguration);
        }
    }
});
