let assert = require("assert");

let DbmRest = require('../DbmRest');

let db;

describe("DbmRest: Queries", function() {

    before(function(){

        db = new DbmRest("test.json");
        
        this.timeout(1000);
        
    });

    it ('Debería haber cargado la base de datos del disco en memoria', function() {

        assert.equal(db.get("incidencias").length, 1000, "BD del disco ya en memoria");

    });
    
    it ('Debería devolver las incidencias en el orden inverso', function() {

        assert.equal(db.get("incidencias", "desc")[0].id, 999, "primer registro es 999 ( desc ).");
        
        assert.equal(db.get("incidencias", "desc")[999].id, 0, "ultimo registro es 0 ( desc ).");
        
        assert.equal(db.get("incidencias/5/comentarios", "desc")[0].id, 2, "primer registro de subtabla es 2 ( desc ).");
        
        assert.equal(db.get("incidencias/5/comentarios")[0].id, 0, "primer registro de subtabla es 0 ( desc ).");

    });
    
    it ('Debería filtrar las incidencias de un técnico concreto', function() {
        
        
        assert.equal(db.find("incidencias", {tecnico1: "tecnico9"}).length, 100, "Busca incidencias del tecnico9");

    });
    
    it ('Debería filtrar por una incidencia concreta y devolver una tabla completa', function() {
        
        assert.equal(db.find("incidencias", 99).id, 99, "Busca incidencia 99 -> Alias de get(/path/id)");
        
        assert.equal(db.find("incidencias").length, 1000, "Devuelve tabla completa -> Alias de get(/path)");
        
    });
    
    it ('Debería filtrar con comodines', function() {
        
        assert.equal(db.find("incidencias", {tecnico1: "tecnico9"}, 50).length, 50, "Busca incidencias del tecnico9, pero dame sólo las 50 primeras");
        
        assert.equal(db.find("incidencias", {tecnico1: "*9"}, 50).length, 50, "Busca incidencias del tecnico9, pero dame sólo las 50 primeras");
        
        assert.equal(db.find("incidencias", {tecnico1: "*9"}).length, 100, "Busca incidencias del que acabe por 9");
        
        assert.equal(db.find("incidencias", {tecnico1: "t*"}).length, 1000, "Busca incidencias del que empiece por t o T");
        
        assert.equal(db.find("incidencias", {tecnico1: "*ni*"}).length, 1000, "Busca incidencias del que contenga ni o NI o nI o Ni");
        
        //falta implementar t*ni*9, *e*ni*    
        
    });
    
    it ('Debería filtrar por varios campos de la tabla', function() {
        
        assert.equal(db.find("incidencias", {tecnico1: "*9", id: 999, created_at: "2017/09*"}).length, 1, "Busca incidencias cuyo tecnico acabe por 9, que tenga id 999 y creada 2017/09");
        
        assert.equal(db.find("incidencias", {tecnico1: "*9", id: 999, created_at: "2017/08*"}).length, 0, "Busca incidencias cuyo tecnico acabe por 9, que tenga id 999 y creada 2017/08");
        
    });

    after(function(){

        db.close();

    });

});