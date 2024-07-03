import { createSlice } from '@reduxjs/toolkit';

interface UserState {
    user: any;
}

const initialState: UserState = {
    user: null,
}

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state, action) => {
            // console.log('userSlice setUser', action.payload)
            state.user = action.payload;
        },
    },
});

export default userSlice.reducer;
export const { setUser } = userSlice.actions;