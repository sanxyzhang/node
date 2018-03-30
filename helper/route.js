const fs=require("fs");
const promisify=require('util').promisify;
const stat=promisify(fs.stat);
const readdir=promisify(fs.readdir);
const handlebars=require('../handlebars');
const path=require("path");
const config=require("../config/defaultConfig");
const mime=require('./mime');
const tplPath=path.join(__dirname,"../template/dir.html");
const compress=require('../helper/compress');
const source=fs.readFileSync(tplPath);
const template=handlebars.compile(source.toString());
module.exports=async function(req,res,filePath){
    try{
        const stats=await stat(filePath);
        if(stats.isFile()){
          res.statusCode=200;
          const contentType=mime(filePath);
          res.setHeader('Content-Type',contentType);
          let rs=fs.createReadStream(filePath);
          //压缩代码
         if(filePath.match(config.compress)){
           rs=compress(rs,req,res);
          }
          rs.pipe(res);
        }
        else if(stats.isDirectory()){
            const files=await readdir(filePath);
            res.statusCode=200;
            res.setHeader('Content-Type','text/html');
           const dir=path.relative(config.root,filePath);
            const data={
                title:path.basename(filePath),
                dir:dir?'/${dir}':'',
                files
            };
            res.end(template(data));
        /*  fs.readdir(filePath,(err,files)=>{
            res.statusCode=200;
            res.setHeader('Content-Type','text/plain');
            res.end(files.join(","));
          });*/
        }   
      }
      catch(ex){
        console.error(ex);
        res.statusCode=404;
        res.setHeader('Content-Type','text/plain');
        res.end(filePath +"is not a directory"+ex.toString());
        return;
      }

}