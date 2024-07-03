import { Socket } from "socket.io-client";
import React, {createContext} from "react";
export interface ISocketContextState {
	socket: Socket | undefined;
	name: string;
	users: string[];
}

export const defaultSocketContextState: ISocketContextState = {
	socket: undefined,
	name: '',
	users: [],
};

export type TSocketContextActions =
	| 'update_socket'
	| 'update_users'
	| 'remove_user'
	| 'update_name';

export type TSocketContextPayload = string | string[] | Socket;

export interface ISocketContextActions {
	type: TSocketContextActions;
	payload: TSocketContextPayload;
}

export interface ISocketContextProps {
	SocketState: ISocketContextState;
	SocketDispatch: React.Dispatch<ISocketContextActions>;
}

const SocketContext = createContext<ISocketContextProps>({
	SocketState: defaultSocketContextState,
	SocketDispatch: () => {},
});

export default SocketContext;
