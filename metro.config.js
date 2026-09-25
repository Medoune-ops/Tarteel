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

// Zustand livre deux builds : `esm/middleware.mjs` utilise `import.meta.env`,
// une syntaxe que Metro ne transpile pas pour le web. Le navigateur echoue
// alors au PARSING du bundle ("Cannot use 'import.meta' outside a module") et
// l'app ne rend rien du tout — ecran blanc, sans erreur exploitable.
//
// Sur le web, on force donc la resolution vers le build CommonJS, equivalent
// et depourvu de cette syntaxe. Les plateformes natives gardent l'ESM, qui y
// fonctionne tres bien.
const resolveRequestOrigine = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName.startsWith('zustand')) {
    return context.resolveRequest(
      { ...context, unstable_enablePackageExports: false, isESMImport: false },
      moduleName,
      platform,
    );
  }
  return (resolveRequestOrigine ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
