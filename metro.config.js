const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Tarteelback est un backend Node totalement separe (son propre node_modules,
// ~385 Mo) qui vit dans ce meme dossier mais n'a rien a voir avec le bundle
// RN. Sans exclusion, Metro le scanne et le surveille en plus de son propre
// node_modules (~433 Mo) : le crawl initial explose et le watcher de fichiers
// finit par timeout ("Failed to start watch mode").
config.resolver.blockList = /[\\/]Tarteelback[\\/].*/;
config.watchFolders = [__dirname];

module.exports = config;
