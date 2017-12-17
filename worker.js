var VEC_LEN = 4;

onmessage = function (e) {
    var imgData = e.data[0];
    var k = e.data[1];
    var numPixels = e.data[2];

    // Allocate the memory
    var imgMem = Module._malloc(imgData.length * Float64Array.BYTES_PER_ELEMENT);
    var centersMem = Module._malloc(k * VEC_LEN * Float64Array.BYTES_PER_ELEMENT);
    var labelsMem = Module._malloc(numPixels * Int32Array.BYTES_PER_ELEMENT);

    Module.HEAPF64.set(imgData, imgMem / Float64Array.BYTES_PER_ELEMENT);
    Module.HEAP32.set(Int32Array.from(Array.from(Array(numPixels)).map(function (i, a) {
        return -1
    })), labelsMem / Int32Array.BYTES_PER_ELEMENT);

    // Run the algorithm
    Module._kmeans_from_js(k, imgMem, imgData.length, centersMem, labelsMem);

    // Get the results
    var centers = Module.HEAPF64.subarray(centersMem / Float64Array.BYTES_PER_ELEMENT, (centersMem / Float64Array.BYTES_PER_ELEMENT) + (k * VEC_LEN));
    var labels = Module.HEAP32.subarray(labelsMem / Int32Array.BYTES_PER_ELEMENT, (labelsMem / Int32Array.BYTES_PER_ELEMENT) + numPixels);

    centers = Array.from(centers).map(function (c) {
        return Math.round(c);
    });

    // Break centers into 2D array
    var colors = [];
    while (centers.length > 0) {
        colors.push(centers.splice(0, VEC_LEN));
    }

    // Free the memory
    Module._free(imgMem);
    Module._free(centersMem);
    Module._free(labelsMem);

    postMessage(["result", colors, labels]);
}

var Module = {
    onRuntimeInitialized: function () {
        postMessage(["init"]);
    }
}

importScripts('colors.js');