import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { eventService, Event, Poll, Question } from '../../services/events';

interface EventState {
  events: Event[];
  currentEvent: Event | null;
  currentPoll: Poll | null;
  questions: Question[];
  isLoading: boolean;
  error: string | null;
}

const initialState: EventState = {
  events: [],
  currentEvent: null,
  currentPoll: null,
  questions: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchEvents = createAsyncThunk<Event[]>(
  'event/fetchEvents',
  async (_, { rejectWithValue }) => {
    try {
      return await eventService.getAllEvents();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch events');
    }
  }
);

export const fetchEvent = createAsyncThunk<Event, string>(
  'event/fetchEvent',
  async (eventId, { rejectWithValue }) => {
    try {
      return await eventService.getEvent(eventId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch event');
    }
  }
);

export const joinEvent = createAsyncThunk<{ message: string }, string>(
  'event/joinEvent',
  async (eventId, { rejectWithValue }) => {
    try {
      return await eventService.joinEvent(eventId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to join event');
    }
  }
);

const eventSlice = createSlice({
  name: 'event',
  initialState,
  reducers: {
    setCurrentEvent: (state, action: PayloadAction<Event>) => {
      state.currentEvent = action.payload;
    },
    updateCurrentEvent: (state, action: PayloadAction<Event>) => {
      state.currentEvent = action.payload;
      // Update in events list too
      const index = state.events.findIndex(e => e.id === action.payload.id);
      if (index !== -1) {
        state.events[index] = action.payload;
      }
    },
    setCurrentPoll: (state, action: PayloadAction<Poll | null>) => {
      state.currentPoll = action.payload;
    },
    updatePoll: (state, action: PayloadAction<Poll>) => {
      state.currentPoll = action.payload;
      // Update poll in current event too
      if (state.currentEvent) {
        const pollIndex = state.currentEvent.polls?.findIndex(p => p.id === action.payload.id);
        if (pollIndex !== undefined && pollIndex !== -1 && state.currentEvent.polls) {
          state.currentEvent.polls[pollIndex] = action.payload;
        }
      }
    },
    addQuestion: (state, action: PayloadAction<Question>) => {
      state.questions.unshift(action.payload);
      // Add to current event too
      if (state.currentEvent) {
        if (!state.currentEvent.questions) {
          state.currentEvent.questions = [];
        }
        state.currentEvent.questions.unshift(action.payload);
      }
    },
    setQuestions: (state, action: PayloadAction<Question[]>) => {
      state.questions = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch events
      .addCase(fetchEvents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.events = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch event
      .addCase(fetchEvent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentEvent = action.payload;
        state.questions = action.payload.questions || [];
      })
      .addCase(fetchEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Join event
      .addCase(joinEvent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(joinEvent.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(joinEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setCurrentEvent,
  updateCurrentEvent,
  setCurrentPoll,
  updatePoll,
  addQuestion,
  setQuestions,
  clearError,
} = eventSlice.actions;

export default eventSlice.reducer;