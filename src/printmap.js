import layers from './layers.js';


class Printmap {
  constructor() {
    this.actualPixelRatio = window.devicePixelRatio;
    this.canceled = false;
  }

  setPixelRatio(dpi) {
    Object.defineProperty(window, 'devicePixelRatio', {
      get: () => dpi / 96
    });
  }

  resetPixelRatio() {
    Object.defineProperty(window, 'devicePixelRatio', {
      get: () => this.actualPixelRatio
    });
  }

  cancel() {
    console.log("Canceling");
    this.canceled = true;
  }

  generatePDF(map, options, progressfn) {
    // Calculate pixel ratio
    this.setPixelRatio(options.dpi);

    console.time("PDF generation");

    // initialise pdf. delete first page to simplify addImage-loop
    const pdf = new jspdf({compress: true});
    pdf.setFontSize(9);
    pdf.deletePage(1);

    // generate functions
    const loadMapImage = loadMap(map, options.format, options.margin);
    const addMapImage = addMap(pdf);

    let count = 0;
    const totalMaps = map.cutouts.features.length;
    progressfn(count, totalMaps);

    map.cutouts.features.reduce(
      (sequence, feature) => {
        return sequence
          .then(() => {
            return (this.canceled) ? Promise.reject() : loadMapImage(feature);
          })
          .then(image => {
            console.time("Load map image " + count);
            progressfn(count++, totalMaps, this.canceled);
            addMapImage(image);
            console.timeEnd("Load map image " + count);
          });
      }, Promise.resolve())
      .then(() => {
        if (!this.canceled) {
          console.log("Saving pdf");
          pdf.save(map.name + ".pdf");
        }
      })
      .catch(() => {
        console.log("Canceled pdf generation");
      })
      .then(() => {
        console.timeEnd("PDF generation");
        console.log("Clean up");
        progressfn(totalMaps, totalMaps, this.canceled);
        map.remove();
      });
  }
}


function loadMap(map, format, margin) {
  return (feature) => map.cutoutMap(feature, format, margin);
}

function addMap(pdf) {
  var count = 0;
  const factor = pdf.internal.getFontSize() / pdf.internal.scaleFactor;
  return (img) => {
    pdf.addPage(img.format, img.orientation);
    pdf.addImage({
      imageData: img.data,
      x: img.margin,
      y: img.margin,
      w: img.width,
      h: img.height,
      compression: 'FAST',
      alias: "map" + count++  // setting alias improves speed ~2x
    });
    pdf.text(img.details(count), img.margin, img.margin + img.height + factor);
  };
}

export default Printmap;

