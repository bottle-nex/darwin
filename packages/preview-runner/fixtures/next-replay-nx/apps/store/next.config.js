const { composePlugins, withNx } = require("@nx/next");

module.exports = composePlugins(withNx)({ nx: { svgr: false } });
