{/* add your file to app.js to navigate to it from the sign up page */}
import React, { useState } from 'react'
import { Text, View , Pressable, StyleSheet, ScrollView, Button  } from 'react-native';
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';

const Separator = () => <View style ={styles.separator}/>;
const ParentalDashboard = () => (
    <SafeAreaProvider>
        <SafeAreaView style={StyleSheet.container}
        edges={['top']}>
            <ScrollView style={styles.scrollView}>
        {/*current balance button */}
                <View style={styles.CurrBal}>
                      <Button
                        title = "Current Balance"
                         /* onPress={() => NavigationActivation.navigate (torewards) */
                    />
                </View>
        {/*miletsones button */}   
               <View style={styles.Milestones}>
                    <Button
                title = "Completed Milestones" /* add which milestones were completed*/
                />
               </View>
                
    
                
        {/* Making Manage Habitat a header */}
                <View style = {styles.header}>
                   <Text style = {styles.headerText}>Manage Habitat</Text> 
                </View>
            
        {/*task manager button */}
            <View style={styles.TaskManage}>
                 <Button 
                title = "Task Management"
                /* onPress={() => NavigationActivation.navigate ("TaskManagemt") */
                />
            </View>
            
        {/*create reward button */}
            <View style={styles.CreateReward}>
                <Button 
                title = "Create Reward"
                /* onPress={() => NavigationActivation.navigate ("RewardCreation") */
                />
            </View> 

        {/*task management button */}  
            <View style={styles.TaskManage}></View>

              <View style={styles.RevTasks}>
                <Button
                title = "Review Tasks"
                /* onPress={() => NavigationActivation.navigate ("ReviewTasks") */
                />
            </View>
            
        {/*settings button */}
            <View style={styles.Settings}>
                <Button 
                title = "Settings"
                /* onPress={() => NavigationActivation.navigate ("AccountSettings") */
            />
            </View>
            

            </ScrollView>
        </SafeAreaView>
    </SafeAreaProvider>
)

{/* add tab navigation */}

const styles = StyleSheet.create ({
    CurrBal: {
        backgroundColor: #F6FBF4,
        /*border radius:
        margin:
        width:
        */
    },
});

export default ParentalDashboard;