// this is the account setting file may need to be updated later place holder code for now 
import react, {use, useState} from "react"
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Switch, ScrollView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // for icons
import { useNavigation } from "@react-navigation/native";


export default function AccountSetting({navigation}) {
  const[Pname, setName] = useState("parent name");
  const [childName, setChildName] = useState("child name");
  const [preferredName, ChildPreferredName] = useState("child preferred name");
  const [phone, setPhone] = useState("123-456-7890");
  const [email, setEmail] = useState("example@  email.com");
  const [password, setPassword] = useState("********");
  const [pin, setPin]= useState("****");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
   
  const handleSaveChanges = () => {
    console.log("Changes saved (placeholder:" , {
      Pname,
      childName,
      preferredName,
      phone,
      email,
      password,
      pin,
      notificationsEnabled
    });
  };

    return (        
<ScrollView style={styles.container}>
  <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
       <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity> 

      <View style={styles.header}>
        <Text style={styles.title}>Our profile</Text>
        <TouchableOpacity onPress={() => console.log("Logged out")}>
          <Text style={styles.logout}>Log out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={Pname} onChangeText={setName} />

        <Text style={styles.label}>Child’s Name</Text>
        <TextInput
          style={styles.input}
          value={childName}
          onChangeText={setChildName}
        />

        <Text style={styles.label}> Child Preferred Name</Text>
        <TextInput
          style={styles.input}
          value={preferredName}
          onChangeText={ChildPreferredName}
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <Text style={styles.label}>Update Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.label}>Update Pin</Text>
        <TextInput
          style={styles.input}
          value={pin}
          onChangeText={setPin}
          secureTextEntry
        />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Enable Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
          <Text style={styles.saveButtonText}>Save changes</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 40,
  },
  title: { fontSize: 22, fontWeight: "600" },
  logout: { color: "#777", fontWeight: "500" },
  form: { marginTop: 30 },
  label: { fontSize: 14, fontWeight: "500", marginBottom: 4, color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 15,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});