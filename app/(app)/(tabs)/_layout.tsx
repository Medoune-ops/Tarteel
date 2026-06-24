import { Tabs } from 'expo-router';
import TabBar from '../../../components/TabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="parcours" />
      <Tabs.Screen name="revisions" />
      <Tabs.Screen name="ligues" />
      <Tabs.Screen name="coran" />
      <Tabs.Screen name="profil" />
    </Tabs>
  );
}
