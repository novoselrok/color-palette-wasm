var MAX_WIDTH = 1024;
var VEC_LEN = 4;

var App = new Vue({
    el: '#app',
    data: {
        moduleInitialized: false,
        imageLoaded: false,
        colors: [],
        labels: [],
        pixels: [],

        colorHoverIdx: -1,

        width: 0,
        height: 0,

        numColors: '4',
    },
    created: function () {
        var app = this;

        app.$on('moduleInitializedEvent', function () {
            app.moduleInitialized = true;
        });
    },
    methods: {
        run: function() {
            // Run the algorithm
            var app = this;
            var ctx = document.getElementById('canvas').getContext('2d');

            // Prepare the parameters
            var data = ctx.getImageData(0, 0, app.width, app.height);
            var k = parseInt(this.numColors, 10);
            var imgData = Float64Array.from(data.data);
            var numPixels = imgData.length / VEC_LEN;

            // Allocate the memory
            var imgMem = Module._malloc(imgData.length * Float64Array.BYTES_PER_ELEMENT);
            var centersMem = Module._malloc(k * VEC_LEN * Float64Array.BYTES_PER_ELEMENT);
            var labelsMem = Module._malloc(numPixels * Int32Array.BYTES_PER_ELEMENT);

            Module.HEAPF64.set(imgData, imgMem / Float64Array.BYTES_PER_ELEMENT);
            Module.HEAP32.set(Int32Array.from(Array.from(Array(numPixels)).map(function (i, a) { return -1 })), labelsMem / Int32Array.BYTES_PER_ELEMENT);

            // Run the algorithm
            Module._kmeans_from_js(k, imgMem, imgData.length, centersMem, labelsMem);

            // Get the results
            var centers = Module.HEAPF64.subarray(centersMem / Float64Array.BYTES_PER_ELEMENT, (centersMem / Float64Array.BYTES_PER_ELEMENT) + (k * VEC_LEN));
            app.labels = Module.HEAP32.subarray(labelsMem / Int32Array.BYTES_PER_ELEMENT, (labelsMem / Int32Array.BYTES_PER_ELEMENT) + numPixels);
            app.pixels = Array.from(imgData);

            centers = Array.from(centers).map(function (c) {
                return Math.round(c);
            });
            
            // Break centers into 2D array
            var colors = [];
            while (centers.length > 0) {
                colors.push(centers.splice(0, VEC_LEN));
            }
            app.colors = colors;
            
            // Free the memory
            Module._free(imgMem);
            Module._free(centersMem);
            Module._free(labelsMem);
        },
        handleFileChange: function (ev) {
            var app = this;

            app.imageLoaded = false;
            app.colors = [];
            app.labels = [];
            app.pixels = [];
            app.colorHoverIdx = -1;

            if (ev.target.files && ev.target.files[0]) {
                var reader = new FileReader();
                
                reader.onload = function (e) {
                    var img = new Image();
                    img.onload = function () {
                        var ratio = this.width / this.height;
                        app.width = Math.min(this.width, MAX_WIDTH);
                        app.height = app.width / ratio;
                        
                        var ctx = document.getElementById('canvas').getContext('2d');
                        ctx.canvas.width = app.width;
                        ctx.canvas.height = app.height;

                        ctx.drawImage(img, 0, 0, app.width, app.height);
                        app.pixels = ctx.getImageData(0, 0, app.width, app.height);
                        app.imageLoaded = true;
                    };
                    img.src = e.target.result;
                }
    
                reader.readAsDataURL(ev.target.files[0]);
            }
        },
        getRgbaColor: function (color) {
            return 'rgba(' + color.join(',') + ')';
        },
        handleMouseOverColor: function (colorIdx) {
            var app = this;
            if (app.colorHoverIdx != colorIdx) {
                app.colorHoverIdx = colorIdx;
                var ctx = document.getElementById('canvas').getContext('2d');
                var imageData = ctx.getImageData(0, 0, app.width, app.height);

                var data = imageData.data;
                for (var i = 0; i < data.length; i += 4) {
                    if (app.labels[i / 4] != app.colorHoverIdx) {
                        // Make pixel transparent
                        data[i + 3] = 0;
                    } else {
                        // Reset the pixel
                        data[i] = app.pixels[i];
                        data[i + 1] = app.pixels[i + 1];
                        data[i + 2] = app.pixels[i + 2];
                        data[i + 3] = app.pixels[i + 3];
                    }
                }
                ctx.putImageData(imageData, 0, 0);
            }
        },
        handleMouseLeaveColors: function () {
            // Reset the canvas
            var app = this;
            app.colorHoverIdx = -1;
            var ctx = document.getElementById('canvas').getContext('2d');
            var imageData = ctx.getImageData(0, 0, app.width, app.height);

            var data = imageData.data;
            for (var i = 0; i < data.length; i += 4) {
                // Reset the pixel
                data[i] = app.pixels[i];
                data[i + 1] = app.pixels[i + 1];
                data[i + 2] = app.pixels[i + 2];
                data[i + 3] = app.pixels[i + 3];
            }
            ctx.putImageData(imageData, 0, 0);
        }
    }
});

Module['onRuntimeInitialized'] = function() {
    App.$emit('moduleInitializedEvent');
};
