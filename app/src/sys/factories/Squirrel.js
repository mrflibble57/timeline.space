/**
 * Squirrel stores nuts
 *
 * He stores his nuts using 'angularLocalStorage' module, and adds some smarts in the way of
 * compression (using lz-string), and the ability to mark objects as for storage across logins
 * or not (items specific to a user vs generic data)
 *
 * Squirrel also puts nuts on his table when accessed or stored so subsequent reads come
 * from a local var without the need for decompression or accessing the localStorage.
 *
 * @param storage
 * @returns {{store: Function, get: Function, empty: Function,remove: Function}}
 * @constructor
 */
angular.module('sysModule').factory("squirrel", ["storage", function(storage) {
    //The items the squirrel has recently accessed or stored are kept on
    //his table for quick access.
    var theTable={};

    /**
     * Store an item into local storage (compressed)
     * Also stores into local copy (his table, not compressed)
     * If crossSession = true, then also store a name_cs:true var
     * which means don't delete it unless told to do a total clear.
     *
     * @param name
     * @param obj
     * @param crossSession
     */
    var store = function(name, obj, crossSession){
        if(typeof obj == 'undefined'){
            //Not going to store this, so clear value if old one stored.
            console.log('Squirrel says '+name+' is undefined, so is turfing it');
            remove(name);
            return;
        }
        // / var startTime = Date.now();
        var strObj = JSON.stringify(obj);
        // var postString = Date.now();
        var compressedObj = LZString.compressToUTF16(strObj);
        // var postComp = Date.now();

        //Locally store uncompressed version for quicker access
        //Could probably just store 'obj' without doing anything to it
        //but making sure what's returned from local vs storage are both
        //identical.
       // console.log("STORING "+name+" STR[",strObj,"] =",obj);

        theTable[name]= JSON.parse(strObj);
        //Local storage gets compressed version
        storage.set(name,compressedObj);

        //var postStore = Date.now();
       // console.log("Squirrel is storing nut "+name+", with size change = "+compressedObj.length+"/"+strObj.length+", or "+((1-(compressedObj.length/strObj.length))*100).toFixed(2)+"% compression");
       // console.log("Time to Stringify = "+(postString-startTime)+"ms. Time to compress = "+(postComp-postString)+"ms. Total Store time="+(postStore-startTime)+"ms");

        //Keep track of whether this is crossSession or not
        storeMap[name] = crossSession?true:false;
       // console.log("Squirrel stored nut["+name+"] with crossSession = "+storeMap[name]);
        storage.set("storeMap",LZString.compressToUTF16(JSON.stringify(storeMap)));
    };

    /**
     * Get an item from local storage, return item or null if not found.
     */
    var get = function(name){
        //If we've already extracted it this session,
        //just get it from local storage.
        if(theTable[name]){
          //  console.log("Squirrel retrieved his nut called "+name+" from the table.");// =",localCopy[name]);
            return theTable[name];
        }
       // var startTime = Date.now();
        //Else get it, uncompress it, store it locally and return
        var storedItem = storage.get(name);
        var returnItem;
        if(storedItem){
            returnItem = JSON.parse(LZString.decompressFromUTF16(storedItem));
           // var postComp = Date.now();
            //console.log("GET ["+name+"] TIME TO DECOMPRESS = "+(postComp-startTime)+"ms");
            //It wasn't
            theTable[name] = returnItem;
            //console.log("Squirrel retrieved his nut called "+name+" from his store.");// = ",returnItem);
            return returnItem;
        }

        //console.log("Squirrel stared blankly when asked for a nut called "+name);
        //We have no such item...
        return null;
    };

    /**
     * Remove one item from the store
     * @param name
     */
    var remove = function(name){
        storage.remove(name);
        delete theTable[name];
        delete storeMap[name];
    };

    /**
     * Eat all items from storage and locally that are not
     * marked for permanent storage
     */
    var consume = function(){
      console.log("Squirrel says 'Nom nom nom'.");
      console.log(storeMap);
      for(var nut in storeMap){
          //If not tagged as cross-session
          if(!storeMap[nut]){
              remove(nut);
          }
      }
      //Put the newly cleaned storeMap back into storage.
      storage.set("storeMap",LZString.compressToUTF16(JSON.stringify(storeMap)));
    };

    /**
     * Eat everything, including cross-session storage. Greedy bugger
     */
    var consumeAll = function(){
        console.log("Squirrel says 'Nom nom nom nom.... burp.'");
        storage.clearAll();
        theTable = {};
        storeMap = {};
    };



    //When Squirrel wakes up, he sees if he's still got his note about previously
    //stored items (Names of items and whether they're crossSession or not)
    var storeMap = get("storeMap");
    if(!storeMap){
        storeMap = {};
    }

    return {
        store: store,
        get: get,
        remove: remove,
        consume: consume,
        consumeAll: consumeAll
    }
}]);