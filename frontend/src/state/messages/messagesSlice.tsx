import { createSlice } from '@reduxjs/toolkit';

export interface messagesState {
    chat_id: number;
    messages: any[];
    // messages: any[]
}

const initialState: messagesState[] = [{
    chat_id: 0,
    messages: [{}]

}]

const messagesSlice = createSlice({
    name: 'messages',
    initialState,
    reducers: {
        setMessages: (state, action) => {
            // console.log('messagesSlice setmessages', action.payload)
            state = action.payload;
        }
    },
});

export default messagesSlice.reducer;
export const { setMessages } = messagesSlice.actions;