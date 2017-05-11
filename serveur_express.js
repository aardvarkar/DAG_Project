var express = require('express');
var app     = express();
var path    = require('path');
var PythonShell = require('python-shell');
const fileUpload = require('express-fileupload');
var input_once = false

app.use(fileUpload());

app.use(express.static(path.join(__dirname,'public')));

app.get('/',function(req,res){
    
  res.sendFile(path.join(__dirname+'/public/home.html'));
  
  
});

app.get('/home',function(req,res){
    
  res.sendFile(path.join(__dirname+'/public/home.html'));
});

app.get('/input_files',function(req,res){
    
  if (input_once) {
  res.sendFile(path.join(__dirname+'/public/input_files2.html'));
  }
  else {
  res.sendFile(path.join(__dirname+'/public/input_files.html'));
      
  }
});

app.get('/project',function(req,res){
    
    res.sendFile(path.join(__dirname+'/public/project.html'));
});

app.get('/contact',function(req,res){
   
    res.sendFile(path.join(__dirname+'/public/contact.html'));
});


//https://www.npmjs.com/package/express-fileupload
app.post('/uploadFile', function(req, res) {
    
  if (!req.files){
    return res.status(400).send('No files were uploaded.')};
 
  var testfile1=false;
  var testfile2=false;  
  var file1 = req.files.file1;  
  file1.mv(__dirname+'/public/dag_treemap/rep2term.csv', function(err) {
    if (err){        
      return res.status(500).send(err)};    
    testfile1=true;
    parse();
    
  });
  
  var file2 = req.files.file2;
  file2.mv(__dirname+'/public/dag_treemap/term2gen.csv', function(err) {
    if (err){
      return res.status(500).send(err)};
    testfile2=true;
    parse();
    });
  
  function parse(){
      if (testfile1 && testfile2){
        PythonShell.run('/public/dag_treemap/parseur.py', function (err) {
        if (err){ throw err};
        console.log('parsing completed');
        res.redirect('/visualization');
        input_once = true
            });
      
        };
     
   
    };  
});

app.get('/instructions',function(req,res){
    
    res.sendFile(path.join(__dirname+'/public/how_to.html'));
});

app.get('/visualization',function(req,res){  
     res.sendFile(path.join(__dirname+'/public/dag_treemap/visualization_dag_treemap.html'));
     
});


app.listen(3000);

console.log('Working directory : '+__dirname+'/public\n');
console.log('Running at Port 3000      url =  localhost:3000');
console.log('Ctrl-C  to close the server\n');

