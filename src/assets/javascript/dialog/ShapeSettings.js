shape_designer.dialog.ShapeSettings = Class.extend({

    /**
     * @constructor
     *
     */
    init:function(){

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
    show: function(app)
    {
        var _this = this;
        var baseClass = app.getConfiguration().baseClass;

        $("#shapeSettingsDialog").modal("show");

        $("#shapeSettingsDialog .shapeBaseClass input[type='radio'][data-class='"+baseClass+"']").prop("checked",true);

        // Button: Commit to GitHub
        //
        $("#shapeSettingsDialog .okButton").on("click", function () {
            var baseClass = ($("#shapeSettingsDialog .shapeBaseClass input[type='radio']:checked").data("class"));
            app.setConfiguration({baseClass:baseClass});
            console.log(app.getConfiguration());
            $('#shapeSettingsDialog').modal('hide');
        });
    }

});