import { StyleSheet, Text, View } from "react-native";

export default function ClientSettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Configuración (próximamente)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { color: "#9ca3af", fontSize: 16 },
});
