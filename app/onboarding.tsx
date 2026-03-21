import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useState } from "react";
import { Button, StyleSheet } from "react-native";
import { View, Text, TextInput } from "react-native";

export default function Onboarding() {
    const [name, setName] = useState('');
    const [feet, setFeet] = useState('');
    const [inches, setInches] = useState('');
    const [weight, setWeight] = useState('');
    const [age, setAge] = useState('');

    const handleSubmit = () => {
        storeData(name, 'name');
        storeData((parseInt(feet) * 12 + parseInt(inches)).toString(), 'height');
        storeData(weight, 'weight');
        router.replace('/');
    }
    const storeData = async (value: string, key: string) => {
        try {
            await AsyncStorage.setItem(key, value);
        } catch (error) {
            console.error(error);
        }
    }
    return (
        <View style={styles.container}>
            <TextInput
            style={styles.inputs}
            onChangeText={setName}
            placeholder="Enter Name"
            value={name}
            inputMode="text"
            />
            <View style={styles.row}>
                <TextInput
                style={styles.inputs}
                onChangeText={setFeet}
                placeholder="Feet"
                value={feet}
                inputMode="numeric"
                />
                <TextInput
                style={styles.inputs}
                onChangeText={setInches}
                placeholder="Inches"
                value={inches}
                inputMode="numeric"
                />
            </View>
            <TextInput
            style={styles.inputs}
            onChangeText={setWeight}
            placeholder="Enter Weight"
            value={weight}
            inputMode="numeric"
            />
            <Button title="Submit" onPress={handleSubmit} /> 
        </View>
    );
}
const styles = StyleSheet.create({
    inputs: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'gray',
        padding: 10,
        marginTop: 10,
        marginBottom: 10,
        marginLeft: 2.5,
        marginRight: 2.5,
        borderRadius: 5,
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
    }
});