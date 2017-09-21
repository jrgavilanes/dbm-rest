let assert = require("assert");
let fs = require('fs');

let {DbmRest} = require('../DbmRest');

let db;

describe("DbmRest: C.R.U.D", function() {

    before(function(){

        if (fs.existsSync("test.json")) {

            fs.unlinkSync("test.json");

        }
        
        this.timeout(1000);

        db = new DbmRest("test.json");

    });

    it ('(CR) Debería insertar el primer registro en la BD y poder leerlo', function() {

        let p = db.post("/noticias", {titulo: "uno", descripcion: "dos"});

        let p2 = db.get("noticias/0");

        assert.equal(p2.titulo+p2.id, p.titulo+p.id, "Inserto primer registro");

    });

    it ('(CR) Debería meter una tabla dentro del primer registro', function() {

        db.post("/noticias/0/comentarios", {autor: 'usuario1@jdj.com', rate: 4 });
        db.post("/noticias/0/comentarios", {autor: 'usuario2@jdj.com', rate: 3 });

        let a = db.get("noticias/0/comentarios/0");

        assert.equal(a.autor, "usuario1@jdj.com", "Leo primer registro de comentarios");

        a = db.get("noticias/0/comentarios");

        assert.equal(a.length, 2, "Leo todos los registros de comentarios");

    });

    it ('( U) Debería actualizar un registro y un sub-registro', function() {

        let a = db.get("noticias/0");

        a.descripcion = "Descripción modificada";

        db.put("noticias/0", a);

        a = "";

        a = db.get("noticias/0");

        assert.equal(a.descripcion, "Descripción modificada", "Registro actualizado");

        db.post("noticias/0/tags", {nombre: 'cine'});
        db.post("noticias/0/tags", {nombre: 'libros'});
        db.post("noticias/0/tags", {nombre: 'viajes'});

        a = db.get("noticias/0/tags/0");
        a.nombre = "Cine Modificado";

        assert.equal(db.put("noticias/0/tags/0", a).nombre, "Cine Modificado", "Sub-Registro actualizado");

    });

    it ('( D) Debería borrar un registro', function() {

        db.delete("/noticias/0/comentarios/0");

        let a = db.get("noticias/0/comentarios/0");

        assert.equal(a, null, "Registro borrado ahora es null");

    });

    it ('( D) Debería vaciar una tabla', function() {

        db.delete("/noticias/0/comentarios");

        let a = db.get("noticias/0/comentarios");

        assert.equal(a.length, 0, "Tabla vaciada");

    });

    it ('( D) Debería eliminar una tabla', function() {

        db.drop("/noticias/0/comentarios");

        let a = db.get("noticias/0/comentarios");

        assert.equal(a, null, "Tabla borrada");

    });
    
    it ('Debería insertar 1.000 registros', function() {
        
        let incidencia = {};
        
        //console.time("inserta 100.000");
        for (let i = 0; i<1000; i++) {
            
            incidencia.titulo = "incidencia nº: " + i;
            incidencia.tecnico1 = "tecnico" +  i%10;
            incidencia.descripcion = "descripcion" + i;
            incidencia.cerrada = false;
            
            db.post("incidencias", incidencia);
            
        }
        
        //console.timeEnd("inserta 100.000");
        
        assert(true, "Incidencias masivas");
        
    });

    after(function(){
        
        this.timeout(1000);
        
        db.close();

    });

});