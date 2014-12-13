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
var _CHACHE_COUNT = "Cache count"

function writeFileTikzBoxplot(file, objects){
	var xIndexes = [];
	var xticklabels = [];
	var medianPlot = [];
	var boxPlots = [];

	var extraAllignmentBoxes = [];
	var extraPlot = [];

	if(!_.isUndefined(objects[0].avgCacheCounts)){
		extraPlot.push("\\addplot[thick, orange!70] coordinates {");
	}

	for(var i = 0; i < objects.length; i++){
		xIndexes.push(i + 1);
		xticklabels.push(objects[i].xAxisLabel);
		
		boxPlots.push("%% " + objects[i].fileName);
		boxPlots.push([
			'	\\buildBoxPlot{' + objects[i].cycleTime.median,
			objects[i].cycleTime.upperQuardant,
			objects[i].cycleTime.lowerQuardant,
			objects[i].cycleTime.max,
			objects[i].cycleTime.min + '}'
		].join('}{') + '\n');

		medianPlot.push("			(" + (i + 1) + " ," + objects[i].cycleTime.median + ")");

		extraAllignmentBoxes.push("\\buildBoxPlot[black]{0}{0}{0}{0}{0}");
		if(!_.isUndefined(objects[0].avgCacheCounts)){
			extraPlot.push("		(" + (i + 1) + " ," + objects[i].avgCacheCounts + ")");
/*			extraAllignmentBoxes.push([
				'	\\buildBoxPlot{' + objects[i].cacheData.median,
				objects[i].cacheData.upperQuardant,
				objects[i].cacheData.lowerQuardant,
				objects[i].cacheData.max,
				objects[i].cacheData.min + '}'
			].join('}{') + '\n');
		}else{
			extraAllignmentBoxes.push("\\buildBoxPlot[black]{0}{0}{0}{0}{0}");
			*/
		}
	}

	if(!_.isUndefined(objects[0].avgCacheCounts)){
		extraPlot.push("	};");
	}


	var data = [		
		"\\begin{tikzpicture}",
		"\\begin{axis}",
		"	[",
		"		width=\\textwidth,",
		"		axis y line*=left,",
		"		xlabel=" + (objects[0].xAxisType === "msleep" ? "Sleeptime (ms)" : "Number of turbines") + ",",
		"		ylabel=Regulation cycle time (ms),",
		"		ymin = 0,",
		"		xtick={" + xIndexes.join(', ') + "},",
		"		xticklabels={" + xticklabels.join(', ') + "},",
		"		boxplot/draw direction=y",
		"	]",
		"",
		boxPlots.join('\n'),
		"",
		"\\addplot[thick, red!70] coordinates {",
		medianPlot.join('\n'),
		"",
		"};",
		"",
		"\\end{axis}",
		"\\end{tikzpicture}",
		""].join('\n');
	if(!_.isUndefined(objects[0].avgCacheCounts)){	
		data += [
			"\\begin{tikzpicture}",
			"\\begin{axis}",
			"	[",
			"		width=\\textwidth,",
			"		axis y line*=left,",
			"		xlabel=" + (objects[0].xAxisType === "msleep" ? "Sleeptime (ms)" : "Number of turbines") + ",",
			"		ymin = 0,",
			"		ylabel=Average Cache hits,",
			"		xtick={" + xIndexes.join(', ') + "},",
			"		xticklabels={" + xticklabels.join(', ') + "},",
			"		boxplot/draw direction=y",
			"	]",
			extraAllignmentBoxes.join('\n'),
			extraPlot.join('\n'),
			"\\end{axis}",
			"\\end{tikzpicture}"
		].join('\n');
	}

	return writeFile(file, data);
}

function writeFileJson(file, objects){
	var data = JSON.stringify(objects, null, 2);
	return writeFileJson(file, data);
}

function writeFile(file, data){
	var deferred = q.defer();
	if(_.isArray(file)){
		file = file.join('/');
	}
	console.log("writing file: " + file);
	fs.writeFile(file, data, function(err){
		if(err === null){
			deferred.resolve();
		}else{
			console.log("Error writing file: " + file);
			deferred.reject(err);
		}
	});

	return deferred.promise;
}

function createBoxData(values, factor){
	values = values.sort(function(a, b){
		return a-b;
	});

	var quardant = values.length / 4;

	var iUpperQuardant =  Math.round(quardant * 3 );
	var iMedian =  Math.round(values.length / 2 );
	var iLowerQuardant =  Math.round(quardant);


	return {
		max: values[values.length -1 ] / factor,
		upperQuardant: values[iUpperQuardant] / factor,
		median: values[iMedian] / factor,
		lowerQuardant: values[iLowerQuardant] / factor,
		min: values[0]  / factor
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
	var NS_TO_MS_FACTOR = 1000000;

	function _createObj(name, err, data){
		var cycleLabel;
		var avgCacheCounts = null;
		var cacheData = null;

		if( _.isNaN( parseInt( data[0][_AVG_FIELD_NAMES[0]] ) ) ){
			cycleLabel = _AVG_FIELD_NAMES[1];
		}else{
			cycleLabel = _AVG_FIELD_NAMES[0];
		}

		for(var i = 0; i < data.length; i++){
			data[i][cycleLabel] = parseInt(data[i][cycleLabel]);
			if(!_.isUndefined(data[i][_CHACHE_COUNT])){
				data[i][_CHACHE_COUNT] = parseInt(data[i][_CHACHE_COUNT]);				
			}
			if(data[i][cycleLabel] === 0){
				data.splice(--i, 1);
			}
		}

		var cycledata = createBoxData(data.map(function(value){
			return parseInt(value[cycleLabel]);
		}), NS_TO_MS_FACTOR);

		if(data.length > 0 && !_.isUndefined(data[0][_CHACHE_COUNT]) ){
			var totalCacheCounts = 0;
			for(var i = 0; i < data.length; i++){
				totalCacheCounts += data[i][_CHACHE_COUNT];
			}
			avgCacheCounts = totalCacheCounts / data.length;

/*			cacheData = createBoxData(data.map(function(value){
				return parseInt(value[_CHACHE_COUNT]);
			}), 1);*/

		}

		var newObj = {
			"xAxisLabel": xAxisLabel,
			"fileName": file,
			"xAxisType": parameters.type,
			"cycleTime": cycledata,
			"cacheData": cacheData
		};
		if(_.isNumber(avgCacheCounts)){
			newObj.avgCacheCounts = avgCacheCounts;
		}
		
		obj.results.unshift(newObj);
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
		if(--obj.i >= 0){
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
			//console.log(JSON.stringify(parameters, null, 2));
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

	var files = fs.readdirSync(searchDir.join('/'));
	//console.log(searchDir.join('/'));
	var csvFiles = [];
	var dirsToProcess = [];
	for(var i = 0; i < files.length; i++){
		var elm = files[i];
		if(elm.charAt(0) === "." || elm === "TestCalc" || elm === _RESULT_FOLDER){
			continue;
		}

		var file = searchDir.concat([elm]);
		var isDir = fs.statSync(file.join('/')).isDirectory();

		if(isDir){
			dirsToProcess.push(file);
		}else if(elm.match(/.csv$/)){
			csvFiles.push(file);
		}
	}

	if(csvFiles.length > 0){
		var resultDir = searchDir.concat([_RESULT_FOLDER]).join('/');
		if(!fs.existsSync(resultDir) ){
			fs.mkdirSync(resultDir);
		}
		processFiles(csvFiles, _parameters).then(function(results){
//			writeFileJson(resultDir +  "/UsedParameters.json", _parameters);
//			writeFileJson(resultDir +  "/boxplot.json", results);
			writeFileTikzBoxplot(resultDir +  "/boxplot.tex", results);
			for(var i = 0; i < dirsToProcess.length; i++){
				processDir(dirsToProcess[i], _parameters);				
			}
		});	
	}else{
		for(var i = 0; i < dirsToProcess.length; i++){
			processDir(dirsToProcess[i], _parameters);				
		}
	}
}
processDir(searchDir, {});
