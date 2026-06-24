import { View, Text, StyleSheet } from 'react-native';
import { DocHeader, DocScroll, Section, P, B, Quote, docStyles } from './_components';

const C = '#2A9E1C';

const PILIERS = [
  { emoji: '🕋', nom: 'Ash-Shahâda', fr: "L'attestation de foi", desc: "Témoigner qu'il n'y a de divinité qu'Allah et que Muhammad ﷺ est Son messager." },
  { emoji: '🤲', nom: 'As-Salât',    fr: 'La prière',            desc: 'Accomplir les cinq prières quotidiennes face à La Mecque.' },
  { emoji: '💰', nom: 'Az-Zakât',    fr: "L'aumône légale",      desc: 'Donner une part de ses biens aux nécessiteux chaque année.' },
  { emoji: '🌙', nom: 'As-Sawm',     fr: 'Le jeûne',             desc: "Jeûner du lever au coucher du soleil pendant le mois de Ramadan." },
  { emoji: '🕋', nom: 'Al-Hajj',     fr: 'Le pèlerinage',        desc: 'Se rendre à La Mecque au moins une fois dans sa vie si on en a les moyens.' },
];

const FOI = [
  'Croire en Allah, unique et sans associé',
  'Croire en Ses anges',
  'Croire en Ses livres révélés',
  'Croire en Ses prophètes et messagers',
  'Croire au Jour du Jugement',
  'Croire au destin (le bien et le mal viennent d\'Allah)',
];

export default function DocIslam() {
  return (
    <View style={docStyles.screen}>
      <DocHeader emoji="☪️" titre="L'Islam" sous="La soumission à Allah" c1="#34C724" c2="#2A9E1C" />
      <DocScroll>

        <Section titre="Qu'est-ce que l'Islam ?" accent={C}>
          <P>
            Le mot <B>« Islam »</B> signifie « soumission » et « paix ». C'est la religion qui invite
            à se soumettre volontairement à la volonté d'Allah, le Dieu unique, pour trouver
            la paix dans cette vie et dans l'au-delà.
          </P>
          <P>
            Un musulman est celui qui témoigne de l'unicité d'Allah et suit l'enseignement
            du Prophète Muhammad ﷺ. L'Islam est aujourd'hui suivi par près de deux milliards
            de personnes à travers le monde.
          </P>
        </Section>

        <Section titre="Les 5 piliers de l'Islam" accent={C}>
          <P>L'Islam repose sur cinq pratiques fondamentales :</P>
          {PILIERS.map((p, i) => (
            <View key={i} style={st.pilier}>
              <Text style={st.pilierEmoji}>{p.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={st.pilierNom}>{i + 1}. {p.nom} <Text style={st.pilierFr}>· {p.fr}</Text></Text>
                <Text style={st.pilierDesc}>{p.desc}</Text>
              </View>
            </View>
          ))}
        </Section>

        <Section titre="Les 6 piliers de la foi (Îmân)" accent={C}>
          <P>Au-delà des actes, la foi du musulman repose sur six croyances :</P>
          {FOI.map((f, i) => (
            <View key={i} style={st.foiRow}>
              <View style={st.foiDot}><Text style={st.foiDotText}>{i + 1}</Text></View>
              <Text style={st.foiText}>{f}</Text>
            </View>
          ))}
        </Section>

        <Section titre="Les valeurs de l'Islam" accent={C}>
          <P>
            L'Islam encourage la <B>bonté</B>, l'<B>honnêteté</B>, la <B>générosité</B>, le respect
            des parents et des voisins, la patience et la justice. Le sourire, la douceur et
            l'entraide font partie intégrante de la foi.
          </P>
          <Quote accent={C}>
            « Les meilleurs d'entre vous sont ceux qui ont le meilleur comportement. » — Prophète Muhammad ﷺ
          </Quote>
        </Section>

      </DocScroll>
    </View>
  );
}

const st = StyleSheet.create({
  pilier: { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'flex-start' },
  pilierEmoji: { fontSize: 26, width: 32, textAlign: 'center' },
  pilierNom: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#1B2333' },
  pilierFr: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#2A9E1C' },
  pilierDesc: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#6A7280', lineHeight: 21, marginTop: 2 },
  foiRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  foiDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#DEF5E5', alignItems: 'center', justifyContent: 'center' },
  foiDotText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 13, color: '#2A9E1C' },
  foiText: { flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#3A4150', lineHeight: 21 },
});
