// src/components/TaskItem.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Task } from '../store/taskSlice'; // Task type ko import karein

interface TaskItemProps {
  item: Task;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const formatDate = (date: Date | null) => date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

// Priority ke liye color define karein
const getPriorityColor = (priority: 'Low' | 'Medium' | 'High') => {
  switch (priority) {
    case 'High': return '#E57373'; // Light Red
    case 'Medium': return '#FFD54F'; // Light Amber
    case 'Low': return '#81C784'; // Light Green
    default: return '#E0E0E0'; // Grey
  }
};

const TaskItem: React.FC<TaskItemProps> = ({ item, onToggleComplete, onEdit, onDelete }) => {
  return (
    <View style={styles.taskItem}>
        <TouchableOpacity onPress={() => onToggleComplete(item)}>
            <Icon name={item.completed ? 'check-circle' : 'circle'} size={24} color={item.completed ? '#4A90E2' : '#888'} />
        </TouchableOpacity>

        <View style={styles.taskTextContainer}>
            <Text style={[styles.taskTitle, item.completed && styles.completedText]}>{item.title}</Text>
            {!!item.description && <Text style={[styles.taskDescription, item.completed && styles.completedText]}>{item.description}</Text>}
            <View style={styles.tagsContainer}>
                {item.deadline && <View style={[styles.tag, {backgroundColor: '#D6EAF8'}]}><Icon name="calendar" size={12} color="#4A90E2" /><Text style={[styles.tagText, {color: '#4A90E2'}]}>{formatDate(new Date(item.deadline))}</Text></View>}
                {item.category && <View style={[styles.tag, {backgroundColor: '#EAEAEA'}]}><Icon name="tag" size={12} color="#555" /><Text style={[styles.tagText, {color: '#555'}]}>{item.category}</Text></View>}
            </View>
        </View>

        {/* Priority Indicator */}
        <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(item.priority) }]} />
        
        <TouchableOpacity onPress={() => onEdit(item)} style={{marginHorizontal: 15}}><Icon name="edit-2" size={20} color="#888" /></TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(item._id)}><Icon name="trash-2" size={20} color="#E57373" /></TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
    taskItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.7)', padding: 20, marginHorizontal: 25, marginVertical: 8, borderRadius: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    taskTextContainer: { flex: 1, marginLeft: 15 },
    taskTitle: { fontSize: 18, color: '#333', fontWeight: '600' },
    taskDescription: { fontSize: 14, color: '#666', marginTop: 4 },
    completedText: { textDecorationLine: 'line-through', color: '#aaa' },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
    tag: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8, marginRight: 8 },
    tagText: { fontSize: 12, marginLeft: 5, fontWeight: '500' },
    priorityDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
});

export default TaskItem;