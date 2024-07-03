import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Namespace, Server, Socket } from 'socket.io';
import { ChatService } from 'src/services/chat.service';
import { PrismaClient, User, chatMembers, message } from '@prisma/client';
import { Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { subscribe } from 'diagnostics_channel';
import { GameGateway } from 'src/game/game.gateway';
import { UserService } from '../services/user/user.service';
import { AppGateWay } from 'src/app.gateway';

interface users {
  socket: Socket;
  username: String;
}

interface AuthenticatedUser {
  socket: Socket;
  Authenticated: boolean;
}

interface GameInvitation {
  sender: string;
  recipient: string;
  status: string;
}

@WebSocketGateway(parseInt(process.env.CHAT_PORT || '8080', 10), {
  cors: { origin: '*' },
})
export class ChatGateway {
  @WebSocketServer()
  server: Namespace;
  private db = new PrismaClient();
  private UsersSockets: users[] = [];
  private AuthenticatedUsers: AuthenticatedUser[] = [];
  private GameInvitations: GameInvitation[] = [];

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  async broadcast(event: string, data: any, exceptUser: string) {
    this.UsersSockets?.map((userSocket: users) => {
      if (userSocket.username !== exceptUser) {
        userSocket.socket.emit(event, JSON.stringify(data));
      }
    });
  }

  async notify(event: string, data: any, user: string) {
    this.UsersSockets?.map((userSocket: users) => {
      if (userSocket.username === user) {
        userSocket.socket.emit(event, JSON.stringify(data));
      }
    });
  }

  handleConnection(client: Socket) {
    try {
      // console.log('eweqeqw')
      const jwt = client.handshake.query?.jwt as string;

      this.jwtService.verify(jwt, { secret: process.env.JWT_SECRET });
      if (
        client.handshake.query?.user == undefined ||
        this.UsersSockets.filter((e: any) => e.socket.id === client.id).length >
          0
      ) {
        return;
      }
      // console.log(client.id);
      this.AuthenticatedUsers.push({ socket: client, Authenticated: true });

      this.UsersSockets.push({
        socket: client,
        username: client.handshake.query?.user as string,
      });
      const usernames = this.UsersSockets.map((user) => user.username);

      this.server.emit('connection', JSON.stringify({ Connected: usernames }));
    } catch (err: any) {
      // console.log('Socket Not Authorized : ', err.message);
      this.AuthenticatedUsers.push({ socket: client, Authenticated: false });
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({
            status: 500,
            message: 'Unauthorized to connect: login and try again',
          }),
        );
    }
  }

  handleDisconnect(client: Socket) {
    // console.log('Client : ', client.id, ' disconnected!');
    const username = this.UsersSockets.find(
      (user) => user.socket?.id === client.id,
    )?.username;
    this.UsersSockets.splice(
      this.UsersSockets.findIndex((user) => user.socket?.id === client.id),
      1,
    );
    this.AuthenticatedUsers.splice(
      this.AuthenticatedUsers.findIndex((user) => user.socket?.id === client.id),
      1,
    );
    const usernames = this.UsersSockets.map((user) => user.username);
    this.GameInvitations.map((inv, index) => {
      if (
        (inv.recipient === username) !== undefined &&
        inv.status === 'pending'
      ) {
        const sender = this.UsersSockets.find(
          (user) => user.username === inv.sender,
        );
        this.GameInvitations.splice(index, 1);
        this.server
          .to(sender?.socket?.id)
          .emit(
            'unauthorized',
            JSON.stringify({
              status: 500,
              message: username + ' refused your Game invitation',
            }),
          );
      }
    });
    this.server.emit('disconnection', JSON.stringify({ Connected: usernames }));
  }

  // send game invitation
  @SubscribeMessage('gameInvitation')
  async handleGameinvit(client: Socket, data: any) {
    if (
      this.AuthenticatedUsers.find((user) => user.socket.id === client.id)
        ?.Authenticated === false
    ) {
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({
            status: 500,
            message: 'Unauthorized to delete chat: login and try again',
          }),
        );
      return;
    }
    const recipient = this.UsersSockets.find(
      (user) => user.username === data.recipient,
    );
    if (!recipient) {
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({ status: 500, message: 'Recipient not connected' }),
        );
      return;
    }
    // console.log('recipient : ', recipient.username);
    // console.log('data : ', data);

    // if the sender has already sent an invitation to the recipient
    if (
      this.GameInvitations.find(
        (inv) => inv.sender === data.sender && inv.recipient === data.recipient,
      ) !== undefined
    ) {
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({
            status: 500,
            message: 'You already sent an invitation to this user',
          }),
        );
      return;
    }
    // if the recepient has already sent an invitation to the sender
    if (
      this.GameInvitations.find(
        (inv) => inv.sender === data.recipient && inv.recipient === data.sender,
      ) !== undefined
    ) {
      // console.log('accepting the invitation');
      this.handleAcceptGameInv(
        this.UsersSockets.find((user) => user.username === data.sender)?.socket,
        { sender: data.recipient, recipient: data.sender, status: 'accept', gameData: data.gameData},
      );
      return;
    }

    this.GameInvitations.push({
      sender: data.sender,
      recipient: data.recipient,
      status: 'pending',
    });
    this.server
      .to(recipient.socket.id)
      .emit('gameInvitation', JSON.stringify(data));
    this.server.to(client.id).emit('gameInvitation', JSON.stringify(data));
    // this.notify("gameInvitation", data, data.recipient)
  }

  // this for amin when the user accepted the invitation
  @SubscribeMessage('AcceptGameInv')
  async handleAcceptGameInv(client: Socket, data: any) {
    if (
      this.AuthenticatedUsers.find((user) => user.socket.id === client.id)
        ?.Authenticated === false
    ) {
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({
            status: 500,
            message:
              'Unauthorized to accept game invitation: login and try again',
          }),
        );
      return;
    }
    const sender = this.UsersSockets.find(
      (user) => user.username === data.sender,
    );
    if (!sender) {
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({ status: 500, message: 'Sender not connected' }),
        );
      return;
    }
    if (
      this.GameInvitations.find(
        (inv) => inv.sender === data.sender && inv.recipient === data.recipient,
      )?.status === 'accepted'
    )
      return;
    const recipient = this.UsersSockets.find(
      (user) => user.username === data.recipient,
    );
    this.GameInvitations.splice(
      this.GameInvitations.findIndex(
        (inv) => inv.sender === data.sender && inv.recipient === data.recipient,
      ),
      1,
    );
    // this.GameInvitations.push({sender: data.sender, recipient: data.recipient, status: "accepted"})
    /**
     *
     *
     * For the game invitation's impplimentation
     *
     */
    // {...data, }
    // const game = this.gameGateway.handleStartPrivate(client);
    // const game = {}
    // data.gameInfo = game;
    // console.log('game_data : ', data);
    this.server
      .to(sender.socket.id)
      .emit('AcceptGameInv', JSON.stringify(data));
    this.server
      .to(recipient.socket.id)
      .emit('AcceptGameInv', JSON.stringify(data));
  }

  @SubscribeMessage('RefuseGameInv')
  async handleRefuseGameInv(client: Socket, data: any) {
    if (
      this.AuthenticatedUsers.find((user) => user.socket.id === client.id)
        ?.Authenticated === false
    ) {
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({
            status: 500,
            message:
              'Unauthorized to accept game invitation: login and try again',
          }),
        );
      return;
    }

    const gameinv = this.GameInvitations.find(
      (inv) => inv.sender === data.sender && inv.recipient === data.recipient,
    );

    if (!gameinv || gameinv?.status !== 'pending') return;
    const sender = this.UsersSockets.find(
      (user) => user.username === data.sender,
    );
    if (!sender) {
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({ status: 500, message: 'Sender not connected' }),
        );
      return;
    }
    this.GameInvitations.splice(
      this.GameInvitations.findIndex(
        (inv) => inv.sender === data.sender && inv.recipient === data.recipient,
      ),
      1,
    );
    this.server
      .to(sender.socket.id)
      .emit(
        'unauthorized',
        JSON.stringify({
          status: 500,
          message:
            this.UsersSockets.find((user) => user.socket.id === client.id)
              ?.username + ' refused your Game invitation',
        }),
      );
    this.server
      .to(client.id)
      .emit(
        'unauthorized',
        JSON.stringify({
          status: 500,
          message: 'You refused the Game invitation',
        }),
      );
  }

  @SubscribeMessage('deleteChat')
  async deleteChat(client: Socket, data: any) {
    if (
      this.AuthenticatedUsers.find((user) => user.socket.id === client.id)
        ?.Authenticated === false
    ) {
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({
            status: 500,
            message: 'Unauthorized to delete chat: login and try again',
          }),
        );
      return;
    }
    const members: chatMembers[] = data.members as [];
    this.UsersSockets?.map((userSock: users) => {
      if (
        members?.filter(
          (member: any) => member?.FK_user?.username === userSock.username,
        ).length > 0
      ) {
        this.server
          .to(userSock.socket.id)
          .emit('chatDel', JSON.stringify({ chat: data.chat_id }));
      }
    });
  }

  @SubscribeMessage('')
  async handlemessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    if (
      this.AuthenticatedUsers.find((user) => user.socket.id === client.id)
        ?.Authenticated === false
    ) {
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({
            status: 500,
            message: 'Unauthorized to send message : login and try again',
          }),
        );
      // console.log('unauthorized : ', client.id);
      return;
    }
    const user: User = (await this.chatService.getUser(data.sender)) as any;
    // console.log('sent by client : ', client.id);
    const members: chatMembers[] = (await this.chatService.getchatMembers(
      Number(data.recepient),
    )) as [];
    const message = await this.chatService.storeMessage(
      String(user.username),
      Number(data.recepient),
      String(data.message),
    );

    // loop through the connected ones and send them
    this.UsersSockets?.map((userSocket: users) => {
      if (
        members?.filter(
          (member: any) => member?.FK_user?.username === userSocket.username,
        ).length > 0
      ) {
        this.server
          .to(userSocket.socket.id)
          .emit('message', JSON.stringify(message));
      }
    });
  }

  @SubscribeMessage('dm')
  async messagedm(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    if (
      this.AuthenticatedUsers.find((user) => user.socket.id === client.id)
        ?.Authenticated === false
    ) {
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({
            status: 500,
            message: 'Unauthorized to send message : login and try again',
          }),
        );
      // console.log('unauthorized : ', client.id);
      return;
    }
    const dm = await this.db.dms.findUnique({
      where: {
        dm_id: data.recepient,
      },
      select: {
        FK_user1: true,
        FK_user2: true,
      },
    });

    const message = await this.chatService.storeDmMessage(
      data.sender,
      data.recepient,
      String(data.message),
    );

    // loop through the connected ones and send them
    this.UsersSockets?.map((userSocket: users) => {
      if (
        dm.FK_user1.username === userSocket.username ||
        dm.FK_user2.username === userSocket.username
      ) {
        this.server
          .to(userSocket.socket.id)
          .emit('messageDM', JSON.stringify(message));
        // console.log('sent to : ', userSocket.username);
      }
    });
  }

  @SubscribeMessage('joingChat')
  async JoinChat(client: Socket, data: any) {
    try {
      // get the chatAdmins that are connected and send the event
      const chatMembers = await this.chatService.getchatMembers(data.id);
      if (this.chatService.status === 500)
        throw { status: 500, message: this.chatService.message };
      this.UsersSockets?.map((elem: users) => {
        if (
          chatMembers.find(
            (member) => member.FK_user.username === elem.username,
          ) &&
          elem.socket.id !== client.id
        ) {
          this.server.to(elem.socket.id).emit('joinChat', JSON.stringify(data));
        }
      });
    } catch (error: any) {
      // console.log(
      //   'err in to send joingChat Event to ChatGroup Admins : ',
      //   error.message,
      // );
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({
            status: 500,
            message:
              "Can't send joingChat Event to ChatGroup Admins: try again later",
          }),
        );
    }
  }

  @SubscribeMessage('leaveChat')
  async leaveChat(client: Socket, data: any) {
    /*
    data: chatMember_id:number
    }
    */
    if (
      this.AuthenticatedUsers.find((user) => user.socket.id === client.id)
        ?.Authenticated === false
    ) {
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({
            status: 500,
            message: 'Unauthorized to leave chat : login and try again',
          }),
        );
      return;
    }
    try {
      const chat = await this.db.chat.findUnique({
        where: {
          chat_id: data.chat_id,
        },
        select: {
          chatMembers: {
            select: {
              FK_user: true,
            },
          },
        },
      });
      const deletedMember = await this.chatService.leaveChat(
        data.chatMember_id,
      );
      // console.log('chatMember : ', chat);
      this.UsersSockets?.map((userSocket: users) => {
        if (
          chat?.chatMembers?.find(
            (elem) => elem.FK_user.username === userSocket.username,
          )
        ) {
          this.server
            .to(userSocket.socket.id)
            .emit('leftChat', JSON.stringify(deletedMember));
        }
      });
    } catch (error: any) {
      // console.log('err in leaveChat : ', error.message);
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({ status: 500, message: error.message }),
        );
    }
  }

  @SubscribeMessage('kickUser')
  async kickUser(client: Socket, data: any) {
    if (
      this.AuthenticatedUsers.find((user) => user.socket.id === client.id)
        ?.Authenticated === false
    ) {
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({
            status: 500,
            message: 'Unauthorized to kick user : login and try again',
          }),
        );
      return;
    }
    try {
      // console.log('data : ', data);
      const chatMembers = await this.chatService.getchatMembers(data.chat_id);
      const deletedMember = await this.chatService.KickUser(
        Number(data.chat_id),
        String(data.user),
        Number(data.member_id),
      );

      if (this.chatService.status === 500)
        throw { status: 500, message: this.chatService.message };
      this.UsersSockets?.map((userSocket: users) => {
        if (
          chatMembers?.find(
            (elem) => elem.FK_user.username === userSocket.username,
          )
        ) {
          this.server
            .to(userSocket.socket.id)
            .emit('kicked', JSON.stringify(deletedMember));
        }
      });
    } catch (error: any) {
      // console.log('err in kickUser : ', error.message);
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({ status: 500, message: error.message }),
        );
    }
  }

  @SubscribeMessage('Chat/Update')
  async updateChat(client: Socket, data: any) {
    if (
      this.AuthenticatedUsers.find((user) => user.socket.id === client.id)
        ?.Authenticated === false
    ) {
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({
            status: 500,
            message: "Unauthorized to send update chat's event",
          }),
        );
      return;
    }
    try {
      const members = await this.chatService.getchatMembers(data.chat_id);
      this.UsersSockets?.map((userSocket: users) => {
        if (
          members?.find((elem) => elem.FK_user.username === userSocket.username)
        ) {
          this.server
            .to(userSocket.socket.id)
            .emit('chatUpdated', JSON.stringify(data));
        }
      });
    } catch (error: any) {
      // console.log('err in updateChat : ', error.message);
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({ status: 500, message: 'Internal Server Error' }),
        );
    }
  }

  @SubscribeMessage('promoteMember')
  async promoteMember(client: Socket, data: any) {
    if (
      this.AuthenticatedUsers.find((user) => user.socket.id === client.id)
        ?.Authenticated === false
    ) {
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({
            status: 500,
            message: 'Unauthorized to promote member : login and try again',
          }),
        );
      return;
    }
    try {
      const chatMembers = await this.chatService.getchatMembers(data.chat_id);
      const promotedMember = await this.chatService.promoteMember(
        data.chat_id,
        data.user,
        data.toPromote,
      );
      if (this.chatService.status === 500)
        throw { status: 500, message: this.chatService.message };
      this.UsersSockets?.map((userSocket: users) => {
        if (
          chatMembers?.find(
            (elem) => elem.FK_user.username === userSocket.username,
          )
        ) {
          this.server
            .to(userSocket.socket.id)
            .emit('promoteMember', JSON.stringify(promotedMember));
        }
      });
    } catch (error: any) {
      // console.log('err in promoteMember : ', error.message);
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({ status: 500, message: 'Internal Server Error' }),
        );
    }
  }

  @SubscribeMessage('demoteAdmin')
  async demoteAdmin(client: Socket, data: any) {
    if (
      this.AuthenticatedUsers.find((user) => user.socket.id === client.id)
        ?.Authenticated === false
    ) {
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({
            status: 500,
            message: 'Unauthorized to demote admin : login and try again',
          }),
        );
      return;
    }
    try {
      const chatMembers = await this.chatService.getchatMembers(data.chat_id);
      const demotedAdmin = await this.chatService.demoteAdmin(
        data.chat_id,
        data.user,
        data.toDemote,
      );
      if (this.chatService.status === 500)
        throw { status: 500, message: this.chatService.message };
      this.UsersSockets?.map((userSocket: users) => {
        if (
          chatMembers?.find(
            (elem) => elem.FK_user.username === userSocket.username,
          )
        ) {
          this.server
            .to(userSocket.socket.id)
            .emit('demoteAdmin', JSON.stringify(demotedAdmin));
        }
      });
    } catch (error: any) {
      // console.log('err in demoteAdmin : ', error.message);
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({ status: 500, message: error.message }),
        );
    }
  }

  @SubscribeMessage('giveOwnership')
  async giveOwnership(client: Socket, data: any) {
    if (
      this.AuthenticatedUsers.find((user) => user.socket.id === client.id)
        ?.Authenticated === false
    ) {
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({
            status: 500,
            message: 'Unauthorized to give ownership : login and try again',
          }),
        );
      return;
    }
    try {
      const chatMembers = await this.chatService.getchatMembers(data.chat_id);
      const newOwner = await this.chatService.giveOwnership(
        data.chat_id,
        data.user,
        data.newOwner,
      );
      if (this.chatService.status === 500)
        throw { status: 500, message: this.chatService.message };
      this.UsersSockets?.map((userSocket: users) => {
        // console.log('mapping through users ');
        if (
          chatMembers?.find(
            (elem) => elem.FK_user.username === userSocket.username,
          )
        ) {
          // console.log(
          //   'send to ',
          //   userSocket.username,
          //   ' newOwner : ',
          //   newOwner,
          // );
          this.server
            .to(userSocket.socket.id)
            .emit('giveOwnership', JSON.stringify(newOwner));
        }
      });
    } catch (error: any) {
      // console.log('err in giveOwnership : ', error.message);
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({ status: 500, message: error.message }),
        );
    }
  }

  @SubscribeMessage('AddToGroup')
  async AddToGroup(client: Socket, data: any) {
    if (
      this.AuthenticatedUsers.find((user) => user.socket.id === client.id)
        ?.Authenticated === false
    ) {
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({
            status: 500,
            message: 'Unauthorized to add to group : login and try again',
          }),
        );
      return;
    }
    try {
      // console.log('data : ', data);
      // const chatAdmins = await this.chatService.getChatAdmins(data.chat_id);
      const newMember = await this.chatService.AddToGroup(
        data.chat_id,
        data.user,
        Number(data.ToAdd),
      );
      if (this.chatService.status === 500)
        throw { status: 500, message: this.chatService.message };
      const chatMembers = await this.chatService.getchatMembers(data.chat_id);
      if (this.chatService.status === 500)
        throw { status: 500, message: this.chatService.message };
      // console.log('newMember : ', newMember);
      this.UsersSockets?.map((userSocket: users) => {
        if (
          chatMembers?.find(
            (elem) => elem.FK_user.username === userSocket.username,
          )
        ) {
          this.server
            .to(userSocket.socket.id)
            .emit('AddToGroup', JSON.stringify(newMember));
        }
      });
    } catch (error: any) {
      // console.log('err in AddToGroup : ', error.message);
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({ status: 500, message: error.status ===300? error.message:"internal server error" }),
        );
    }
  }

  @SubscribeMessage('CreateDm')
  async CreateDm(client: Socket, data: any) {
    if (
      this.AuthenticatedUsers.find((user) => user.socket.id === client.id)
        ?.Authenticated === false
    ) {
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({
            status: 500,
            message: 'Unauthorized to create dm : login and try again',
          }),
        );
      return;
    }
    try {
      // console.log('crtDm data : ', data);
      this.UsersSockets?.map((userSocket: users) => {
        if (
          userSocket.username === data.FK_user1.username ||
          userSocket.username === data.FK_user2.username
        ) {
          this.server
            .to(userSocket.socket.id)
            .emit('CreateDm', JSON.stringify(data));
        }
      });
    } catch (error: any) {
      // console.log('err in CreateDm : ', error.message);
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({ status: 500, message: error.message }),
        );
    }
  }

  @SubscribeMessage('block')
  async block(client: Socket, data: any) {
    if (
      this.AuthenticatedUsers.find((user) => user.socket.id === client.id)
        ?.Authenticated === false
    ) {
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({
            status: 500,
            message: 'Unauthorized to block user : login and try again',
          }),
        );
      return;
    }
    try {
      this.UsersSockets?.map((userSocket: users) => {
        if (
          userSocket.username === data.toBlock ||
          userSocket.username === data.blocker
        ) {
          this.server
            .to(userSocket.socket.id)
            .emit('blocked', JSON.stringify(data));
        }
      });
    } catch (error: any) {
      // console.log('err in block : ', error.message);
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({ status: 500, message: error.message }),
        );
    }
  }

  @SubscribeMessage('Unblock')
  async Unblock(client: Socket, data: any) {
    if (
      this.AuthenticatedUsers.find((user) => user.socket.id === client.id)
        ?.Authenticated === false
    ) {
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({
            status: 500,
            message: 'Unauthorized to block user : login and try again',
          }),
        );
      return;
    }
    try {
      // console.log('Unblock data : ', data);
      if (this.UsersSockets.find((user) => user.username === data.toUnBlock))
        this.server
          .to(
            this.UsersSockets.find((user) => user.username === data.toUnBlock)
              ?.socket.id,
          )
          .emit('unblocked', JSON.stringify(data));
      if (this.UsersSockets.find((user) => user.username === data.Unblocker))
        this.server
          .to(
            this.UsersSockets.find((user) => user.username === data.Unblocker)
              ?.socket.id,
          )
          .emit('unblocked', JSON.stringify(data));
    } catch (error: any) {
      // console.log('err in block : ', error.message);
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({ status: 500, message: error.message }),
        );
    }
  }

  @SubscribeMessage('banUser')
  async banUser(client: Socket, data: any) {
    if (
      this.AuthenticatedUsers.find((user) => user.socket.id === client.id)
        ?.Authenticated === false
    ) {
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({
            status: 500,
            message: 'Unauthorized to ban user : login and try again',
          }),
        );
      return;
    }
    try {
      const chatMembers = await this.chatService.getchatMembers(data.chat_id);
      this.UsersSockets?.map((userSocket: users) => {
        if (
          chatMembers?.find(
            (elem) => elem.FK_user.username === userSocket.username,
          )
        ) {
          this.server
            .to(userSocket.socket.id)
            .emit('banned', JSON.stringify(data));
        }
      });
      if (this.UsersSockets.find((user) => user.username === data.Banned_user))
        this.server
          .to(
            this.UsersSockets.find((user) => user.username === data.Banned_user)
              ?.socket.id,
          )
          .emit('banned', JSON.stringify(data));
    } catch (error: any) {
      // console.log('err in banUser : ', error.message);
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({ status: 500, message: error.message }),
        );
    }
  }

  @SubscribeMessage('MuteUser')
  async SendMuteEvent(client: Socket, data: any) {
    if (
      this.AuthenticatedUsers.find((user) => user.socket.id === client.id)
        ?.Authenticated === false
    ) {
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({
            status: 500,
            message: 'Unauthorized to block user : login and try again',
          }),
        );
      return;
    }
    try {
      // console.log('Mute data : ', data);
      const members = await this.chatService.getchatMembers(data.chat_id);
      this.UsersSockets?.map((userSocket: users) => {
        if (
          members?.find((elem) => elem.FK_user.username === userSocket.username)
        ) {
          this.server
            .to(userSocket.socket.id)
            .emit('Muted', JSON.stringify(data));
        }
      });
    } catch (error: any) {}
  }
  /**Mute data :  {
  Muted_id: 4,
  Muted_user: 'aarjouzi',
  chat_id: 5,
  createdAt: '2024-02-27T15:24:59.288Z',
  MutedBy: 'oidboufk'
} */

  /**UnMute data :  {
  Muted_id: 4,
  Muted_user: 'aarjouzi',
  chat_id: 5,
  createdAt: '2024-02-27T15:24:59.288Z',
  UnMutedBy: 'oidboufk'
} */
  @SubscribeMessage('UnmuteUser')
  async SendUnMuteEvent(client: Socket, data: any) {
    if (
      this.AuthenticatedUsers.find((user) => user.socket.id === client.id)
        ?.Authenticated === false
    ) {
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({
            status: 500,
            message: 'Unauthorized to block user : login and try again',
          }),
        );
      return;
    }
    try {
      // console.log('UnMute data : ', data);
      const members = await this.chatService.getchatMembers(data.chat_id);
      this.UsersSockets?.map((userSocket: users) => {
        if (
          members?.find((elem) => elem.FK_user.username === userSocket.username)
        ) {
          this.server
            .to(userSocket.socket.id)
            .emit('UnMuted', JSON.stringify(data));
        }
      });
    } catch (error: any) {}
  }

  @SubscribeMessage('deleteFriend')
  async deleteFriend(client: Socket, data: any) {
    if (
      this.AuthenticatedUsers.find((user) => user.socket.id === client.id)
        ?.Authenticated === false
    ) {
      this.server
        .to(client.id)
        .emit(
          'unauthorized',
          JSON.stringify({
            status: 500,
            message: 'Unauthorized to block user : login and try again',
          }),
        );
      return;
    }
    try {
      // console.log('deleteFriend data : ', data);
      this.UsersSockets?.map((userSocket: users) => {
        if (
          userSocket.username === data.DM.FK_user2.username ||
          userSocket.username === data.DM.FK_user1.username
        ) {
          this.server
            .to(userSocket.socket.id)
            .emit('friendDeleted', JSON.stringify(data));
        }
      });
    } catch (error: any) {}
  }
}
