import { View } from 'react-native';
import { DocHeader, DocScroll, Section, P, B, Quote, Step, docStyles } from './_components';

const C = '#0894A1';

export default function DocAblutions() {
  return (
    <View style={docStyles.screen}>
      <DocHeader emoji="💧" titre="Les Ablutions" sous="Le Wudû — se purifier avant la prière" c1="#0FB5C4" c2="#0894A1" />
      <DocScroll>

        <Section titre="Pourquoi faire les ablutions ?" accent={C}>
          <P>
            Le <B>Wudû</B> (الوضوء) est la purification que le musulman accomplit avant la prière.
            Il nettoie le corps mais symbolise aussi la purification de l'âme et la préparation
            à se présenter devant Allah dans un état de propreté.
          </P>
          <Quote accent={C}>
            « Allah aime ceux qui se repentent et ceux qui se purifient. » (Sourate Al-Baqara, 2:222)
          </Quote>
        </Section>

        <Section titre="Les étapes du Wudû" accent={C}>
          <Step num={1} titre="L'intention (niyya)" accent={C}>
            Avoir l'intention dans son cœur de se purifier pour Allah, puis dire « Bismillah » (au nom d'Allah).
          </Step>
          <Step num={2} titre="Laver les mains" accent={C}>
            Laver les deux mains jusqu'aux poignets, trois fois, en commençant par la droite.
          </Step>
          <Step num={3} titre="Se rincer la bouche" accent={C}>
            Prendre de l'eau dans la main droite et se rincer la bouche, trois fois.
          </Step>
          <Step num={4} titre="Nettoyer le nez" accent={C}>
            Aspirer un peu d'eau par le nez puis la rejeter, trois fois.
          </Step>
          <Step num={5} titre="Laver le visage" accent={C}>
            Laver tout le visage, du front au menton et d'une oreille à l'autre, trois fois.
          </Step>
          <Step num={6} titre="Laver les bras" accent={C}>
            Laver chaque bras du bout des doigts jusqu'au coude, trois fois, en commençant par le droit.
          </Step>
          <Step num={7} titre="Essuyer la tête (Mash)" accent={C}>
            Passer les mains mouillées sur la tête, de l'avant vers l'arrière, une fois.
          </Step>
          <Step num={8} titre="Essuyer les oreilles" accent={C}>
            Avec les doigts mouillés, essuyer l'intérieur et l'extérieur des oreilles, une fois.
          </Step>
          <Step num={9} titre="Laver les pieds" accent={C}>
            Laver chaque pied jusqu'aux chevilles, trois fois, en commençant par le droit,
            sans oublier entre les orteils.
          </Step>
        </Section>

        <Section titre="Ce qui annule les ablutions" accent={C}>
          <P>
            Les ablutions doivent être refaites notamment après : être allé aux toilettes,
            avoir dormi profondément, ou avoir perdu connaissance. Tant qu'elles ne sont pas
            rompues, on peut enchaîner plusieurs prières avec un seul Wudû.
          </P>
        </Section>

        <Section titre="L'invocation après le Wudû" accent={C}>
          <P>À la fin des ablutions, il est recommandé de dire :</P>
          <Quote accent={C}>
            « Ash-hadu an lâ ilâha illa Llâh, wa ash-hadu anna Muhammadan ʿabduhu wa rasûluh. »{'\n'}
            (J'atteste qu'il n'y a de divinité qu'Allah, et que Muhammad est Son serviteur et messager.)
          </Quote>
        </Section>

      </DocScroll>
    </View>
  );
}
