const pageformats = new Map();
pageformats
  .set('a4', [210, 297])
  .set('a5', [148, 210])
  .set('a6', [105, 148])
  .set('tabloid', [279, 432])
  .set('legal', [216, 356])
  .set('letter', [216, 279]);

const paperformat = {
  dimensions(format, margin=0, orientation="p") {
    let [w, h] = pageformats.get(format).map(x => x -= 2*margin);
    if (orientation === "l") {
      [w, h] = [h, w];
    }
    return [w, h];
  },

  validFormats(maxArea) {
    const formats = [];
    for (let [format, sizes] of pageformats) {
      if (sizes[0] * sizes[1] <= maxArea) {
        formats.push(format);
      }
    }
    return formats;
  }
};

export default paperformat;
