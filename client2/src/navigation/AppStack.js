// src/navigation/AppStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SwipeScreen from '../screens/Home/SwipeScreen';
import MatchesScreen from '../screens/Home/MatchesScreen';
import ChatsListScreen from '../screens/Chat/ChatsListScreen';
import ChatScreen from '../screens/Chat/ChatScreen';
import ProfileScreen from '../screens/Home/ProfileScreen';

const Stack = createNativeStackNavigator();

export default function AppStack() {
  return (
    <Stack.Navigator initialRouteName="Swipe">
      <Stack.Screen
        name="Swipe"
        component={SwipeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Matches"
        component={MatchesScreen}
        options={{ title: 'I Miei Match' }}
      />
      <Stack.Screen
        name="Chats"
        component={ChatsListScreen}
        options={{ title: 'Chat' }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({ title: route.params?.matchName || 'Chat' })}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profilo' }}
      />
    </Stack.Navigator>
  );
}
