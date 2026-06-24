import { View } from 'react-native';
import { DocHeader, DocScroll, Section, P, B, Quote, Fact, docStyles } from './_components';

const C = '#6B4DFF';

export default function DocCoran() {
  return (
    <View style={docStyles.screen}>
      <DocHeader emoji="📖" titre="Le Saint Coran" sous="La parole d'Allah révélée" c1="#7C5CFF" c2="#6B4DFF" />
      <DocScroll>

        <View style={docStyles.factsRow}>
          <Fact val="114"   lbl="Sourates" accent={C} />
          <Fact val="6 236" lbl="Versets" accent={C} />
          <Fact val="23 ans" lbl="de révélation" accent={C} />
        </View>

        <Section titre="Qu'est-ce que le Coran ?" accent={C}>
          <P>
            Le Coran (القرآن, « la récitation ») est le livre sacré de l'Islam. Les musulmans
            croient qu'il est la parole littérale d'Allah, révélée au Prophète Muhammad ﷺ
            par l'intermédiaire de l'ange Jibril (Gabriel).
          </P>
          <P>
            Il est écrit en arabe et reste, encore aujourd'hui, inchangé depuis sa révélation
            il y a plus de 1400 ans. C'est un guide spirituel, moral et pratique pour toute la vie.
          </P>
        </Section>

        <Section titre="Comment a-t-il été révélé ?" accent={C}>
          <P>
            La révélation a commencé en l'an 610, dans la grotte de Hira près de La Mecque,
            lorsque l'ange Jibril apparut au Prophète Muhammad ﷺ et lui dit :
          </P>
          <Quote accent={C}>« Lis, au nom de ton Seigneur qui a créé. » (Sourate Al-'Alaq, 96:1)</Quote>
          <P>
            La révélation s'est ensuite poursuivie progressivement pendant environ 23 ans,
            verset par verset, selon les événements et les besoins de la communauté. Les
            compagnons mémorisaient et notaient chaque révélation. Après le décès du Prophète ﷺ,
            le Coran fut rassemblé en un seul livre sous le calife Abou Bakr, puis unifié sous Othman.
          </P>
        </Section>

        <Section titre="Sa structure" accent={C}>
          <P>
            Le Coran est divisé en <B>114 sourates</B> (chapitres), de longueurs très variées :
            la plus longue, Al-Baqara, compte 286 versets ; la plus courte, Al-Kawthar, n'en a que 3.
          </P>
          <P>
            Au total, il contient environ <B>6 236 versets</B> (āyāt). Pour faciliter la lecture,
            il est aussi découpé en 30 parties égales appelées <B>Juz'</B>, ce qui permet de
            le lire entièrement en un mois, notamment pendant le Ramadan.
          </P>
          <P>
            Les sourates sont classées en deux types : <B>mecquoises</B> (révélées avant l'émigration
            à Médine, centrées sur la foi) et <B>médinoises</B> (centrées sur les lois et la vie en société).
          </P>
        </Section>

        <Section titre="Son rôle" accent={C}>
          <P>
            Le Coran est avant tout un <B>guide</B> (hudâ). Il enseigne la croyance en un Dieu unique
            (tawhîd), les règles de la vie quotidienne, la morale, la justice, et la relation
            entre l'être humain et son Créateur.
          </P>
          <P>
            Le réciter est un acte d'adoration. Le mémoriser entièrement fait de celui qui y parvient
            un « Hâfiz ». Il apporte la paix du cœur, la guidance et d'innombrables récompenses.
          </P>
          <Quote accent={C}>
            « Ce Livre, nul doute en lui, est un guide pour les pieux. » (Sourate Al-Baqara, 2:2)
          </Quote>
        </Section>

      </DocScroll>
    </View>
  );
}
