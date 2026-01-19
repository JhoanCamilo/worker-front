import { View, Text } from "react-native";

export default function LoginScreen() {
    return(
        <View  style={{height: '100%', padding: 15}}>
            <Text
                style={{
                    fontSize: 25,
                    fontWeight: '700',
                    marginBottom: 20,
                    marginTop: 40,
                    textAlign: 'center',
                    color: "#3061b2"
                }}
            >
                Código de verificación
            </Text>
            
        </View>
    )
}