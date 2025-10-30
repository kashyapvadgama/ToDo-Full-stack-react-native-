import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the shape of a single task
    export interface Task {
      _id: string;
      title: string;
      description: string;
      deadline?: string;
      priority: 'Low' | 'Medium' | 'High';
      completed: boolean;
      category?: string; // <<-- YEH LINE ADD KAREIN
    }

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
}

const initialState: TaskState = {
  tasks: [],
  isLoading: false,
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setTasks(state, action: PayloadAction<Task[]>) {
      state.tasks = action.payload;
    },
    addTask(state, action: PayloadAction<Task>) {
      state.tasks.unshift(action.payload); // Add to the beginning of the list
    },
    updateTask(state, action: PayloadAction<Task>) {
      const index = state.tasks.findIndex(task => task._id === action.payload._id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
    },
    deleteTask(state, action: PayloadAction<string>) {
      state.tasks = state.tasks.filter(task => task._id !== action.payload);
    },
    setTaskLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    }
  },
});

export const { setTasks, addTask, updateTask, deleteTask, setTaskLoading } = taskSlice.actions;
export default taskSlice.reducer;