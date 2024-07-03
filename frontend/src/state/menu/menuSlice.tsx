import { createSlice } from '@reduxjs/toolkit';

interface isMenuOpen {
    isMenuOpen: boolean;
}

const initialState: isMenuOpen = {
    isMenuOpen: true,
}

const IsMenuOpenSlice = createSlice({
    name: 'isMenuOpen',
    initialState,
    reducers: {
        setIsMenuOpen : (state, action) => {
            state.isMenuOpen = action.payload;
        }
    },
});

export default IsMenuOpenSlice.reducer;
export const { setIsMenuOpen } = IsMenuOpenSlice.actions;