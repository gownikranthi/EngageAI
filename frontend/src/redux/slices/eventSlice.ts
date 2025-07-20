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

// Response type definitions
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

interface EventsResponse {
  events: Event[];
  total: number;
  page: number;
  limit: number;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

// Async thunks
export const fetchEvents = createAsyncThunk<Event[]>(
  'event/fetchEvents',
  async (_, { rejectWithValue }) => {
    try {
      const response = await eventService.getAllEvents();
      // Handle different response formats
      if (Array.isArray(response)) {
        return response;
      } else if (response && typeof response === 'object' && 'data' in response) {
        const data = (response as ApiResponse<EventsResponse>).data;
        return data?.events || [];
      } else {
        return [];
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError.response?.data?.message || apiError.message || 'Failed to fetch events');
    }
  }
);

export const fetchEvent = createAsyncThunk<Event, string>(
  'event/fetchEvent',
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await eventService.getEvent(eventId);
      // Handle different response formats
      if (response && typeof response === 'object' && 'data' in response) {
        const apiResponse = response as unknown as ApiResponse<Event>;
        return apiResponse.data as Event;
      }
      return response as Event;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError.response?.data?.message || apiError.message || 'Failed to fetch event');
    }
  }
);

export const joinEvent = createAsyncThunk<{ message: string }, string>(
  'event/joinEvent',
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await eventService.joinEvent(eventId);
      return response;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError.response?.data?.message || apiError.message || 'Failed to join event');
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
      const index = state.events.findIndex(e => e._id === action.payload._id);
      if (index !== -1) {
        state.events[index] = action.payload;
      }
    },
    setCurrentPoll: (state, action: PayloadAction<Poll | null>) => {
      state.currentPoll = action.payload;
    },
    updatePoll: (state, action: PayloadAction<Poll>) => {
      state.currentPoll = action.payload;
      if (state.currentEvent) {
        const pollIndex = state.currentEvent.polls?.findIndex(p => p._id === action.payload._id);
        if (pollIndex !== undefined && pollIndex !== -1 && state.currentEvent.polls) {
          state.currentEvent.polls[pollIndex] = action.payload;
        }
      }
    },
    addQuestion: (state, action: PayloadAction<Question>) => {
      state.questions.unshift(action.payload);
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
