import { View } from 'react-native';
import { DocHeader, DocScroll, Section, P, B, Quote, Step, docStyles } from './_components';
import { useT } from '../../../lib/i18n';

const C = '#0894A1';

export default function DocAblutions() {
  const tr = useT();
  return (
    <View style={docStyles.screen}>
      <DocHeader emoji="💧" titre={tr('docAblutions.headerTitre')} sous={tr('docAblutions.headerSous')} c1="#0FB5C4" c2="#0894A1" />
      <DocScroll>

        <Section titre={tr('docAblutions.s1Titre')} accent={C}>
          <P>
            {tr('docAblutions.s1P1Before')}<B>{tr('docAblutions.s1P1Wudu')}</B>{tr('docAblutions.s1P1After')}
          </P>
          <Quote accent={C}>
            {tr('docAblutions.s1Quote')}
          </Quote>
        </Section>

        <Section titre={tr('docAblutions.s2Titre')} accent={C}>
          <Step num={1} titre={tr('docAblutions.step1Titre')} accent={C}>
            {tr('docAblutions.step1Text')}
          </Step>
          <Step num={2} titre={tr('docAblutions.step2Titre')} accent={C}>
            {tr('docAblutions.step2Text')}
          </Step>
          <Step num={3} titre={tr('docAblutions.step3Titre')} accent={C}>
            {tr('docAblutions.step3Text')}
          </Step>
          <Step num={4} titre={tr('docAblutions.step4Titre')} accent={C}>
            {tr('docAblutions.step4Text')}
          </Step>
          <Step num={5} titre={tr('docAblutions.step5Titre')} accent={C}>
            {tr('docAblutions.step5Text')}
          </Step>
          <Step num={6} titre={tr('docAblutions.step6Titre')} accent={C}>
            {tr('docAblutions.step6Text')}
          </Step>
          <Step num={7} titre={tr('docAblutions.step7Titre')} accent={C}>
            {tr('docAblutions.step7Text')}
          </Step>
          <Step num={8} titre={tr('docAblutions.step8Titre')} accent={C}>
            {tr('docAblutions.step8Text')}
          </Step>
          <Step num={9} titre={tr('docAblutions.step9Titre')} accent={C}>
            {tr('docAblutions.step9Text')}
          </Step>
        </Section>

        <Section titre={tr('docAblutions.s3Titre')} accent={C}>
          <P>
            {tr('docAblutions.s3P1')}
          </P>
        </Section>

        <Section titre={tr('docAblutions.s4Titre')} accent={C}>
          <P>{tr('docAblutions.s4P1')}</P>
          <Quote accent={C}>
            {tr('docAblutions.s4Quote')}
          </Quote>
        </Section>

      </DocScroll>
    </View>
  );
}
