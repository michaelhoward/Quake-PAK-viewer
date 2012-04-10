// q1.js - Used to load a Quake 1 PAK file
// Michael Howard 2012


var PAK = new Object();
PAK.dataFile = "";
PAK.dataAccess = "";
PAK.files = new Array();
PAK.header = new Object();
PAK.bsps = new Array();
var renderer = new THREE.WebGLRenderer();
var clock = new THREE.Clock();
var camera = new THREE.PerspectiveCamera(90, 640/480, 1, 1000);
	
//
// File IO Functions
//

function LoadFile(evt)
{
	var reader = new FileReader();
	reader.onerror = errorHandler;
	reader.onload = completeHandler;
	reader.readAsArrayBuffer(evt.target.files[0]);
}

function errorHandler(evt)
{
    switch(evt.target.error.code) {
      case evt.target.error.NOT_FOUND_ERR:
        alert('File Not Found!');
        break;
      case evt.target.error.NOT_READABLE_ERR:
        alert('File is not readable');
        break;
      case evt.target.error.ABORT_ERR:
        break; // noop
      default:
        alert('An error occurred reading this file.');
    };
}

function completeHandler(evt)
{

	//set up 3d

	
	renderer.setSize(640,480);
	renderer.domElement.style.border = '1px solid black';
	document.body.appendChild(renderer.domElement);
	
		scene = new THREE.Scene();
	camera.position.set(0,0,0);
	camera.lookAt(new THREE.Vector3(100,0,0));
	
	scene.add(camera);	

//	controls = new THREE.FlyControls(camera);
//	controls.movementSpeed = 100;
//	controls.lookSpeed = 1;

	// create PAK objects
	PAK.dataFile = evt.target.result;
	PAK.dataAccess = new Uint8Array(PAK.dataFile);
	PAK.dataView = new DataView(PAK.dataFile,0);
	
	// load data
	LoadHeader();
	LoadDirectory();
	parsePAK();
	
}

//3d Functions

function vertexFromEdge(bsp, vertex)
{
	var v = new THREE.Vertex(new THREE.Vector3(PAK.bsps[bsp].vertices[vertex].x, PAK.bsps[bsp].vertices[vertex].y, PAK.bsps[bsp].vertices[vertex].z));
	return v;
}

function drawBSP(bsp)
{
console.log('drawing bsp '+bsp);
var material = new THREE.LineBasicMaterial({color:0x0000FF});


for (var i=0; i<PAK.bsps[bsp].edges.length; i++)
{
	var geometry = new THREE.Geometry();
	geometry.vertices.push(vertexFromEdge(bsp,PAK.bsps[bsp].edges[i].startV));
	geometry.vertices.push(vertexFromEdge(bsp,PAK.bsps[bsp].edges[i].endV));

	var line = new THREE.Line(geometry, material);
	//console.log('adding line to scene');
	scene.add(line);
}

setInterval("render()", 30/1000);

//renderer.render(scene, camera);

}

function render()
{
controls.update( clock.getDelta() );
renderer.render( scene, camera );
}

// Utility Function
function readString(at,chars)
{
	var result = "";


	for (var i=at; i< (at+chars); i++)
	{
		result = result + String.fromCharCode(PAK.dataAccess[i]);
	}

	return result;
}

function readStringFromFile(j, at,chars)
{
	var result = "";
	for (var i=at; i< (at+chars); i++)
	{
		result = result + String.fromCharCode(PAK.files[j].dataAccess[i]);
	}
	return result;
}

function readLongFromPAK(at)
{
	//console.log('reading long at: '+at);
	//var result = new Int32Array(PAK.dataFile,at,1);
	//return result[0];
	
	return PAK.dataView.getInt32(at, true);
}

function readLongFromFile(i, at)
{
	return PAK.files[i].dataView.getInt32(at, true);

}

function readUnsignedLongFromFile(i, at)
{
	return PAK.files[i].dataView.getUint32(at, true);

}



function readFloatFromFile(i, at)
{
	return PAK.files[i].dataView.getFloat32(at, true);

}

function readUnsignedShortFromFile(i, at)
{
	return PAK.files[i].dataView.getUint16(at, true);

}

function readShortFromFile(i, at)
{
	return PAK.files[i].dataView.getInt16(at, true);

}

function readUnsignedByteFromFile(i, at)
{
	return PAK.files[i].dataView.getUint8(at, true);

}


//
// Main Functions
//

function LoadHeader()
{
	console.log('Loading PAK File');
	var offset = 0;
	PAK.header.name = readString(0,4);
	
	if (PAK.header.name == "PACK")
	{
		console.log('Valid PACK detected');
	}
	else
	{
		return -1;
	}
	
	offset = offset + 4;
	PAK.header.directoryOffset = readLongFromPAK(offset);
	offset = offset + 4;
	
	PAK.header.directorySize = readLongFromPAK(offset);
	
	PAK.header.directoryCount = PAK.header.directorySize / 64;
	
	console.log('PAK file header load complete');
}

function LoadDirectory()
{
	var offset = PAK.header.directoryOffset;
	
	for (var i=0; i < PAK.header.directoryCount; i++)
	{
		PAK.files[i] = new Object();
		PAK.files[i].name = readString(offset, 56);
		offset = offset + 56;
		PAK.files[i].offset = readLongFromPAK(offset);
		offset = offset + 4;
		
		PAK.files[i].size = readLongFromPAK(offset);
		offset = offset + 4;
		
		console.log(PAK.files[i].name + ' '+PAK.files[i].offset+' '+PAK.files[i].size);
	
		PAK.files[i].data = PAK.dataFile.slice(PAK.files[i].offset, PAK.files[i].offset + PAK.files[i].size);
	
		PAK.files[i].dataView = new DataView(PAK.files[i].data,0);
		PAK.files[i].dataAccess = new Uint8Array(PAK.files[i].data);
	}

}

function addWave(i)
{

	var selector = document.getElementById('soundSelector');
	var option = document.createElement('option');
	var name = document.createTextNode(PAK.files[i].name);
	
	option.setAttribute('value', i);
	option.appendChild(name);
	selector.appendChild(option);
}

function parseWave(i)
{

	var bb = new WebKitBlobBuilder();
	bb.append(PAK.files[i].data);

	//var player = new Audio(window.webkitURL.createObjectURL(makeWave(i)));
	var player = document.getElementById('player');
	player.src = window.webkitURL.createObjectURL(bb.getBlob("audio/wav"));
	//player.play();
	//player.id = 'player'+i;
	//player.controls = true;
	
	
}

function changeWave(evt)
{
	parseWave(evt.target.value);
}


function parseBSP(i)
{
	console.log('Parsing BSP: '+i);
	var currentBSP = PAK.bsps.length;
	
	PAK.bsps[currentBSP] = new Object();
	
	PAK.bsps[currentBSP].header = new Object();
	PAK.bsps[currentBSP].id = i;
	var offset = 0;
	
	PAK.bsps[currentBSP].header.version = readLongFromFile(i, offset);
	offset = offset + 4;
	
	if (PAK.bsps[currentBSP].header.version != 29)
	{
		console.log('Invalid BSP version - expected 29 ='+PAK.bsps[currentBSP].header.version);
		return -1;
	}
	
	//1- entities 
	PAK.bsps[currentBSP].header.entitiesOffset = readLongFromFile(i, offset);
	offset = offset + 4;
	
	PAK.bsps[currentBSP].header.entitiesSize = readLongFromFile(i, offset);
	offset = offset + 4;
	
	
	//2 - Planes
	PAK.bsps[currentBSP].header.planesOffset = readLongFromFile(i, offset);
	offset = offset + 4;
	
	PAK.bsps[currentBSP].header.planesSize = readLongFromFile(i, offset);
	offset = offset + 4;
	
		
	//3 - Textures
	PAK.bsps[currentBSP].header.miptexturesOffset = readLongFromFile(i, offset);
	offset = offset + 4;
	
	PAK.bsps[currentBSP].header.miptexturesSize = readLongFromFile(i, offset);
	offset = offset + 4;
	
	//4-Vertices
	PAK.bsps[currentBSP].header.verticesOffset = readLongFromFile(i, offset);
	offset = offset + 4;
	
	PAK.bsps[currentBSP].header.verticesSize = readLongFromFile(i, offset);
	offset = offset + 4;
	
	//5 - Visibility
	PAK.bsps[currentBSP].header.vislistsOffset = readLongFromFile(i, offset);
	offset = offset + 4;
	
	PAK.bsps[currentBSP].header.vislistsSize = readLongFromFile(i, offset);
	offset = offset + 4;
	
	//6 - BSP Nodes
	PAK.bsps[currentBSP].header.nodesOffset = readLongFromFile(i, offset);
	offset = offset + 4;
	
	PAK.bsps[currentBSP].header.nodesSize = readLongFromFile(i, offset);
	offset = offset + 4;
	
	
	//7 - Texture Info
	PAK.bsps[currentBSP].header.textureinfosOffset = readLongFromFile(i, offset);
	offset = offset + 4;
	
	PAK.bsps[currentBSP].header.textureinfosSize = readLongFromFile(i, offset);
	offset = offset + 4;

	//8 - Faces
	PAK.bsps[currentBSP].header.facesOffset = readLongFromFile(i, offset);
	offset = offset + 4;
	
	PAK.bsps[currentBSP].header.facesSize = readLongFromFile(i, offset);
	offset = offset + 4;


	//9 - Lightmaps
	PAK.bsps[currentBSP].header.lightmapsOffset = readLongFromFile(i, offset);
	offset = offset + 4;
	
	PAK.bsps[currentBSP].header.lightmapsSize = readLongFromFile(i, offset);
	offset = offset + 4;
	
	
	//10 - Clip Nodes
	PAK.bsps[currentBSP].header.clipnodesOffset = readLongFromFile(i, offset);
	offset = offset + 4;
	
	PAK.bsps[currentBSP].header.clipnodesSize = readLongFromFile(i, offset);
	offset = offset + 4;
	
	//11 - BSP Leaves
	PAK.bsps[currentBSP].header.leavesOffset = readLongFromFile(i, offset);
	offset = offset + 4;
	
	PAK.bsps[currentBSP].header.leavesSize = readLongFromFile(i, offset);
	offset = offset + 4;
	
	// 12 - List of Faces
	PAK.bsps[currentBSP].header.lfacesOffset = readLongFromFile(i, offset);
	offset = offset + 4;
	
	PAK.bsps[currentBSP].header.lfacesSize = readLongFromFile(i, offset);
	offset = offset + 4;
	
	
	//13 - Edges
	PAK.bsps[currentBSP].header.edgesOffset = readLongFromFile(i, offset);
	offset = offset + 4;
	
	PAK.bsps[currentBSP].header.edgesSize = readLongFromFile(i, offset);
	offset = offset + 4;
	
	
	//14 - List of Edges
	PAK.bsps[currentBSP].header.ledgesOffset = readLongFromFile(i, offset);
	offset = offset + 4;
	
	PAK.bsps[currentBSP].header.ledgesSize = readLongFromFile(i, offset);
	offset = offset + 4;
	
	//15 - Models
	PAK.bsps[currentBSP].header.modelsOffset = readLongFromFile(i, offset);
	offset = offset + 4;
	
	PAK.bsps[currentBSP].header.modelsSize = readLongFromFile(i, offset);
	offset = offset + 4;
	
	parseVertices(currentBSP);
	parseEdges(currentBSP);
	parseListOfEdges(currentBSP);
	parseFaces(currentBSP);
	parseTextureInfos(currentBSP);
	parseTextures(currentBSP);	
}

function parseTextures(bsp)
{
	var file = PAK.bsps[bsp].id;
	

	var offset = PAK.bsps[bsp].header.miptexturesOffset;
	
	var textureCount = readLongFromFile(file, offset);
	offset = offset + 4;
	
	console.log('Parsing '+textureCount+' Textures for file: '+file+' bsp: '+bsp);
	
	
	PAK.bsps[bsp].textures = new Array();
	
	for (var i=0; i<textureCount; i++)
	{
		PAK.bsps[bsp].textures[i] = new Object();
		PAK.bsps[bsp].textures[i].offset = readLongFromFile(file, offset);
		offset = offset + 4;		
	}
	
	for (var i=0; i<textureCount; i++)
	{
		if (PAK.bsps[bsp].textures[i].offset > 0)
		{
		//offset = PAK.bsps[bsp].textures[i].offset;
		
		offset = PAK.bsps[bsp].textures[i].offset + PAK.bsps[bsp].header.miptexturesOffset;
		
		PAK.bsps[bsp].textures[i].name = readStringFromFile(file, offset, 16);
		offset = offset + 16;
		
		PAK.bsps[bsp].textures[i].width = readUnsignedLongFromFile(file,offset);
		offset = offset + 4;
		
		PAK.bsps[bsp].textures[i].height = readUnsignedLongFromFile(file,offset);
		offset = offset + 4;
		
		PAK.bsps[bsp].textures[i].texture1Offset = readUnsignedLongFromFile(file,offset);
		offset = offset + 4;
		
		PAK.bsps[bsp].textures[i].data = new Uint8Array();
		
		var tOffset = PAK.bsps[bsp].textures[i].offset+ PAK.bsps[bsp].header.miptexturesOffset + PAK.bsps[bsp].textures[i].texture1Offset;
		
		console.log(PAK.bsps[bsp].textures[i].offset+' '+PAK.bsps[bsp].header.miptexturesOffset+' '+PAK.bsps[bsp].textures[i].texture1Offset);
		
		for (var j=0; j<PAK.bsps[bsp].textures[i].width*PAK.bsps[bsp].textures[i].height; j++)
		{
			PAK.bsps[bsp].textures[i].data[j] = readUnsignedByteFromFile(file, tOffset);
			tOffset = tOffset + 1;
		}
		
		PAK.bsps[bsp].textures[i].texture2Offset = readUnsignedLongFromFile(file,offset);
		offset = offset + 4;
		
		PAK.bsps[bsp].textures[i].texture3Offset = readUnsignedLongFromFile(file,offset);
		offset = offset + 4;
		
		PAK.bsps[bsp].textures[i].texture4Offset = readUnsignedLongFromFile(file,offset);
		offset = offset + 4;
		}
		else
		{
		console.log('Negative Offset for texture...');
		}
	}
}

function parseTextureInfos(bsp)
{
	var textureInfoCount = PAK.bsps[bsp].header.textureinfosSize /40;
	var offset = PAK.bsps[bsp].header.textureinfosOffset;
	var file = PAK.bsps[bsp].id;
	PAK.bsps[bsp].textureInfos = new Array();
	console.log('Parsing '+textureInfoCount+' Texture Infos for file: '+file+' bsp: '+bsp);
	
	for (var i=0; i<textureInfoCount; i++)
	{
		PAK.bsps[bsp].textureInfos[i] = new Object();
		
		PAK.bsps[bsp].textureInfos[i].sx = readFloatFromFile(file, offset);
		offset = offset + 4;
		PAK.bsps[bsp].textureInfos[i].sy = readFloatFromFile(file, offset);
		offset = offset + 4;
		PAK.bsps[bsp].textureInfos[i].sz = readFloatFromFile(file, offset);
		offset = offset + 4;
		
		PAK.bsps[bsp].textureInfos[i].sOffset = readFloatFromFile(file, offset);
		offset = offset + 4;
		
		PAK.bsps[bsp].textureInfos[i].tx = readFloatFromFile(file, offset);
		offset = offset + 4;
		PAK.bsps[bsp].textureInfos[i].ty = readFloatFromFile(file, offset);
		offset = offset + 4;
		PAK.bsps[bsp].textureInfos[i].tz = readFloatFromFile(file, offset);
		offset = offset + 4;
		
		PAK.bsps[bsp].textureInfos[i].tOffset = readFloatFromFile(file, offset);
		offset = offset + 4;
				
		PAK.bsps[bsp].textureInfos[i].texureId = readLongFromFile(file, offset);
		offset = offset + 4;
	
		PAK.bsps[bsp].textureInfos[i].animated = readLongFromFile(file, offset);
		offset = offset + 4;
	
	}
}


function parseVertices(bsp)
{

	var vertexCount = PAK.bsps[bsp].header.verticesSize / 12;
	var offset = PAK.bsps[bsp].header.verticesOffset;
	var file = PAK.bsps[bsp].id;
	PAK.bsps[bsp].vertices = new Array();
	console.log('Parsing vertices for file: '+file+' bsp: '+bsp);
	for (var i =0; i<vertexCount; i++)
	{
		PAK.bsps[bsp].vertices[i] = new Object();
		
		PAK.bsps[bsp].vertices[i].x = readFloatFromFile(file, offset);
		offset = offset + 4;
		PAK.bsps[bsp].vertices[i].y = readFloatFromFile(file, offset);
		offset = offset + 4;
		PAK.bsps[bsp].vertices[i].z = readFloatFromFile(file, offset);
		offset = offset + 4;
		
		
	}
}

function parseEdges(bsp)
{
	var edgeCount = PAK.bsps[bsp].header.edgesSize / 4;
	var offset = PAK.bsps[bsp].header.edgesOffset;
	
	var file = PAK.bsps[bsp].id;
	
	PAK.bsps[bsp].edges = new Array();
	
	console.log('Parsing Edges for file: '+file+' bsp: '+bsp);
	
	for (var i=0; i < edgeCount; i++)
	{
	PAK.bsps[bsp].edges[i] = new Object();
	PAK.bsps[bsp].edges[i].startV = readUnsignedShortFromFile(file, offset);
	offset = offset + 2;
	
	PAK.bsps[bsp].edges[i].endV = readUnsignedShortFromFile(file, offset);
	offset = offset + 2;
	
	
	}
}

function parseListOfEdges(bsp)
{
	var ledgeCount = PAK.bsps[bsp].header.ledgesSize / 2;
	var offset = PAK.bsps[bsp].header.ledgesOffset;
	
	var file = PAK.bsps[bsp].id;
	
	PAK.bsps[bsp].ledges = new Array();
	
	for (var i=0; i<ledgeCount; i++)
	{
		PAK.bsps[bsp].ledges[i] = new Object();
		PAK.bsps[bsp].ledges[i].edgeId = readShortFromFile(file, offset);
		offset = offset + 2;
	}
}

function parseFaces(bsp)
{
	var faceCount = PAK.bsps[bsp].header.facesSize / 20;
	var offset = PAK.bsps[bsp].header.facesOffset;
	
	var file = PAK.bsps[bsp].id;
	
	PAK.bsps[bsp].faces = new Array();
	
	console.log('Parsing Faces for file: '+file+' bsp: '+bsp);
	
	for (var i=0; i < faceCount; i++)
	{
	PAK.bsps[bsp].faces[i] = new Object();
	PAK.bsps[bsp].faces[i].plane = readUnsignedShortFromFile(file, offset);
	offset = offset + 2;
	
	PAK.bsps[bsp].faces[i].side = readUnsignedShortFromFile(file, offset);
	offset = offset + 2;
	
	
	PAK.bsps[bsp].faces[i].listOfEdgesId = readLongFromFile(file, offset);
	offset = offset + 4;
	
	PAK.bsps[bsp].faces[i].lifOfEdgesCount = readUnsignedShortFromFile(file, offset);
	offset = offset + 2;
	
	PAK.bsps[bsp].faces[i].textureInfoId = readUnsignedShortFromFile(file, offset);
	offset = offset + 2;	
	
	PAK.bsps[bsp].faces[i].lightType = readUnsignedByteFromFile(file, offset);
	offset = offset + 1;	
	
	PAK.bsps[bsp].faces[i].baseLight = readUnsignedByteFromFile(file, offset);
	offset = offset + 1;	
	
	PAK.bsps[bsp].faces[i].lightModel1 = readUnsignedByteFromFile(file, offset);
	offset = offset + 1;	
	
	PAK.bsps[bsp].faces[i].lightModel2 = readUnsignedByteFromFile(file, offset);
	offset = offset + 1;
	
	PAK.bsps[bsp].faces[i].lightMap = readLongFromFile(file, offset);
	offset = offset + 4;
	
	}
	
}




function parsePAK()
{
	console.log('Parsing the PAK File');

	for (var i=0; i < PAK.files.length; i++)
	{
	//based on their extension do something
	var fileType = PAK.files[i].name.split(".")[1].slice(0,3);
	switch (fileType)
	{
		case "wav":
			addWave(i);
		break;
	
		case "bsp":
			parseBSP(i);
		break;
	
		case "lmp":
		break;
	
		case "cfg":
		break;
	
		case "dat":
		break;
	
		case "bin":
		break;
	
		case "dem":
		break;
	
		case "mdl":
		break;
	
		case "rc":
		break;
	
		case "spr":
		break;
	
		case "rc":
		break;
		
		case "wad":
		break;
	
		default:
			
			
			console.log('Unknown File: '+fileType);
		break;
	}
	
	
	}


}


