shape_designer.storage.BackendStorage = draw2d.storage.FileStorage.extend({
    NAME : "shape_designer.storage.BackendStorage",

    /**
     * @constructor
     * 
     */
    init:function(){
        this._super();
        
        
        this.baseUrl =  Configuration.backend[location.host];
        this.initDone = true;
        
    },
    
    requiresLogin: function(){
        return true;
    },
    
    isLoggedIn: function(callback){

        $.jsonRPC.request('isLoggedIn', {
            params: [],
            endPoint: this.baseUrl+'rpc/User.php',
            success: function(result) {
              callback(result.result);
            },
            error: function(result) {
              callback(false);
            }
          });
    },
    
    
    /**
     * @method
     * 
     * Open the file picker and load the selected file.<br>
     * 
     * Example usage:
     * 
     *      this.openButton.on("click",$.proxy(function(){
     *         this.filePicker.pickFileAndLoad("*.draw2d", $.proxy(function(file, fileData){
     *            // save the fileHandle for further save operations
     *            this.file = file;
     *          
     *            // cleanup the canvas 
     *            this.canvas.clear();
     *          
     *            // load the JSON into the canvas
     *            var reader = new draw2d.io.json.Reader();
     *            reader.unmarshal(canvas, JSON.parse(fileData));
     *        },this));
     *     },this));
     *     
     * @param {String} filenameFilter the file picker set a file name filter with the given pattern. Only files which contains the given string will be loaded    
     * @param {Function} successCallback callback method if the user select a file and the content is loaded
     * @param {Function} errorCallback method to call if any error happens
     * 
     * @since 4.0.0
     */
    pickFileAndLoad: function(filenameFilter, successCallback, errorCallback, abortCallback) {    
        $.jsonRPC.request('getAll', {
            params: [],
            endPoint: this.baseUrl+'rpc/Figure.php',
            success: function(response) {
               var files = response.result;
            
               var compiled = Hogan.compile(
                           '<div id="modal-background"></div>'+
                           '<div  class="panel panel-default" id="fileOpenDialog">'+
                           '   <div  class="panel-heading">Select File to load</div>'+
                           '   <div class="panel-body">'+
                           '      <div  class="list-group" style="height:230px; overflow:auto">'+
                           '         {{#files}}'+
                           '         <a href="#" data-title="{{{title}}}" class="list-group-item"><img width="48" src="{{{image}}}">{{{title}}}</a>'+
                           '         {{/files}}'+
                           '      </div>'+
                           '   </div>'+
                           '</div>');
               
               var output = compiled.render({
                   files: files
               });
               $("body").append($(output));

               $("#fileOpenDialog a").click(function (event) {
                   $("#modal-background, #fileOpenDialog").remove();
                   var title = $(event.currentTarget).data("title");
                   var file = files.reduce(function(old, current){ return current.title===title?current: old;});
                   successCallback(file, file.json);
               });
    
             
               $("#modal-background, #modal-close").click(function () {
                   $("#modal-background, #fileOpenDialog").remove();
                   abortCallback();
               });
            },
            error: function(result) {
                errorCallback();
            }
          });

 
    },
    
    load: function(fileId, successCallback, errorCallback){
        var _this = this;
        $.jsonRPC.request('findById', {
            params: [fileId],
            endPoint: _this.baseUrl+'rpc/Figure.php',
            success: function(response) {
                successCallback(response.result);
            },
            error: function(result) {
                errorCallback();
            }
        });
  
    },
    
    save: function(view, currentFileHandle, successCallback, errorCallback, abortCallback){
        var _this = this;
        
    	if(currentFileHandle==null){
    		currentFileHandle= {
    		    title:"Document name",
    		    tags:"Common"
    		};
    	}
        // generate the PNG file
        //
        new draw2d.io.png.Writer().marshal(view, $.proxy(function(imageDataUrl){
         	
            var compiled = Hogan.compile(
                '	<div id="fileSaveDialog" class="modal fade">'+
                '	  <div class="modal-dialog">'+
                '	    <div class="modal-content">'+
                '	      <div class="modal-header">'+
                '           <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>'+
                '	        <h4 class="modal-title">Save Document</h4>'+
                '	      </div>'+
                
                '	      <div class="modal-body" style="min-height:150; padding-left:30px; padding-right:30px">'+
                '            <div class="row" style="min-height:100px;">'+
                '                <img class="img-thumbnail col-md-4" width="96" src="{{{image}}}"></a>'+
                '                <div class="col-md-8">'+
                '                    <label for="inputName">Name</label>'+
                '                    <input type="text" class="form-control" id="inputName" placeholder="Enter name" value="{{{name}}}">'+
                '                 </div>'+
                '             </div>'+
                '             <div class="row" style="margin-top:30px">'+
                '                <label>Tag (use comma as delimiter)</label>'+
                '	          </div>'+
                '             <div class="row">'+
                '                <input id="figureTags" type="text" value="{{groups}}" data-role="tagsinput" />'+
                '	          </div>'+
                '	      </div>'+
                
                '	      <div class="modal-footer">'+
                '	        <button data-dismiss="modal" type="button" class="btn btn-default">Abort</button>'+
                '	        <button id="saveButton"  type="button" class="btn btn-primary">Save</button>'+
                '	      </div>'+
                '	    </div>'+
                '	  </div>'+
                '	</div>');
        	
            var output = compiled.render({
                image: imageDataUrl,
                name:  currentFileHandle.title,
                groups:currentFileHandle.tags
            });
            
            $("body").append($(output));
            $('#figureTags').tagsinput({
               trimValue: true
            });
    	                
            $('#saveButton').on('click', function (e) {
                
            	currentFileHandle.title = $("#inputName").val();
            	currentFileHandle.tags  = $("#figureTags").val();
            	abortCallback = function(){};
            	
                // ensure that the className is a regular JS className. May it is a potential file path
                currentFileHandle.title = currentFileHandle.title.split(/[\\/]/).pop();
                var toCamleCase = function(sentenceCase) {
                    var out = "";
                    sentenceCase.split(" ").forEach(function (el, idx) {
                        var add = el;
                        out += (idx === 0 ? add : add[0].toUpperCase() + add.slice(1));
                    });
                    return out;
                }
                currentFileHandle.title = toCamleCase(currentFileHandle.title);
    
                    // generate the json 
                    //
                    new draw2d.io.json.Writer().marshal(view,$.proxy(function(json){
                        json = JSON.stringify(json, null, 2);
                        // generate the JS file
                        //
                        new shape_designer.FigureWriter().marshal(view, currentFileHandle.title, $.proxy(function(js){ 
    
    	                    $("#fileSaveDialog").modal("hide");
    	                    $("#modal-background, #fileSaveDialog").remove();
    
    	                    $.jsonRPC.request('save', {
    	                        params: [currentFileHandle.title, json, js, imageDataUrl, currentFileHandle.tags],
    	                        endPoint: _this.baseUrl+'rpc/Figure.php',
    	                        success: function(result) {
    	                            $.bootstrapGrowl("<b>"+currentFileHandle.title +"</b> saved");
    	                            successCallback(currentFileHandle);
    	                        },
    	                        error: function(result) {
    	                        	errorCallback();
    	                        }
    	                    });
                        },this));
                    },this));
            });
            
            $('#fileSaveDialog').on('hidden.bs.modal', function (e) {
                abortCallback();
                $("#fileSaveDialog").remove();
            });
            
            $("#fileSaveDialog").modal();
        },this), view.getBoundingBox().scale(10,10));     
    }
});