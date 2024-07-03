import { createSlice } from '@reduxjs/toolkit';

interface conversationsState {
    conversations: any;
}

const initialState: conversationsState = {
    conversations: [],
}

const conversationsSlice = createSlice({
    name: 'conversations',
    initialState,
    reducers: {
        setConversations: (state, action) => {
            state.conversations = action.payload;
        },
    },
});

export default conversationsSlice.reducer;
export const { setConversations } = conversationsSlice.actions;