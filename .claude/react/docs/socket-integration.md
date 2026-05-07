# Socket.io Client Integration

Real-time WebSocket integration using Socket.io client with Redux state management, TypeScript event definitions, and proper cleanup patterns.

---

## Architecture Overview

The frontend uses a layered approach for real-time communication:

1. **Socket Service** - Socket.io client singleton with connection management
2. **Socket Context** - React context providing socket instance to components
3. **useSocket Hook** - Custom hook for subscribing to events with cleanup
4. **Redux Slices** - State updated from socket events via dispatch

---

## Directory Structure

```
app/
├── services/
│   └── socketService.ts              # Socket.io client singleton
├── contexts/
│   └── SocketContext.tsx             # Provider for socket instance
├── hooks/
│   └── useSocket.ts                  # Custom hook for socket events
├── types/
│   └── socket.d.ts                   # Socket event type definitions
└── redux/features/
    └── {feature}Slice.ts             # State updated from socket events
```

---

## Socket Service

Location: `~/services/socketService.ts`

```typescript
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "~/types/socket";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3000";

let socket: TypedSocket | null = null;

/**
 * Get or create a socket connection for a specific namespace.
 * Uses httpOnly cookies for authentication (sent automatically).
 */
export function getSocket(namespace = "/"): TypedSocket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(`${WS_URL}${namespace}`, {
    withCredentials: true, // CRITICAL: Send httpOnly cookies
    autoConnect: false, // Connect manually after auth check
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000, // Start at 1s
    reconnectionDelayMax: 5000, // Cap at 5s (exponential backoff)
    transports: ["websocket", "polling"],
  }) as TypedSocket;

  return socket;
}

/**
 * Connect the socket instance.
 * Call after confirming user is authenticated.
 */
export function connectSocket(namespace = "/"): TypedSocket {
  const s = getSocket(namespace);
  if (!s.connected) {
    s.connect();
  }
  return s;
}

/**
 * Disconnect and clean up the socket instance.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Check if socket is currently connected.
 */
export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}
```

**Key Points:**

- `withCredentials: true` sends httpOnly cookies automatically — NO manual token handling
- `autoConnect: false` prevents connection before auth is confirmed
- Exponential backoff: 1s → 2s → 4s → 5s (capped)
- Singleton pattern — one connection per namespace
- Type-safe socket with `ServerToClientEvents` and `ClientToServerEvents`

---

## Socket Context Provider

Location: `~/contexts/SocketContext.tsx`

```typescript
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { connectSocket, disconnectSocket } from '~/services/socketService';
import type { Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '~/types/socket';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketContextValue {
  socket: TypedSocket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
});

/** Props for the SocketProvider component */
interface SocketProviderProps {
  /** Socket.io namespace (e.g., '/board', '/chat') */
  namespace?: string;
  /** Child components */
  children: React.ReactNode;
}

/**
 * Provides socket instance to child components.
 * MUST be placed inside AuthProvider — socket auth depends on cookies set by login.
 */
export function SocketProvider({ namespace = '/', children }: SocketProviderProps) {
  const socketRef = useRef<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = connectSocket(namespace);
    socketRef.current = socket;

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Set initial state
    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      disconnectSocket();
      socketRef.current = null;
    };
  }, [namespace]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

/**
 * Access the socket instance from context.
 * Must be used within a SocketProvider.
 */
export function useSocketContext(): SocketContextValue {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
}
```

**Key Points:**

- Place `SocketProvider` **inside** `AuthProvider` — cookies must be set before connecting
- `useRef` holds socket instance to avoid re-renders on socket reference changes
- Cleanup: `socket.off()` removes listeners, `disconnectSocket()` closes connection
- `isConnected` state tracks connection status for UI feedback

### Provider Placement

```typescript
// app/root.tsx or app/components/layouts/ProtectedLayout.tsx
import { SocketProvider } from '~/contexts/SocketContext';

function ProtectedLayout() {
  return (
    <AuthProvider>
      <SocketProvider namespace="/{feature}">
        <Outlet />
      </SocketProvider>
    </AuthProvider>
  );
}
```

---

## Custom useSocket Hook

Location: `~/hooks/useSocket.ts`

```typescript
import { useEffect, useCallback } from "react";
import { useSocketContext } from "~/contexts/SocketContext";

/**
 * Subscribe to a socket event with automatic cleanup.
 * @param event - The event name to listen for
 * @param callback - Handler called when the event fires
 */
export function useSocketEvent<T = unknown>(
  event: string,
  callback: (data: T) => void,
): void {
  const { socket } = useSocketContext();

  useEffect(() => {
    if (!socket) return;

    socket.on(event as any, callback as any);

    return () => {
      socket.off(event as any, callback as any);
    };
  }, [socket, event, callback]);
}

/**
 * Get a type-safe emit function for sending events.
 * @returns emit function that sends events via the socket
 */
export function useSocketEmit() {
  const { socket } = useSocketContext();

  const emit = useCallback(
    <T = unknown>(event: string, data?: T) => {
      if (socket?.connected) {
        socket.emit(event as any, data as any);
      }
    },
    [socket],
  );

  return emit;
}

/**
 * Join and leave a socket room with automatic cleanup.
 * @param roomId - The room to join
 */
export function useSocketRoom(roomId: string | null): void {
  const emit = useSocketEmit();

  useEffect(() => {
    if (!roomId) return;

    emit("join-{feature}", roomId);

    return () => {
      emit("leave-{feature}", roomId);
    };
  }, [roomId, emit]);
}
```

**Key Points:**

- `useSocketEvent` — subscribe to events, auto-unsubscribe on unmount
- `useSocketEmit` — memoized emit function, checks connection before sending
- `useSocketRoom` — join room on mount, leave on unmount
- All hooks use `useSocketContext` — must be inside `SocketProvider`

---

## TypeScript Event Definitions

Location: `~/types/socket.d.ts`

```typescript
/**
 * Events emitted by the server to clients.
 * Keys are event names, values are callback signatures.
 */
export interface ServerToClientEvents {
  "{feature}-created": (data: { id: string; [key: string]: unknown }) => void;
  "{feature}-updated": (data: { id: string; [key: string]: unknown }) => void;
  "{feature}-deleted": (data: { id: string }) => void;
  "user-joined": (data: { userId: string; roomId: string }) => void;
  "user-left": (data: { userId: string; roomId: string }) => void;
  "presence-update": (data: { users: string[] }) => void;
  exception: (data: { status: string; message: string }) => void;
}

/**
 * Events emitted by clients to the server.
 * Keys are event names, values are argument types.
 */
export interface ClientToServerEvents {
  "join-{feature}": (roomId: string) => void;
  "leave-{feature}": (roomId: string) => void;
  "{feature}-updated": (data: {
    id: string;
    roomId: string;
    [key: string]: unknown;
  }) => void;
  "{feature}-created": (data: {
    roomId: string;
    [key: string]: unknown;
  }) => void;
}
```

**Key Points:**

- Separate interfaces for server→client and client→server events
- Event names must match backend `@SubscribeMessage()` decorators exactly
- Replace `{feature}` with actual domain name (e.g., `board`, `task`, `chat`)
- Use `unknown` instead of `any` for type safety

---

## Redux State Sync from Socket Events

Socket events update Redux state via dispatch — same unidirectional flow as REST:

```typescript
// app/pages/{feature}/{Feature}ViewPage.tsx
import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '~/redux/store/hooks';
import { useSocketEvent, useSocketRoom } from '~/hooks/useSocket';
import {
  itemUpdated,
  itemCreated,
  itemDeleted,
} from '~/redux/features/{feature}Slice';

export default function {Feature}ViewPage() {
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((state) => state.{feature});
  const roomId = 'room-123'; // From route params or props

  // Join room on mount, leave on unmount
  useSocketRoom(roomId);

  // Handle real-time updates
  const handleUpdated = useCallback(
    (data: { id: string; [key: string]: unknown }) => {
      dispatch(itemUpdated(data));
    },
    [dispatch],
  );

  const handleCreated = useCallback(
    (data: { id: string; [key: string]: unknown }) => {
      dispatch(itemCreated(data));
    },
    [dispatch],
  );

  const handleDeleted = useCallback(
    (data: { id: string }) => {
      dispatch(itemDeleted(data.id));
    },
    [dispatch],
  );

  // Subscribe to socket events
  useSocketEvent('{feature}-updated', handleUpdated);
  useSocketEvent('{feature}-created', handleCreated);
  useSocketEvent('{feature}-deleted', handleDeleted);

  // ... render UI
}
```

### Redux Slice with Socket Actions

```typescript
// app/redux/features/{feature}Slice.ts
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { {Feature}, {Feature}State } from '~/types/{feature}';

const initialState: {Feature}State = {
  items: [],
  loading: false,
  error: null,
};

const {feature}Slice = createSlice({
  name: '{feature}',
  initialState,
  reducers: {
    // Synchronous reducers for socket events
    itemUpdated: (state, action: PayloadAction<Partial<{Feature}> & { id: string }>) => {
      const index = state.items.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload };
      }
    },
    itemCreated: (state, action: PayloadAction<{Feature}>) => {
      state.items.push(action.payload);
    },
    itemDeleted: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    // Async thunks for initial data fetch (REST API)
    // ...
  },
});

export const { itemUpdated, itemCreated, itemDeleted } = {feature}Slice.actions;
export default {feature}Slice.reducer;
```

**Key Points:**

- Socket events trigger **synchronous** Redux reducers (not async thunks)
- Initial data load uses REST API via `createAsyncThunk` (in `extraReducers`)
- Real-time updates use socket events via synchronous `reducers`
- `useCallback` wraps handlers to prevent unnecessary re-subscriptions
- Same unidirectional flow: Socket Event → dispatch → Redux Store → Component re-render

---

## Reconnection Strategy

Socket.io handles reconnection automatically with exponential backoff:

```typescript
// Already configured in socketService.ts
const socket = io(WS_URL, {
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000, // 1s initial
  reconnectionDelayMax: 5000, // 5s cap
});
```

### UI Feedback for Connection Status

```typescript
import { useSocketContext } from '~/contexts/SocketContext';

function ConnectionStatus() {
  const { isConnected } = useSocketContext();

  if (isConnected) return null;

  return (
    <div className="fixed bottom-4 right-4 rounded-lg bg-yellow-100 px-4 py-2 text-sm text-yellow-800 shadow-md">
      Reconnecting...
    </div>
  );
}
```

### Manual Reconnection on Auth Failure

```typescript
// In SocketContext or a dedicated hook
socket.on("disconnect", (reason) => {
  if (reason === "io server disconnect") {
    // Server disconnected us (likely auth failure)
    // Re-authenticate then reconnect
    try {
      await authService.refreshToken();
      socket.connect();
    } catch {
      // Refresh failed — redirect to login
      window.location.href = "/login";
    }
  }
  // For other reasons, Socket.io auto-reconnects
});
```

---

## MANDATORY: Socket Cleanup

**Every socket listener MUST be cleaned up on unmount.** Failure to clean up causes memory leaks and duplicate event handlers.

### ✅ Correct — Cleanup in useEffect return

```typescript
useEffect(() => {
  socket.on("{feature}-updated", handleUpdate);

  return () => {
    socket.off("{feature}-updated", handleUpdate);
  };
}, [socket]);
```

### ❌ Wrong — No cleanup

```typescript
// MEMORY LEAK: listener accumulates on every re-render
useEffect(() => {
  socket.on("{feature}-updated", handleUpdate);
  // Missing cleanup!
}, [socket]);
```

### ✅ Correct — Context provider disconnects on unmount

```typescript
useEffect(() => {
  const socket = connectSocket(namespace);

  return () => {
    disconnectSocket(); // Closes connection
  };
}, [namespace]);
```

### ❌ Wrong — Socket never disconnected

```typescript
// CONNECTION LEAK: socket stays open after component unmounts
useEffect(() => {
  connectSocket(namespace);
  // Missing disconnectSocket in cleanup!
}, [namespace]);
```

---

## MANDATORY: Integration Checklist

- ✅ Install `socket.io-client`
- ✅ Socket service with `withCredentials: true`
- ✅ `autoConnect: false` — connect only after auth confirmation
- ✅ Socket context provider placed inside auth boundary
- ✅ Custom `useSocketEvent` hook with `socket.off()` cleanup
- ✅ Custom `useSocketEmit` hook with connection check
- ✅ Custom `useSocketRoom` hook with join/leave lifecycle
- ✅ TypeScript event interfaces (`ServerToClientEvents`, `ClientToServerEvents`)
- ✅ Redux dispatch from socket events (synchronous reducers)
- ✅ Reconnection with exponential backoff configured
- ✅ UI feedback for disconnection state
- ✅ No socket listeners without cleanup (`socket.off()`)
- ✅ Provider `disconnectSocket()` on unmount

---

## Prohibited Patterns

| Pattern                                            | Why It's Wrong                  | Correct Approach                               |
| -------------------------------------------------- | ------------------------------- | ---------------------------------------------- |
| ❌ `localStorage.getItem('token')` for socket auth | XSS vulnerable                  | ✅ `withCredentials: true` (cookies auto-sent) |
| ❌ `socket.on()` without `socket.off()`            | Memory leak                     | ✅ Cleanup in `useEffect` return               |
| ❌ `autoConnect: true` before auth                 | Unauthorized connection attempt | ✅ `autoConnect: false`, connect after login   |
| ❌ Socket events updating state directly           | Bypasses Redux flow             | ✅ `dispatch(action)` from socket callback     |
| ❌ Raw `io()` calls in components                  | No cleanup, no context          | ✅ Use `useSocketContext` hook                 |
| ❌ Hardcoded WebSocket URL                         | Breaks across environments      | ✅ Use `VITE_WS_URL` env variable              |

---

**Related Resources:**

- [data-fetching.md](data-fetching.md) - REST API data fetching patterns
- [api-integration.md](api-integration.md) - API endpoint mapping
- [authentication-architecture.md](authentication-architecture.md) - Auth flow and cookies
- [loading-and-error-states.md](loading-and-error-states.md) - Async state patterns
