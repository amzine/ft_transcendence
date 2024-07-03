import { createSlice } from '@reduxjs/toolkit';

interface dmsState {
    dms: any;
}

const initialState: dmsState = {
    dms: [],
}

const dmsSlice = createSlice({
    name: 'dms',
    initialState,
    reducers: {
        setDms: (state, action) => {
            state.dms = action.payload;
        },
    },
});

export default dmsSlice.reducer;
export const { setDms } = dmsSlice.actions;