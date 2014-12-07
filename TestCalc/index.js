// node samples/sample.js

var parse = require('csv').parse;
var fs = require('fs');
var q = require('q');
var _ = require('lodash-node');
var jStat = require('jStat');

var searchDir = __dirname.split('/');
searchDir.pop();

var _RESULT_FOLDER = "CalcResult";
var _PARAMETER_FILE = "parameters.json";

var _AVG_FIELD_NAMES = ["MS since last write", "sig2:MS since last write"];

function writeFileTikzBoxplot(file, objects){
	var deferred = q.defer();
	debugger;
	var xIndexes = [];
	var xticklabels = [];

	for(var i = 0; i < objects.length; i++){
		xIndexes.push(i + 1);
		xticklabels.push(objects[i].xAxisLabel);
	}

	var data = [
		"\\begin{tikzpicture}",
		"	\\begin{axis}",
		"	[",
		"		width=\\textwidth,",
		"		xlabel=" + (objects[0].xAxisType === "msleep" ? "Sleeptime (ms)" : "Number of turbines") + ",",
		"		ylabel=Regulation cycle time (ms),",
		"		xtick={" + xIndexes.join(', ') + "},",
		"		xticklabels={" + xticklabels.join(', ') + "},",
		"		boxplot/draw direction=y",
		"	]",
		""
	].join('\n');
	
	for(var i = 0; i < objects.length; i++){
	    data += [
	        '	\\buildBoxPlot{' + objects[i].median,
	        objects[i].upperQuardant,
	        objects[i].lowerQuardant,
	        objects[i].max,
	        objects[i].min + '}'
	    ].join('}{') + "\n\n";
	}

	data += "\\addplot[thick, red] coordinates {\n"
	for(var i = 0; i < objects.length; i++){
		data += "(" + (i + 1) + " ," + objects[i].median + ")\n";
	}	
	data +="};\n"


	data += ["\\end{axis}",
	"\\end{tikzpicture}"
	].join('\n');

	fs.writeFile(file, data, function(err){
		if(err === null){
			console.log("File Written: " + file);
			deferred.resolve();
		}else{
			deferred.reject(err);
		}
	});


	return deferred.promise;
}

function writeFileJson(file, objects){
	var deferred = q.defer();
	debugger;

	var data = JSON.stringify(objects, null, 2);
	fs.writeFile(file, data, function(err){
		if(err === null){
			deferred.resolve();
		}else{
			deferred.reject(err);
		}
	});

	return deferred.promise;
}

function createBoxData(values){
	var NS_TO_MS_FACTOR = 1000000;
	values = values.sort(function(a, b){
		return a-b;
	});

	while(values[0] === 0 && values.length !== 0){
		values.shift();
	}

	var quardant = values.length / 4;

	var iUpperQuardant =  Math.round(quardant * 3 );
	var iMedian =  Math.round(values.length / 2 );
	var iLowerQuardant =  Math.round(quardant);


	return {
		max: values[values.length -1 ] / NS_TO_MS_FACTOR,
		upperQuardant: values[iUpperQuardant] / NS_TO_MS_FACTOR,
		median: values[iMedian] / NS_TO_MS_FACTOR,
		lowerQuardant: values[iLowerQuardant] / NS_TO_MS_FACTOR,
		min: values[0]  / NS_TO_MS_FACTOR
	};
}

function getFileIndex(fileName){
	var index = fileName.split('.')[0];
	index = index.match(/\d*$/)[0];
	index = parseInt(index);
	return index;
}

function createObj(file, parameters, obj){
	var deferred = q.defer();
	var fileName = file[file.length -1];
	file = file.join("/"); // searchDir.concat([_PARAMETER_FILE]).join('/');
	var rs = fs.createReadStream(file);
	var fileNumberMappingFn;
	eval( "fileNumberMappingFn = " + parameters.FileNumberMapping.join('\n'));	
	var xAxisLabel = fileNumberMappingFn(getFileIndex(fileName));
	function _createObj(name, err, data){
		var cycleLabel;

		if( isNaN( parseInt( data[0][_AVG_FIELD_NAMES[0]] ) ) ){
			cycleLabel = _AVG_FIELD_NAMES[1];
		}else{
			cycleLabel = _AVG_FIELD_NAMES[0];
		}

		var cycledata = createBoxData(data.map(function(value){
			return parseInt(value[cycleLabel]);
		}));

		cycledata.xAxisType = parameters.type;
		cycledata.file = file;
		cycledata.xAxisLabel = xAxisLabel;
		obj.results.unshift(cycledata);
		deferred.resolve(obj);
	}

	parser = parse({columns: true}, _createObj.bind(this, file));
	rs.pipe(parser);
	return deferred.promise;
}

function processFiles(files, parameters) {
	var deferred = q.defer();
	var startObj = {
		results: [],
		i : files.length -1
	};

	function callback(obj){
		if(--obj.i > 0){
			createObj(files[obj.i], parameters, obj).then(callback);
		}else{
			obj.results = obj.results.sort(function(a, b){
				return parseInt(a.xAxisLabel)- parseInt(b.xAxisLabel);
			});

			deferred.resolve(obj.results);
		}
	}
	createObj(files[startObj.i], parameters, startObj).then(callback);
	return deferred.promise;
}

function loadParmeters(searchDir, parameters){
	var file = searchDir.concat([_PARAMETER_FILE]).join('/');
	parameters = _.cloneDeep(parameters); // work with a copy;
	if( fs.existsSync(file) ){
		try{
			var _parameters = fs.readFileSync(file);
			_parameters = JSON.parse(_parameters);
			parameters = _.merge(parameters, _parameters);
			console.log(JSON.stringify(parameters, null, 2));
			return parameters;
		}catch(e){
			debugger;
			console.log("Error parsing parameters: " + e);
			return parameters;
		}


	}else{
		return parameters;
	}
}

function processDir(searchDir, parameters) {
	var _parameters = loadParmeters(searchDir, parameters);

	fs.readdir(searchDir.join('/'), function(err, files){
		var csvFiles = [];
		files.forEach(function(elm){
			if(elm.charAt(0) === "." || elm === "TestCalc" || elm === _RESULT_FOLDER){
				return;
			}

			var file = searchDir.concat([elm]);
			var isDir = fs.statSync(file.join('/')).isDirectory();

			if(isDir){
				processDir(file, _parameters);
				return;
			}else if(!elm.match(/.csv$/)){
				return;
			}
			csvFiles.push(file);
		});

		if(csvFiles.length > 0){
			var resultDir = searchDir.concat([_RESULT_FOLDER]).join('/');
			if(!fs.existsSync(resultDir) ){
				fs.mkdirSync(resultDir);
			}
			processFiles(csvFiles, _parameters).then(function(results){
				writeFileJson(resultDir +  "/UsedParameters.json", _parameters);
				writeFileJson(resultDir +  "/boxplot.json", results);
				writeFileTikzBoxplot(resultDir +  "/boxplot.tex", results);
			});	
		}
	});
}
processDir(searchDir, {});
