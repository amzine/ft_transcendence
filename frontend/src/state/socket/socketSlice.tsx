import { createSlice } from '@reduxjs/toolkit';
import { Socket } from 'socket.io-client';

interface SocketState {
    socket: any;
    pvsocket: any;
}

const initialState: SocketState = {
    socket: null,
    pvsocket: null
}

const socketSlice = createSlice({
    name: 'socket',
    initialState,
    reducers: {
        setSocket: (state, action) => {
            // console.log('socketSlice setSocket', action.payload)
            state.socket = action.payload;
        },
        setPvSocket: (state, action) => {
            state.pvsocket = action.payload;
        }
    },
});

export default socketSlice.reducer;
export const { setSocket, setPvSocket } = socketSlice.actions;