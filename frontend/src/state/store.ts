import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./user/userSlice";
import chatReducer from "./chat/chatSlice";
import usersReducer from "./users/usersSlice";
import socketReducer from "./socket/socketSlice";
import conversationReducer from "./conversations/conversationSlice";
import connectedUsersReducer from "./connected/connectedSlice";
import messagesReducer from "./messages/messagesSlice";
import dmsReducer from "./dms/dmsSlice";
import dmRoomReducer from "./dmRoom/dmRoomSlice";
import BlockedReducer from "./Blocked/BlockedSlice";
import profileReducer from "./user/profileSlice";
import IsMenuOpenReducer from "./menu/menuSlice";

export const store = configureStore({
    reducer: {
        user: userReducer,
        chat: chatReducer,
        users: usersReducer,
        socket: socketReducer,
        conversations: conversationReducer,
        connectedUsers: connectedUsersReducer,
        messages: messagesReducer,
        dms: dmsReducer,
        dmRoom: dmRoomReducer,
        Blocked: BlockedReducer,
        profile: profileReducer,
        isMenuOpen: IsMenuOpenReducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false,
    }),
});


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;