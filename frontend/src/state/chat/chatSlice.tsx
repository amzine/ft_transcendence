import { createSlice } from '@reduxjs/toolkit';

interface chatState {
    chat: any;
}

const initialState: chatState = {
    chat: null,
}

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setChat: (state, action) => {
            state.chat = action.payload;
        }
    },
});

export default chatSlice.reducer;
export const { setChat } = chatSlice.actions;