import { createSlice } from '@reduxjs/toolkit';

interface connectedUsersState {
    connectedUsers: any;
}

const initialState: connectedUsersState = {
    connectedUsers: [],
}

const connectedUsersSlice = createSlice({
    name: 'connectedUsers',
    initialState,
    reducers: {
        setConnectedUsers: (state, action) => {
            state.connectedUsers = action.payload;
        }
    },
});

export default connectedUsersSlice.reducer;
export const { setConnectedUsers } = connectedUsersSlice.actions;