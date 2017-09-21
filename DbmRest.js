/*
*   Project: DbmREST 
*   Version: 0.0.1
*   Description: Zero Installation Memory JSON Database for NodeJS.
*   Author: Juan R. Gavilanes.
*   Node Version: v6.11.2.
*/

/*
TODOLIST
--------
empezar a documentar en el readme.md
Filtros *algo*otra cosa*
Probar localstorage.

*/

let fs = require('fs');

class DbmRest {

    constructor(file = "data.json", minutesToDoBackup = 1, production = true) {

        this._file = file;

        this._production = production;

        this._enviroment = this.getEnviroment();

        this.load();

        this._updated_at = "";

        this._backup_at = "";

        if (minutesToDoBackup > 0) this.doBackup(minutesToDoBackup);

    }

    getEnviroment() {

        try {

            if (localStorage) {}

            return "web";

        } catch (e) {

            return "server";

        }

    }

    load() {

        if (fs.existsSync(this._file)) {

           this._data = JSON.parse(fs.readFileSync(this._file,{ encoding: 'utf8' }));

        } else {

           this._data = {};

        }

    }

    close() {

        this.save();
        this._data = [];

    }

    save() {

        if (this._enviroment === "server") {

            if (this._updated_at > this._backup_at ) {

                let dbx = this;

                let t0 = Date.now();
                
                fs.writeFile(this._file, JSON.stringify(this._data), function(err) {

                    if(err) {

                        throw err;

                    }

                    if (!dbx._production) {
                        
                        t0 = Date.now() - t0;
                        console.log(getDateTime() + " -> The file was saved in " + t0 + " ms.");
                        
                    }
                        
                    dbx._backup_at = getDateTime();

                });

            } else {

                if (!this._production) console.log(getDateTime() + " -> No backup needed.");

            }

        }

    }

    doBackup(minutes) {

        setInterval(this.save.bind(this), 1000*60*minutes);

    }

    cleanObject(obj) {

        let cleanObject = {}

        for (let e of Object.keys(obj)) {

            if (typeof obj[e] === "string") {

                cleanObject[e] = obj[e].trim().toLowerCase();

            } else {

                cleanObject[e] = obj[e];

            }

        }

        return clone(cleanObject);

    }

    find(path, query = "*", limit = 0) {

        if (typeof query == "object") {
            
            query = this.cleanObject(query);
            
        } else if (typeof query == "number") {
            
            if (path[path.length-1] == "/") {
                
                path = path + query;
                
            } else {
                
                path = path + "/" + query;
                
            }
            
            return this.get(path);
            
        } else if (query == "*") {
            
            return this.get(path);
            
        }
        
        path = this.sanitizePath(path);

        let result = [];

        for (let e of this._data[path[0]]) {

            let coincidencias = 0;

            for (let k of Object.keys(query)) {

                if ( e[k] ) {

                    if (typeof e[k] === "string") {

                        if (query[k].includes("*")) {   //Búsqueda con comodines.

                            if (query[k].length === 1) {

                                coincidencias++;

                            } else {
                                
                                //falta implementar t*ni*9, *e*ni*    

                                if (query[k].startsWith("*") && query[k].endsWith("*")) {

                                    let busca = query[k].replace(/\*/g, '');

                                    if (e[k].toLowerCase().trim().includes(busca)) coincidencias++;

                                } else if (query[k].startsWith("*")) {

                                    if (e[k].toLowerCase().trim().endsWith(query[k].substring(1))) coincidencias++;

                                } else if (query[k].endsWith("*")) {

                                    if (e[k].toLowerCase().trim().startsWith(query[k].substring(0, query[k].length-1))) coincidencias++;

                                }

                            }

                        } else if (query[k].startsWith(">") || query[k].startsWith("<") || query[k].startsWith("!") ) {

                            // Revisar

                            if (query[k].startsWith(">=")) {

                               if ( e[k] >= query[k].substring(2) ) {

                                   coincidencias++;

                               }

                            } else if (query[k].startsWith(">")) {

                               if ( e[k] > query[k].substring(1) ) {

                                   coincidencias++;

                               }

                            } else if (query[k].startsWith("<=")) {

                               if ( e[k] <= query[k].substring(2) ) {

                                   coincidencias++;

                               }

                            } else if (query[k].startsWith("<")) {

                               if ( e[k] < query[k].substring(1) ) {

                                   coincidencias++;

                               }

                            } else if (query[k].startsWith("!")) {

                               if ( e[k] != query[k].substring(1) ) {

                                   coincidencias++;

                               }

                            }

                        } else {    //Búsqueda exacta.

                            if (e[k].toLowerCase().trim() === query[k])  coincidencias++;

                        }

                    } else {    //Búsqueda numérica.

                        if (typeof query[k] !== "string") {
                            
                            if (e[k] === query[k])  coincidencias++;
                            
                        } else {

                            if (query[k].startsWith(">=")) {

                               if ( e[k] >= query[k].substring(2) ) {

                                   coincidencias++;

                               }

                            } else if (query[k].startsWith(">")) {

                               if ( e[k] > query[k].substring(1) ) {

                                   coincidencias++;

                               }

                            } else if (query[k].startsWith("<=")) {

                               if ( e[k] <= query[k].substring(2) ) {

                                   coincidencias++;

                               }

                            } else if (query[k].startsWith("<")) {

                               if ( e[k] < query[k].substring(1) ) {

                                   coincidencias++;

                               }

                            } else if (query[k].startsWith("!")) {

                               if ( e[k] != query[k].substring(1) ) {

                                   coincidencias++;

                               }

                            } else if (query[k].startsWith("=")) {

                               if ( e[k] == query[k].substring(1) ) {

                                   coincidencias++;

                               }

                            }

                        }

                    }

                }

            }

            if (coincidencias === Object.keys(query).length) result.push(e);

            if (limit > 0 && result.length === limit) break;

        }

        return result;

    }

    drop(path) {

        path = this.sanitizePath(path);

        if (!(path.length === 1 || path.length === 3 )) {

            throw "Invalid number of parameters";

        }

        if ( path.length === 1 ) {

            if (this._data[path[0]]) {
                
                delete this._data[path[0]];

                return true;

            }

            return false;

        } else if ( path.length === 3 ) {

            if (this._data[path[0]][path[1]][path[2]]) {

                delete this._data[path[0]][path[1]][path[2]];

                return true;

            }

            return false;

        }

        throw "Unexpected error";

    }

    /*

    db.post("/noticias", noticia)
    db.post("/noticias/2/comentarios", comentario)

    */

    post(path, row) {

        path = this.sanitizePath(path);

        if (!(path.length === 1 || path.length === 3 )) {

            throw "Invalid number of parameters";

        }
        
        row = clone(row);

        let now = getDateTime();
        row.created_at = now;
        row.updated_at = now;

        if ( path.length === 1 ) {

            if (this._data[path[0]]) {

                row.id = this._data[path[0]].length;

                this._data[path[0]].push(row);

            } else {

                this._data[path[0]] = [];

                row.id = 0;

                this._data[path[0]].push(row);

            }

        } else if ( path.length === 3 ) {

            if (this._data[path[0]][path[1]][path[2]] ) {

                row.id = this._data[path[0]][path[1]][path[2]].length;

                this._data[path[0]][path[1]][path[2]].push(row);

            } else {

                this._data[path[0]][path[1]][path[2]] = [];

                row.id = 0;

                this._data[path[0]][path[1]][path[2]].push(row);

            }

        } else {

            throw "Unexpected error!";

        }

        this._updated_at = now;

        return clone(row);

    }

    /*

    db.put("/noticias/2", noticia)
    db.put("/noticias/2/comentarios/3", comentario)

    */

    put(path, row) {

        path = this.sanitizePath(path);

        if (!(path.length === 2 || path.length === 4 )) {

            throw "Invalid number of parameters";

        }
        
        row = clone(row);

        let now = getDateTime();
        row.updated_at = now;
        
        if ( path.length === 2 ) {

            if (this._data[path[0]] && this._data[path[0]][path[1]]) {

                this._data[path[0]][path[1]] = clone(row);

                return clone(this._data[path[0]][path[1]]);

            }

            return false;

        } else if ( path.length === 4) {

            if (this._data[path[0]][path[1]][path[2]] && this._data[path[0]][path[1]][path[2]][path[3]]) {

                this._data[path[0]][path[1]][path[2]][path[3]] = clone(row);

                return clone(this._data[path[0]][path[1]][path[2]][path[3]]);

            }

            return false;

        }

        throw "Unexpected error!";

    }
    
    sanitizePath(path){

        path = path.trim();

        if (path[0] === "/") path = path.substring(1);

        if (path[path.length-1] === "/") path = path.substring(0,path.length-1);

        path = path.split("/");

        return path.map(function(e){return e.trim().toLowerCase()});

    }

    delete(path) {

        path = this.sanitizePath(path);

        if ( path.length === 1 ) {

            if (this._data[path[0]]) {

                this._data[path[0]] = [];

                this._updated_at = getDateTime();

                return true;

            }

            return false;

        } else if ( path.length === 2 ) {

            if (this._data[path[0]] && this._data[path[0]][path[1]]) {

                delete this._data[path[0]][path[1]];

                this._updated_at = getDateTime();

                return true;

            }

            return false;

        } else if ( path.length === 3 ) {

            if (this._data[path[0]][path[1]][path[2]]) {

                this._data[path[0]][path[1]][path[2]] = [];

                this._updated_at = getDateTime();

                return true;

            }

            return false;

        } else if ( path.length === 4 ) {

            if (this._data[path[0]][path[1]][path[2]] && this._data[path[0]][path[1]][path[2]][path[3]]) {

                delete this._data[path[0]][path[1]][path[2]][path[3]];

                this._updated_at = getDateTime();

                return true;

            }

            return false;

        } 

        throw "Unexpected length! (max: 4)";

    }

    get(path) {

        path = this.sanitizePath(path);

        let len = path.length;

        if (len === 1) {

            try {

                if (this._data[path[0]]) {

                    return this._data[path[0]].slice();

                }

                return null;

            } catch(e) {

                return null;

            }

        } else if (len === 2) {

            try {

                if (this._data[path[0]][path[1]]) {

                    return clone(this._data[path[0]][path[1]]);

                }

                return null;


            } catch(e) {

                return null;

            }

        } else if (len === 3) {

            try {

                if (this._data[path[0]][path[1]][path[2]]) {

                    return this._data[path[0]][path[1]][path[2]].slice();

                }

                return null;
                
            } catch(e) {

                return null;

            }

        } else if (len === 4) {

            try {

                if (this._data[path[0]][path[1]][path[2]][path[3]]) {

                    return clone(this._data[path[0]][path[1]][path[2]][path[3]]);

                }

                return null;


            } catch(e) {

                return null;

            }

        }

        throw "Unexpected length! (max: 4)";

    }
    
    get file() {

        return this._file;

    }

}

module.exports = { DbmRest };


/* HELPERS */
function getDateTime() {

    let date = new Date();

    let hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    let min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    let sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    let year = date.getFullYear();

    let month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    let day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + "/" + month + "/" + day + " " + hour + ":" + min + ":" + sec;

}

function clone( obj ) {

    if ( obj === null || typeof obj  !== 'object' ) {

        return obj;

    }

    let temp = obj.constructor();

    for ( let key in obj ) {

        temp[ key ] = clone( obj[ key ] );

    }

    return temp;

}