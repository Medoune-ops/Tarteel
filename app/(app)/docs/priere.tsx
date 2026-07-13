import { View, Text, StyleSheet } from 'react-native';
import { DocHeader, DocScroll, Section, P, B, Quote, Step, docStyles } from './_components';
import { useT } from '../../../lib/i18n';

const C = '#C42968';

export default function DocPriere() {
  const tr = useT();

  const PRIERES = [
    { nom: 'Fajr',    moment: tr('docPriere.fajrMoment'), rakat: '2' },
    { nom: 'Dhuhr',   moment: tr('docPriere.dhuhrMoment'), rakat: '4' },
    { nom: 'Asr',     moment: tr('docPriere.asrMoment'), rakat: '4' },
    { nom: 'Maghrib', moment: tr('docPriere.maghribMoment'), rakat: '3' },
    { nom: 'Isha',    moment: tr('docPriere.ishaMoment'), rakat: '4' },
  ];

  return (
    <View style={docStyles.screen}>
      <DocHeader emoji="🕌" titre={tr('docPriere.headerTitre')} sous={tr('docPriere.headerSous')} c1="#E0387E" c2="#C42968" />
      <DocScroll>

        <Section titre={tr('docPriere.s1Titre')} accent={C}>
          <P>
            {tr('docPriere.s1Before')}<B>{tr('docPriere.s1Bold1')}</B>{tr('docPriere.s1Mid')}<B>{tr('docPriere.s1Bold2')}</B>{tr('docPriere.s1After')}
          </P>
        </Section>

        <Section titre={tr('docPriere.s2Titre')} accent={C}>
          {PRIERES.map((p, i) => (
            <View key={i} style={st.row}>
              <View style={st.badge}><Text style={st.badgeRakat}>{p.rakat}</Text><Text style={st.badgeLbl}>{tr('docPriere.rakat')}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={st.nom}>{p.nom}</Text>
                <Text style={st.moment}>{p.moment}</Text>
              </View>
            </View>
          ))}
          <P>{tr('docPriere.s2PBefore')}<B>{tr('docPriere.s2PBold')}</B>{tr('docPriere.s2PAfter')}</P>
        </Section>

        <Section titre={tr('docPriere.s3Titre')} accent={C}>
          <Step num={1} titre={tr('docPriere.step1Titre')} accent={C}>
            {tr('docPriere.step1Text')}
          </Step>
          <Step num={2} titre={tr('docPriere.step2Titre')} accent={C}>
            {tr('docPriere.step2Text')}
          </Step>
          <Step num={3} titre={tr('docPriere.step3Titre')} accent={C}>
            {tr('docPriere.step3Text')}
          </Step>
          <Step num={4} titre={tr('docPriere.step4Titre')} accent={C}>
            {tr('docPriere.step4Text')}
          </Step>
          <Step num={5} titre={tr('docPriere.step5Titre')} accent={C}>
            {tr('docPriere.step5Text')}
          </Step>
          <Step num={6} titre={tr('docPriere.step6Titre')} accent={C}>
            {tr('docPriere.step6Text')}
          </Step>
        </Section>

        <Section titre={tr('docPriere.s4Titre')} accent={C}>
          <P>{tr('docPriere.s4P1')}</P>
          <Quote accent={C}>
            {tr('docPriere.s4Quote')}
          </Quote>
        </Section>

        <Section titre={tr('docPriere.s5Titre')} accent={C}>
          <P>
            {tr('docPriere.s5PBefore')}
            <B>{tr('docPriere.s5PBold')}</B>
            {tr('docPriere.s5PAfter')}
          </P>
          <Quote accent={C}>
            {tr('docPriere.s5Quote')}
          </Quote>
        </Section>

      </DocScroll>
    </View>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  badge: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#FCE4EF', alignItems: 'center', justifyContent: 'center' },
  badgeRakat: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: '#C42968' },
  badgeLbl: { fontFamily: 'Nunito_600SemiBold', fontSize: 9, color: '#C42968', marginTop: -2 },
  nom: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#1B2333' },
  moment: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#8A8F99', marginTop: 2 },
});
