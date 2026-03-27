export interface BaseEvent {
  type: string;
  timestamp: string;
}

export interface IterationStartEvent extends BaseEvent {
  type: 'iteration_start';
  iteration: number;
  max_iterations: number;
}

export interface ThoughtEvent extends BaseEvent {
  type: 'thought';
  content: string;
  is_delta?: boolean;
}

export interface ToolCallEvent extends BaseEvent {
  type: 'tool_call';
  tool: string;
  input: Record<string, unknown>;
  tool_call_id: string;
}

export interface ToolResultEvent extends BaseEvent {
  type: 'tool_result';
  tool: string;
  result: {
    status: 'success' | 'error';
    data?: Record<string, unknown>[];
    columns?: string[];
    rows?: number;
    message?: string;
    suggestions?: string[];
    failed_query?: string;
    schemas?: Record<string, unknown>;
    tables?: Record<string, unknown>[];
    execution_time_ms?: number;
  };
  tool_call_id: string;
}

export interface FinalResultEvent extends BaseEvent {
  type: 'final_result';
  data: Record<string, unknown>[];
  columns: string[];
  rows: number;
  query: string;
  reasoning: string;
  iterations: number;
  execution_time_ms: number;
}

export interface EmptyResultEvent extends BaseEvent {
  type: 'empty_result';
  query: string;
  message: string;
}

export interface ErrorEvent extends BaseEvent {
  type: 'error';
  error: string;
  iteration: number;
  recoverable: boolean;
}

export interface MaxIterationsEvent extends BaseEvent {
  type: 'max_iterations_reached';
  iterations: number;
  message: string;
}

export interface CompletedEvent extends BaseEvent {
  type: 'completed';
  message: string;
}

export type AgentEvent =
  | IterationStartEvent
  | ThoughtEvent
  | ToolCallEvent
  | ToolResultEvent
  | FinalResultEvent
  | EmptyResultEvent
  | ErrorEvent
  | MaxIterationsEvent
  | CompletedEvent;

export interface QueryState {
  isExecuting: boolean;
  events: AgentEvent[];
  finalResult: FinalResultEvent | null;
  error: string | null;
}
