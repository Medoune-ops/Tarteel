const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Tarteelback est un backend Node totalement separe (son propre node_modules,
// ~385 Mo) qui vit dans ce meme dossier mais n'a rien a voir avec le bundle
// RN. Sans exclusion, Metro le scanne et le surveille en plus de son propre
// node_modules (~433 Mo) : le crawl initial explose et le watcher de fichiers
// finit par timeout ("Failed to start watch mode").
config.resolver.blockList = /[\\/]Tarteelback[\\/].*/;
config.watchFolders = [__dirname];

// Les recueils de hadiths (~7,7 Mo) portent l'extension `.hadith` et non
// `.json` : Metro traite le JSON comme un module SOURCE, ce qui les
// inlinerait dans le bundle et les chargerait en memoire a chaque demarrage,
// meme pour quelqu'un qui ne lit jamais de hadiths. Declares en asset, ils
// sont livres avec l'app (donc hors-ligne) mais lus a la demande.
config.resolver.assetExts.push('hadith');

module.exports = config;
