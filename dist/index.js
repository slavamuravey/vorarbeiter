'use strict';

if (process.env.NODE_ENV === "production") {
  module.exports = require("./vorarbeiter.cjs.min.js");
} else {
  module.exports = require("./vorarbeiter.cjs.js");
}
