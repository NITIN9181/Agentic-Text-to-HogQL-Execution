import { useState, useCallback, useRef } from 'react';
import { AgentEvent, FinalResultEvent, QueryState, MaxIterationsEvent, ThoughtEvent, IterationStartEvent } from '../types';

export function useQueryStream() {
  const [state, setState] = useState<QueryState>({
    isExecuting: false,
    events: [],
    finalResult: null,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (query: string) => {
    // Reset state
    setState({
      isExecuting: true,
      events: [],
      finalResult: null,
      error: null,
      lastQuery: undefined,
      lastIteration: undefined,
    });

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/query/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, max_iterations: 10 }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const event = JSON.parse(trimmed.slice(6)) as AgentEvent;

              setState(prev => {
                const updatedEvents = [...prev.events];
                const lastEvent = updatedEvents[updatedEvents.length - 1];

                if (event.type === 'thought' && (event as ThoughtEvent).is_delta && lastEvent && lastEvent.type === 'thought') {
                  // Aggregate deltas to avoid many small UI cards
                  const updatedLastEvent: ThoughtEvent = {
                    ...(lastEvent as ThoughtEvent),
                    content: (lastEvent as ThoughtEvent).content + (event as ThoughtEvent).content,
                  };
                  updatedEvents[updatedEvents.length - 1] = updatedLastEvent;
                } else {
                  updatedEvents.push(event);
                }

                const newState: QueryState = {
                  ...prev,
                  events: updatedEvents,
                };

                if (event.type === 'iteration_start') {
                  newState.lastIteration = (event as IterationStartEvent).iteration;
                }

                if (event.type === 'final_result') {
                  newState.finalResult = event as FinalResultEvent;
                  newState.lastQuery = (event as FinalResultEvent).query;
                  newState.isExecuting = false;
                }

                if (event.type === 'max_iterations_reached') {
                  newState.isExecuting = false;
                  newState.error = (event as MaxIterationsEvent).message;
                }

                if (event.type === 'completed') {
                  newState.isExecuting = false;
                }

                return newState;
              });
            } catch {
              console.warn('Failed to parse SSE event:', trimmed);
            }
          }
        }
      }

      // Stream ended
      setState(prev => ({ ...prev, isExecuting: false }));

    } catch (err: unknown) {
      const error = err as Error;
      if (error.name !== 'AbortError') {
        setState(prev => ({
          ...prev,
          isExecuting: false,
          error: error.message,
        }));
      }
    }
  }, []);

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    setState(prev => ({ ...prev, isExecuting: false }));
  }, []);

  return { ...state, execute, stop };
}
