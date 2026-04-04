import React, { useCallback, useState, useEffect } from "react";
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
import {
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
  doc,
  setDoc,
  increment,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { startOfDay } from "date-fns";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { getAuth } from "firebase/auth";

import { Picker } from "@react-native-picker/picker";
import { useSelectedChild } from "../SelectedChildContext";
import { useFocusEffect } from "@react-navigation/native";
import { useParentLock } from "../ParentLockContext";

export default function ParentTaskPage({ navigation, route }) {
  const { selectedChildId } = useSelectedChild();
  const { isParentUnlocked } = useParentLock();

  useFocusEffect(
    useCallback(() => {
      if (!isParentUnlocked) {
        navigation.replace("parentPinScreen");
      }
    }, [isParentUnlocked, navigation])
  );

  const activeChildId = route?.params?.childId || selectedChildId;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [steps, setSteps] = useState([""]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [points, setPoints] = useState("");
  const [isPointsDropdownOpen, setIsPointsDropdownOpen] = useState(false);
  const [isCustomPointsMode, setIsCustomPointsMode] = useState(false);
  const [frequency, setFrequency] = useState("One-Time");
  const [endDate, setEndDate] = useState(null);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);


  // Dropdown state for generic tasks
  const [taskList, setTaskList] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");

  // Fetch generic tasks from the stockpile (genericTasks collection)
  useEffect(() => {
    const fetchGenericTasks = async () => {
      try {
        const snapshot = await getDocs(collection(db, "genericTasks"));
        const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTaskList(tasks);
      } catch (err) {
        console.error("Error fetching generic tasks:", err);
      }
    };
    fetchGenericTasks();
  }, []);

  // When a generic task is selected, populate fields
  useEffect(() => {
    if (!selectedTaskId) return;
    const task = taskList.find(t => t.id === selectedTaskId);
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setPoints(task.points ? String(task.points) : "");
      setSteps(Array.isArray(task.steps) ? task.steps : [""]);
      // Use today's date and time for new task
      setDate(new Date());
      setTime(new Date());
    }
  }, [selectedTaskId]);

  // --- Step Handlers ---
  const handleAddStep = () => setSteps([...steps, ""]);

  const handleRemoveStep = (index) => {
    const updated = steps.filter((_, i) => i !== index);
    setSteps(updated);
  };

  const handleStepChange = (text, index) => {
    const updated = [...steps];
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
    if (isNaN(parsedPoints) || parsedPoints < 0 || parsedPoints > 1000) {
      Alert.alert("Invalid Points", "Points must be between 0 and 1000.");
      return;
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!activeChildId) {
      Alert.alert("No Child Selected", "Please select a child before creating a task.");
      return;
}

      const parentId = user.uid;
      const dateStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        0,
        0,
        0,
        0
      );

      // Validate end date for repeating tasks
      if (frequency !== "One-Time") {
        if (!endDate) {
          Alert.alert("Missing End Date", "Please select an end date for repeating tasks.");
          return;
        }

        const endDateStart = new Date(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate(),
          0,
          0,
          0,
          0
        );

        if (endDateStart < dateStart) {
          Alert.alert("Invalid End Date", "End date cannot be before the start date.");
          return;
        }
      }

      const scheduleDateKey = `${dateStart.getFullYear()}-${String(dateStart.getMonth() + 1).padStart(2, "0")}-${String(dateStart.getDate()).padStart(2, "0")}`;

      const endDateStartForSave =
        endDate && frequency !== "One-Time"
          ? new Date(
            endDate.getFullYear(),
            endDate.getMonth(),
            endDate.getDate(),
            0,
            0,
            0,
            0
          )
          : null;

      const endDateKey = endDateStartForSave
        ? `${endDateStartForSave.getFullYear()}-${String(endDateStartForSave.getMonth() + 1).padStart(2, "0")}-${String(endDateStartForSave.getDate()).padStart(2, "0")}`
        : null;

      // 1) Save task with points + status
      const taskRef = await addDoc(collection(db, "tasks"), {
        title,
        description,
        scheduleDate: scheduleDateKey, // YYYY-MM-DD (local)
        dateTimestamp: Timestamp.fromDate(dateStart),
        time: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        steps,
        ownerId: parentId,
        userId: user.uid, // Always set userId to the currently logged-in user's UID
        childId: activeChildId,
        frequency,
        isRecurring: frequency !== "One-Time",
        endDate: endDateStartForSave ? Timestamp.fromDate(endDateStartForSave) : null,
        endDateKey,
        points: parsedPoints,
        status: "pending",
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
      setFrequency("One-Time");
      setEndDate(null);
      navigation.goBack();
    } catch (error) {
      console.error("Error saving task:", error);
      Alert.alert("Error", "Could not save task. Please try again.");
    }
  };

  async function childTasksSave({ title, description, date, childId }) {
    const start = startOfDay(date);
    const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
    await addDoc(collection(db, "tasks"), {
      title,
      description,
      scheduleDate: key,
      dateTimestamp: Timestamp.fromDate(start),
      childId,
      isRecurring: false,
      userId: getAuth().currentUser?.uid || null,
      createdAt: serverTimestamp(),
    });
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.header}>Create Task</Text>

          <View style={styles.formWrapper}>
            {/* Dropdown for stockpile of tasks */}
            <Text style={styles.label}>Select Existing Task</Text>
            <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginTop: 5 }}>
              <Picker
                selectedValue={selectedTaskId}
                onValueChange={setSelectedTaskId}
                style={{ color: '#222' }} // Ensure text is visible
              >
                <Picker.Item label="-- Select a task --" value="" color="#888" />
                {taskList.map(task => (
                  <Picker.Item
                    key={task.id}
                    label={task.title ? String(task.title) : `Untitled Task (${task.id.slice(-4)})`}
                    value={task.id}
                    color="#222"
                  />
                ))}
              </Picker>
            </View>

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

            {/* Task Frequency */}
            <Text style={styles.label}>Task Frequency</Text>
            <View style={styles.frequencyContainer}>
              {[/*"One-Time"*/, "Daily", "Weekly", "Monthly"].map((freq) => (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.freqButton,
                    frequency === freq && styles.freqButtonActive,
                  ]}
                  onPress={() => setFrequency(freq)}
                >
                  <Text
                    style={[
                      styles.freqText,
                      frequency === freq && styles.freqTextActive,
                    ]}
                  >
                    {freq}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Points */}
            <Text style={styles.label}>Points</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setIsPointsDropdownOpen((prev) => !prev)}
            >
              <Text
                style={
                  points ? styles.dropdownValueText : styles.dropdownPlaceholderText
                }
              >
                {points ? `${points} points` : "Select points"}
              </Text>
              <Ionicons
                name={isPointsDropdownOpen ? "chevron-up" : "chevron-down"}
                size={18}
                color="#555"
              />
            </TouchableOpacity>
            {isPointsDropdownOpen && (
              <View style={styles.dropdownList}>
                {[5, 10, 15, 20, 25, 30].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setPoints(String(value));
                      setIsCustomPointsMode(false);
                      setIsPointsDropdownOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{value} points</Text>
                  </TouchableOpacity>
                ))}
                <View style={styles.dropdownDivider} />
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setIsCustomPointsMode(true);
                  }}
                >
                  <Text style={styles.dropdownItemText}>Custom value (max 1000)</Text>
                </TouchableOpacity>
                {isCustomPointsMode && (
                  <View style={styles.customPointsContainer}>
                    <TextInput
                      style={styles.customPointsInput}
                      placeholder="e.g., 75"
                      keyboardType="numeric"
                      value={points}
                      onChangeText={(text) => {
                        const sanitized = text.replace(/[^0-9]/g, "");
                        if (!sanitized) {
                          setPoints("");
                          return;
                        }
                        const numeric = Math.min(parseInt(sanitized, 10) || 0, 1000);
                        setPoints(String(numeric));
                      }}
                    />
                    <TouchableOpacity
                      style={styles.customPointsDoneButton}
                      onPress={() => {
                        setIsPointsDropdownOpen(false);
                      }}
                    >
                      <Text style={styles.customPointsDoneText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Schedule */}
            <Text style={styles.label}>Schedule</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
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
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowTimePicker(true)}
            >
              <Text>
                {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
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

            {/* End Date for repeating tasks */}
            {frequency !== "One-Time" && (
              <>
                <Text style={styles.label}>End Date</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text>
                    {endDate
                      ? endDate.toISOString().split("T")[0]
                      : "Select end date"}
                  </Text>
                </TouchableOpacity>
                {showEndDatePicker && (
                  <DateTimePicker
                    value={endDate || date}
                    mode="date"
                    display="default"
                    onChange={(e, selectedEndDate) => {
                      setShowEndDatePicker(false);
                      if (selectedEndDate) setEndDate(selectedEndDate);
                    }}
                  />
                )}
              </>
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
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  formWrapper: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 15,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 5,
    backgroundColor: "#fafafa",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  frequencyContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 6,
  },
  freqButton: {
    borderWidth: 1,
    borderColor: "#4CAF50",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginBottom: 6,
  },
  freqButtonActive: {
    backgroundColor: "#4CAF50",
  },
  freqText: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  freqTextActive: {
    color: "#fff",
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 5,
    backgroundColor: "#fafafa",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownPlaceholderText: {
    color: "#888",
    fontSize: 16,
  },
  dropdownValueText: {
    color: "#333",
    fontSize: 16,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#fff",
    marginBottom: 5,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#333",
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: "#eee",
    marginHorizontal: 8,
  },
  customPointsContainer: {
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  customPointsInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 6,
    marginBottom: 6,
  },
  customPointsDoneButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
  },
  customPointsDoneText: {
    color: "#fff",
    fontWeight: "600",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5
  },
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
    fontSize: 16,
    fontWeight: "bold",
  },
  backButton: {
    alignSelf: "flex-start",
    marginLeft: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  backText: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "bold",
  },

});
