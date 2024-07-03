import { createSlice } from '@reduxjs/toolkit';

interface ProfileState {
    user: any;
}

const initialState: ProfileState = {
    user: null,
}

const profileSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setProfile: (state, action) => {
            state.user = action.payload;
        },
    },
});

export default profileSlice.reducer;
export const { setProfile } = profileSlice.actions;