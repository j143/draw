
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
        var baseClass = app.getConfiguration().baseClass;
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
         '// Generated Code for the Draw2D touch HTML5 lib\n'+
         '//\n'+
         '// http://www.draw2d.org\n'+
         '//\n'+
         '// '+new Date()+'\n'+
         '//\n'+
         '// Go to the Designer http://www.draw2d.org               \n'+
         '// to design your own shape or download user generated    \n'+       
         '//\n'+
         'var {{{className}}} = {{{baseClass}}}.extend({\n'+
         '\n'+
         '       NAME: "{{{className}}}",\n'+
         '\n'+
         '       init:function(attr, setter, getter)\n'+
         '       {\n'+
         '         this._super( $.extend({stroke:0, bgColor:null, width:{{width}},height:{{height}}},attr), setter, getter);\n'+
         '         var port;                                        \n'+
         '         {{#ports}}                                       \n'+
         '         // {{{name}}}                                    \n'+
         '         port = this.createPort("{{type}}", new draw2d.layout.locator.XYRelPortLocator({{x}}, {{y}})); \n'+       
         '         port.setConnectionDirection({{direction}});      \n'+       
         '         port.setBackgroundColor("{{color}}");            \n'+
         '         {{/ports}}                                       \n'+
         '         this.persistPorts=false;                         \n'+
         '       },                                                 \n'+
         '\n'+
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
         '\n'+
         '            {{#figures}}\n'+
         '            // {{{name}}}\n'+
         '            shape = {{{constructor}}};                    \n'+
         '            shape.attr({{{attr}}});                       \n'+
         '            set.push(shape);                              \n'+
         '            {{{extra}}}                                   \n'+       
         '            {{/figures}}                                  \n'+
         '            return set;                                   \n'+
         '       },                                                 \n'+
         '\n'+
         '       applyAlpha: function(){                            \n'+
         '       }                                                  \n'+
       '});                                                         \n'+
         '                                                          \n';
        
        
        var compiled = Hogan.compile(template);
        var output = compiled.render({
            className: className,
            baseClass: baseClass,
            figures: shapes,
            ports: ports,
            width: b.w,
            height: b.h
        });
        
        resultCallback(output,  draw2d.util.Base64.encode(output));
    }
});