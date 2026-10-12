/**
 * Palette du module Amis. Centralise les tons NON couverts par le thème
 * global (LightTheme/DarkTheme) — teintes de sélection, badges de statut,
 * pastilles d'icônes, pistes de barres — pour garantir une parité clair/sombre
 * sur les 7 écrans Amis.
 */
export interface FriendPalette {
  /** Rouge d'action destructive (signaler/bloquer/retirer/quitter). */
  danger: string;
  dangerBg: string;
  /** Lavande de sélection (ligne « moi », boutons secondaires). */
  tint: string;
  tintBorder: string;
  /** Ambre (code, podium or, badges). */
  amberBg: string;
  amberText: string;
  /** Vert (succès, défi actif, gagnant). */
  greenBg: string;
  greenText: string;
  /** Neutre (badge terminé, séparateurs). */
  neutralBg: string;
  neutralText: string;
  /** Piste d'une barre de progression posée sur une carte. */
  barTrack: string;
  /** Fond d'une ligne non lue dans la boîte de réception. */
  unreadBg: string;
}

export function friendPalette(isDark: boolean): FriendPalette {
  return isDark
    ? {
        danger: '#FF6B6E',
        dangerBg: '#3A1F26',
        tint: '#241F3D',
        tintBorder: '#3A3360',
        amberBg: '#332A14',
        amberText: '#F0C24A',
        greenBg: '#1B3220',
        greenText: '#4ED83A',
        neutralBg: '#252436',
        neutralText: '#9896B8',
        barTrack: '#252436',
        unreadBg: '#241F3D',
      }
    : {
        danger: '#E5484D',
        dangerBg: '#FDE8E8',
        tint: '#EFEAFF',
        tintBorder: '#DDD8FF',
        amberBg: '#FFF3CD',
        amberText: '#8A5A0C',
        greenBg: '#DFF3E3',
        greenText: '#2A9E1C',
        neutralBg: '#EDEDF2',
        neutralText: '#8A8F99',
        barTrack: '#EEF0F4',
        unreadBg: '#F3F0FF',
      };
}
