import { createSlice } from '@reduxjs/toolkit';

interface BlockedState {
    Blocked: any;
}

const initialState: BlockedState = {
    Blocked: [],
}

const BlockedSlice = createSlice({
    name: 'Blocked',
    initialState,
    reducers: {
        setBlocked: (state, action) => {
            state.Blocked = action.payload;
        }
    },
});

export default BlockedSlice.reducer;
export const { setBlocked } = BlockedSlice.actions;