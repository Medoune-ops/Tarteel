import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DeviceStatusBar from '../../../components/StatusBar';

export default function CoranScreen() {
  return (
    <View style={styles.screen}>
      <DeviceStatusBar />
      <View style={styles.center}>
        <Feather name="book-open" size={48} color="#6B4DFF" />
        <Text style={styles.title}>Coran</Text>
        <Text style={styles.sub}>Lecture des sourates à venir</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 28, color: '#1B2333' },
  sub: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#8A8F99' },
});
