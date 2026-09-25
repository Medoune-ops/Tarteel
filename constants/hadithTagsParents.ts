/**
 * Extraction du tag `parents` depuis `famille`.
 *
 * Même correction que pour `couple`, et pour la même raison : `famille`
 * couvrait parents, enfants, fratrie et conjoint dans un seul tag de ~100
 * hadiths, triés par numéro. Quelqu'un qui écrivait « mes parents
 * vieillissent » recevait donc les premiers hadiths du chapitre du mariage,
 * qui encouragent à se marier — pendant que « ta mère, ta mère, ta mère, puis
 * ton père » (muslim:6500) attendait en fin de liste, hors de vue.
 *
 * Les textes retenus viennent du chapitre « Vertu, bonnes manières et liens
 * de parenté » de Muslim. Ils couvrent trois situations réelles :
 *  - à qui je dois ma bonté en priorité (6500, 6501) ;
 *  - le parent âgé dont on s'occupe (6504, 6507, 6510, 6511) ;
 *  - la famille qui rompt le lien alors qu'on le maintient (6518-6525).
 *
 * `famille` demeure pour les saisies larges (« ma famille », « mes proches »)
 * et pour les enfants, la fratrie et le foyer.
 */

/** Hadiths à taguer `parents`, EN PLUS de leurs tags actuels. */
export const PARENTS_TAGS: string[] = [
  // La priorité due à la mère, puis au père.
  'muslim:6500',
  'muslim:6501',
  // Le jihad renvoyé au chevet des parents : s'occuper d'eux passe avant.
  'muslim:6504',
  'muslim:6507',
  // Juraij, qui préfère sa prière à l'appel de sa mère — et le regrette.
  'muslim:6508',
  'muslim:6509',
  // « Qu'il soit humilié, celui qui voit ses parents vieillir et n'entre pas
  // au Paradis » : la réponse directe à « mes parents vieillissent ».
  'muslim:6510',
  'muslim:6511',
  // Honorer les amis de son père après sa mort.
  'muslim:6513',
  'muslim:6514',
  'muslim:6515',
  // Les liens de parenté : les maintenir, ne pas les rompre.
  'muslim:6518',
  'muslim:6519',
  'muslim:6520',
  'muslim:6521',
  'muslim:6523',
  'muslim:6524',
  // « Je garde le lien, ils le rompent » — la réponse à une famille qui
  // maltraite, sans exiger de se taire.
  'muslim:6525',
];
