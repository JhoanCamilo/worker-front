import { StyleSheet, Text, View } from "react-native";

export default function ClientScheduleScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Agenda (próximamente)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { color: "#9ca3af", fontSize: 16 },
});
