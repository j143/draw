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
        
        this.view    = new shape_designer.View(this, "canvas");
        this.toolbar = new shape_designer.Toolbar(this, "toolbar",  this.view );
        this.layer   = new shape_designer.Layer(this, "layer_elements", this.view );
        this.filter  = new shape_designer.FilterPane(this, "filter_actions", this.view );
        this.view.installEditPolicy(new shape_designer.policy.SelectionToolPolicy());
        about.hide();
 	},

 	
	fileOpen: function( successCallback, errorCallback, abortCallback)
    {
        $('#fileSelectDialog').modal('show');
        var handleFileSelect=function(evt) {
            var files = evt.target.files; // FileList object

            if(files.length>0) {
                var  f = files[0];

                if(f.name.endsWith(".draw2d"))
                {
                    var reader = new FileReader();
                    reader.onload = function (theFile) {
                        console.log(theFile.target.result);
                    };

                    // Read in the image file as a data URL.
                    reader.readAsText(f);
                }
                else{
                    errorCallback();
                }
            }
            else{
                abortCallback();
            }
        };

        $("#file").on('change', handleFileSelect);
	},



	
	fileSave: function(successCallback, errorCallback, abortCallback)
    {

        var blob = new Blob(["text text text text"]);
        saveAs(blob, "document.txt");

        // http://www.html5rocks.com/en/tutorials/file/filesystem/

        /*
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

            abortCallback();
            return;



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

        },this), view.getBoundingBox().scale(10,10));
         */
    }
});
