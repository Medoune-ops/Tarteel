import { View } from 'react-native';
import { DocHeader, DocScroll, Section, P, B, Quote, Fact, docStyles } from './_components';
import { useT } from '../../../lib/i18n';

const C = '#6B4DFF';

export default function DocCoran() {
  const tr = useT();
  return (
    <View style={docStyles.screen}>
      <DocHeader emoji="📖" titre={tr('docCoran.headerTitre')} sous={tr('docCoran.headerSous')} c1="#7C5CFF" c2="#6B4DFF" />
      <DocScroll>

        <View style={docStyles.factsRow}>
          <Fact val="114"   lbl={tr('docCoran.factSourates')} accent={C} />
          <Fact val="6 236" lbl={tr('docCoran.factVersets')} accent={C} />
          <Fact val="23 ans" lbl={tr('docCoran.factYears')} accent={C} />
        </View>

        <Section titre={tr('docCoran.s1Titre')} accent={C}>
          <P>{tr('docCoran.s1P1')}</P>
          <P>{tr('docCoran.s1P2')}</P>
        </Section>

        <Section titre={tr('docCoran.s2Titre')} accent={C}>
          <P>{tr('docCoran.s2P1')}</P>
          <Quote accent={C}>{tr('docCoran.s2Quote')}</Quote>
          <P>{tr('docCoran.s2P2')}</P>
        </Section>

        <Section titre={tr('docCoran.s3Titre')} accent={C}>
          <P>
            {tr('docCoran.s3P1Before')}<B>{tr('docCoran.s3P1Bold')}</B>{tr('docCoran.s3P1After')}
          </P>
          <P>
            {tr('docCoran.s3P2Before')}<B>{tr('docCoran.s3P2Bold')}</B>{tr('docCoran.s3P2Mid')}<B>{tr('docCoran.s3P2Bold2')}</B>{tr('docCoran.s3P2After')}
          </P>
          <P>
            {tr('docCoran.s3P3Before')}<B>{tr('docCoran.s3P3Bold1')}</B>{tr('docCoran.s3P3Mid')}<B>{tr('docCoran.s3P3Bold2')}</B>{tr('docCoran.s3P3After')}
          </P>
        </Section>

        <Section titre={tr('docCoran.s4Titre')} accent={C}>
          <P>
            {tr('docCoran.s4P1Before')}<B>{tr('docCoran.s4P1Bold')}</B>{tr('docCoran.s4P1After')}
          </P>
          <P>
            {tr('docCoran.s4P2Before')}<B>{tr('docCoran.s4P2Bold')}</B>{tr('docCoran.s4P2After')}
          </P>
          <Quote accent={C}>{tr('docCoran.s4Quote')}</Quote>
        </Section>

      </DocScroll>
    </View>
  );
}
