import { ScrollView, View, Text } from 'react-native'
import { router } from "expo-router";
import { Button } from '@/src/components/ui/Button'
import { useRegisterStore } from '@/src/store/register.store';

export default function TermsConditionsScreen() {

    //? Obtaining complete user data
    const { payload, clear } = useRegisterStore()

    const onConfirm = () => {
        router.dismissAll()
        router.replace("/(auth)/login")
        console.log(payload);
        clear()
    }

    const onReject = () => {
        router.dismissAll()
        router.replace("/(auth)/login")
        clear()
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