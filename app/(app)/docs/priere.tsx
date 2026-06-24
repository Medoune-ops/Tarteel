import { View, Text, StyleSheet } from 'react-native';
import { DocHeader, DocScroll, Section, P, B, Quote, Step, docStyles } from './_components';

const C = '#C42968';

const PRIERES = [
  { nom: 'Fajr',    moment: "À l'aube, avant le lever du soleil", rakat: '2' },
  { nom: 'Dhuhr',   moment: 'Après que le soleil ait dépassé son zénith', rakat: '4' },
  { nom: 'Asr',     moment: "L'après-midi", rakat: '4' },
  { nom: 'Maghrib', moment: 'Juste après le coucher du soleil', rakat: '3' },
  { nom: 'Isha',    moment: 'La nuit', rakat: '4' },
];

export default function DocPriere() {
  return (
    <View style={docStyles.screen}>
      <DocHeader emoji="🕌" titre="La Prière" sous="La Salât — le lien avec Allah" c1="#E0387E" c2="#C42968" />
      <DocScroll>

        <Section titre="Qu'est-ce que la Salât ?" accent={C}>
          <P>
            La <B>Salât</B> (الصلاة) est la prière rituelle, deuxième pilier de l'Islam. C'est un
            rendez-vous quotidien entre le croyant et son Seigneur, accompli <B>cinq fois par jour</B>
            à des moments précis, en se tournant vers la Kaaba à La Mecque (la Qibla).
          </P>
        </Section>

        <Section titre="Les 5 prières quotidiennes" accent={C}>
          {PRIERES.map((p, i) => (
            <View key={i} style={st.row}>
              <View style={st.badge}><Text style={st.badgeRakat}>{p.rakat}</Text><Text style={st.badgeLbl}>rakʿât</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={st.nom}>{p.nom}</Text>
                <Text style={st.moment}>{p.moment}</Text>
              </View>
            </View>
          ))}
          <P>Une <B>rakʿa</B> est une unité de prière composée de positions précises (debout, incliné, prosterné).</P>
        </Section>

        <Section titre="Comment prier — une rakʿa" accent={C}>
          <Step num={1} titre="Takbîr — debout" accent={C}>
            Lever les mains et dire « Allâhu Akbar » (Allah est le plus grand) pour entrer en prière.
          </Step>
          <Step num={2} titre="La récitation" accent={C}>
            Réciter la sourate Al-Fâtiha, suivie d'une autre courte sourate (ex. Al-Ikhlâs).
          </Step>
          <Step num={3} titre="Rukûʿ — l'inclinaison" accent={C}>
            S'incliner, mains sur les genoux, en disant « Subhâna Rabbiya l-ʿAdhîm » (Gloire à mon Seigneur le Très-Grand), 3 fois.
          </Step>
          <Step num={4} titre="Se redresser" accent={C}>
            Se relever en disant « Samiʿa Llâhu liman hamidah » (Allah entend celui qui Le loue).
          </Step>
          <Step num={5} titre="Sujûd — la prosternation" accent={C}>
            Se prosterner (front, nez, mains, genoux et orteils au sol) en disant « Subhâna Rabbiya l-Aʿlâ » (Gloire à mon Seigneur le Très-Haut), 3 fois.
          </Step>
          <Step num={6} titre="S'asseoir puis se prosterner à nouveau" accent={C}>
            Se redresser en position assise un court instant, puis se prosterner une seconde fois.
          </Step>
        </Section>

        <Section titre="La fin de la prière (Tashahhud)" accent={C}>
          <P>Après la dernière rakʿa, assis, on récite le Tashahhud puis on salue :</P>
          <Quote accent={C}>
            « As-salâmu ʿalaykum wa rahmatu Llâh » (Que la paix et la miséricorde d'Allah soient sur vous){'\n'}
            — en tournant la tête à droite, puis à gauche. La prière est terminée.
          </Quote>
        </Section>

        <Section titre="Pourquoi prier ?" accent={C}>
          <P>
            La prière purifie le cœur, rappelle Allah tout au long de la journée et apporte la
            sérénité. C'est un moment de paix, de gratitude et de connexion, à vivre avec
            <B> joie et amour</B>, pas comme une corvée. 🌸
          </P>
          <Quote accent={C}>
            « En vérité, c'est par le rappel d'Allah que les cœurs se tranquillisent. » (Sourate Ar-Raʿd, 13:28)
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
