// this is the account setting file may need to be updated later place holder code for now 
import React, { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Alert, View, Text, TextInput, StyleSheet, TouchableOpacity, Switch, ScrollView} from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import { getAuth, signOut } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useTheme } from "../theme/ThemeContext";

export default function AccountSetting({navigation}) {
  const[parentName, setParentName] = useState("");
  const [childsName, setChildName] = useState("");
  const [childsPreferredName, setChildPreferredName] = useState("");
  const [phoneNum, setPhone] = useState("");
  const [userEmail, setEmail] = useState("");
  const [password, setPassword] = useState("************");
  const [pin, setPin]= useState("****");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const { theme, mode, setMode } = useTheme();
  const colors = theme.colors;
   
  const handleLogOut = async() => {
    try {
      const auth = getAuth();
      await signOut(auth);
      console.log("User logged out");
      navigation.navigate("LoginScreen");
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  };
  // Fetch parent profile data
  useFocusEffect(
  useCallback(() => {
    const fetchParentData = async () => {
      try {
        setLoading(true);
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
            setParentName("");
            setPhone("");
            return;
        }
        const docRef = doc(db, "parents", user.uid);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
            const data = snap.data();
            setParentName(data.name || "");
            setPhone(data.phone || "");
        } else {
            setParentName("");
            setPhone("");
        }
      } catch (error) {
          console.error("Error fetching parent profile:", error);
          setParentName("");
          setPhone("");
      } finally {
        setLoading(false);
      }
    }; 
  fetchParentData();
  }, []));

  // Fetch child profile data
  useFocusEffect(
  useCallback(() => {
    const fetchChildData = async () => {
      try {
        setLoading(true);
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
            setChildName("");
            setChildPreferredName("");
            return;
        }
        const uid = user.uid;
        const q = query(collection(db, "children"), where("userId", "==", uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data();
            setChildName(data.fullName || "");
            setChildPreferredName(data.preferredName || "");
        } else {
            setChildName("");
            setChildPreferredName("");
        }
      } catch (error) {
          console.error("Error fetching child profile:", error);
          setChildName("");
          setChildPreferredName("");
      } finally {   
        setLoading(false);
      }
    }; 
  fetchChildData();
  }, []));

  // Get latest user email 
  useFocusEffect(
  useCallback(() => {
    const reloadUserEmail = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
          await user.reload();           // make sure Firebase has the latest data
          setEmail(user.email || "");
        } else {
          setEmail("");
        }
      } catch (err) {
        console.log("Error reloading user:", err);
      }
    };
    reloadUserEmail();
  }, [])
);
  
  const handleSaveChanges = async () => {
    if (!parentName.trim() || !phoneNum.trim()) {
        Alert.alert("Missing Info", "Please enter your name or phone number.");
        return;
      }
    
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
            Alert.alert("Error", "No logged-in user. Please log in again.");
            return;
      }

      const docRef = doc(db, "parents", user.uid);
      await setDoc(docRef, {
        name: parentName, 
        phone: phoneNum}, 
        { merge: true });
      Alert.alert("Success", "Changes saved.");
      navigation.navigate("ParentDashBoard");

      } catch (error) {
      console.error("Error saving changes: ", error);
      Alert.alert("Error", "Could not save changes. Please try again.");
    }
    
  };


    return ( 
      <SafeAreaProvider>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}
        edges ={['top']}>
          <ScrollView style={styles.ScrollView}>
            
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons style={[styles.backButton, { color: colors.text }]} name="arrow-back" />
            </TouchableOpacity>

            <Text style={[styles.title, { color: colors.text }]}>Our Profile</Text>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogOut}>
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>
          </View>
            
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={[styles.label, { color: colors.text }]}>Parent's Name:</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    { width: "100%", marginRight: 0, backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
                  ]}
                  value={parentName}
                  onChangeText={setParentName}
                  placeholder={"Parent Name"}
                  placeholderTextColor={colors.muted}
                />

              <View style={styles.iconWrapper}>
                <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.muted} />
              </View>
              
              </View>
            </View>
            <View style={styles.column}>
              <Text style={[styles.label, { color: colors.text }]}>Child's Name:</Text>
              <TextInput
                style={[
                  styles.input,
                  { width: "100%", marginRight: 0, backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
                ]}
                value={childsName}
                onChangeText={setChildName}
                placeholder={"Child Name"}
                placeholderTextColor={colors.muted}
                editable={false}
              />
              <Text style={[styles.label, { marginTop: 8, color: colors.text }]}>Preferred Name:</Text>
              <TextInput
                style={[
                  styles.prefInput,
                  { width: "100%", marginRight: 0, backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
                ]}
                value={childsPreferredName}
                onChangeText={setChildPreferredName}
                placeholder="Preferred Name"
                placeholderTextColor={colors.muted}
                editable={false}
              />
            </View>
          </View>

          <View>  
            <Text style={[styles.label, { color: colors.text }]}>Phone</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                value={phoneNum}
                placeholder="123-456-7890"
                placeholderTextColor={colors.muted}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            <View style={styles.iconWrapper}>
                <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.muted} />
              </View>
            </View>

            <View style={styles.changeRow}>
              <Text style={[styles.label, { color: colors.text }]}>Email</Text>
              <TouchableOpacity onPress={() => navigation.navigate("ChangeEmail")}>
                <Text style={{ color: "#1E90FF", fontSize: 12, marginRight:"1%" }}>Change Email</Text>
              </TouchableOpacity>
            </View> 
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={userEmail}
              placeholder="example@email.com"
              placeholderTextColor={colors.muted}
              onChangeText={setEmail}
              keyboardType="email-address"
              editable={false}
            />
            <View style={styles.changeRow}>
              <Text style={[styles.label, { color: colors.text }]}>Password</Text>
              <TouchableOpacity onPress={() => navigation.navigate("ChangePassword")}>
                <Text style={{ color: "#1E90FF", fontSize: 12, marginRight:"1%" }}>Change Password</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={password}
              onChangeText={setPassword}
              editable={false}
            />
            <View style={styles.changeRow}>
              <Text style={[styles.label, { color: colors.text }]}>PIN</Text>
              <TouchableOpacity onPress={() => navigation.navigate("ChangePin")}> 
                <Text style={{ color: "#1E90FF", fontSize: 12, marginRight:"1%" }}>Change PIN</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={pin}
              onChangeText={setPin}
              editable={false}
            />

            <View style={styles.sectionRow}>
              <Text style={[styles.label, { color: colors.text }]}>Appearance</Text>
            </View>
            <View style={styles.themeRow}>
              {["system", "light", "dark"].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.themeOption,
                    { borderColor: colors.border },
                    mode === opt && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setMode(opt)}
                >
                  <Text
                    style={[
                      styles.themeOptionText,
                      { color: mode === opt ? "#fff" : colors.text },
                    ]}
                  >
                    {opt === "system" ? "System" : opt === "light" ? "Light" : "Dark"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.switchRow}>
              <Text style={[styles.label, { color: colors.text }]}>Enable Notifications</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                thumbColor={notificationsEnabled ? colors.primary : undefined}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <TouchableOpacity style={[styles.saveButton, loading && { opacity: 0.6 }]} onPress={handleSaveChanges} disabled={loading}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff", 
    padding: 15 
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  changeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  column: {
    width: "48%",
    flexDirection: "column",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "1%",
    marginBottom: "5%",
  },
  backButton: { 
    color: "#000",
    fontSize: 20, 
    marginRight: 10 
  },
  title: { 
    marginLeft: 10,
    fontSize: 22, 
    fontWeight: "600" 
  },
  logoutButton: { 
    width: 65,
    height: 40,
    backgroundColor: "#ff0000ff",
    alignItems: "center",
    borderRadius: 8,
    justifyContent: "center",
  },
  logoutButtonText: { 
    fontSize: 12,
    color: "#fff", 
    fontWeight: "600"
  },
  label: { 
    fontSize: 14, 
    fontWeight: "500", 
    marginBottom: 4, 
    color: "#333", 
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginTop: "1%",
    marginBottom: "5%",
    backgroundColor: "#f9f9f9",
    fontSize: 12,
  },
  inputWrapper: {
    position: "relative",
    width: "100%",
  },
  iconWrapper: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: [{ translateY: -12 }],
    justifyContent: "center",
    alignItems: "center",
  },
  prefInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginTop: "1%",
    marginBottom: "5%",
    backgroundColor: "#f9f9f9",
    fontSize: 12,
    textAlign: "left",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  sectionRow: {
    marginTop: 8,
  },
  themeRow: {
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 6,
  },
  themeOption: {
    flex: 1,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  themeOptionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  saveButton: {
    width: "50%",
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    alignSelf: "center",
    marginTop: 20,
  },
  saveButtonText: { 
    color: "#fff", 
    fontWeight: "600", 
    fontSize: 16 
  },
  text:{
    fontSize:16,
    color:"#000",  
    width:"100%"
  }
});
