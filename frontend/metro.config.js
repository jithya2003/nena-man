const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Zustand v5 ESM middleware contains `import.meta.env` which is unsupported in Metro's web script wrapper.
// Direct Metro to resolve Zustand modules to CommonJS.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'zustand') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/zustand/index.js'),
      type: 'sourceFile',
    };
  }
  if (moduleName === 'zustand/middleware') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/zustand/middleware.js'),
      type: 'sourceFile',
    };
  }
  if (moduleName.startsWith('zustand/')) {
    const sub = moduleName.replace('zustand/', '');
    return {
      filePath: path.resolve(__dirname, `node_modules/zustand/${sub}.js`),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

