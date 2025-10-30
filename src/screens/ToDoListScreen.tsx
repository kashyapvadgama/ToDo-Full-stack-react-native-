// src/screens/ToDoListScreen.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, ScrollView, StatusBar } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { logout } from '../store/authSlice';
import { Task, setTasks, addTask, updateTask, deleteTask } from '../store/taskSlice';
import apiClient from '../api/apiClient';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import DatePicker from 'react-native-date-picker';

import TaskItem from '../components/TaskItem';

const ToDoListScreen = () => {
  const dispatch: AppDispatch = useDispatch();
  const { tasks } = useSelector((state: RootState) => state.tasks);

  // States
  const [modalVisible, setModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState<Partial<Task> | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  // Filtering & Sorting States
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [sortOrder, setSortOrder] = useState<'smart' | 'date' | 'alphabetical'>('smart'); // NEW STATE FOR SORTING
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // We are now fetching the "unsorted" tasks from the backend and sorting on the frontend
    apiClient.get('/tasks').then(res => dispatch(setTasks(res.data))).catch(err => Alert.alert('Error', 'Could not fetch tasks.'));
  }, [dispatch]);

  // Filtering and searching logic
  const sortedAndFilteredTasks = useMemo(() => {
    // 1. Filter tasks first
    let filtered = tasks.filter(task => {
        const matchesStatus = 
            filterStatus === 'all' || 
            (filterStatus === 'active' && !task.completed) || 
            (filterStatus === 'completed' && task.completed);
        const matchesSearch = 
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (task.category && task.category.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    // 2. Now, sort the filtered tasks
    switch (sortOrder) {
      case 'date':
        return filtered.sort((a, b) => {
          if (!a.deadline) return 1; // Tasks without deadlines go to the end
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });
      case 'alphabetical':
        return filtered.sort((a, b) => a.title.localeCompare(b.title));
      case 'smart':
      default:
        // 'smart' sort is the default from the backend, so we don't need to re-sort
        return filtered;
    }

  }, [tasks, filterStatus, searchQuery, sortOrder]); // sortOrder added to dependencies

  // ... (baaki saare handler functions bilkul same rahenge)
  const handleLogout = () => dispatch(logout());

  const openModal = (task?: Task) => {
    setCurrentTask(task || null);
    setTitle(task?.title || '');
    setDescription(task?.description || '');
    setCategory(task?.category || 'General');
    setDeadline(task?.deadline ? new Date(task.deadline) : null);
    setModalVisible(true);
  };

  const handleSaveTask = async () => {
    if (!title) return Alert.alert('Error', 'Title is required.');
    const taskData = { title, description, deadline, category, priority: 'Medium' };
    try {
        // Refresh the list from the server to get the latest smart sort
        const fetchAndSetTasks = () => apiClient.get('/tasks').then(res => dispatch(setTasks(res.data)));

        if (currentTask?._id) {
            await apiClient.put(`/tasks/${currentTask._id}`, taskData);
            fetchAndSetTasks();
        } else {
            await apiClient.post('/tasks', taskData);
            fetchAndSetTasks();
        }
        setModalVisible(false);
    } catch (error) { Alert.alert('Error', 'Could not save the task.'); }
  };

  const handleToggleComplete = async (task: Task) => {
    const updatedTask = { ...task, completed: !task.completed };
    dispatch(updateTask(updatedTask));
    try { await apiClient.put(`/tasks/${task._id}`, updatedTask); } 
    catch (error) { dispatch(updateTask(task)); Alert.alert('Error', 'Could not update status.'); }
  };

  const handleDeleteTask = (id: string) => {
    Alert.alert("Delete Task", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => {
            dispatch(deleteTask(id));
            try { await apiClient.delete(`/tasks/${id}`); } 
            catch (error) { Alert.alert('Error', 'Could not delete task.'); }
        }}
    ]);
  };

  const formatDate = (date: Date | null) => date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Set Deadline';

  const renderTaskItem = ({ item }: { item: Task }) => (
    <TaskItem 
      item={item}
      onToggleComplete={handleToggleComplete}
      onEdit={openModal}
      onDelete={handleDeleteTask}
    />
  );

  return (
    <LinearGradient colors={['#E0EAFC', '#CFDEF3']} style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Today's Tasks</Text>
        <TouchableOpacity onPress={handleLogout}><Icon name="log-out" size={24} color="#333" /></TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
          <View style={styles.searchBar}>
              <Icon name="search" size={20} color="#888" />
              <TextInput style={styles.searchInput} placeholder="Search tasks or tags..." placeholderTextColor="#888" value={searchQuery} onChangeText={setSearchQuery} />
          </View>
          {/* FILTER BUTTONS */}
          <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>Filter:</Text>
              <TouchableOpacity onPress={() => setFilterStatus('all')} style={[styles.filterButton, filterStatus === 'all' && styles.activeFilter]}><Text style={[styles.filterText, filterStatus === 'all' && styles.activeFilterText]}>All</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setFilterStatus('active')} style={[styles.filterButton, filterStatus === 'active' && styles.activeFilter]}><Text style={[styles.filterText, filterStatus === 'active' && styles.activeFilterText]}>Active</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setFilterStatus('completed')} style={[styles.filterButton, filterStatus === 'completed' && styles.activeFilter]}><Text style={[styles.filterText, filterStatus === 'completed' && styles.activeFilterText]}>Done</Text></TouchableOpacity>
          </View>
          {/* SORT BUTTONS (NEW) */}
          <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>Sort by:</Text>
              <TouchableOpacity onPress={() => setSortOrder('smart')} style={[styles.filterButton, sortOrder === 'smart' && styles.activeFilter]}><Text style={[styles.filterText, sortOrder === 'smart' && styles.activeFilterText]}>Smart</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setSortOrder('date')} style={[styles.filterButton, sortOrder === 'date' && styles.activeFilter]}><Text style={[styles.filterText, sortOrder === 'date' && styles.activeFilterText]}>Date</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setSortOrder('alphabetical')} style={[styles.filterButton, sortOrder === 'alphabetical' && styles.activeFilter]}><Text style={[styles.filterText, sortOrder === 'alphabetical' && styles.activeFilterText]}>A-Z</Text></TouchableOpacity>
          </View>
      </View>

      <FlatList 
        data={sortedAndFilteredTasks} // Use the new sorted and filtered array
        keyExtractor={(item) => item._id} 
        renderItem={renderTaskItem} 
        contentContainerStyle={{ paddingBottom: 100 }} 
        ListEmptyComponent={<Text style={styles.emptyListText}>No tasks found. Time to relax!</Text>} 
      />
      
      <TouchableOpacity style={styles.fab} onPress={() => openModal()}><Icon name="plus" size={28} color="#fff" /></TouchableOpacity>

      {/* MODAL (No changes needed here) */}
      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
            <ScrollView contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}>
            <View style={styles.modalView}>
                <Text style={styles.modalTitle}>{currentTask ? 'Edit Task' : 'Add New Task'}</Text>
                <TextInput style={styles.input} placeholder="Title" placeholderTextColor="#888" value={title} onChangeText={setTitle} />
                <TextInput style={styles.input} placeholder="Description (Optional)" placeholderTextColor="#888" value={description} onChangeText={setDescription} />
                <TextInput style={styles.input} placeholder="Category (e.g. Work, Home)" placeholderTextColor="#888" value={category} onChangeText={setCategory} />
                <TouchableOpacity style={styles.dateButton} onPress={() => setDatePickerOpen(true)}>
                    <Icon name="calendar" size={20} color="#333" />
                    <Text style={styles.dateButtonText}>{formatDate(deadline)}</Text>
                </TouchableOpacity>
                <DatePicker modal open={datePickerOpen} date={deadline || new Date()} onConfirm={(date) => { setDatePickerOpen(false); setDeadline(date); }} onCancel={() => setDatePickerOpen(false)} />
                <View style={styles.modalActions}>
                    <TouchableOpacity style={[styles.modalButton, {backgroundColor: '#EAEAEA'}]} onPress={() => setModalVisible(false)}><Text style={[styles.modalButtonText, {color: '#333'}]}>Cancel</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.modalButton, {backgroundColor: '#4A90E2'}]} onPress={handleSaveTask}><Text style={[styles.modalButtonText, {color: '#fff'}]}>Save Task</Text></TouchableOpacity>
                </View>
            </View>
            </ScrollView>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingTop: 60 },
    headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#333' },
    filterContainer: { paddingHorizontal: 25, paddingTop: 20 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 15, marginBottom: 20, borderWidth: 1, borderColor: '#E8E8E8' },
    searchInput: { flex: 1, height: 50, color: '#333', fontSize: 16, marginLeft: 10 },
    controlRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    controlLabel: { color: '#555', fontSize: 16, marginRight: 10 },
    filterButtons: { flexDirection: 'row' },
    filterButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#fff', marginRight: 10, borderWidth: 1, borderColor: '#E8E8E8' },
    activeFilter: { backgroundColor: '#4A90E2', borderWidth: 0 },
    filterText: { color: '#555', fontSize: 14 },
    activeFilterText: { color: '#fff', fontWeight: 'bold' },
    fab: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: '#4A90E2', alignItems: 'center', justifyContent: 'center', right: 30, bottom: 40, elevation: 8, shadowColor: '#4A90E2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
    emptyListText: { textAlign: 'center', marginTop: 50, color: '#666', fontSize: 16 },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
    modalView: { width: '90%', backgroundColor: 'white', borderRadius: 20, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
    input: { width: '100%', backgroundColor: '#F7F8F9', padding: 15, marginBottom: 15, borderRadius: 12, color: '#333', fontSize: 16, borderWidth: 1, borderColor: '#E8E8E8' },
    dateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F8F9', padding: 15, borderRadius: 12, width: '100%', marginBottom: 20, borderWidth: 1, borderColor: '#E8E8E8' },
    dateButtonText: { color: '#333', fontSize: 16, marginLeft: 10 },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 10 },
    modalButton: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center', marginHorizontal: 5 },
    modalButtonText: { fontWeight: 'bold', fontSize: 16 },
});

export default ToDoListScreen;