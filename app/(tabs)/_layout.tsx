import { useAuthStore } from "@/src/store/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { Text, TouchableOpacity } from "react-native";

const TAB_BG = "#407ee3";
const ACTIVE = "#f2c70f";
const INACTIVE = "rgba(0,0,0,0.5)";

function HeaderTitle() {
  const user = useAuthStore((state) => state.user);
  return (
    <Text>
      <Text style={{ color: "#fff", fontSize: 18 }}>Bienvenido, </Text>
      <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
        {user?.name ?? "Usuario"}
      </Text>
    </Text>
  );
}

export default function TabsLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: TAB_BG,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitle: () => <HeaderTitle />,
        headerLeft:
          route.name !== "home"
            ? () => (
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={{ marginLeft: 12 }}
                >
                  <Ionicons name="chevron-back" size={26} color="#fff" />
                </TouchableOpacity>
              )
            : undefined,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: TAB_BG,
          borderTopWidth: 0,
          height: 80,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
      })}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings-sharp" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
