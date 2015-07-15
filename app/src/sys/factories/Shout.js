angular.module('sysModule').factory("shout", function() {
    var list = [];
    return {
        listen: function(name, fn) {
          //  console.log("Shout register: " + name);
            var arr = name.split(",");
            for (var n in arr)
                list.push({name: arr[n], fn: fn});
        },

        out: function(name) {
            var args = Array.prototype.slice.call(arguments);
           // console.log("Shout out " + name, arguments.length>1?arguments[1]:"nothing");
            for (var index = 0; index < list.length; index++) {
                var obj = list[index];
                if (obj.name == name) {
                   //console.log("Shout.out Obj:",obj);
                    obj.fn.apply(this, args.slice(1, args.length));
                }
            }
        },

        snub: function(name, fn) {
            var arr = [];
            for (var i in list) {
                var item = list[i];
                if (item.name != name || item.fn != fn)
                    arr.push(item);
            }
            list = arr;
        }

    };
});