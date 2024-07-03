import { createSlice } from '@reduxjs/toolkit';

interface dmRoomState {
    dmRoom: any;
}

const initialState: dmRoomState = {
    dmRoom: null,
}

const dmRoomSlice = createSlice({
    name: 'dmRoom',
    initialState,
    reducers: {
        setDmRoom: (state, action) => {
            state.dmRoom = action.payload;
        },
    },
});

export default dmRoomSlice.reducer;
export const { setDmRoom } = dmRoomSlice.actions;