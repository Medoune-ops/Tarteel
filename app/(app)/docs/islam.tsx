import { View, Text, StyleSheet } from 'react-native';
import { DocHeader, DocScroll, Section, P, B, Quote, docStyles } from './_components';
import { useT } from '../../../lib/i18n';

const C = '#2A9E1C';

export default function DocIslam() {
  const tr = useT();

  const PILIERS = [
    { emoji: '🕋', nom: tr('docIslam.pilier1Nom'), fr: tr('docIslam.pilier1Fr'), desc: tr('docIslam.pilier1Desc') },
    { emoji: '🤲', nom: tr('docIslam.pilier2Nom'), fr: tr('docIslam.pilier2Fr'), desc: tr('docIslam.pilier2Desc') },
    { emoji: '💰', nom: tr('docIslam.pilier3Nom'), fr: tr('docIslam.pilier3Fr'), desc: tr('docIslam.pilier3Desc') },
    { emoji: '🌙', nom: tr('docIslam.pilier4Nom'), fr: tr('docIslam.pilier4Fr'), desc: tr('docIslam.pilier4Desc') },
    { emoji: '🕋', nom: tr('docIslam.pilier5Nom'), fr: tr('docIslam.pilier5Fr'), desc: tr('docIslam.pilier5Desc') },
  ];

  const FOI = [
    tr('docIslam.foi1'),
    tr('docIslam.foi2'),
    tr('docIslam.foi3'),
    tr('docIslam.foi4'),
    tr('docIslam.foi5'),
    tr('docIslam.foi6'),
  ];

  return (
    <View style={docStyles.screen}>
      <DocHeader emoji="☪️" titre={tr('docIslam.headerTitre')} sous={tr('docIslam.headerSous')} c1="#34C724" c2="#2A9E1C" />
      <DocScroll>

        <Section titre={tr('docIslam.s1Titre')} accent={C}>
          <P>
            {tr('docIslam.s1P1Before')}<B>{tr('docIslam.s1P1Bold')}</B>{tr('docIslam.s1P1After')}
          </P>
          <P>
            {tr('docIslam.s1P2')}
          </P>
        </Section>

        <Section titre={tr('docIslam.s2Titre')} accent={C}>
          <P>{tr('docIslam.s2P1')}</P>
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

        <Section titre={tr('docIslam.s3Titre')} accent={C}>
          <P>{tr('docIslam.s3P1')}</P>
          {FOI.map((f, i) => (
            <View key={i} style={st.foiRow}>
              <View style={st.foiDot}><Text style={st.foiDotText}>{i + 1}</Text></View>
              <Text style={st.foiText}>{f}</Text>
            </View>
          ))}
        </Section>

        <Section titre={tr('docIslam.s4Titre')} accent={C}>
          <P>
            {tr('docIslam.s4P1Before')}<B>{tr('docIslam.s4P1Bold1')}</B>{tr('docIslam.s4P1Mid1')}<B>{tr('docIslam.s4P1Bold2')}</B>{tr('docIslam.s4P1Mid2')}<B>{tr('docIslam.s4P1Bold3')}</B>{tr('docIslam.s4P1After')}
          </P>
          <Quote accent={C} arabe={tr('docIslam.s4QuoteArabe')}>
            {tr('docIslam.s4Quote')}
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
