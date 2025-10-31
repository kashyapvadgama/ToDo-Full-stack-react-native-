// =================================================================
// 1. IMPORTS
// =================================================================
// React & React Native
import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, 
  Modal, TextInput, Alert, ScrollView, StatusBar, 
  LayoutAnimation, UIManager, Platform 
} from 'react-native';

// Third-party Libraries
import { useSelector, useDispatch } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import DatePicker from 'react-native-date-picker';

// Local Imports (Hamare apne components aur code)
import { RootState, AppDispatch } from '../store';
import { logout } from '../store/authSlice';
import { Task, setTasks, addTask, updateTask, deleteTask } from '../store/taskSlice';
import apiClient from '../api/apiClient';
import TaskItem from '../components/TaskItem';

// =================================================================
// 2. CONFIGURATION & TYPES
// =================================================================
// Android ke liye LayoutAnimation enable karein
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Priority ke liye type define karein
type Priority = 'Low' | 'Medium' | 'High';

// =================================================================
// 3. THE MAIN COMPONENT
// =================================================================
const ToDoListScreen = () => {

  // -----------------------------------------------------------------
  // A. HOOKS & STATE MANAGEMENT (Saare states ek jagah)
  // -----------------------------------------------------------------
  const dispatch: AppDispatch = useDispatch();
  const { tasks } = useSelector((state: RootState) => state.tasks);

  // Modal aur Form ke States
  const [modalVisible, setModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState<Partial<Task> | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [priority, setPriority] = useState<Priority>('Medium');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  // Filtering aur Sorting ke States
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [sortOrder, setSortOrder] = useState<'smart' | 'date' | 'alphabetical'>('smart');
  const [searchQuery, setSearchQuery] = useState('');
  
  // -----------------------------------------------------------------
  // B. API & DATA HANDLING LOGIC (Server se baat-cheet)
  // -----------------------------------------------------------------
  const fetchTasks = () => {
    apiClient.get('/tasks')
      .then(res => {
        // Animation ke saath list update karein
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        dispatch(setTasks(res.data));
      })
      .catch(err => Alert.alert('Error', 'Could not fetch tasks.'));
  };

  const handleSaveTask = async () => {
    if (!title) return Alert.alert('Error', 'Title is required.');
    const taskData = { title, description, deadline, category, priority };
    try {
        if (currentTask?._id) {
            await apiClient.put(`/tasks/${currentTask._id}`, taskData);
        } else {
            await apiClient.post('/tasks', taskData);
        }
        fetchTasks(); // Nayi aur sorted list ke liye server se data fetch karein
        setModalVisible(false);
    } catch (error) { Alert.alert('Error', 'Could not save the task.'); }
  };

  const handleToggleComplete = async (task: Task) => {
    const updatedTask = { ...task, completed: !task.completed };
    dispatch(updateTask(updatedTask)); // Turant UI update ke liye
    try { await apiClient.put(`/tasks/${task._id}`, updatedTask); } 
    catch (error) { dispatch(updateTask(task)); Alert.alert('Error', 'Could not update status.'); }
  };

  const handleDeleteTask = (id: string) => {
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => {
            dispatch(deleteTask(id)); // Turant UI update ke liye
            try { await apiClient.delete(`/tasks/${id}`); } 
            catch (error) { Alert.alert('Error', 'Could not delete task.'); }
        }}
    ]);
  };

  // -----------------------------------------------------------------
  // C. MEMOIZED COMPUTATIONS (Performance ke liye)
  // -----------------------------------------------------------------
  const sortedAndFilteredTasks = useMemo(() => {
    let processedTasks = [...tasks];

    processedTasks = processedTasks.filter(task => {
        const matchesStatus = 
            filterStatus === 'all' || 
            (filterStatus === 'active' && !task.completed) || 
            (filterStatus === 'completed' && task.completed);
        const matchesSearch = 
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (task.category?.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    switch (sortOrder) {
      case 'date':
        return processedTasks.sort((a, b) => {
          if (!a.deadline) return 1; if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });
      case 'alphabetical':
        return processedTasks.sort((a, b) => a.title.localeCompare(b.title));
      case 'smart':
      default:
        return processedTasks; // Backend se aane wala default smart sort
    }
  }, [tasks, filterStatus, searchQuery, sortOrder]);
  
  // -----------------------------------------------------------------
  // D. EFFECTS (Component ke life-cycle ko handle karna)
  // -----------------------------------------------------------------
  useEffect(() => {
    fetchTasks();
  }, []); // Sirf pehli baar component load hone par chalaayein

  // -----------------------------------------------------------------
  // E. UI HANDLERS & HELPERS (Chote-mote UI functions)
  // -----------------------------------------------------------------
  const handleLogout = () => dispatch(logout());

  const openModal = (task?: Task) => {
    setCurrentTask(task || null);
    setTitle(task?.title || '');
    setDescription(task?.description || '');
    setCategory(task?.category || 'General');
    setDeadline(task?.deadline ? new Date(task.deadline) : null);
    setPriority(task?.priority || 'Medium');
    setModalVisible(true);
  };

  const formatDate = (date: Date | null) => date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Set Deadline';
  
  // -----------------------------------------------------------------
  // F. SUB-RENDER FUNCTIONS (JSX ko clean rakhne ke liye)
  // -----------------------------------------------------------------
  const renderTaskItem = ({ item }: { item: Task }) => (
    <TaskItem 
      item={item}
      onToggleComplete={handleToggleComplete}
      onEdit={openModal}
      onDelete={handleDeleteTask}
    />
  );
  
  const renderPrioritySelector = () => (
    <View style={styles.priorityContainer}>
      <Text style={styles.priorityLabel}>Priority:</Text>
      <TouchableOpacity style={[styles.priorityButton, priority === 'Low' && styles.priorityButtonActiveLow]} onPress={() => setPriority('Low')}>
        <Text style={[styles.priorityButtonText, priority === 'Low' && styles.priorityButtonTextActive]}>Low</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.priorityButton, priority === 'Medium' && styles.priorityButtonActiveMedium]} onPress={() => setPriority('Medium')}>
        <Text style={[styles.priorityButtonText, priority === 'Medium' && styles.priorityButtonTextActive]}>Medium</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.priorityButton, priority === 'High' && styles.priorityButtonActiveHigh]} onPress={() => setPriority('High')}>
        <Text style={[styles.priorityButtonText, priority === 'High' && styles.priorityButtonTextActive]}>High</Text>
      </TouchableOpacity>
    </View>
  );

  // -----------------------------------------------------------------
  // G. MAIN RENDER (Component ka asli JSX)
  // -----------------------------------------------------------------
  return (
    <LinearGradient colors={['#E0EAFC', '#CFDEF3']} style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* ===== HEADER ===== */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Today's Tasks</Text>
        <TouchableOpacity onPress={handleLogout}><Icon name="log-out" size={24} color="#333" /></TouchableOpacity>
      </View>

      {/* ===== CONTROLS (SEARCH, FILTER, SORT) ===== */}
      <View style={styles.filterContainer}>
          <View style={styles.searchBar}><Icon name="search" size={20} color="#888" /><TextInput style={styles.searchInput} placeholder="Search tasks or tags..." placeholderTextColor="#888" value={searchQuery} onChangeText={setSearchQuery} /></View>
          <View style={styles.controlRow}><Text style={styles.controlLabel}>Filter:</Text><TouchableOpacity onPress={() => setFilterStatus('all')} style={[styles.filterButton, filterStatus === 'all' && styles.activeFilter]}><Text style={[styles.filterText, filterStatus === 'all' && styles.activeFilterText]}>All</Text></TouchableOpacity><TouchableOpacity onPress={() => setFilterStatus('active')} style={[styles.filterButton, filterStatus === 'active' && styles.activeFilter]}><Text style={[styles.filterText, filterStatus === 'active' && styles.activeFilterText]}>Active</Text></TouchableOpacity><TouchableOpacity onPress={() => setFilterStatus('completed')} style={[styles.filterButton, filterStatus === 'completed' && styles.activeFilter]}><Text style={[styles.filterText, filterStatus === 'completed' && styles.activeFilterText]}>Done</Text></TouchableOpacity></View>
          <View style={styles.controlRow}><Text style={styles.controlLabel}>Sort by:</Text><TouchableOpacity onPress={() => setSortOrder('smart')} style={[styles.filterButton, sortOrder === 'smart' && styles.activeFilter]}><Text style={[styles.filterText, sortOrder === 'smart' && styles.activeFilterText]}>Smart</Text></TouchableOpacity><TouchableOpacity onPress={() => setSortOrder('date')} style={[styles.filterButton, sortOrder === 'date' && styles.activeFilter]}><Text style={[styles.filterText, sortOrder === 'date' && styles.activeFilterText]}>Date</Text></TouchableOpacity><TouchableOpacity onPress={() => setSortOrder('alphabetical')} style={[styles.filterButton, sortOrder === 'alphabetical' && styles.activeFilter]}><Text style={[styles.filterText, sortOrder === 'alphabetical' && styles.activeFilterText]}>A-Z</Text></TouchableOpacity></View>
      </View>

      {/* ===== TASK LIST ===== */}
      <FlatList 
        data={sortedAndFilteredTasks} 
        keyExtractor={(item) => item._id} 
        renderItem={renderTaskItem} 
        contentContainerStyle={{ paddingBottom: 100 }} 
        ListEmptyComponent={<Text style={styles.emptyListText}>No tasks found. Time to relax!</Text>} 
        refreshing={false} // Add a loading state here for a spinner
        onRefresh={fetchTasks} // Pull to refresh
      />
      
      {/* ===== ADD TASK BUTTON (FAB) ===== */}
      <TouchableOpacity style={styles.fab} onPress={() => openModal()}><Icon name="plus" size={28} color="#fff" /></TouchableOpacity>

      {/* ===== ADD/EDIT TASK MODAL ===== */}
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
                    {renderPrioritySelector()}
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

// =================================================================
// 4. STYLES
// =================================================================
const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingTop: 60 },
    headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#333' },
    filterContainer: { paddingHorizontal: 25, paddingTop: 20 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 15, marginBottom: 20, borderWidth: 1, borderColor: '#E8E8E8' },
    searchInput: { flex: 1, height: 50, color: '#333', fontSize: 16, marginLeft: 10 },
    controlRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    controlLabel: { color: '#555', fontSize: 16, marginRight: 10 },
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
    dateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F8F9', padding: 15, borderRadius: 12, width: '100%', marginBottom: 15, borderWidth: 1, borderColor: '#E8E8E8' },
    dateButtonText: { color: '#333', fontSize: 16, marginLeft: 10 },
    priorityContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 20, justifyContent: 'space-between' },
    priorityLabel: { fontSize: 16, color: '#333', fontWeight: '500' },
    priorityButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#F7F8F9', borderWidth: 1, borderColor: '#E8E8E8' },
    priorityButtonText: { color: '#555', fontWeight: '600' },
    priorityButtonActiveLow: { backgroundColor: '#C8E6C9', borderColor: '#A5D6A7' },
    priorityButtonActiveMedium: { backgroundColor: '#FFF9C4', borderColor: '#FFF59D' },
    priorityButtonActiveHigh: { backgroundColor: '#FFCDD2', borderColor: '#EF9A9A' },
    priorityButtonTextActive: { color: '#333' },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 10 },
    modalButton: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center', marginHorizontal: 5 },
    modalButtonText: { fontWeight: 'bold', fontSize: 16 },
});

// =================================================================
// 5. EXPORT
// =================================================================
export default ToDoListScreen;