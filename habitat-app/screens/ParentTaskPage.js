import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { db } from "../firebaseConfig";
import { collection, addDoc, serverTimestamp, Timestamp, query, where, onSnapshot } from "firebase/firestore";
import { startOfDay } from 'date-fns';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { getAuth } from "firebase/auth";
import { useEffect } from "react";

export default function ParentTaskPage({ navigation, route }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [steps, setSteps] = useState([""]);
  const [childId, setChildId] = useState(route?.params?.childId || "");
  const [childrenList, setChildrenList] = useState([]);

  // Recurrence state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFreq, setRecurrenceFreq] = useState("weekly"); // daily | weekly | monthly
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceDays, setRecurrenceDays] = useState([false, false, false, false, false, false, false]); // Mon..Sun
  const [recurrenceEndType, setRecurrenceEndType] = useState("never"); // never | until | count
  const [recurrenceUntil, setRecurrenceUntil] = useState(new Date());
  const [recurrenceCount, setRecurrenceCount] = useState(10);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // NEW: points input from parent
  const [points, setPoints] = useState("");

  // childId is initialized from route params in the state above; use the childId state variable instead

  // --- Step Handlers ---
  const handleAddStep = () => setSteps([...steps, ""]);

  const handleRemoveStep = (index) => {
    const updated = steps.filter((_, i) => i !== index);
    setSteps(updated);
  };

  const handleStepChange = (text, index) => {
    const [childId, setChildId] = useState(route?.params?.childId || null);
    updated[index] = text;
    setSteps(updated);
  };

  // --- Save Task ---
  const handleSaveTask = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Missing Info", "Please fill in both task title and description.");
      return;
    }

    const parsedPoints = parseInt(points, 10);
    if (isNaN(parsedPoints) || parsedPoints < 0) {
      Alert.alert("Invalid Points", "Points must be a non-negative number.");
      return;
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

      const recurrence = isRecurring
        ? {
          frequency: recurrenceFreq,
          interval: recurrenceInterval,
          daysOfWeek: recurrenceDays.map((v, i) => v ? i : -1).filter(i => i >= 0), // 0=Mon,6=Sun
          endType: recurrenceEndType,
          until: recurrenceEndType === 'until' ? Timestamp.fromDate(startOfDay(recurrenceUntil)) : null,
          count: recurrenceEndType === 'count' ? recurrenceCount : null,
          startDate: Timestamp.fromDate(start),
        }
        : null;

      // Find the selected child's userId from childrenList
      let childUserId = null;
      if (childId) {
        const childObj = childrenList.find(c => c.id === childId);
        if (childObj) childUserId = childObj.userId || null;
      }

      await addDoc(collection(db, "tasks"), {
        title,
        description,
        scheduleDate: date.toISOString().split("T")[0], // YYYY-MM-DD
        dateTimestamp: Timestamp.fromDate(dateStart),
        time: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        steps,
        ownerId: user.uid,
        childId: childId || null,
        userId: childUserId,
        isRecurring: !!isRecurring,
        recurrence,
        createdAt: serverTimestamp(),
      });

      // 2) Update parent's point summary (parentPoints collection)
      const parentPointsRef = doc(db, "parentPoints", parentId);
      await setDoc(
        parentPointsRef,
        {
          parentId,
          totalAssignedPoints: increment(parsedPoints),
          updatedAt: serverTimestamp(),
          lastTaskId: taskRef.id,
        },
        { merge: true }
      );

      Alert.alert("Success", "Task saved with points!");
      setTitle("");
      setDescription("");
      setSteps([""]);
      setPoints("");
      navigation.goBack();
    } catch (error) {
      console.error("Error saving task:", error);
      Alert.alert("Error", "Could not save task. Please try again.");
    }
  };

  async function childTasksSave({ title, description, date, childId }) {
    const start = startOfDay(date);
    await addDoc(collection(db, "tasks"), {
      title,
      description,
      dateTimestamp: Timestamp.fromDate(start),
      childId,
      createdAt: serverTimestamp(),
    });
  }

  // Load children for the current parent to allow selecting a child profile
  useEffect(() => {
    const auth = getAuth();
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const q = query(collection(db, 'children'), where('userId', '==', uid));
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setChildrenList(list);
      // if there's at least one child and no selected child, auto-select the first
      if (list.length && !childId) setChildId(list[0].id);
    }, err => console.error('children onSnapshot', err));
    return () => unsub();
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
          <Text style={styles.header}>Task Management</Text>

          {/* Task Title */}
          <Text style={styles.label}>Task Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Clean my room"
            value={title}
            onChangeText={setTitle}
          />

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, { height: 100 }]}
            multiline
            placeholder="e.g., Put away clothes, make the bed, vacuum..."
            value={description}
            onChangeText={setDescription}
          />

          {/* Schedule */}
          <Text style={styles.label}>Schedule</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
            <Text>{date.toISOString().split("T")[0]}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(e, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}

          {/* Time */}
          <Text style={styles.label}>Time</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowTimePicker(true)}>
            <Text>{time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              display="default"
              onChange={(e, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime) setTime(selectedTime);
              }}
            />
          )}


          {/* Child selection (optional) */}
          <Text style={styles.label}>Child (optional)</Text>
          {childrenList && childrenList.length > 0 ? (
            <View>
              <View style={{ flexDirection: 'row', marginTop: 8, flexWrap: 'wrap' }}>
                {childrenList.map(c => (
                  <TouchableOpacity key={c.id} onPress={() => setChildId(c.id)} style={{ padding: 10, marginRight: 8, marginBottom: 8, backgroundColor: childId === c.id ? '#5CB85C' : '#f1f1f1', borderRadius: 8 }}>
                    <Text style={{ color: childId === c.id ? '#fff' : '#000' }}>{c.preferredName || c.fullName || 'Child'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={{ marginTop: 6, color: '#666' }}>{childId ? `Selected: ${childrenList.find(x => x.id === childId)?.preferredName || childrenList.find(x => x.id === childId)?.fullName}` : 'No child selected'}</Text>
            </View>
          ) : (
            <TextInput
              style={styles.input}
              placeholder="Paste child UID (optional)"
              value={childId}
              onChangeText={setChildId}
            />
          )}

          {/* Recurrence */}
          <Text style={styles.label}>Repeat</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <TouchableOpacity
              style={[styles.input, { flex: 1, justifyContent: 'center' }]}
              onPress={() => setIsRecurring(prev => !prev)}
            >
              <Text>{isRecurring ? `Repeats: ${recurrenceFreq}` : 'Does not repeat'}</Text>
            </TouchableOpacity>
          </View>

          {isRecurring && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontWeight: '600' }}>Frequency</Text>
              <View style={{ flexDirection: 'row', marginTop: 8 }}>
                {['daily', 'weekly', 'monthly'].map((f) => (
                  <TouchableOpacity key={f} onPress={() => setRecurrenceFreq(f)} style={{ padding: 8, marginRight: 8, backgroundColor: recurrenceFreq === f ? '#5CB85C' : '#f1f1f1', borderRadius: 8 }}>
                    <Text style={{ color: recurrenceFreq === f ? '#fff' : '#000' }}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {recurrenceFreq === 'weekly' && (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ fontWeight: '600' }}>Days of week</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
                      <TouchableOpacity key={d} onPress={() => {
                        const arr = [...recurrenceDays]; arr[i] = !arr[i]; setRecurrenceDays(arr);
                      }} style={{ padding: 8, marginRight: 8, marginBottom: 8, backgroundColor: recurrenceDays[i] ? '#5CB85C' : '#f1f1f1', borderRadius: 8 }}>
                        <Text style={{ color: recurrenceDays[i] ? '#fff' : '#000' }}>{d}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={{ marginTop: 10 }}>
                <Text style={{ fontWeight: '600' }}>End</Text>
                <View style={{ flexDirection: 'row', marginTop: 8 }}>
                  {['never', 'until', 'count'].map((t) => (
                    <TouchableOpacity key={t} onPress={() => setRecurrenceEndType(t)} style={{ padding: 8, marginRight: 8, backgroundColor: recurrenceEndType === t ? '#5CB85C' : '#f1f1f1', borderRadius: 8 }}>
                      <Text style={{ color: recurrenceEndType === t ? '#fff' : '#000' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {recurrenceEndType === 'until' && (
                  <View style={{ marginTop: 8 }}>
                    <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                      <Text>{recurrenceUntil.toISOString().split('T')[0]}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {recurrenceEndType === 'count' && (
                  <View style={{ marginTop: 8 }}>
                    <TextInput style={styles.input} keyboardType="numeric" value={String(recurrenceCount)} onChangeText={(v) => setRecurrenceCount(Number(v) || 0)} />
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Steps */}
          <Text style={styles.label}>Steps</Text>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={`Step ${index + 1} description`}
                value={step}
                onChangeText={(text) => handleStepChange(text, index)}
              />
              {steps.length > 1 && (
                <TouchableOpacity onPress={() => handleRemoveStep(index)}>
                  <Ionicons name="close" size={20} color="gray" />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.addStep} onPress={handleAddStep}>
            <Ionicons name="add" size={20} color="black" />
            <Text style={styles.addStepText}>Add Step</Text>
          </TouchableOpacity>

          {/* Save Task */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveTask}>
            <Text style={styles.saveButtonText}>Save Task</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  header: { fontSize: 22, fontWeight: "600", textAlign: "center", marginVertical: 10 },
  label: { fontSize: 16, fontWeight: "500", marginTop: 15 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
  },
  stepRow: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  addStep: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#f1f1f1",
    padding: 10,
    borderRadius: 8,
    justifyContent: "center",
  },
  addStepText: { marginLeft: 5, fontWeight: "500" },
  saveButton: {
    backgroundColor: "#5CB85C",
    marginTop: 25,
    paddingVertical: 15,
    borderRadius: 12,
  },
  saveButtonText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  backButton: {
    alignSelf: "flex-start",
    marginLeft: 20,
    marginTop: 40,
    marginBottom: 10,
  },
  backText: {
    fontSize: 18,
    color: "#4CAF50",
    fontWeight: "bold",
  },

});
