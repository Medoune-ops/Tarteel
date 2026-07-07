import { Tabs } from 'expo-router';
import TabBar from '../../../components/TabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      // lazy : un onglet n'est monté qu'à sa première visite.
      // freezeOnBlur : les onglets quittés sont gelés (plus de re-renders
      // ni d'animations en fond) → navigation entre onglets bien plus fluide.
      screenOptions={{ headerShown: false, lazy: true, freezeOnBlur: true }}
    >
      <Tabs.Screen name="parcours" />
      <Tabs.Screen name="revisions" />
      <Tabs.Screen name="ligues" />
      <Tabs.Screen name="coran" />
      <Tabs.Screen name="profil" />
    </Tabs>
  );
}
