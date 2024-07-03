import { createSlice } from '@reduxjs/toolkit';

interface UsersState {
    users: [];
    friends: [];
    awaiting: [];
}

const initialState: UsersState = {
    users: [],
    friends: [],
    awaiting: []
}

const usersSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUsers: (state, action) => {
            console.log("setting users", action.payload)
            state.users = action.payload;
        },
        setFriends: (state, action) => {
            console.log("setting friends", action.payload)
            state.friends = action.payload;
        },
        setAwaiting: (state, action) => {
            console.log("setting awaiting", action.payload)
            state.awaiting = action.payload;
        }
    },
});

export default usersSlice.reducer;
export const { setUsers, setFriends, setAwaiting } = usersSlice.actions;