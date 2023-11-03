/**
 * author: Sven Lieber (sven.lieber@ugent.be)
 * Ghent University - imec - IDLab
 */
const path = require('path')
const git = require('isomorphic-git')
const httpGit = require('isomorphic-git/http/node')
const http = require('http')
const https = require('https')
const fs = require('fs')
const glob = require('glob')
const n3 = require('n3')
const toArray = require('stream-to-array')
const streamify = require('stream-array')

if (process.argv.length < 4) {
  console.error("Usage: node get-content.js [json config] [output directory]");
  process.exit(1);
}


async function main(configFile, outputDir){
  
  let sources = JSON.parse(fs.readFileSync(path.resolve(__dirname, configFile), 'utf8'));

  for(let i in sources){
    const e = sources[i];
    const outputFilename = path.resolve(outputDir, e.prefix+'.nt');
    const outputMetadataFilename = path.resolve(outputDir, e.prefix+'.json');
    if(!e.hasOwnProperty("ref")){
      e.ref = "master";
    }

    console.log("checking " + e.title);

    if(e.type == "file-url"){
      // handle entries which point to a single file online

      try{
        const nTriplesWriter = new n3.StreamWriter({'format': 'N-Triples'});
        const outputFile = fs.createWriteStream(outputFilename);
        outputFile.on('error', (error) => {console.error("Error while writing to file '" + outputFilename + "'");});
        if(e["file-type"] == "turtle"){
          const singleFileTurtleParser = new n3.StreamParser({'format': "N3"});
          singleFileTurtleParser.on('error', (error) => {console.log("Error while parsing turtle file from '" + e.url + "'");});
          let protocol = (e.url.startsWith("https")) ? https : http;
          singleFileTurtleParser.on('error', (error) => {console.error("Error while parsing turtle file"); console.log(error.message); });
          nTriplesWriter.on('error', (error) => {console.log("Error while creating n-triples file from single turtle file"); console.log(error.message);});
          protocol.get(e.url, res => res.pipe(singleFileTurtleParser).pipe(nTriplesWriter).pipe(outputFile));
        } else{
          console.log("unknown file type: '" + e["file-type"] + "'");
        }
      }catch(error){
        console.error("Error while processing single file from URL '" + e.url + "'");
        console.error(error.message);
        console.log(error);
      }

    } else if(e.type == "file-local"){
      // handle entries which point to a single file on the local file system
      try{
        const nTriplesWriter = new n3.StreamWriter({'format': 'N-Triples'});
        const outputFile = fs.createWriteStream(outputFilename);
        outputFile.on('error', (error) => {console.error("Error while writing to file '" + outputFilename + "'");});
        if(e["file-type"] == "turtle"){
          const singleFileTurtleParser = new n3.StreamParser({'format': "N3"});
          singleFileTurtleParser.on('error', (error) => {console.log("Error while parsing turtle file from '" + e.path + "'");});
          singleFileTurtleParser.on('error', (error) => {console.error("Error while parsing turtle file"); console.log(error.message); });
          nTriplesWriter.on('error', (error) => {console.log("Error while creating n-triples file from single turtle file"); console.log(error.message);});
          const turtleFileReader = fs.createReadStream(path.resolve(outputDir, e.path));
          turtleFileReader.pipe(singleFileTurtleParser).pipe(nTriplesWriter).pipe(outputFile);
        } else{
          console.log("unknown file type: '" + e["file-type"] + "'");
        }

      }catch(error){
        console.error("Error while processing single file from local file system '" + e.path + "'");
        console.error(error.message);
        console.log(error);
      }
    } else if(e.type == "git"){
      // handle entries which store their shapes in git repositories where we have to get it from

      let repoDir = path.resolve(outputDir, e.prefix+'-repo');
      try{
        if (fs.existsSync(repoDir) && fs.readdirSync(repoDir).length > 1){
          // don't clone again
          console.log("using existing repo directory");
        } else {
          let repo = await git.clone({ fs, http: httpGit, singleBranch: true, dir: repoDir, url: e.url, ref: e.ref})
        }
      } catch(error){
        console.error("Couldn't fetch repo: '" + e.url + "'");
        console.error(error.message);
        fs.rmdirSync(repoDir, {recursive: true});
      }
       
      try{

        // we want one merged file with all the shapes of this repo
        const mergedWriter = new n3.StreamWriter({'format': 'N-Triples'});
        mergedWriter.on('error', (error) => {console.log("Incomplete data for file '" + outputFilename + "'. Error in one file of '" + e.title + "' (" + e.url + ")"); console.log(error.message);});
        mergedWriter.on('close', () => {console.log("Merged writer was closed");});
        const mergedFile = fs.createWriteStream(outputFilename);

        // there might be several specified subfolders in which we have too look recursively for shapes
        for(j in e.folder){

          // there might be different file formats we have to check for which we obviously need different input parsers
          for(k in e["file-type"]){
            let fileFormat = e["file-type"][k];
            let baseFolder = path.resolve(repoDir, e["folder"][j]);
            mergeFiles(baseFolder, mergedWriter, fileFormat);
          }
        }
        // when all done write everything to file
        mergedWriter.pipe(mergedFile);

      } catch(error){
        console.error("Couldn't create merged N-triples file");
        console.error(error.message);
        console.error(error);
      }
  
    } else {
      console.error("unknown type: '" + e.type + "'");
    }
    fs.writeFileSync(outputMetadataFilename, JSON.stringify(e));
  }
}


// Based on fileFormat check content of baseFolder, parse and pipe into given writer
async function mergeFiles(baseFolder, writer, fileFormat){

  try{
    let pathExpression;
    let parserFormat;

    // Extension point to handle more formats
    if(fileFormat == "turtle"){
      pathExpression = baseFolder + "/**/*.ttl";
      parserFormat = "N3"
    } else {
      console.error("unknown file format: '" + fileFormat + "'");
      return;
    }

    // get all files of the specified folder recursively
    let files = glob.sync(pathExpression, {});
    for(f in files){
      let currentFile = files[f];

      // read and parse each file and pass it to the merged writer
      const parser = new n3.StreamParser({'format': parserFormat});
      const reader = fs.createReadStream(files[f]); 
      reader.pipe(parser);

      // It could be that some of the files are malformed, they should be excluded from merging
      let triples;
      try{
        console.log("Parsing '" + currentFile + "'");
        triples = await toArray(parser);
      } catch(error){
        console.error("Parse error for file '" + currentFile + "'");
        console.error(error.message);
      }
      if(triples){
        if(f == (files.length-1)){
          streamify(triples).pipe(writer);
        } else {
          streamify(triples).pipe(writer, {end: false});
        }
      } else {
        console.log("No triples");
      }
    }
  } catch(error){
    console.log("couldn't read or parse a file in '" + baseFolder + "'");
    console.log(error);
  }
}


main(process.argv[2], process.argv[3]);
