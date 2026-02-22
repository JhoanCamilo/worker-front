import { View, Text, StyleSheet } from "react-native";

export default function TechnicianScheduleScreen() {
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
