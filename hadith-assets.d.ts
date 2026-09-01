/**
 * Les recueils de hadiths sont des assets `.hadith` (voir metro.config.js).
 * TypeScript ne connaît pas cette extension : on la déclare comme un module
 * d'asset classique, `require()` renvoyant l'identifiant que consomme
 * `Asset.fromModule()`.
 */
declare module '*.hadith' {
  const asset: number;
  export default asset;
}
