'use strict';

var SysFactoryFormat =  function() {

    var currency = function(value) {
        if (value) {
            var v = decimal(value);
            return "$" + sep(v);
        }
        else return "";
    };

    var decimal = function(value) {
        if (value) {
            var v = value.toFixed(2);
            return sep(v);
        }
        else
            return "";
    };

    var integer = function(value) {
        if(value){
            var v = value.toFixed(0);
            return sep(v);
        }
        else
            return "";
    };

    var sep = function(value) {
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    return {
        currency: function(value) { return currency(value) },
        decimal: function(value) { return decimal(value) },
        integer: function(value) { return integer(value) },
        as: function(format, value) {
            switch (format) {
                case "CURRENCY":
                    return currency(value);
                case "DECIMAL":
                    return decimal(value);
                case "INTEGER":
                    return integer(value);
            }
            return format + value;
        }

    };
};