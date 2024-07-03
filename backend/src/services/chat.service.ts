import { Injectable, Req, Res, UploadedFile, UseInterceptors } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { Chat, Prisma, PrismaClient, State, TYPE, User, chatMembers } from "@prisma/client";

import * as bcrypt from 'bcrypt';
import { stat, unlink } from "fs";
// import { Like } from "typeorm";
import { NumericData } from "qrcode";
import { hasSubscribers } from "diagnostics_channel";
import { get } from "http";

interface gameInvitation {
    gameId : number,
    sender_login: string,
    reicever_login: string,
    state:string //pending
}

@Injectable()
export class ChatService {
    private db = new PrismaClient();
    private server : Server = new Server();
    public status : number = 200;
    public message : string = "success";

    public GameInvitations : gameInvitation[]
        
    constructor() {

        }

        // function to send invitaion 

        async sendGameInv() {

        }

        // function for accept game invit
        async acceptGameInvit(){}
        // function for refuse game invit
        async refuseGameInvit(){}

        
        async getChats(id : number) {
            var data = await this.db.chat.findMany({
                where: {
                    chatMembers: {
                        some: {
                            user_id: id
                        },
                    }
                },
                select:{
                    chat_id: true,
                    chatName: true,
                    messages: {
                        select: {
                            message_id: true,
                            message: true,
                            created_at: true,
                            FK_sender: {
                                select: {
                                    username: true,
                                    image: true,
                                    user_id: true
                                }
                            }
                        },
                        orderBy: {
                            created_at: 'asc'
                        }
                    },
                    chatMembers: {
                        select: {
                            chatMember_id: true,
                            FK_user: {
                                select: {
                                    username: true,
                                    image: true,
                                    user_id: true
                                }
                            }
                        }
                    },
                    chatType: true,
                    chatAdmins: {
                        select: {
                            FK_user:{
                                select: {
                                    username: true,
                                    image: true,
                                    user_id: true
                                }
                            }
                        }
                    },
                    chatBio: true,
                    chatOwner: true,
                    chatImage: true,
                    GroupState: true,
                    Password: false,
                    FK_chatOwner: true
                }
                
            });
            const sorted = data.sort((a , b) =>{
                if (a.messages.length == 0)
                    return 1;
                if (b.messages.length == 0)
                    return -1;
                return Number(b.messages[b.messages.length - 1]?.created_at) - Number(a.messages[a.messages.length - 1]?.created_at)
            }
            );
            this.status = 200;
            return sorted; 
        }

        async getChatMessages(id : number) {
            try {
                
                const messages  = await this.db.message.findMany({
                    where: {
                        FK_chat: await this.db.chat.findUnique({
                            where: {
                                chat_id: id
                            },
                        }
                        )
                    },
                    select : {
                        message_id: true,
                        message: true,
                        created_at: true,
                        FK_sender: {
                            select: {
                                username: true,
                                image: true,
                                user_id: true
                            }
                        }
                    },
                    orderBy: {
                        created_at: 'asc'
                    }
                });
                this.status = 200;
                return messages;
            } catch (error: any) {
                console.log("err in getChatMessages", error)
            }
            
        }

        async getchatMembers(id : number) {
            try {
                const chatMembers =  await this.db.chatMembers.findMany({
                    where: {
                        chat_id: id
                    },
                    select : {
                        FK_user: {
                            select: {
                                username: true,
                                image: true,
                                user_id: true
                            }
                        }
                    }
                });
                this.status = 200;
                return chatMembers;
                
            } catch (error: any) {
                console.log("err in getchatMembers", error)
            }
            
        }
    
        async createChat(req : any){
            
            // console.log("req.file : ", req.file)
            // console.log("req.file : ", file);
            try {
                const user = await this.db.user.findUnique({
                    where: {
                        username: req.user.user.login
                    }
                });
                // console.log("req/body.data.")
                var password : string;
                if (req.body.State==="Protected")
                    password = await bcrypt.hash(req?.body?.password, 10)
                // need to add socket here for chat adding if the user gets added in a  new chat he need to get notified 
                var data = await this.db.chat.create({
                    data : 
                    {
                        chatName: req?.body?.name || "leet chat",
                        chatMembers: {
                            create: {
                                user_id: user.user_id
                            }
                        },
                        chatType: TYPE.GROUP,
                        chatAdmins: {
                            create: {
                                 user_id: user.user_id
                            }
                        },
                        chatBio: req.body?.chatBio || "leet chat",
                        chatOwner: user.user_id,
                        
                        chatImage: req.body?.chatImage || "uploads/default_Room.webp",
                        GroupState: req.body?.State==="PROTECTED"?State.PROTECTED:req.body?.State==="PRIVATE"?State.PRIVATE:State.PUBLIC,
                        Password: password
                    },
                    select:{
                        chat_id: true,
                        chatName: true,
                        messages: {
                            select: {
                                message_id: true,
                                message: true,
                                created_at: true,
                                FK_sender: {
                                    select: {
                                        username: true,
                                        image: true,
                                        user_id: true
                                    }
                                }
                            },
                            orderBy: {
                                created_at: 'asc'
                            }
                        },
                        chatMembers: {
                            select: {
                                chatMember_id: true,
                                FK_user: {
                                    select: {
                                        username: true,
                                        image: true,
                                        user_id: true
                                    }
                                }
                            }
                        },
                        chatType: true,
                        chatAdmins: {
                            select: {
                                FK_user:{
                                    select: {
                                        username: true,
                                        image: true,
                                        user_id: true
                                    }
                                }
                            }
                        },
                        chatBio: true,
                        chatOwner: true,
                        chatImage: true,
                        GroupState: true,
                        Password: false,
                        FK_chatOwner: true
                    }
                });
                this.status = 200;
                return data;
            } catch (error: any) {
                console.log("err in createChat : ", error)
                return {status: 500, message: error.message}
            }
        }
    
        async updateChat(req:any, name:string) {

            // need to add socket for chat updating
            try {
                const chat = await this.db.chat.findUnique({
                    where: {
                        chatName: name
                    },
                    select : {
                        chatImage: true,
                    }
                });
                if (req.body?.chatImage && chat.chatImage !== "uploads/default_Room.webp") {
                    unlink(chat.chatImage, (err) => {
                        if (err) {
                            console.error(err)
                            return
                        }else
                            console.log(`file ${chat.chatImage} deleted`)
                        }
                        );
                    }
                const updatedChat =  await this.db.chat.update({
                    where: {
                        chatName: name
                    },
                    data: {
                        chatName: req.body?.name,
                        chatBio: req.body?.bio,
                        chatImage: req.body?.chatImage || chat.chatImage,
                    },
                    select:{
                        chat_id: true,
                        chatName: true,
                        messages: {
                            select: {
                                message_id: true,
                                message: true,
                                created_at: true,
                                FK_sender: {
                                    select: {
                                        username: true,
                                        image: true,
                                        user_id: true
                                    }
                                }
                            },
                            orderBy: {
                                created_at: 'asc'
                            }
                        },
                        chatMembers: {
                            select: {
                                chatMember_id: true,
                                FK_user: {
                                    select: {
                                        username: true,
                                        image: true,
                                        user_id: true
                                    }
                                }
                            }
                        },
                        chatType: true,
                        chatAdmins: {
                            select: {
                                FK_user:{
                                    select: {
                                        username: true,
                                        image: true,
                                        user_id: true
                                    }
                                }
                            }
                        },
                        chatBio: true,
                        chatOwner: true,
                        chatImage: true,
                        GroupState: true,
                        Password: false,
                        FK_chatOwner: true
                    }
                });
                this.status = 200;
                
                return updatedChat;
            } catch (error : any) {
                this.status = 500;
                this.message = error.message;
                console.log("err in updateChat", error)
            }
        }
        
        async updateChatPassword(req:any, name:string) {
            try {
                if (req.body.state === "PROTECTED" && (req.body.password === undefined || req.body.password === ""))
                    throw new Error("Password is required");
                if (req.body.state === "PROTECTED" && req.body.password !== req.body.password_conf)
                    throw new Error("Password confirmation does not match the password");
                const oldPassword = await this.db.chat.findUnique({
                    where: {
                        chatName: name
                    },
                    select: {
                        Password: true,
                        FK_chatOwner: {
                            select: {
                                username: true
                            }
                        }
                    }
                });
                if (oldPassword.FK_chatOwner.username !== req.user.user.login)
                    throw new Error("Operation Denied : You are not the chat owner");
                var newPassword ;
                if (req.body.state === "PROTECTED" && req.body.password)
                    newPassword = await bcrypt.hash(req.body.password, 10);
                else
                    newPassword = oldPassword.Password;
                const chat = await this.db.chat.update({
                    where: {
                        chatName: name
                    },
                    data: {
                        Password: newPassword,
                        GroupState: req.body.state==="PROTECTED"?State.PROTECTED:req.body.state==="PRIVATE"?State.PRIVATE:State.PUBLIC,
                    },
                    select:{
                        chat_id: true,
                        GroupState: true
                    }
                });
                this.status = 200;
                return chat;
            } catch (error:any) {
                this.status = 500;
                this.message = error.message;
                console.log("err in updateChatPassword", error)
            }
        }
        async deleteChat(id : number) {
            try {
                // const chat = 
                // here too , it needs a socket event for all the chatMembers that the chat is deleted 
                // returns the deleted chat
                const chat = await this.db.chat.delete({
                    where: {
                        chat_id: id
                    },
                    select : {
                        chat_id: true,
                        chatName: true,
                        chatMembers: {
                            select: {
                                chatMember_id: true,
                                FK_user: {
                                    select: {
                                        username: true,
                                        image: true,
                                        user_id: true
                                    }
                                }
                            }
                        },
                        chatType: true,
                        chatAdmins: {
                            select: {
                                FK_user:{
                                    select: {
                                        username: true,
                                        image: true,
                                        user_id: true
                                    }
                                }
                            }
                        },
                        chatBio: true,
                        chatOwner: true,
                        chatImage: true,
                        GroupState: true,
                        Password: false,
                        FK_chatOwner: true
                    },
                    
                });
                if (chat.chatImage !== "uploads/default_Room.webp") {
                    unlink(chat.chatImage, (err) => {
                        if (err) {
                            console.error(err)
                            return
                        }else
                            console.log(`file ${chat.chatImage} deleted`)
                        }
                        );
                    }
                this.status = 200;
                return chat;
            } catch (error : any) {
                console.log("err in deleteChat", error)                
            }
        }

        async joinChat(@Req() req) {
            
            try {
                const user = await this.db.user.findUnique({
                    where: {
                        username: req.user.user.login
                    },
                });
                const chat = await this.db.chat.findUnique({
                    where : {
                        chat_id: Number(req.body?.chatId)
                    },
                    select : {
                        chat_id: true,
                        chatMembers: true,
                        chatAdmins: {
                            select: {
                                FK_user:{
                                    select: {
                                        username: true,
                                        image: true,
                                        user_id: true
                                    }
                                }
                            }
                        },
                        chatBio: true,
                        chatOwner: true,
                        chatType: true,
                        chatImage: true,
                        GroupState: true,
                        Password: true,
                    }
                })

                if (chat.GroupState === State.PRIVATE) {
                    throw {status: 500, message: "Chat is Private"};
                }else if (chat.chatType == TYPE.DM) {
                    throw {status: 500, message: "Chat is Direct Message"};
                }
                // return null;
                if (chat.chatMembers.filter((member:chatMembers)=>member.user_id === user.user_id).length > 0) {
                    throw {status:500, message: "User Already in The Chat Group"};
                }
                if (chat.GroupState === State.PROTECTED) {
                    const match = await bcrypt.compare(req.body.password, chat.Password);
                if (!match) {
                    throw {status: 500, message: "Wrong Password"};
                }
                }
                const isBanned=await this.db.banned.findMany({
                    where :{
                        chat_id: chat.chat_id,
                        Banned_user: user.username
                    }
                })
                console.log("isBanned : ", isBanned)
                if (isBanned.length > 0) {
                    throw {status: 500, message: "You are banned from this chat"};
                }
                const chatmembers = await this.db.chatMembers.create({
                    data : {
                        chat_id: Number(req.body?.chatId),
                        user_id: user.user_id,
                    }
                });
                const joinedChat = await this.db.chat.findUnique({
                    where : {
                        chat_id: Number(req.body?.chatId)
                    },
                    select:{
                        chat_id: true,
                        chatName: true,
                        messages: {
                            select: {
                                message_id: true,
                                message: true,
                                created_at: true,
                                FK_sender: {
                                    select: {
                                        username: true,
                                        image: true,
                                        user_id: true
                                    }
                                }
                            },
                            orderBy: {
                                created_at: 'asc'
                            }
                        },
                        chatMembers: {
                            select: {
                                chatMember_id: true,
                                FK_user: {
                                    select: {
                                        username: true,
                                        image: true,
                                        user_id: true
                                    }
                                }
                            }
                        },
                        chatType: true,
                        chatAdmins: {
                            select: {
                                FK_user:{
                                    select: {
                                        username: true,
                                        image: true,
                                        user_id: true
                                    }
                                }
                            }
                        },
                        chatBio: true,
                        chatOwner: true,
                        chatImage: true,
                        GroupState: true,
                        Password: false,
                        FK_chatOwner: true
                    }
                })
                this.status = 200;
                 return joinedChat;
                
            } catch (error : any) {
                this.status = 500;
                this.message = error.message;
                // new Error(error.message);
                console.log("err in joinChat : ", error.message)
                // throw {status: 500, message: error.message};
            }
        }

        // check if the privided name is available
        async IsAvailable(name:string) {
            try {
            
                const chat = await this.db.chat.findMany({
                    where: {
                        chatName: name,
                        chatType: TYPE.GROUP
                    }
                }) || null;
                if (!chat || chat.length === 0)
                    return true;
                else{
                    console.log(`The Name : ${name} : is use ${chat.length} chats`)
                    return false;
                }
            } catch (error:any) {
                console.log("error in IsAvailable service : ", error.message);
            }
        }

        async getFilteredChats(filter:string) {
            try {
                const chats = await this.db.chat.findMany({
                    where : {
                        chatName : {
                            startsWith: filter,
                        },
                        chatType: TYPE.GROUP,
                        GroupState: {
                            not: State.PRIVATE
                        }
                    },
                    select : {
                        chat_id: true,
                        chatName: true,
                        _count: {
                            select: {
                                chatMembers: true,
                            }
                        },
                        chatType: true,
                        chatBio: true,
                        chatOwner: true,
                        chatImage: true,
                        GroupState: true,
                        Password: false,
                        FK_chatOwner: true
                    }
                })
                this.status = 200;
                return chats;
                
            } catch (error:any) {
                this.status = 500;
                this.message = error.message;
                console.log("error in getFilteredChats service : ", error.message);
            }
        }

        async storeMessage(Username:string, chat_id:number, message:string) {
            try {
                const msg = await  this.db.message.create({
                    data: {
                        message : message,
                        sender_login: Username,
                        receiver_id: chat_id
                    },
                    select : {
                        message_id: true,
                        message: true,
                        created_at: true,
                        FK_sender: {
                            select: {
                                username: true,
                                image: true,
                                user_id: true
                            }
                        }
                    }
                });
                this.status = 200;
                // msg.assign("recepient", chat_id)
                return {...msg, "recepient": chat_id};
            }
            catch(error : any) {
                this.status = 500;
                console.log("error In SendMessage Service : ", error.message);
                // return ([{status:500, message:error.message}])
                return null;
            }
        }
        async storeDmMessage(sender:string, recepient:number, message:string) {
            try {
                const Dm = await this.db.dms.findUnique({
                    where:{
                        dm_id: recepient
                    },
                    select :{
                        FK_user1:{
                            select:{
                                username:true,
                            }
                        },
                        FK_user2:{
                            select:{
                                username:true,
                            }
                        }
                    }
                })
                const Blocked = await this.db.blocked.findMany({
                    where :{
                        OR:[
                            {
                                Blocked_Username: Dm.FK_user1.username,
                            },
                            {
                                Blocked_Username: Dm.FK_user2.username,
                            }
                        ]
                    }
                })
                if (Blocked.length > 0) {
                    throw {status: 500, message: "You Are Blocked from sending messages to this user"};
                }
                const msg = await  this.db.message.create({
                    data: {
                        message : message,
                        sender_login: sender,
                        Dm_id: recepient,
                    },
                    select : {
                        message_id: true,
                        message: true,
                        created_at: true,
                        FK_sender: {
                            select: {
                                username: true,
                                image: true,
                                user_id: true
                            }
                        },
                    }
                });
                this.status = 200;
                // msg.assign("recepient", chat_id)
                return {...msg, "recepient": recepient};
            }
            catch(error : any) {
                this.status = 500;
                this.message = error.message;
                console.log("error In SendMessage Service : ", error.message);
                // return ([{status:500, message:error.message}])
                return null;
            }
        }

        async getUser(login : string){
            try {
                const user =  await this.db.user.findUnique({
                    where: {
                        username: login
                    }
                })
                return user;
            } catch (error:any) {
                console.log("error in getUser Service : ", error.message);
                return null;
            }
        }

        async leaveChat(chatMember_id:number) {
            try {
                let chatAdmin; 
                const deletedchatMembers = await this.db.chatMembers.delete({
                    where: {
                        chatMember_id: Number(chatMember_id)
                    },
                    select : {
                        chatMember_id: true,
                        chat_id: true,
                        FK_user: {
                            select: {
                                username: true,
                                user_id:true
                            }
                        },
                        FK_chat:{
                            select:{
                                chatAdmins:{
                                    select:{
                                        FK_user:{
                                            select:{
                                                username:true,
                                            },
                                        }
                                    }
                                }
                            }
                        }
                    }
                })

                if (deletedchatMembers.FK_chat.chatAdmins.find((admin)=>admin.FK_user.username === deletedchatMembers.FK_user.username)) {
                    await this.db.chatAdmins.delete({
                        where : {
                            chat_id_user_id:{
                                chat_id: deletedchatMembers.chat_id,
                                user_id: deletedchatMembers.FK_user.user_id
                            }

                        },
                        select:{
                            chatAdmin_id: true,
                        }
                    }).then((res:any)=>{
                        chatAdmin = res;
                    })
                    .catch((err)=>{
                        console.log("error in leaveChat Service : ", err.message);
                    });
                }
                const chat = await this.db.chat.findUnique({
                    where:{
                        chat_id: deletedchatMembers.chat_id
                    },
                    select:{
                        chatMembers:true,
                    }
                })
                if (chat.chatMembers.length === 0) {
                    await this.deleteChat(deletedchatMembers.chat_id);
                }
                this.status = 200;
                return {...deletedchatMembers, chatAdmin_id: chatAdmin?.chatAdmin_id || null};
            } catch (error: any) {
                console.log("error in leaveChat Service : ", error.message);
                
            }
        }

        async getChatAdmins(id:number) {
            try {
                const chatAdmins = await this.db.chatAdmins.findMany({
                    where: {
                        chat_id: Number(id)
                    },
                    select : {
                        chatAdmin_id: true,
                        FK_user:{
                            select: {
                                username: true,
                                user_id: true,
                                image: true
                            }
                        }
                    }
                });
                this.status = 200;
                return chatAdmins;
            } catch (error: any) {
                console.log("error in getChatAdmins Service : ", error.message);
                this.status = 500;
                this.message = error.message;
            }
        }

        async getChatProfile(id:number) {
            try {
                const chat = await this.db.chat.findUnique({
                    where:{
                        chat_id: Number(id),
                    },
                    select:{
                        chat_id: true,
                        chatName: true,
                        chatMembers: {
                            select: {
                                chatMember_id: true,
                                FK_user: {
                                    select: {
                                        username: true,
                                        image: true,
                                        user_id: true
                                    }
                                }
                            }
                        },
                        chatType: true,
                        chatAdmins: {
                            select: {
                                chatAdmin_id: true,
                                FK_user:{
                                    select: {
                                        username: true,
                                        image: true,
                                        user_id: true
                                    }
                                }
                            }
                        },
                        chatBio: true,
                        chatOwner: true,
                        chatImage: true,
                        GroupState: true,
                        Password: false,
                        createdAt: true,
                        FK_chatOwner: {
                            select: {
                                username: true,
                                image: true,
                                user_id: true
                            }
                        }
                    }
                })
                this.status = 200;
                return chat;
            } catch (error:any) {
                this.status = 500;
                this.message = error.message;
                // console.log("error in getChatProfile Service : ", error.message);
            }
        }
        
        async KickUser(chat_id:number, user:string, member_id:number) {
            try {
                const usr = await this.getUser(user);
                const chatAdmins = await this.db.chat.findUnique({
                    where:{
                        chat_id: chat_id,
                        chatOwner: usr.user_id
                    },
                })

                if (!chatAdmins) {
                    throw {status: 500, message: "Operations denied : You are not the chat owner"};
                }
                // console.log("member_id : ", member_id)
                const deletedMember = await this.db.chatMembers.delete({
                    where:{
                        chat_id: chat_id,
                        chatMember_id: member_id,
                    },
                    select : {
                        chatMember_id: true,
                        chat_id: true,
                        FK_user: {
                            select: {
                                username: true,
                            }
                        },
                        FK_chat: {
                            select: {
                                chatName: true,
                            }
                        }
                    }
                })
                this.status = 200;
                return deletedMember;
            } catch (error:any) {
                this.status = 500;
                this.message = error.message;
                console.log("error in KickUser Service : ", error.message);
            }
        }

        async promoteMember(chat_id:number, usr:string, toPromote:string) {
            try {
                const user = await this.getUser(usr);
                const chat = await this.db.chat.findUnique({
                    where:{
                        chat_id: chat_id,
                    },
                    select:{
                        chatOwner: true,
                        chatAdmins: {
                            select: {
                                FK_user:{
                                    select: {
                                        username: true,
                                        image: true,
                                        user_id: true
                                    }
                                }
                            }
                        },
                        chatMembers: {
                            select: {
                                FK_user: {
                                    select: {
                                        username: true,
                                        image: true,
                                        user_id: true
                                    }
                                }
                            }
                        },
                    }
                });
                if (!chat.chatAdmins.find((admin)=>admin.FK_user.user_id === user.user_id)) {
                    throw {status: 500, message: "Operations denied : You are not an Admin"};
                }
                const member = await this.getUser(toPromote);
                if (!member) {
                    throw {status: 500, message: "User not found"};
                }
                if (chat.chatAdmins.find((admin)=>admin.FK_user.username === member.username)) {
                    throw {status: 500, message: "User is already an admin"};
                }
                if (!chat.chatMembers.find((mbmr)=>mbmr.FK_user.username === member.username)) {
                    throw {status: 500, message: "User is not a member"};
                }
                const promotedMember = await this.db.chatAdmins.create({
                    data: {
                        chat_id: chat_id,
                        user_id: member.user_id
                    },
                    select : {
                        chatAdmin_id: true,
                        chat_id: true,
                        FK_user: {
                            select: {
                                username: true,
                                image: true,
                                user_id: true
                           }
                        }
                    }
                });
                this.status = 200;
                return promotedMember;
            } catch (error:any) {
                this.status = 500;
                this.message = error.message;
                console.log("error in promoteMember Service : ", error.message);
            }
        }

        async demoteAdmin(chat_id:number, usr:string, toDemote:number) { // toDemote is the chatAdmin_id
            try {
                const user = await this.getUser(usr);
                const chat = await this.db.chat.findUnique({
                    where:{
                        chat_id: chat_id,
                    },
                    select:{
                        chatOwner: true,
                        chatAdmins: {
                            select: {
                                FK_user:{
                                    select: {
                                        username: true,
                                        image: true,
                                        user_id: true
                                    }
                                }
                            }
                        },
                        chatMembers: {
                            select: {
                                FK_user: {
                                    select: {
                                        username: true,
                                        image: true,
                                        user_id: true
                                    }
                                }
                            }
                        },
                    }
                });
                if (chat.chatOwner !== user.user_id) {
                    throw {status: 500, message: "Operations denied : You are not the chat owner"};
                }
                const member = await this.db.chatAdmins.findUnique({
                    where:{
                        chatAdmin_id: toDemote,
                    },
                    select : {
                        chatAdmin_id: true,
                        chat_id: true,
                        FK_user: {
                            select: {
                                username: true,
                                image: true,
                                user_id: true
                            }
                        }
                    }
                });
                if (member.FK_user.user_id === chat.chatOwner) {
                    throw {status: 500, message: "You can't demote the chat owner"};
                }
                if (!member) {
                    throw {status: 500, message: "User not found"};
                }
                if (!chat.chatAdmins.find((admin)=>admin.FK_user.username === member.FK_user.username)) {
                    throw {status: 500, message: "User is not an admin"};
                }
                const demotedMember = await this.db.chatAdmins.delete({
                    where: {
                        chat_id: chat_id,
                        chatAdmin_id: toDemote
                    },
                    select : {
                        chatAdmin_id: true,
                        chat_id: true,
                        FK_user: {
                            select: {
                                username: true,
                            }
                        }
                    }
                });
                this.status = 200;
                return demotedMember;
                // if ()
            } catch (error:any) {
                this.status = 500;
                this.message = error.message;
                console.log("error in demoteMember Service : ", error.message);
            }
        }

        async giveOwnership(chat_id:number, usr:string, toPromote:number) {
            // console.log("chat_id : ", chat_id);
            // console.log("usr : ", usr);
            // console.log("toPromote : ", toPromote);
            try {
                const user = await this.getUser(usr);
                const chat = await this.db.chat.findUnique({
                    where:{
                        chat_id: chat_id,
                    },
                    select:{
                        chatOwner: true,
                        chatAdmins: {
                            select: {
                                FK_user:{
                                    select: {
                                        username: true,
                                        image: true,
                                        user_id: true
                                    }
                                }
                            }
                        },
                        chatMembers: {
                            select: {
                                FK_user: {
                                    select: {
                                        username: true,
                                        image: true,
                                        user_id: true
                                    }
                                }
                            }
                        },
                    }
                });
                if (chat.chatOwner !== user.user_id) {
                    throw {status: 500, message: "Operations denied : You are not the chat owner"};
                }
                const member = await this.db.chatAdmins.findUnique({
                    where:{
                        chatAdmin_id: toPromote,
                    },
                    select : {
                        chatAdmin_id: true,
                        chat_id: true,
                        FK_user: {
                            select: {
                                username: true,
                                image: true,
                                user_id: true
                            }
                        }
                    }
                }).catch((err)=>{});
                if (!member) {
                    throw {status: 500, message: "admin not found"};
                }
                const newOwner = await this.db.chat.update({
                    where: {
                        chat_id: chat_id
                    },
                    data: {
                        chatOwner: member.FK_user.user_id
                    },
                    select : {
                        chat_id: true,
                        chatOwner: true,
                        FK_chatOwner:{
                            select: {
                                username: true,
                                image: true,
                                user_id: true
                            }
                        }
                    }
                })
                .catch((err)=>{
                    this.status = 500; this.message = "internal error, please try again later";
                    return ;
                });
                this.status = 200
                return newOwner;
            } catch (error:any) {
                this.status = 500;
                this.message = error.message;
            }
        }

        async AddToGroup(chat_id:number, user:string, toAdd:number) {
            try {
                const chat = await this.db.chat.findUnique({
                    where:{
                        chat_id: chat_id,
                    },
                    select:{
                        chatAdmins: {
                            select: {
                                FK_user:{
                                    select: {
                                        username: true,
                                        image: true,
                                        user_id: true
                                    }
                                }
                            }
                        },
                        chatMembers: {
                            select: {
                                FK_user: {
                                    select: {
                                        username: true,
                                        image: true,
                                        user_id: true
                                    }
                                }
                            }
                        },
                    }
                });
                if (chat.chatMembers.find((member)=>member.FK_user.user_id === toAdd)) {
                    throw {status: 500, message: "User is already in the chat"};
                }
                if (!chat.chatAdmins.find((admin)=>admin.FK_user.username === user)) {
                    throw {status: 500, message: "Operations denied : You are not an Admin"};
                }
                const userToAdd = await this.db.user.findUnique({
                    where: {
                        user_id: toAdd
                    }
                });
                const is_Banned = await this.db.banned.findMany({
                    where:{
                        Banned_user: userToAdd?.username,
                        chat_id: chat_id
                    }
                }) 
                if (is_Banned.length > 0) {
                    throw {status: 500, message: `User is banned by ${is_Banned[0].BannedBy_user}`};
                }
                if (!userToAdd) {
                    throw {status: 500, message: "Can't add :User not found"};
                }
                const newChatMember = await this.db.chatMembers.create({
                    data:{
                        chat_id: chat_id,
                        user_id: Number(toAdd)
                    },
                    select : {
                        chatMember_id: true,
                        chat_id: true,
                        FK_user: {
                            select: {
                                username: true,
                                image: true,
                                user_id: true
                            }
                        }
                    }
                })
                const newchat = await this.db.chat.findUnique({
                    where:{
                        chat_id: chat_id,
                    },
                    select:{
                        chat_id: true,
                        chatName: true,
                        messages: {
                            select: {
                                message_id: true,
                                message: true,
                                created_at: true,
                                FK_sender: {
                                    select: {
                                        username: true,
                                        image: true,
                                        user_id: true
                                    }
                                }
                            },
                            orderBy: {
                                created_at: 'asc'
                            }
                        },
                        chatMembers: {
                            select: {
                                chatMember_id: true,
                                FK_user: {
                                    select: {
                                        username: true,
                                        image: true,
                                        user_id: true
                                    }
                                }
                            }
                        },
                        chatType: true,
                        chatAdmins: {
                            select: {
                                FK_user:{
                                    select: {
                                        username: true,
                                        image: true,
                                        user_id: true
                                    }
                                }
                            }
                        },
                        chatBio: true,
                        chatOwner: true,
                        chatImage: true,
                        GroupState: true,
                        Password: false,
                        FK_chatOwner: true
                    }
                })
                this.status = 200;
                return {...newchat, fk_user: newChatMember.FK_user};
            } catch (error:any) {
                this.status = 500;
                this.message = error.message;
                console.log("error in AddToGroup Service : ", error.message);
            }
        }

        /* Dms Section */

        async createDm(user:string, userToDm:string) {
            try {
                let isFriend = await this.db.friends.findMany({
                    where :{
                        State: "accepted",
                    },
                    select: {
                        FK_user:{
                            select: {
                                username: true
                            }
                        },
                        FK_friend:{
                            select: {
                                username: true
                            }
                        }
                    }
                })
                isFriend = isFriend.filter((friend)=>{
                    return (friend.FK_user.username === user && friend.FK_friend.username === userToDm) || (friend.FK_user.username === userToDm && friend.FK_friend.username === user)
                })
                if (isFriend.length === 0) {
                    throw {status: 500, message: "You are not friends"};
                }
                const user1 = await this.db.user.findUnique({
                    where: {
                        username: user
                    }
                });
                const user2 = await this.db.user.findUnique({
                    where: {
                        username: userToDm
                    }
                });
                if (!user1 || !user2) {
                    throw {status: 500, message: "User not found"};
                }
                const getDm = await this.db.dms.findMany({
                    where:{
                        OR:[
                            {
                                FK_user1: {
                                    user_id: user1.user_id
                                },
                                FK_user2: {
                                    user_id: user2.user_id
                                }
                            },
                            {
                                FK_user1: {
                                    user_id:user2.user_id
                                },
                                FK_user2: {
                                    user_id:user1.user_id
                                }
                            }
                        ]
                    },
                    select:{
                        dm_id: true,
                        FK_user1:{
                            select: {
                                username: true,
                                image: true,
                                user_id: true,
                            }
                        },
                        FK_user2:{
                            select: {
                                username: true,
                                image: true,
                                user_id: true,
                            }
                        },
                        messages: {
                            select: {
                                message_id: true,
                                message: true,
                                created_at: true,
                                FK_sender: {
                                    select: {
                                        username: true,
                                        image: true,
                                        user_id: true
                                    }
                                }
                            },
                            orderBy: {
                                created_at: 'asc'
                            }
                        },
                    }
                })
                if (getDm.length > 0) {
                    this.status = 200;
                    return getDm[0];
                }
                const Dm = await this.db.dms.create({
                    data:{
                        FK_user1: {
                            connect: {
                                user_id: user1.user_id
                            }
                        },
                        FK_user2: {
                            connect: {
                                user_id:user2.user_id
                            }
                        }
                    },
                    select:{
                        dm_id: true,
                        FK_user1:{
                            select: {
                                username: true,
                                image: true,
                                user_id: true,
                            }
                        },
                        FK_user2:{
                            select: {
                                username: true,
                                image: true,
                                user_id: true,
                            }
                        },
                        messages: {
                            select: {
                                message_id: true,
                                message: true,
                                created_at: true,
                                FK_sender: {
                                    select: {
                                        username: true,
                                        image: true,
                                        user_id: true
                                    }
                                }
                            },
                            orderBy: {
                                created_at: 'asc'
                            }
                        },
                    }
                })
                this.status = 200;
                return Dm;
                // const Dm = await this.db.dms.create({
                //     data
                // })
            } catch (error) {
                this.status = 500;
                this.message = error.message;
                console.log("error in createDm Service : ", error.message);
            }
        }

        async getDms(username:string) {
            try {
                const user = await this.getUser(username);
                if (!user) {
                    throw {status: 500, message: "User not found"};
                }
                const data = await this.db.dms.findMany({
                    where:{
                        OR: [
                            {
                                FK_user1: {
                                    user_id:user.user_id
                                }
                            },
                            {
                                FK_user2: {
                                    user_id:user.user_id
                                }
                            }
                        ],
                    },
                    select:{
                        dm_id: true,
                        FK_user1:{
                            select: {
                                username: true,
                                image: true,
                                user_id: true,
                            }
                        },
                        FK_user2:{
                            select: {
                                username: true,
                                image: true,
                                user_id: true,
                            }
                        },
                        messages: {
                            select: {
                                message_id: true,
                                message: true,
                                created_at: true,
                                FK_sender: {
                                    select: {
                                        username: true,
                                        image: true,
                                        user_id: true
                                    }
                                }
                            },
                            orderBy: {
                                created_at: 'asc'
                            }
                        },
                    }
                })
                if (data.length === 0) {
                    // console.log("no dms found")
                    return [];
                }
                const dms = data.sort((a , b) =>{
                    if (a.messages.length == 0)
                        return 1;
                    if (b.messages.length == 0)
                        return -1;
                    return Number(b.messages[b.messages.length - 1]?.created_at) - Number(a.messages[a.messages.length - 1]?.created_at)
                })
                this.status = 200;
                return dms;
            } catch (error:any) {
                this.status = 500;
                this.message = error.message;
                console.log("error in getDms Service : ", error.message);
            }
        }

        async GetBlockedUsers(username:string) {
            try {
                const Blocked = await this.db.blocked.findMany({
                    where:{
                        OR:[
                            {
                                Blocked_Username: username
                            },
                            {
                                Blocker_Username: username
                            }
                        ]
                    },
                    select:{
                        blocked_id: true,
                        Blocked_Username: true,
                        Blocker_Username: true,
                        createdAt: true,
                        updatedAt: true
                    }
                })
                this.status = 200;
                return Blocked;
            } catch (error:any) {
                this.status = 500;
                this.message = error.message;
                console.log("error in GetBlockedUsers Service : ", error.message);
            }
        }

        async BlockUser(username:string, toBlock:string) {
            try {
                const user = await this.getUser(username);
                const userToBlock = await this.getUser(toBlock);
                if (!user || !userToBlock) {
                    throw {status: 500, message: "User not found"};
                }
                const Block = await this.db.blocked.create({
                    data:{
                        FK_user:{
                            connect: {
                                user_id:user.user_id
                            }
                        },
                        FK_blocked:{
                            connect: {
                                user_id:userToBlock.user_id
                            }
                        }
                    },
                    select:{
                        blocked_id: true,
                        Blocked_Username: true,
                        Blocker_Username: true,
                        createdAt: true,
                        updatedAt: true
                    }
                })
                this.status = 200;
                return Block;
            } catch (error:any) {
                this.status = 500;
                this.message = error.message;
                console.log("error in BlockUser Service : ", error.message);
            }
        }

        async UnblockUser(username:string, toUnblock:string, blocked_id:number) {
            try {
                const user = await this.getUser(username);
                const userToUnBlock = await this.getUser(toUnblock);
                if (!user || !userToUnBlock) {
                    throw {status: 500, message: "User not found"};
                }
                const isBlocked = await this.db.blocked.findUnique({
                    where:{
                        blocked_id: Number(blocked_id)
                    }
                })
                if (!isBlocked) {
                    throw {status: 500, message: "User is not blocked"};
                }
                const unblock = await this.db.blocked.delete({
                    where:{
                        blocked_id: Number(blocked_id)
                    },
                    select:{
                        Blocked_Username: true,
                        Blocker_Username: true,
                        blocked_id: true,
                        createdAt: true,
                        updatedAt: true
                    }
                })
                this.status = 200;
                return unblock;
            } catch (error:any) {
                this.status = 500;
                this.message = error.message;
                console.log("error in UnblockUser Service : ", error.message);
            }
        }

        // need some more tests
        async BanUser(username:string, toBan:string, chat_id:number) {  
            try {
                const chat = await this.db.chat.findUnique({
                    where :{
                        chat_id: Number(chat_id)
                    },
                    select:{
                        chat_id: true,
                        FK_chatOwner:{
                            select:{
                                user_id: true,
                                username: true,
                            }
                        },
                        chatMembers:{
                            select:{
                                chatMember_id:true,
                                FK_user:{
                                    select:{
                                        username:true,
                                        user_id:true
                                    }
                                },
                            }
                        },
                        chatAdmins:{
                            select:{
                                chatAdmin_id:true,
                                FK_user:{
                                    select:{
                                        username:true,
                                        user_id:true
                                    }
                                }
                            }
                        },
                    }
                })
                if (!chat) {
                    throw {status: 500, message: "Chat not found"};
                }
                // check for the hierarchy of the users
                if (!chat.chatAdmins.find((admin)=>admin.FK_user.username === username)) {
                    throw {status: 500, message: "Operations denied : You are not an Admin"};
                }
                if (chat.chatAdmins.find((admin)=>admin.FK_user.username === toBan) && chat.FK_chatOwner.username !== username) {
                    throw {status: 500, message: "You can't ban an admin"};
                }
                // kick user from the chat
                this.status=200;
                this.leaveChat(chat.chatMembers.find((member)=>member.FK_user.username === toBan).chatMember_id);
                if (this.status == 500)
                    throw {status: 500, message: this.message};
                // then ban him
                console.log("chat_id : ", chat_id)
                console.log("toBan : ", toBan)
                console.log("username : ", username)
                const bannedUser = await this.db.banned.create({
                    data:{
                        Banned_user: toBan,
                        BannedBy_user: username,
                        chat_id: Number(chat_id)
                    },
                    select :{
                        banned_id: true,
                        Banned_user: true,
                        BannedBy_user: true,
                        chat_id: true,
                        createdAt: true
                    }
                })
                this.status = 200;
                return bannedUser;
            } catch (error:any) {
                this.status = 500;
                this.message = error.message;
                console.log("error in BanUser Service : ", error.message);
            }
        }
        async UnBanUser(username:string, toBan:string, chat_id:number) {  
            try {
                const chat = await this.db.chat.findUnique({
                    where :{
                        chat_id: Number(chat_id)
                    },
                    select:{
                        chat_id: true,
                        FK_chatOwner:{
                            select:{
                                user_id: true,
                                username: true,
                            }
                        },
                        chatMembers:{
                            select:{
                                chatMember_id:true,
                                FK_user:{
                                    select:{
                                        username:true,
                                        user_id:true
                                    }
                                },
                            }
                        },
                        chatAdmins:{
                            select:{
                                chatAdmin_id:true,
                                FK_user:{
                                    select:{
                                        username:true,
                                        user_id:true
                                    }
                                }
                            }
                        },
                    }
                })
                if (!chat) {
                    throw {status: 500, message: "Chat not found"};
                }
               
               if (chat.FK_chatOwner.username !== username) {
                    throw {status: 500, message: "Operations denied : You are not the chat owner"};
               }
               const isBanned = await this.db.banned.findMany({
                     where:{
                          chat_id: Number(chat_id),
                          Banned_user: toBan
                     }
                });
                if (isBanned.length === 0) {
                    throw {status: 500, message: "User is not banned"};
                }
                const unBannedUser = await this.db.banned.deleteMany({
                    where:{
                        chat_id: Number(chat_id),
                        Banned_user: toBan
                    },
                })
                this.status = 200;
                return unBannedUser;
            } catch (error:any) {
                this.status = 500;
                this.message = error.message;
                console.log("error in BanUser Service : ", error.message);
            }
        }

        // GetBanned Users Function by chat_id
        async GetBannedUsers(chat_id:number) {
            try {
                const Banned = await this.db.banned.findMany({
                    where:{
                        chat_id: Number(chat_id)
                    },
                    select:{
                        banned_id: true,
                        Banned_user: true,
                        BannedBy_user: true,
                        chat_id: true,
                        createdAt: true
                    }
                })
                this.status = 200;
                return Banned;
            } catch (error:any) {
                this.status = 500;
                this.message = error.message;
                console.log("error in GetBannedUsers Service : ", error.message);
            }
        }

        // Mute User Function
        async MuteUser(username:string, toMute:string, chat_id:number) {
            try {
                const chat = await this.db.chat.findUnique({
                    where : {
                        chat_id: Number(chat_id)
                    },
                    select : {
                        chatAdmins : {
                            select : {
                                FK_user : {
                                    select : {
                                        username : true
                                    }
                                }
                            }
                        },
                        chatMembers : {
                            select : {
                                FK_user : {
                                    select : {
                                        username : true
                                    }
                                }
                            }
                        },
                        FK_chatOwner:{
                            select:{
                                username:true
                            }
                        }

                    }
                })
                if (!chat) {
                    throw {status: 500, message: "Chat not found"};
                }
                if (!chat.chatAdmins.find((admin)=>admin.FK_user.username === username)) {
                    throw {status: 500, message: "Operations denied : You are not an Admin"};
                }
                if (chat.chatAdmins.find((admin)=>admin.FK_user.username === toMute) && chat.FK_chatOwner.username !== username) {
                    throw {status: 500, message: "You can't mute an admin"};
                }
                const muted = await this.db.muted.findUnique({
                    where:{
                        Muted_user_chat_id:{
                            chat_id: Number(chat_id),
                            Muted_user: toMute
                        }
                    }
                })
                if (muted) {
                    throw {status: 500, message: "User is already muted"};
                }
                
                const mute = await this.db.muted.create({
                    data:{
                        Muted_user: toMute,
                        chat_id: Number(chat_id)
                    },
                    select :{
                        Muted_id: true,
                        Muted_user: true,
                        chat_id: true,
                        createdAt: true
                    }
                })
                this.status = 200;
                return mute;
            } catch (error:any) {
                this.status = 500;
                this.message = error.message;
                console.log("error in MuteUser Service : ", error.message);
            }
        }

        // Unmute User
        async UnMuteUser(username:string, toUnMute:string, chat_id:number) {
            try {
                const Chat = await this.db.chat.findUnique({
                    where:{
                        chat_id: Number(chat_id)
                    },
                    select:{
                        chatAdmins:{
                            select:{
                                FK_user:{
                                    select:{
                                        username:true
                                    }
                                }
                            }
                        },
                        FK_chatOwner:{
                            select:{
                                username:true
                            }
                        }
                    }
                })
                if (!Chat) {
                    throw {status: 500, message: "Chat not found"};
                }

                if (!Chat.chatAdmins.find((admin)=>admin.FK_user.username === username)) {
                    throw {status: 500, message: "Operations denied : You are not an Admin"};
                }

                if (Chat.chatAdmins.find((admin)=>admin.FK_user.username === toUnMute) && Chat.FK_chatOwner.username !== username) {
                    throw {status: 500, message: "You can't unmute an admin"};
                }
                const muted = await this.db.muted.findUnique({
                    where:{
                        Muted_user_chat_id:{
                            chat_id: Number(chat_id),
                            Muted_user: toUnMute
                        }
                    }
                })
                if (!muted)
                    throw {status: 500, message: "User is not muted"};
                const unmute = await this.db.muted.delete({
                    where:{
                        Muted_id: muted.Muted_id
                    },
                    select:{
                        Muted_id: true,
                        Muted_user: true,
                        chat_id: true,
                        createdAt: true
                    }
                })
                this.status = 200;
                return unmute;

            } catch (error:any) {
                this.status = 500;
                this.message = error.message;
                console.log("error in UnMuteUser Service : ", error.message);
            }
        }

        async GetMutedUsers(chat_id:number) {
            try {
                const chat = await this.db.chat.findUnique({
                    where :{
                        chat_id: Number(chat_id)
                    }
                })
                if (!chat) {
                    throw {status: 500, message: "Chat not found"};
                }
                const muted = await this.db.muted.findMany({
                    where:{
                        chat_id: Number(chat_id)
                    },
                    select:{
                        Muted_id: true,
                        Muted_user: true,
                        chat_id: true,
                        createdAt: true
                    }
                })
                this.status = 200;
                return muted;
            } catch (error:any) {
                this.status=500;
                this.message=error.message;
                console.log("error in GetMutedUsers Service : ", error.message);
            }
        }
    }