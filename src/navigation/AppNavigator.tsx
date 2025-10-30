import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ToDoListScreen from '../screens/ToDoListScreen';

// Define the types for the navigation stack parameters
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ToDoList: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  // Get isAuthenticated status from the Redux store
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <Stack.Navigator>
      {isAuthenticated ? (
        // If logged in, show the main ToDoList screen
        <Stack.Screen 
          name="ToDoList" 
          component={ToDoListScreen} 
          options={{ headerShown: false }} // Hide the default header
        />
      ) : (
        // If not logged in, show the authentication screens
        <>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ title: 'Login' }} 
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen} 
            options={{ title: 'Register' }} 
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;