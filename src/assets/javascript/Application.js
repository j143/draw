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
        draw2d.Configuration.factory.createResizeHandle=function(forShape, type){
            return new draw2d.ResizeHandle(forShape, type).attr({"bgColor":"#26b4a8"});
        };
      
     
        this.currentFile = null;
        
        this.storage = new shape_designer.storage.BackendStorage();
        this.view    = new shape_designer.View(this, "canvas");
        this.toolbar = new shape_designer.Toolbar(this, "toolbar",  this.view );
        this.layer   = new shape_designer.Layer(this, "layer_elements", this.view );
        this.filter  = new shape_designer.FilterPane(this, "filter_actions", this.view );
        this.view.installEditPolicy(new shape_designer.policy.SelectionToolPolicy());
             
           // special drag drop handling for the TideSDK environment
           if(typeof Ti !=="undefined"){
               $("#toolbar").mousedown ( function ( event )
               {
                   event.preventDefault();
                   if(!Ti.UI.getMainWindow().isMaximized())
                   {
                       var diffX = event.pageX;
                       var diffY = event.pageY;
    
                       $(document).mousemove ( function ( event )
                       {
                           event.preventDefault();
                           if (event.screenY - diffY < screen.height-100)
                           Ti.UI.getMainWindow().moveTo(event.screenX - diffX, event.screenY - diffY);
                       });
                   }
               });
    
               $(document).mouseup ( function ( event )
               {
                   event.preventDefault();
                   $(document).unbind('mousemove');
               });
    
               $("#toolbar").dblclick ( function ( event )
               {
                   event.preventDefault();
                   if (!Ti.UI.getMainWindow().isMaximized())
                       Ti.UI.getMainWindow().maximize();
                   else
                       Ti.UI.getMainWindow().unmaximize();
               });
           }
           about.hide();
           
           var param = this.getParam("figureId");
           if(param!==null){
               this.storage.load(param, 
                   function(fileData){
                   console.log(fileData.json);
                       this.view.clear();
                       var reader = new draw2d.io.json.Reader();
                       reader.unmarshal(this.view, fileData.json);
                       this.currentFile = fileData;
                       document.title = fileData.title;
                       this.view.getCommandStack().markSaveLocation();
                   }.bind(this), 
                   function(){
                       
                   }.bind(this)
               );
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

    login:function(githubToken){
        this.storage.login(githubToken, $.proxy(function(success){
            this.toolbar.onLogginStatusChanged(success);
        },this));
    },
 	
 	isLoggedIn: function( callback){
 	   if(this.storage.requiresLogin()){
 	       this.storage.isLoggedIn(function(result){
 	           callback(result);
 	       });
 	   }
 	   else{
 	       callback(true);
 	   }
 	},
 	
	fileOpen: function( successCallback, errorCallback, abortCallback){
        this.storage.pickFileAndLoad(
          // file pattern
          "draw2d",
          
          // success callback
          //
          $.proxy(function(file, fileData){
            try{
                this.view.clear();
                var reader = new draw2d.io.json.Reader();
                reader.unmarshal(this.view, fileData);
                this.currentFile = file;
                document.title = file.title;
                this.view.getCommandStack().markSaveLocation();
                successCallback();
            }
            catch(e){
                this.view.reset();
                errorCallback();
            }
          },this),
          
          // error callback
          //
          errorCallback,
          
          // abort callback
          //
          abortCallback);
	},
	
	fileSave: function(successCallback, errorCallback, abortCallback){
		var _this = this;
		this.storage.save(this.view, this.currentFile, 
				function(fileHandle){
					_this.currentFile = fileHandle;
					successCallback();
				}, 
				errorCallback, 
				abortCallback
		);
	}
});
