// paste updated changes below function line include neccesary importd 
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ParentReviewTask() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>This is the ParentReviewTask screen (placeholder)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 18,
    color: "#333",
    textAlign: "center",
  },
});
