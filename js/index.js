var MAX_WIDTH = 1024;
var VEC_LEN = 4;

var worker = new Worker('../worker.js');

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
        running: false
    },
    created: function () {
        var app = this;

        app.$on('moduleInitializedEvent', function () {
            app.moduleInitialized = true;
        });

        app.$on('kmeansDone', function (data) {
            app.colors = data[0];
            app.labels = data[1];
            app.running = false;
        });
    },
    methods: {
        run: function() {
            // Run the algorithm
            var app = this;
            app.running = true;
            var ctx = document.getElementById('canvas').getContext('2d');

            // Prepare the parameters
            var data = ctx.getImageData(0, 0, app.width, app.height);
            var k = parseInt(this.numColors, 10);
            var imgData = Float64Array.from(data.data);
            var numPixels = imgData.length / VEC_LEN;
            app.pixels = Array.from(imgData);

            worker.postMessage([imgData, k, numPixels]);
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

worker.onmessage = function (e) {
    var data = e.data;
    if (data[0] === "init") {
        App.$emit('moduleInitializedEvent');
    } else if (data[0] === "result") {
        App.$emit('kmeansDone', data.splice(1));
    }
}
