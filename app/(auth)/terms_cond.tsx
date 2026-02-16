import { ScrollView, View, Text } from 'react-native'
import { router } from "expo-router";
import { useState } from "react";
import { Button } from '@/src/components/ui/Button'
import { useRegisterStore } from '@/src/store/register.store';
import { useToast } from '@/src/hooks/useToast';
import { register } from '@/src/services/register.service';
import { RegisterPayload } from '@/src/types/register';

export default function TermsConditionsScreen() {

    const { payload, clear } = useRegisterStore()
    const { success, error } = useToast()
    const [loading, setLoading] = useState(false)

    const onConfirm = async () => {
        try {
            setLoading(true)
            await register(payload as RegisterPayload)
            success("Registro exitoso")
        } catch (err: any) {
            error(err?.message || "Error al registrarse")
        } finally {
            setLoading(false)
            clear()
            router.dismissAll()
            router.replace("/(auth)/login")
        }
    }

    const onReject = () => {
        clear()
        router.dismissAll()
        router.replace("/(auth)/login")
    }

    return(
        <>
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
                Terminos y condiciones de uso
            </Text>
            <ScrollView>
                <View style={{height: '100%', padding: 15}}>
                    <Text>
                        Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                        Aliquid quas molestiae quod tempore, illo quam incidunt nihil nobis.
                        Sequi perferendis reprehenderit at explicabo nostrum rerum nihil.
                        Totam fugiat debitis laboriosam.
                        Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                        Aliquid quas molestiae quod tempore, illo quam incidunt nihil nobis.
                        Sequi perferendis reprehenderit at explicabo nostrum rerum nihil.
                        Totam fugiat debitis laboriosam.
                        Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                        Aliquid quas molestiae quod tempore, illo quam incidunt nihil nobis.
                        Sequi perferendis reprehenderit at explicabo nostrum rerum nihil.
                        Totam fugiat debitis laboriosam.
                        Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                        Aliquid quas molestiae quod tempore, illo quam incidunt nihil nobis.
                        Sequi perferendis reprehenderit at explicabo nostrum rerum nihil.
                        Totam fugiat debitis laboriosam.
                        Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                        Aliquid quas molestiae quod tempore, illo quam incidunt nihil nobis.
                        Sequi perferendis reprehenderit at explicabo nostrum rerum nihil.
                        Totam fugiat debitis laboriosam.
                        Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                        Aliquid quas molestiae quod tempore, illo quam incidunt nihil nobis.
                        Sequi perferendis reprehenderit at explicabo nostrum rerum nihil.
                        Totam fugiat debitis laboriosam.
                        Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                        Aliquid quas molestiae quod tempore, illo quam incidunt nihil nobis.
                        Sequi perferendis reprehenderit at explicabo nostrum rerum nihil.
                        Totam fugiat debitis laboriosam.
                        Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                        Aliquid quas molestiae quod tempore, illo quam incidunt nihil nobis.
                        Sequi perferendis reprehenderit at explicabo nostrum rerum nihil.
                        Totam fugiat debitis laboriosam.
                        Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                        Aliquid quas molestiae quod tempore, illo quam incidunt nihil nobis.
                        Sequi perferendis reprehenderit at explicabo nostrum rerum nihil.
                        Totam fugiat debitis laboriosam.
                        Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                        Aliquid quas molestiae quod tempore, illo quam incidunt nihil nobis.
                        Sequi perferendis reprehenderit at explicabo nostrum rerum nihil.
                        Totam fugiat debitis laboriosam.
                        Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                        Aliquid quas molestiae quod tempore, illo quam incidunt nihil nobis.
                        Sequi perferendis reprehenderit at explicabo nostrum rerum nihil.
                        Totam fugiat debitis laboriosam.
                        Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                        Aliquid quas molestiae quod tempore, illo quam incidunt nihil nobis.
                        Sequi perferendis reprehenderit at explicabo nostrum rerum nihil.
                        Totam fugiat debitis laboriosam.
                        Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                        Aliquid quas molestiae quod tempore, illo quam incidunt nihil nobis.
                        Sequi perferendis reprehenderit at explicabo nostrum rerum nihil.
                        Totam fugiat debitis laboriosam.
                        Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                        Aliquid quas molestiae quod tempore, illo quam incidunt nihil nobis.
                        Sequi perferendis reprehenderit at explicabo nostrum rerum nihil.
                        Totam fugiat debitis laboriosam.
                        Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                        Aliquid quas molestiae quod tempore, illo quam incidunt nihil nobis.
                        Sequi perferendis reprehenderit at explicabo nostrum rerum nihil.
                        Totam fugiat debitis laboriosam.
                        Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                        Aliquid quas molestiae quod tempore, illo quam incidunt nihil nobis.
                        Sequi perferendis reprehenderit at explicabo nostrum rerum nihil.
                        Totam fugiat debitis laboriosam.
                    </Text>
                </View>
            </ScrollView>
            <View style={{padding:15, marginBottom: 80}}>
                <Button
                    title="Aceptar"
                    onPress={() => onConfirm()}
                    customStyle={{backgroundColor: "#407ee3"}}
                    type='primary'
                    disabled={loading}
                />
                <Button
                    title="Rechazar"
                    onPress={() => onReject()}
                    customStyle={{borderColor: "#f13d3d"}}
                    customTextStyles={{color: "#f13d3d"}}
                    type='secondary'
                />
            </View>
        </>
    )
}