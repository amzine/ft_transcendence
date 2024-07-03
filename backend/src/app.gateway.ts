import { BaseWsExceptionFilter, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { Users } from "./users/services/users.services";
import { Status } from "./users/statusers";
import {Server, Socket} from 'socket.io';
import { JwtService } from "@nestjs/jwt";
import { GameService } from "./game/game.service";
import { gameInvitation } from "./game/interfaces/game.types";
import { ArgumentsHost, Catch } from "@nestjs/common";

@WebSocketGateway(4000,{cors: {
    origin : "*"
}})

export class AppGateWay implements OnGatewayConnection, OnGatewayDisconnect{
    constructor(
        private readonly userService : Users,
        private readonly jwtService : JwtService,
    ){}
    
    @WebSocketServer()
    server : Server

    userStatusMap = new Map<string, Status>()
    clientSocket = new Map<string, Socket>();
    
    inGameFromService(username : string){
        this.userStatusMap.set(username, Status.online);
        const IterableMap = [...this.userStatusMap.entries()];
        this.server.emit('update-status', IterableMap);
    }

    async handleConnection(client: Socket, ...args: any[]) {
        // console.log("PASSING FROM HERE")
        try {
            client.setMaxListeners(20);
            const User = this.jwtService.verify(String(client.handshake.auth.token), {secret: process.env.JWT_SECRET});
            const username = User['username'];
            const user = this.userService.getUser(username);
            client.data.username = username;
            if (!user)
              throw new WsException('Invalid token.');
      
            //setting status as online
            this.userStatusMap.set(client.data.username, Status.online);
            const serializedMap = [...this.userStatusMap.entries()];
            this.server.emit('update-status', serializedMap);
            //add to clientSocket
            this.clientSocket.set(username, client);
        } catch (error) {
            // console.log("error", error);
            return false;
        }
    }

    async handleDisconnect(client: Socket) {
        
    if (client.data.username !== undefined) {
        this.userStatusMap.set(client.data.username, Status.offline)
        const serializedMap = [...this.userStatusMap.entries()];
        client.emit('update-status', serializedMap);
        this.clientSocket.delete(client.data.username);
        // console.log('disconnect userId', client.data.id, client.id);
      }
  
     if (GameService.rooms.some((room) => room.player1 === client)) {
        if (!GameService.rooms.find((room) => room.player1 === client).player2)
        GameService.rooms.splice(
                  GameService.rooms.findIndex((room) => room.player1 === client), 1);
        else
          GameService.rooms.find((room) => room.player1 === client).player1Disconnected = true;
      }
      if (GameService.rooms.some((room) => room.player2 === client))
      GameService.rooms.find((room) => room.player2 === client).player2Disconnected = true;
      client.removeAllListeners();
    }

    onlineService(username :string){
        this.userStatusMap.set(username, Status.online);
        const itermap = [...this.userStatusMap.entries()];
        this.server.emit('update-status',itermap);
    }
    async get_clientSocket(username: string){
        if(this.clientSocket.has(username)){
            const socket = this.clientSocket.get(username);
            return socket;
        }
    }

    @SubscribeMessage('send_invitation')
    async gameInvitation(@MessageBody() data : gameInvitation){
        const client = await this.get_clientSocket(data.targetUsername);
        if (client) {
            this.inGameFromService(data.targetUsername);
            client.emit('game invitation',data);
        }
    }

    @SubscribeMessage('decline game')
    async gameinvitation(@MessageBody() data : gameInvitation){
        const client = await this.get_clientSocket(data.inviterUsername);
        if (client) {
            const target = await this.userService.getUser(data.targetUsername);
            client.emit('rejected', target.username);
            this.onlineService(data.targetUsername);
        }
    }
}

@Catch()
export class AllExceptionFilter extends BaseWsExceptionFilter{
    catch(exception: unknown, host: ArgumentsHost): void {
        super.catch(exception, host);
    }
}