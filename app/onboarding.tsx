import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useState } from "react";
import { Button, StyleSheet } from "react-native";
import { View, Text, TextInput } from "react-native";

export default function Onboarding() {
    const [name, setName] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [age, setAge] = useState('');

    const handleSubmit = () => {
        storeData(name, 'name');
        storeData(height, 'height');
        storeData(weight, 'weight');
        storeData(age, 'age');
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
            <TextInput
            style={styles.inputs}
            onChangeText={setHeight}
            placeholder="Enter Height"
            value={height}
            inputMode="numeric"
            />
            <TextInput
            style={styles.inputs}
            onChangeText={setWeight}
            placeholder="Enter Weight"
            value={weight}
            inputMode="numeric"
            />
            <TextInput
            style={styles.inputs}
            onChangeText={setAge}
            placeholder="Enter Age"
            value={age}
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
        margin: 10,
        borderRadius: 5,
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    }
});