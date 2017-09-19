/*
*   Project: DbmRestJS
*   Version: 0.0.1
*   Description: Zero Installation Memory JSON Database for NodeJS.
*   Author: Juan R. Gavilanes.
*   Node Version: v6.11.2.
*/

/*
TODOLIST
--------

- db.getChild("table/id/subtable/", 1);
- db.insertChild("table/id/subtable/", object);
- db.updateChild("table/id/subtable/", object);
- db.deleteChild("table/id/subtable/", 1);

db.post("/noticias", noticia) *

db.post("noticias/2/comentarios", comentario) *

db.delete("noticias/1") *

db.delete("noticias/1/comentario/2") *

db.get("/noticias/1") *

db.put("/noticias/1", noticia) *
db.put("noticias/0/comentarios/1", noticia); *

db.drop("noticias") *
db.drop("noticias/1/comentarios") *


db.find("/noticias", {titulo: "texto guapo"})

PROBAR BORRADO !!!

*/

let fs = require('fs');

class MemRestJs {

    constructor(file = "data.json", minutesToDoBackup = 1, production = true) {

        this._file = file;

        this._production = production;

        this._enviroment = this.getEnviroment();

        this._data = this.loadDB();

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

    loadDB() {

        if (fs.existsSync(this._file)) {

           return JSON.parse(fs.readFileSync(this._file,{ encoding: 'utf8' }));

        } else {

           return {};

        }

    }

    saveDB() {

        if (this._enviroment === "server") {

            if (this._updated_at > this._backup_at ) {

                let dbx = this;

                fs.writeFile(this._file, JSON.stringify(this._data), function(err) {

                    if(err) {

                        throw err;

                    }

                    if (!dbx._production) console.log(getDateTime() + " -> The file was saved!");

                    dbx._backup_at = getDateTime();

                });

            } else {

                if (!this._production) console.log(getDateTime() + " -> No backup needed.");

            }

        }

    }

    doBackup(minutes) {

        setInterval(this.saveDB.bind(this), 1000*60*minutes);

    }

    insert(table, row) {

        let now = getDateTime();
        row.created_at = now;
        row.updated_at = now;

        if (this._data[table]) {

            row.id = this.keyGen(table);

            this._data[table].push(row);

        } else {

            this._data[table] = [];

            this._data[table].push({ lastKey: 0 });

            row.id = this.keyGen(table);

            this._data[table].push(row);
            
        }

        this._updated_at = now;

        return clone(row);

    }

    keyGen(table) {

        if (this._data[table]) {

            return ++this._data[table][0].lastKey;

        }

        return null;

    }

    /*
    *
    *   @param: path {"noticias/1/comentarios"} this._data[usuarios][1][noticias]
    *   @param: row { autor: 'autor1', fecha: '23232', puntuacion: 5 }
    */
    insertChild(path, row) {

        let now = getDateTime();
        row.created_at = now;
        row.updated_at = now;

        path = this.sanitizePath(path);

        if (path.length === 3) {

            if (this._data[path[0]][path[1]][path[2]] ) {

                row.id = ++this._data[path[0]][path[1]][path[2]][0].lastKey;

                this._data[path[0]][path[1]][path[2]].push(row);

            } else {

                this._data[path[0]][path[1]][path[2]] = [];

                this._data[path[0]][path[1]][path[2]].push({ lastKey: 1 });

                row.id = 1;

                this._data[path[0]][path[1]][path[2]].push(row);

            }

        }

        this._updated_at = now;

        return clone(row);

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
    
    
    //bm2
    find(path, query, limit = 50) {
        
        path = this.sanitizePath(path);
        
        query = this.cleanObject(query);
        
        let result = [];
        
        for (let e of this._data[path[0]]) {
            
            let coincidencias = 0;
            
            for (let k of Object.keys(query)) {
                
                if ( e[k] ) {
                    
                    if (typeof e[k] === "string") {
                        
                        if (query[k].includes("%")) {   //Búsqueda con comodines.
                            
                            if (query[k].length === 1) {
                                
                                coincidencias++;
                                
                            } else {
                                
                                if (query[k].startsWith("%") && query[k].endsWith("%")) {
                                    
                                    let busca = query[k].replace(/%/g, '');
                                    
                                    if (e[k].toLowerCase().trim().includes(busca)) coincidencias++;
                                
                                } else if (query[k].startsWith("%")) {
                                    
                                    if (e[k].toLowerCase().trim().endsWith(query[k].substring(1))) coincidencias++;
                                    
                                } else if (query[k].endsWith("%")) {
                                    
                                    if (e[k].toLowerCase().trim().startsWith(query[k].substring(0, query[k].length-1))) coincidencias++;
                                    
                                }
                                
                            }
                            
                        } else if (query[k].startsWith(">") || query[k].startsWith("<") || query[k].startsWith("!") ) {
                            
                            // Implementar
                            
                            
                            
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
                        
                        // console.log("ñuuu");
                        // if (e[k] === query[k])  coincidencias++;
                        
                        if (typeof query[k] !== "string") {
                            
                        
                            if (e[k] === query[k])  coincidencias++;
                            
                            
                        } else {
                            
                            
                            
                            //console.log("y", query[k]);
                            
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
                
                this._data[path[0]] = [];
                
                return true;
                
            }
            
            return false;
            
        } else if ( path.length === 3 ) {
            
            if (this._data[path[0]][path[1]][path[2]]) {
                
                this._data[path[0]][path[1]][path[2]] = [];
                
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

        let now = getDateTime();
        row.updated_at = now;
        
        //bm
        
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

    update(table, row) {

        if (this._data[table] && this._data[table][row.id]) {

            let claves = Object.keys(row);

            for (let clave of claves) {

                this._data[table][row.id][clave] = row[clave];

            }

            let now = getDateTime();

            this._data[table][row.id].updated_at = now;

            this._updated_at = now;

            return clone(this._data[table][row.id]);

        }

        return null;

    }

    // deletex(table, id) {

    //     if (this._data[table] && this._data[table][id]) {

    //         this._updated_at = getDateTime();

    //         delete this._data[table][id];

    //         return true;

    //     }

    //     if (this._data[table] && id === "*") {

    //         this._data[table] = [];

    //         this._updated_at = getDateTime();

    //         return true;

    //     }

    //     return false;

    // }



    delete(path) {

        path = this.sanitizePath(path);

        if (!(path.length === 2 || path.length === 4 )) {

            throw "Invalid number of parameters";

        }

        if ( path.length === 2 ) {

            if (this._data[path[0]] && this._data[path[0]][path[1]]) {

                delete this._data[path[0]][path[1]];

                this._updated_at = getDateTime();

                return true;

            } else {

                return false;

            }

        } else if ( path.length === 4 ) {

            if (this._data[path[0]][path[1]][path[2]] && this._data[path[0]][path[1]][path[2]][path[3]]) {

                delete this._data[path[0]][path[1]][path[2]][path[3]];

                this._updated_at = getDateTime();

                return true;

            } else {

                return false;

            }

        } else {

            throw "Unexpected error!";

        }

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



    // find(table, id = -1) {

    //     if (id == -1) {

    //         if (this._data[table]) {

    //             return this._data[table].slice();

    //         }

    //         return null;

    //     } else {

    //         if (this._data[table] && this._data[table][id]) {

    //             return clone(this._data[table][id]);

    //         }

    //         return null;

    //     }
    // }

    get file() {

        return this._file;

    }

}

module.exports = { MemRestJs };




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




/* TESTS */

//let {MemRestJs} = require('./MemRestJs');
//let db = new MemRestJs("test.json");


let testsOk = 0;

try {
    fs.unlinkSync("test.json");
} catch (error) {
}

let db = new MemRestJs("test.json", 0.0, false);

db.post("/noticias", {titulo: "uno", descripcion: "dos"});
db.post("/noticias", {titulo: "tres", descripcion: "cuatro", edad: 5});
db.post("/noticias", {titulo: "tres", descripcion: "cuatro"});
db.post("/noticias/0/comentarios/", {titulo: "cinco", descripcion: "seis"});
db.post("/noticias/0/comentarios", {titulo: "siete", descripcion: "ocho"});
db.post("/noticias/0/comentarios", {titulo: "nueve", descripcion: "diez"});
db.post("/noticias/0/comentarios", {titulo: "once", descripcion: "doce"});

//console.log("get /noticias");
//bm
// console.log("\033cget /noticias:\n\n", db.get("/noticias"));
// console.log("\nget /noticias/1:\n\n", db.get("/noticias/1"));
// console.log("\nget /noticias/0/comentarios:\n\n", db.get("/noticias/0/comentarios"));
// console.log("\nget /noticias/0/comentarios/2:\n\n", db.get("/noticias/0/comentarios/2"));

//bm2/
console.log("Cu%",db.find("noticias", {titulo: "tres", edad: 5, descripcion: "Cu%"}));
console.log("%Tro",db.find("noticias", {titulo: "tres", edad: 5, descripcion: "%Tro"}));
console.log("%aT%",db.find("noticias", {titulo: "tres", edad: 5, descripcion: "%at%"}));
console.log("%%%",db.find("noticias", {titulo: "tres", edad: 5, descripcion: "%%%"}));

console.log("limit",db.find("noticias", {titulo: "tres", descripcion: "cuatro"}));
console.log("dates",db.find("noticias", {created_at: "!2017/09/18"}));
console.log("edad",db.find("noticias", {id: "=2"}));

//db.delete("noticias/1");
//db.delete("noticias/0/comentarios/0");

// let obj = db.get("noticias/1")

// console.log("antes: ", obj);
// obj.titulo = 'tres > "moñificado"';
// console.log("despues: ", db.put("noticias/1", obj));

// obj = db.get("noticias/0/comentarios/1");
// if (obj) {
//     obj.titulo = obj.titulo + " > modificado";
//     db.put("noticias/0/comentarios/1", obj);
//     console.log("actualizo: noticias/0/comentarios/1");
// }

// console.log(db.drop("noticias/0/comentarios"));




db.saveDB();


/*
* Test 1: Crear tabla e inserta primer registro
*
*
*/
// let user = db.insert('usuarios', {nombre: 'juanra1', email: 'janrax1@gmai.com'});

// console.log(user);

// user.nombre="juanrax";
// if (!(      user.id===1
//         &&  user.nombre==="juanrax"
//         &&  db._data.usuarios[1].nombre==="juanra1"

//     )) {

//     throw "--> 1er Insert Test: KO";

// } else {

//     testsOk++;

// }

// /*
// * Test 2: Inserta registros en tabla ya existente.
// *
// *
// */

// db.insert('usuarios', {nombre: 'juanra2', email: 'janrax1@gmai.com'});
// db.insert('usuarios', {nombre: 'juanra3', email: 'janrax1@gñai.com'});
// db.insert('usuarios', {nombre: 'juanra4', email: 'janrax1@gmai.com', edad: 40});
// if (!(      db._data.usuarios[2].nombre==="juanra2"
//         &&  db._data.usuarios[2].id===2
//     )) {

//     throw "--> 2+ Insert Test: KO";

// } else {

//     testsOk++;

// }

// /*
// * Test 3: Buscar registro por su ID en tabla inexistente
// *
// *
// */
// if (!(db.find("usuar", 90)===null)) {

//     throw "--> Find record in table that does not exist Test: KO";

// } else {

//     testsOk++;

// }

// /*
// * Test 4: Buscar registro por su ID en tabla existente
// *
// *
// */
// if (!(db.find("usuarios", 90)===null)) {

//     throw "--> Find record that it's not in table that does exist. Test: KO";

// }

// if (!(db.find("usuarios", 2).id===2)) {

//     throw "--> Find record that exists in table that does exist Test: KO";

// }


// if (!(db.find("usuarios").length===5)) {

//     throw "--> Retrieve all the records in table that does exist Test: KO";

// }


// testsOk++;


















// console.log(`Great! All ${testsOk} Tests performed are Ok.`);





// // user = db.find("usuarios", 0);
// // user.nombre = "luis";

// // db.update("usuarios", user);




// db.delete("usuarios", db.find("usuarios", 1).id );
// console.log("yusass", db.find("usuarios", 1));

// console.log(db._data);



// let noticia = {};

// noticia.titulo = "titulo random";
// noticia.descripcion = "hola bla bla bla bla";
// noticia.comentarios = [];
// noticia.comentarios.push({autor: "geromo", puntos: 5});














// db.saveDB();

// //console.log(db.find("usuarios"));

// // setTimeout(function() {
// //     let db2 = new JrxDb("test.json");
// //     console.log(db2.find("usuarios"));


// // }, 1000);



// //console.log(db2.find("usuarios"));

// // user.nombre = "perro";

// // db.delete("usuarios", user);

// // user = db.find("usuarios", 3);
// // user.nombre = "ramona";
// // db.update("usuarios", user);


// // // db.update("usuarios", user);

// // db.insert('notas', {titulo: 'La primera nota', autor: user.email});
// // db.insert('notas', {titulo: 'La segunda nota', autor: user});

// // //console.log(db.find("usuarios", user.id));

// // console.log(db.find("usuarios"));
// // console.log(db.find("notas"));














// /*




// DB.insert('usuarios', {nombre: 'juanra', email: 'jan@jd.com'});
// let user1 = DB.find('usuarios', 1);

// user1.nombre = 'nano';
// DB.update('usuarios', user1);

// DB.delete('usuarios', 1);

// DB.filter('usuarios', {nombre: '*juan', email: )


// */