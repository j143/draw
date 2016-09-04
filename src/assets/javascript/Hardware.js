// just a simple mock object tfor the DigitalTrainingStudio
// Hardware binding
//
var hardware={

    gpio:{
        set:function(pin, value){},
        get:function(pin){return false;}
    },

    bloc:{
        set:function(blocId, value){},
        get:function(blocId){return false;}
    }
};