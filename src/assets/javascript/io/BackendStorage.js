shape_designer.storage.BackendStorage = draw2d.storage.FileStorage.extend({
    NAME : "shape_designer.storage.BackendStorage",

    /**
     * @constructor
     * 
     */
    init:function(){
        this._super();


        this.octo=null;
        this.repositories = null;
        this.githubToken = null;
        this.currentRepository = null;
        this.currentPath = "";
        this.initDone = true;
        
    },
    
    requiresLogin: function(){
        return true;
    },

    login: function(token, callback){
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
    },

    isLoggedIn: function(callback){

        if (this.octo === null) {
            callback(false);
            return;
        }

        // fetch all repositories of the related user
        //
        this.octo.user.fetch(function(param0, user){
            if(user){
                callback(true);
            }
            else {
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
        if(this.currentRepository ===null) {
            this.fetchRepositories(filenameFilter, successCallback, errorCallback, abortCallback);
        }
        else{
            this.fetchPathContent(this.currentPath,filenameFilter, successCallback, errorCallback, abortCallback);
        }

        $('#githubFileSelectDialog').modal('show');
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
        
    	if(currentFileHandle===null){
    		currentFileHandle= {
    		    title:"DocumentName"
    		};
    	}
        // generate the PNG file
        //
        new draw2d.io.png.Writer().marshal(view, $.proxy(function(imageDataUrl){


            $("#githubFilePreview").attr("src", imageDataUrl);
            $("#githubFileName")
                .val(currentFileHandle.title)
                .removeClass("empty");

            $('#githubSaveFileDialog').on('shown.bs.modal', function() {
                $(this).find('input:first').focus();
            });
            $("#githubSaveFileDialog").modal("show");
            return;

            /*

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
                };
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
            */
        },this), view.getBoundingBox().scale(10,10));     
    },



    fetchRepositories: function(filenameFilter, successCallback, errorCallback, abortCallback){
        var _this = this;

        // fetch all repositories of the related user
        //
        this.octo.user.repos.fetch(function(param, repos){

            repos.sort(function(a, b)
            {
                if ( a.name.toLowerCase() < b.name.toLowerCase() )
                    return -1;
                if ( a.name.toLowerCase() > b.name.toLowerCase() )
                    return 1;
                return 0;
            });

            _this.repositories = repos;
            var compiled = Hogan.compile(
                '         {{#repos}}'+
                '         <a href="#" class="list-group-item repository withripple text-nowrap" data-type="repository" data-id="{{id}}">'+
                '         <small><span class="glyphicon mdi-content-archive"></span></small>'+
                '         {{{name}}}'+
                '         </a>'+
                '         {{/repos}}'
            );

            var output = compiled.render({
                repos: repos
            });
            $("#githubNavigation").html($(output));
            $.material.init();

            $(".repository").on("click", function(){
                var $this = $(this);
                var repositoryId = $this.data("id");
                _this.currentRepository = $.grep(_this.repositories, function(repo){return repo.id === repositoryId;})[0];
                _this.fetchPathContent("", filenameFilter, successCallback, errorCallback, abortCallback);
            });
        });
    },

    fetchPathContent: function( newPath, filenameFilter, successCallback, errorCallback, abortCallback ){
        var _this = this;

        this.currentRepository.contents(newPath).fetch(function(param, files){
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

            _this.currentPath = newPath;
            var compiled = Hogan.compile(
                '         <a href="#" class="list-group-item githubPath withripple" data-type="{{parentType}}" data-path="{{parentPath}}" >'+
                '             <small><span class="glyphicon mdi-navigation-arrow-back"></span></small>'+
                '             ..'+
                '         </a>'+
                '         {{#files}}'+
                '           <a href="#" data-draw2d="{{draw2d}}" class="list-group-item githubPath withripple text-nowrap" data-type="{{type}}" data-path="{{currentPath}}{{name}}" data-id="{{id}}" data-sha="{{sha}}">'+
                '              <small><span class="glyphicon {{icon}}"></span></small>'+
                '              {{{name}}}'+
                '           </a>'+
                '         {{/files}}'
            );


            var parentPath =  _this.dirname(newPath);
            var output = compiled.render({
                parentType: parentPath===newPath?"repository":"dir",
                parentPath: parentPath,
                currentPath: _this.currentPath.length===0?_this.currentPath:_this.currentPath+"/",
                files: files,
                draw2d:function(){
                    return this.name.endsWith(".draw2d");
                },
                icon: function(){
                    if(this.name.endsWith(".draw2d")){
                        return "mdi-editor-mode-edit";
                    }
                    return this.type==="dir"?"mdi-file-folder":"mdi-image-crop-portrait";
                }
            });
            $("#githubNavigation").html($(output));
            $.material.init();

            //we are in a folder. Create of a file is possible now
            //
            $("#newFileButton").show();

            $(".githubPath[data-type='repository']").on("click", function(){
                _this.fetchRepositories(filenameFilter, successCallback, errorCallback, abortCallback);
            });

            $(".githubPath[data-type='dir']").on("click", function(){
                _this.fetchPathContent( $(this).data("path"), filenameFilter, successCallback, errorCallback, abortCallback);
            });

            $(".githubPath[data-type='file']").on("click", function(){
                var path = $(this).data("path");
                var sha  = $(this).data("sha");
                _this.currentRepository.contents(path).read(function(param, content){
                    successCallback({
                        path : path,
                        title: path.split(/[\\/]/).pop(), // basename
                        sha  : sha,
                        content : content
                    }, content);
                    $('#githubFileSelectDialog').modal('hide');
                });
            });
        });
    },




   dirname: function(path) {
       if (path.length === 0)
           return "";

       var segments = path.split("/");
       if (segments.length <= 1)
           return "";
       return segments.slice(0, -1).join("/");
   }


});