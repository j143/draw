/*jshint sub:true*/

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

        this.documentConfigurationTempl = {
            baseClass:"draw2d.SetFigure",
            code :$("#shape-edit-template").text().trim()
        };

        this.localStorage = [];
        try {
            if( 'localStorage' in window && window.localStorage !== null){
                this.localStorage = localStorage;
            }
        } catch(e) {

        }

        // automatic add the configuration to the very first shape
        // in the document as userData
        //
        this.documentConfiguration = $.extend({},this.documentConfigurationTempl);

        this.storage     = new shape_designer.storage.BackendStorage();
        this.view        = new shape_designer.View(this, "canvas");
        this.toolbar     = new shape_designer.Toolbar(this, "toolbar",  this.view );
        this.layer       = new shape_designer.Layer(this, "layer_elements", this.view );
        this.filter      = new shape_designer.FilterPane(this, "filter_actions", this.view );
        this.breadcrumb  = new shape_designer.Breadcrumb(this,"breadcrumb" );

        this.view.installEditPolicy(new shape_designer.policy.SelectionToolPolicy());


        // First check if a valid token is inside the local storage
        //
        this.autoLogin();

        // check if the user has added a "file" parameter. In this case we load the shape from
        // the draw2d.shape github repository
        //
        var file = this.getParam("file");
        if(file){
            var path = conf.shapesPath+file.replace(/_/g,"/");
            var repo = conf.defaultRepo;
            _this.storage.load(repo, path,function(content){
                _this.view.clear();
                var reader = new draw2d.io.json.Reader();
                reader.unmarshal(_this.view, content);
                _this.getConfiguration();
                _this.view.getCommandStack().markSaveLocation();
                _this.view.centerDocument();
                _this.breadcrumb.update(_this.storage);

            });
        }
        else{
            _this.fileNew();
        }
    },

    login:function()
    {
        window.location.href='https://github.com/login/oauth/authorize?client_id='+conf.githubClientId+'&scope=public_repo';
    },

    autoLogin:function()
    {
        var _this = this;
        var _doIt=function() {
            var code = _this.getParam("code");
            if (code !== null) {
                $.getJSON(conf.githubAuthenticateCallback + code, function (data) {
                    _this.storage.connect(data.token, function (success) {
                        if (success) {
                            _this.localStorage["token"] = data.token;
                        }
                        else {
                            _this.localStorage.removeItem("token");
                        }
                        _this.toolbar.onLogginStatusChanged(success);
                    });
                });
            }
        };

        var token = this.localStorage["token"];
        if(token){
            _this.storage.connect(token, function(success){
                _this.toolbar.onLogginStatusChanged(success);
                if(!success){
                    _doIt();
                }
            });
        }
        // or check if we come back from the OAuth redirect
        //
        else{
            _doIt();
        }
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
        this.documentConfiguration = $.extend({},this.documentConfigurationTempl);

        if(shapeTemplate){
            var reader = new draw2d.io.json.Reader();
            reader.unmarshal(this.view, shapeTemplate);
            this.view.getCommandStack().markSaveLocation();
            this.view.centerDocument();
        }
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
                    this.getConfiguration();
                    this.view.getCommandStack().markSaveLocation();
                    this.view.centerDocument();
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


    getConfiguration: function( key)
    {
        var figures = this.view.getExtFigures();
        if(figures.getSize()>0){
            this.documentConfiguration = $.extend({},  this.documentConfiguration, figures.first().getUserData());
        }

        if(key){
            return this.documentConfiguration[key];
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
