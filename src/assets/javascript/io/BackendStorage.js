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
        this.currentRepository = null;
        this.currentPath = "";
    },
    
    requiresLogin: function()
    {
        return true;
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
    },

    isLoggedIn: function(callback)
    {

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
     * @param {Function} successCallback callback method if the user select a file and the content is loaded
     * @param {Function} errorCallback method to call if any error happens
     * 
     * @since 4.0.0
     */
    pickFileAndLoad: function(successCallback, errorCallback, abortCallback)
    {
        // Select first a ROOT repository if we didn'T have before
        if(this.currentRepository===null) {
            this.fetchRepositories(successCallback, errorCallback, abortCallback);
        }
        // else reopen the already selected directory
        else{
            this.fetchPathContent(this.currentPath,successCallback, errorCallback, abortCallback);
        }

        $('#githubFileSelectDialog').modal('show');
    },

    save: function(canvas, currentFileHandle, successCallback, errorCallback, abortCallback)
    {
        var _this = this;
        
    	if(currentFileHandle===null){
    		currentFileHandle= {
    		    title:"DocumentName",
                sha:null
    		};
    	}

        // generate the PNG preview and oben the save dialog
        //
        var showFileSaveDialog= function() {
            new draw2d.io.png.Writer().marshal(canvas, function (imageDataUrl) {

                $("#githubFilePreview").attr("src", imageDataUrl);
                $("#githubFileName")
                    .val(currentFileHandle.title)
                    .removeClass("empty");

                $('#githubSaveFileDialog').on('shown.bs.modal', function () {
                    $(this).find('input:first').focus();
                });
                $("#githubSaveFileDialog").modal("show");

                // Button: Commit to GitHub
                //
                $("#commitToGithub").on("click", function () {
                    var writer = new draw2d.io.json.Writer();
                    writer.marshal(canvas, function (json, base64) {
                        var config = {
                            message: $("#githubCommitMessage").val(),
                            content: base64,
                            sha: currentFileHandle.sha
                        };

                        _this.currentRepository.contents(currentFileHandle.path).add(config)
                            .then(function (info) {
                                currentFileHandle.sha = info.content.sha;
                                $('#githubSaveFileDialog').modal('hide');
                            });
                    });
                });

            }, canvas.getBoundingBox().scale(10, 10));
        };

        if(this.currentRepository===null){
            this.fetchRepositories(
                function(){
                    // success
                },
                function(){
                    // error
                },
                function(){
                    // abort
                })
        }
        else{
            showFileSaveDialog();
        }
    },


    /**
     * @private
     *
     * @param successCallback
     * @param errorCallback
     * @param abortCallback
     */
    fetchRepositories: function(successCallback, errorCallback, abortCallback)
    {
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
                '         <a href="#" class="list-group-item repository text-nowrap" data-type="repository" data-id="{{id}}">'+
                '         <small><span class="glyphicon mdi-content-archive"></span></small>'+
                '         {{{name}}}'+
                '         </a>'+
                '         {{/repos}}'
            );

            var output = compiled.render({
                repos: repos
            });
            $("#githubNavigation").html($(output));

            $(".repository").on("click", function(){
                var $this = $(this);
                var repositoryId = $this.data("id");
                _this.currentRepository = $.grep(_this.repositories, function(repo){return repo.id === repositoryId;})[0];
                _this.fetchPathContent("", successCallback, errorCallback, abortCallback);
            });
        });
    },

    fetchPathContent: function( newPath, successCallback, errorCallback, abortCallback )
    {
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
                '         <a href="#" class="list-group-item githubPath" data-type="{{parentType}}" data-path="{{parentPath}}" >'+
                '             <small><span class="glyphicon mdi-navigation-arrow-back"></span></small>'+
                '             ..'+
                '         </a>'+
                '         {{#files}}'+
                '           <a href="#" data-draw2d="{{draw2d}}" class="list-group-item githubPath text-nowrap" data-type="{{type}}" data-path="{{currentPath}}{{name}}" data-id="{{id}}" data-sha="{{sha}}">'+
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

            //we are in a folder. Create of a file is possible now
            //
            $("#newFileButton").show();

            $(".githubPath[data-type='repository']").on("click", function(){
                _this.fetchRepositories(successCallback, errorCallback, abortCallback);
            });

            $(".githubPath[data-type='dir']").on("click", function(){
                _this.fetchPathContent( $(this).data("path"), successCallback, errorCallback, abortCallback);
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