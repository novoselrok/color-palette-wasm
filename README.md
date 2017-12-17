# Color Palette using WASM and K-Means

[DEMO](https://novoselrok.github.io/color-palette-wasm/)

![Demo of the color palette finder](./assets/demo.gif)

### Description

- Image is resized to maximum width of 1024 pixels
- The number of colors corresponds to the number of clusters in k-means
- K-means runs for 10 iterations or exits if less than 1% of pixels changed clusters
- Cluster centers (means) are the actual colors that are drawn
- You can hover over the colors to see which pixels belong to that cluster

### Files
- `main.c` contains the k-means algorithm
- `js/index.js` sets up the web app and runs the wasm code
- `colors.js` and `colors.wasm` are the outputs from Emscripten

## Compiling the C code

*Before compiling you need to have Emscripten installed.*

```bash
emcc main.c -O3 -o colors.js -s WASM=1 -s EXPORTED_FUNCTIONS="['_kmeans_from_js']" -s NO_EXIT_RUNTIME=1 -s ALLOW_MEMORY_GROWTH=1
```

## Todo
- ~~Move the k-means calculation to a WebWorker~~
- Use k-means++ for initial centers
