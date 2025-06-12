function parse1xMesh(MESHDATA, is10) {
  var vectors = MESHDATA.replace(/]/g, "").split("[");
  var h = vectors.shift();
  var positions = [];
  var normal = [];
  var uv = [];
  // 1.00 assets are scaled up by 2x in the file-
  var offset = is10 ? 0.5 : 1;

  function toVector(vstring, offst) {
    var a = [];
    for (var i of vstring.split(",")) {
      a.push(parseFloat(i) * offst);
    }
    return a;
  }
  for (var i = 0; i < vectors.length; i += 3) {
    positions.push(...toVector(vectors[i], offset));
    normal.push(...toVector(vectors[i + 1], 1));
    uv.push(...toVector(vectors[i + 2], 1));
  }
  console.log(
    `Parsed version 1 mesh\n\nDetails:\nVectors: ${vectors.length} (/ 3 = ${
      vectors.length / 3
    })\n\nHeader:`,
    h
  );
  vectors = null;
  return {
    positions,
    normal,
    uv
  };
}

function parse2x3xMesh(dv) {
  var headerStart = 13;
  var MeshHeader = {
    sizeof_MeshHeader: dv.getUint16(headerStart, true),
    sizeof_Vertex: dv.getUint8(headerStart + 2, true),
    sizeof_Face: dv.getUint8(headerStart + 3, true),
    numVerts: dv.getUint32(headerStart + 4, true),
    numFaces: dv.getUint32(headerStart + 8, true)
  };
  if (MeshHeader.sizeof_MeshHeader > 12) {
    // v3 header
    MeshHeader.sizeof_LOD = dv.getUint16(headerStart + 4, true);
    MeshHeader.numLODs = dv.getUint16(headerStart + 6, true);
    MeshHeader.numVerts = dv.getUint16(headerStart + 8, true);
    MeshHeader.numFaces = dv.getUint16(headerStart + 12, true);
  }
  console.log("Parsing version 2/3 mesh\n\nDetails:\n" + JSON.stringify(MeshHeader));
  var i = headerStart + MeshHeader.sizeof_MeshHeader;
  var verticies = [];
  var verticiesEnd =
    headerStart +
    MeshHeader.sizeof_MeshHeader +
    MeshHeader.numVerts * MeshHeader.sizeof_Vertex;
  while (i < verticiesEnd) {
    var vertex = {
      px: dv.getFloat32(i, true),
      py: dv.getFloat32(i + 4, true),
      pz: dv.getFloat32(i + 8, true),
      nx: dv.getFloat32(i + 12, true),
      ny: dv.getFloat32(i + 16, true),
      nz: dv.getFloat32(i + 20, true),
      u: dv.getFloat32(i + 24, true),
      v: dv.getFloat32(i + 28, true),
      w: dv.getFloat32(i + 32, true),
      r: 255,
      g: 255,
      b: 255,
      a: 255
    };
    if (MeshHeader.sizeof_Vertex >= 40) {
      vertex.r = dv.getUint8(i + 36, true);
      vertex.g = dv.getUint8(i + 37, true);
      vertex.b = dv.getUint8(i + 38, true);
      vertex.a = dv.getUint8(i + 39, true);
    }
    if (MeshHeader.sizeof_MeshHeader > 12) vertex.u = vertex.u;
    verticies.push(vertex);
    i += MeshHeader.sizeof_Vertex;
  }

  var faces = [];
  var facesEnd = verticiesEnd + MeshHeader.numFaces * MeshHeader.sizeof_Face;
  while (i < facesEnd) {
    faces.push({
      a: dv.getUint32(i, true),
      b: dv.getUint32(i + 4, true),
      c: dv.getUint32(i + 8, true)
    });
    i += MeshHeader.sizeof_Face;
  }

  var LODs = [];
  if (MeshHeader.sizeof_MeshHeader > 12) {
    var lodsEnd = facesEnd + MeshHeader.numLODs * MeshHeader.sizeof_LOD;
    while (i < lodsEnd) {
      LODs.push(dv.getUint32(i, true));
      i += MeshHeader.sizeof_LOD;
    }
  }

  console.log({
    MeshHeader,
    verticies,
    faces,
    LODs
  });

  var positions = [];
  var normal = [];
  var uv = [];

  for (var faceIdx in faces) {
    if (LODs.length > 1 && faceIdx > LODs[1]) break;
    var face = faces[faceIdx];
    for (var i in face) {
      var vertex = verticies[face[i]];
      positions.push(vertex.px, vertex.py, vertex.pz);
      normal.push(vertex.nx, vertex.ny, vertex.nz);
      uv.push(vertex.u, 1 - vertex.v, vertex.w);
    }
  }

  return {
    positions,
    normal,
    uv
  };
}

let meshCache = {};
export function parseMesh(data, meshId) {
  if (meshCache[meshId]) return meshCache[meshId];
  let returnValue;
  var stringData = new TextDecoder().decode(data);
  if (stringData.startsWith("version 1.0")) {
    returnValue = parse1xMesh(stringData, stringData.startsWith("version 1.0"));
  } else if (
    stringData.startsWith("version 2.0") ||
    stringData.startsWith("version 3.0")
  ) {
    console.log("Parsing v2/3 mesh, header: ", stringData.substring(0, 12));
    returnValue = parse2x3xMesh(new DataView(data));
  } else {
    console.log("unsupported mesh " + stringData.split("\n")[0]);
  }
  meshCache[meshId] = returnValue;
  return returnValue;
}