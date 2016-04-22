shape_designer.dialog.FileSave = Class.extend({

    /**
     * @constructor
     *
     */
    init:function(storage)
    {
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

                    var currentName = _this.storage.basename(_this.storage.currentFileHandle.path);
                    var newName = $("#githubSaveFileDialog .githubFileName").val();
                    if(currentName!= newName){
                        config.sha=null;
                        _this.storage.currentFileHandle.path = _this.storage.dirname(_this.storage.currentFileHandle.path )+"/"+newName;
                    }
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