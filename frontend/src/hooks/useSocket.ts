import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import socketService from '../services/socket';
import { updateCurrentEvent, updatePoll, addQuestion } from '../redux/slices/eventSlice';
import type { Event, Poll, Question } from '../services/events';

export const useSocket = (eventId?: string) => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Connect socket
    const socket = socketService.connect();

    // Join session if eventId provided
    if (eventId) {
      socketService.joinSession(eventId);
    }

    // Set up listeners
    socketService.onSessionUpdate((data: Event) => {
      dispatch(updateCurrentEvent(data));
    });

    socketService.onPollUpdate((data: Poll) => {
      dispatch(updatePoll(data));
    });

    socketService.onNewQuestion((data: Question) => {
      dispatch(addQuestion(data));
    });

    // Cleanup function
    return () => {
      socketService.removeAllListeners();
      if (!eventId) {
        socketService.disconnect();
      }
    };
  }, [eventId, dispatch]);

  return {
    submitPoll: (pollId: string, answer: string) => {
      if (eventId) {
        socketService.submitPoll(eventId, pollId, answer);
      }
    },
    submitQuestion: (question: string) => {
      if (eventId) {
        socketService.submitQuestion(eventId, question);
      }
    },
  };
};