import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  UseGuards,
  Req,
  Res,
  Query,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { AppService } from './services/app.service';
import * as speakeasy from 'speakeasy';
import { toDataURL } from 'qrcode';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './services/chat.service';
import { PrismaClient } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { unlink } from 'fs';
import { UserService } from './services/user/user.service';
import * as nanoid from 'nanoid';
import { JwtService } from '@nestjs/jwt';
import { Users } from './users/services/users.services';

// const storage = {
//     storage : diskStorage({
//    destination: './uploads',
//    filename: (req, file, cb) => {
//        const filename: string = file.originalname + Date.now().toString();
//        const extension: string = filename.substring(filename.lastIndexOf('.'), filename.length);
//        cb(null, `${Date.now()}${extension}`);
//    }
// })
// }

let secret: any = null;

@Controller()
export class AppController {
  db = new PrismaClient();
  constructor(
    private readonly user : Users,
    private readonly appService: AppService,
    private chatService: ChatService,
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  async profile(@Req() req) {
    // console.log('req.user : \n\n\n\n\n\n\n\n\n', req.user);
    return {
      userId: req.user.userId,
      userData: req.user.user,
    };
  }

  @Get('get_leaderboard')
  @UseGuards(AuthGuard('jwt'))
	async getLeaderboard() {
		// this.logger.log('getLeaderboard');
		return this.user.getLeaderboard();
	}

  @Get('profile/:username')
  @UseGuards(AuthGuard('jwt'))
  async userProfile(@Req() req, @Param('username') username: string) {
    return this.userService.getUserProfile(req.user, username);
  }

  @Get('friends/:username')
  @UseGuards(AuthGuard('jwt'))
  async userProfileFriends(@Req() req, @Param('username') username: string) {
    return this.userService.getUserFriends(username);
  }

  @Get('resume')
  @UseGuards(AuthGuard('jwt'))
  async resume(@Req() req) {
    return this.userService.getUserResume(req.user);
  }

  @Get('matchHistory')
  @UseGuards(AuthGuard('jwt'))
  async matchHistory(@Req() req) {
    return this.userService.getUserMatchHistory(req.user);
  }

  @Get('matchHistory/:username')
  @UseGuards(AuthGuard('jwt'))
  async userProfileMatchHistory(@Param('username') username: string) {
    return this.userService.getUserMatchHistory(username);
  }

  /*{
  userId: undefined,
  payload: {
    id: '62553',
    username: 'aarjouzi',
    email: 'aarjouzi@student.1337.ma',
    accessToken: '1c1ba43d2cde544ff228538d8b31f45b0567833db21d43b11702cc90f544f2f3',
    refreshToken: '8d459345b90a8ac3afcafe49b4188590e27424c3d6d4e745472b838139af3601',
    iat: 1708519191,
    exp: 1708605591
  },
  user: {
    id: 2,
    login: 'aarjouzi',
    email: 'aarjouzi@student.1337.ma',
    first_name: null,
    last_name: null,
    image: 'https://cdn.intra.42.fr/users/af326d2fdbe9f134635a93de01b226ff/aarjouzi.jpg',
    bio: 'LEET Student',
    twoFactor: false
  }
}
 */
  @Get('users')
  @UseGuards(AuthGuard('jwt'))
  async users(@Req() req) {
    const users = await this.userService.getUsers(req.user);
    if (users) return users;
    return [];
  }

  @Put('user/new')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/profiles',
        filename: (req, file, cb) => {
          console.log('file : ', file);
          const filename: string = nanoid.nanoid();
          const extension: string = file.originalname.substring(
            file.originalname.lastIndexOf('.'),
            file.originalname.length,
          );
          cb(null, `${filename}${extension}`);
        },
      }),
    }),
  )
  async newUser(@Req() req, @UploadedFile() file: Express.Multer.File) {
    let user = await this.userService.newUser(req, file?.path || null);
    if (user.jwt) {
      // generate a new jwt
      const payload = {
        id: user.user.id,
        username: user.user.login,
        email: user.user.email,
        accessToken: req.user.accessToken,
        refreshToken: req.user.refreshToken,
        twoFa: user.user.twoFactor,
      };
      const jwt = this.jwtService.sign(payload, { expiresIn: '1d' });
      user.jwt = jwt;
    }
    return user;
  }

  @Get('friends')
  @UseGuards(AuthGuard('jwt'))
  async getFriends(@Req() req) {
    return this.userService.getFriends(req.user);
  }

  @Post('friends')
  @UseGuards(AuthGuard('jwt'))
  async addFriend(@Req() req) {
    return this.userService.addFriend(req);
  }

  @Put('friends')
  @UseGuards(AuthGuard('jwt'))
  async acceptFriend(@Req() req) {
    return this.userService.acceptFriend(req);
  }

  @Get('users/blocked')
  @UseGuards(AuthGuard('jwt'))
  async getBlockedUsers(@Req() req) {
    return this.userService.getBlockedUsers(req);
  }

  @Delete('users/blocked/:username')
  @UseGuards(AuthGuard('jwt'))
  async unblockUser(@Req() req, @Param('username') username: string) {
    if (username === undefined || username === null || username === '')
      return {
        error: 'provide a username',
        message: 'provide a username',
      };
    return this.userService.unblockUser(req, username);
  }

  @Post('friends/blocked')
  @UseGuards(AuthGuard('jwt'))
  async blockFriend(@Req() req) {
    if (
      req.body.username === undefined ||
      req.body.username === null ||
      req.body.username === ''
    )
      throw new Error('provide a username');
    return this.userService.blockUser(req, req.body.username);
  }

  @Delete('friends/:username')
  @UseGuards(AuthGuard('jwt'))
  async deleteFriend(@Req() req, @Param('username') username: string) {
    return this.userService.deleteFriend(req, username);
  }

  @Get('twoAuthQr')
  @UseGuards(AuthGuard('jwt'))
  async twoAuthQr(@Req() req, @Res() res) {
    return this.userService.twoFactorAuth(req, res);
  }
  // created_at
  @Post('twoAuth')
  @UseGuards(AuthGuard('jwt'))
  async twoAuth(@Req() req, @Res() res) {
    return this.userService.twoFactorAuthVerify(req, res);
  }

  @Delete('twoAuth')
  @UseGuards(AuthGuard('jwt'))
  async deleteTwoFactor(@Req() req, @Res() res) {
    return this.userService.deleteTwoFactor(req, res);
  }

  @Put('twoAuth')
  @UseGuards(AuthGuard('jwt'))
  async twoFactorAuthVerify(@Req() req, @Res() res) {
    return this.userService.twoFactorAuthVerify(req, res);
  }

  @Post('verifyTwoFactorCode')
  @UseGuards(AuthGuard('jwt'))
  async verifyTwoFactorCode(@Req() req, @Res() res) {
    const result = await this.userService.verifyTwoFactorCode(req, res);
    if (result.error) res.status(400).send({ message: result.error });
    // console.log(req.user)
    const payload = {
      id: req.user.payload.id,
      username: req.user.payload.username,
      email: req.user.payload.email,
      accessToken: req.user.payload.accessToken,
      refreshToken: req.user.payload.refreshToken,
      twoFa: false,
    };
    // console.log("payload : ", payload)
    const dbuser = await this.db.user.findFirst({
      where: {
        username: payload.username,
      },
    });
    const jwt = this.jwtService.sign(payload);
    res.status(200).send({ message: result.message, jwt });
  }

  @Get('auth/42')
  @UseGuards(AuthGuard('42'))
  async auth42(@Req() req, @Res() res) {
    console.log('####', req.user);
    if (req.user.twoFactor) {
      res.redirect(
        `${
          process.env.FRONTEND_SERVER
            ? process.env.FRONTEND_SERVER
            : 'http://localhost:3000'
        }/twoAuth?fa2=true&jwt=${req.user.jwt}`,
      );
      return;
    }
    if (req.user.firstTime === true) {
      // console.log('User is new !!!!!!!!!!!!');
      res.redirect(
        `${
          process.env.FRONTEND_SERVER
            ? process.env.FRONTEND_SERVER
            : 'http://localhost:3000'
        }/success?jwt=${req.user.jwt}&firstTime=true`,
      );
      return;
    }
    res.redirect(
      `${
        process.env.FRONTEND_SERVER
          ? process.env.FRONTEND_SERVER
          : 'http://localhost:3000'
      }/success?jwt=${req.user.jwt}`,
    );
  }

  @Post('chat/create')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const filename: string = file.originalname;
          const extension: string = filename.substring(
            filename.lastIndexOf('.'),
            filename.length,
          );
          cb(null, `${Date.now()}${extension}`);
        },
      }),
    }),
  )
  async createChat(@UploadedFile() file: Express.Multer.File, @Req() req) {
    try {
      req.body.chatImage = file?.path || null;
      if (req.body?.name === undefined)
        throw new Error('chat name is required');
      if (req.body?.State == 'Protected' && !req.body?.password)
        throw new Error('password is required');
      if (
        req.body?.State === 'Protected' &&
        req.body?.password !== req.body?.password_conf
      )
        throw new Error("passwords don't match");

      var data = await this.chatService.createChat(req);
      return data;
    } catch (error: any) {
      console.log('err in createChat : ', error.message);
      unlink(file.path, (err) => {
        if (err) {
          console.error(err);
          return;
        } else console.log(`file ${file.path} deleted`);
      });
      return null;
    }
    // return [];
  }

  @Post('chat/update/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const filename: string = file.originalname;
          const extension: string = filename.substring(
            filename.lastIndexOf('.'),
            filename.length,
          );
          cb(null, `${Date.now()}${extension}`);
        },
      }),
    }),
  )
  async UpdateChat(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') name: string,
    @Req() req,
  ) {
    try {
      const chat = await this.db.chat.findUnique({
        where: {
          chatName: name,
        },
        select: {
          chatAdmins: {
            select: {
              FK_user: true,
            },
          },
        },
      });
      if (
        !chat.chatAdmins.find(
          (elem) => elem.FK_user.username === req?.body.user,
        )
      )
        throw new Error('You are not an admin of this chat');
      req.body.chatImage = file?.path || null;
      if (req.body?.name === undefined)
        throw new Error('chat name is required');

      var data = await this.chatService.updateChat(req, name);
      if (this.chatService.status === 500)
        throw new Error(this.chatService.message);
      return data;
    } catch (error: any) {
      console.log('err in updating : ', error.message);
      unlink(file.path, (err) => {
        if (err) {
          console.error(err);
          return;
        } else console.log(`file ${file.path} deleted`);
      });
      return null;
    }
    // return [];
  }

  @Post('chat/changePassword/:name')
  @UseGuards(AuthGuard('jwt'))
  async changePassword(@Req() req, @Param('name') name: string) {
    try {
      const chat = await this.chatService.updateChatPassword(req, name);
      if (this.chatService.status === 500)
        throw new Error(this.chatService.message);
      return chat;
    } catch (error: any) {}
  }

  @Get('chat/get')
  @Get('getChat')
  @UseGuards(AuthGuard('jwt'))
  async getChats(@Req() req) {
    try {
      const user = await this.db.user.findUnique({
        where: {
          username: req.user.user.login,
        },
      });
      const chats = await this.chatService.getChats(user.user_id);
      // console.log("chats : ", chats)
      return chats;
    } catch (error: any) {
      console.log('err in getChat : ', error.message);
      return null;
    }
  }

  @Get('chat/image/:id')
  async getChatImage(@Param('id') id: string, @Res() res) {
    try {
      const chat = await this.db.chat.findUnique({
        where: {
          chat_id: Number(id),
        },
      });
      // console.log("chat : ", chat)
      res.sendFile(chat.chatImage, { root: './' });
    } catch (error: any) {
      console.log('err in getChatImage : ', error.message);
      return null;
    }
  }
  @Delete('chat/delete/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteChat(@Param('id') id: string, @Req() req, @Res() res) {
    try {
      const user = await this.db.user.findUnique({
        where: {
          username: req.user.user.login,
        },
      });
      const owner = await this.db.chat.findUnique({
        where: {
          chat_id: Number(id),
        },
        select: {
          chatOwner: true,
        },
      });
      if (owner.chatOwner !== user.user_id)
        throw new Error('You are not the owner of this chat');
      const chat = await this.chatService.deleteChat(Number(id));
      res.send(chat);
    } catch (error: any) {
      console.log('err in deleteChat : ', error.message);
      res.status(500).send({ message: error.message });
    }
  }

  @Post('chat/join')
  @UseGuards(AuthGuard('jwt'))
  async joinChat(@Req() req) {
    try {
      if (req.body?.isPublic == false && req.body?.password === undefined)
        throw new Error('password is required');
      var chat = await this.chatService.joinChat(req);

      if (this.chatService.status === 500) {
        throw {
          status: this.chatService.status,
          message: this.chatService.message,
        };
      }
      // res.status(200).send(chat);
      return chat;
    } catch (error: any) {
      // console.log("err in joinChat controller : ", error.message)
      console.log('err in joinChat controller : ', error.message);
      // res.status(500).send({message: error.message});
      return { status: 500, message: error.message };
    }
  }

  @Get('username/available/:name')
  @UseGuards(AuthGuard('jwt'))
  async usernameAvailable(@Param('name') name: string, @Res() res) {
    try {
      name = name?.trim();
      if (name == undefined || name === null) new Error('provide a name');
      const isNameAvailable = await this.userService.usernameAvailable(name);
      res.status(200).send(isNameAvailable);
    } catch (error: any) {
      console.log('error in usernameAvailable controller : ', error.message);
      res.status(500).send(error);
    }
  }

  @Get('Available/:name')
  @UseGuards(AuthGuard('jwt'))
  async IsAvailable(@Param('name') name: string, @Res() res) {
    try {
      name = name?.trim();

      if (name == undefined || name === null) new Error('provide a name');
      const isNameAvailable = await this.chatService.IsAvailable(name);
      res.status(200).send(isNameAvailable);
    } catch (error: any) {
      console.log('error in IsAvailable controller : ', error.message);
      res.status(500).send(error);
    }
  }

  @Get('chat/filter/:query')
  @UseGuards(AuthGuard('jwt'))
  async Filter(@Param('query') filter: string) {
    try {
      if (filter.length == 0) new Error('filter is empty');
      const chats = this.chatService.getFilteredChats(filter);
      return chats;
    } catch (error: any) {
      console.log('error in Filter controller : ', error.message);
      new Error('Server Error');
    }
  }

  @Get('chat/profile/:id')
  @UseGuards(AuthGuard('jwt'))
  async ChatProfile(@Param('id') id: number) {
    //
    try {
      const chat = await this.chatService.getChatProfile(id as number);
      if (this.chatService.status === 500)
        throw { status: 500, message: this.chatService.message };
      return chat;
    } catch (error: any) {
      console.log('error in ChatProfile controller : ', error.message);
      return { status: 500, message: error.message };
    }
  }
  @Get('chat/admins/:chat_id')
  @UseGuards(AuthGuard('jwt'))
  async GetAdmins(@Param('chat_id') id: number) {
    // this.chatService.getChatAdmins(id);
    try {
      const admins = await this.chatService.getChatAdmins(id);
      if (this.chatService.status === 500)
        throw { status: 500, message: this.chatService.message };
      return admins;
    } catch (error: any) {
      console.log('error in GetAdmins controller : ', error.message);
      return { status: 500, message: error.message };
    }
  }

  @Put('profile')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/profiles',
        filename: (req, file, cb) => {
          console.log('file : ', file);
          const filename: string = nanoid.nanoid();
          const extension: string = file.originalname.substring(
            file.originalname.lastIndexOf('.'),
            file.originalname.length,
          );
          cb(null, `${filename}${extension}`);
        },
      }),
    }),
  )
  async updateProfile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
    @Res() res,
  ) {
    try {
      const data = await this.userService.updateProfile(
        req,
        req.body,
        file?.path || null,
      );
      const { error, message, user } = data;
      if (error) res.status(400).send({ message: error });
      else res.status(200).send({ message, user });
    } catch (error: any) {
      console.log('err in updateProfile : ', error.message);
      res.status(500).send({ message: 'Server Error' });
    }
  }

  @Get('profile-image/:login')
  async getProfileImage(@Param('login') login: string, @Res() res) {
    if (login === undefined || login === null || login === '')
      return new Error('provide a name');
    try {
      const user = await this.db.user.findUnique({
        where: {
          username: login,
        },
      });
      if (user.image.startsWith('http://') || user.image.startsWith('https://'))
        res.redirect(user.image);
      else res.sendFile(user.image, { root: './' });
    } catch (error: any) {
      // console.log('err in getProfileImage : ', error.message);
      return null;
    }
  }

  /*Dms Section */
  @Post('dm')
  @UseGuards(AuthGuard('jwt'))
  async createDm(@Req() req) {
    try {
      const createdDm = await this.chatService.createDm(
        req.body.user,
        req.body.userToDm,
      );
      if (this.chatService.status === 500)
        throw { status: 500, message: this.chatService.message };
      return createdDm;
    } catch (error: any) {
      console.log('error in createDm controller : ', error.message);
      return { status: 500, message: error.message };
    }
  }

  @Get('dms')
  @UseGuards(AuthGuard('jwt'))
  async getDms(@Req() req) {
    try {
      const dms = await this.chatService.getDms(req.user.user.login);
      if (this.chatService.status === 500)
        throw { status: 500, message: this.chatService.message };
      return dms;
    } catch (error: any) {
      console.log('error in getDms controller : ', error.message);
      return { status: 500, message: error.message };
    }
  }

  @Get('Block')
  @UseGuards(AuthGuard('jwt'))
  async GetBlockedUsers(@Req() req) {
    try {
      const Blocked = await this.chatService.GetBlockedUsers(
        req.user.user.login,
      );
      if (this.chatService.status === 500)
        throw { status: 500, message: this.chatService.message };
      return Blocked;
    } catch (error: any) {
      console.log('error in GetBlockedUsers controller : ', error.message);
      return { status: 500, message: error.message };
    }
  }

  @Post('Block/:name')
  @UseGuards(AuthGuard('jwt'))
  async BlockUser(@Req() req, @Param('name') name: string) {
    try {
      const blocked = await this.chatService.BlockUser(
        req.user.user.login,
        name,
      );
      if (this.chatService.status === 500)
        throw { status: 500, message: this.chatService.message };
      return blocked;
    } catch (error: any) {
      console.log('error in BlockUser controller : ', error.message);
      return { status: 500, message: error.message };
    }
  }

  @Delete('Block/:name/:id')
  @UseGuards(AuthGuard('jwt'))
  async UnBlockUser(
    @Req() req,
    @Param('name') name: string,
    @Param('id') blocked_id: number,
  ) {
    try {
      const Unblocked = await this.chatService.UnblockUser(
        req.user.user.login,
        name,
        blocked_id,
      );
      if (this.chatService.status === 500)
        throw { status: 500, message: this.chatService.message };
      return Unblocked;
    } catch (error: any) {
      console.log('error in BlockUser controller : ', error.message);
      return { status: 500, message: error.message };
    }
  }

  @Post('Ban/:name/:chat_id')
  @UseGuards(AuthGuard('jwt'))
  async BanUser(
    @Req() req,
    @Param('name') name: string,
    @Param('chat_id') chat: number,
  ) {
    try {
      const banned = await this.chatService.BanUser(
        req.user.user.login,
        name,
        chat,
      );
      if (this.chatService.status === 500)
        throw { status: 500, message: this.chatService.message };
      return banned;
    } catch (error: any) {
      console.log('error in BanUser controller : ', error.message);
      return { status: 500, message: error.message };
    }
  }

  @Post('UnBan/:name/:chat_id')
  @UseGuards(AuthGuard('jwt'))
  async UnBanUser(
    @Req() req,
    @Param('name') name: string,
    @Param('chat_id') chat: number,
  ) {
    try {
      const banned = await this.chatService.UnBanUser(
        req.user.user.login,
        name,
        chat,
      );
      if (this.chatService.status === 500)
        throw { status: 500, message: this.chatService.message };
      return banned;
    } catch (error: any) {
      console.log('error in BanUser controller : ', error.message);
      return { status: 500, message: error.message };
    }
  }

  @Get('BannedUsers/:chat_id')
  @UseGuards(AuthGuard('jwt'))
  async GetBannedUsers(@Req() req, @Param('chat_id') chat_id: number) {
    try {
      const BannedUsers = await this.chatService.GetBannedUsers(chat_id);
      if (this.chatService.status === 500)
        throw { status: 500, message: this.chatService.message };
      return BannedUsers;
    } catch (error: any) {
      console.log('error in GetBannedUsers controller : ', error.message);
      return { status: 500, message: error.message };
    }
  }

  @Get('Muted/:chat_id')
  @UseGuards(AuthGuard('jwt'))
  async getMutedUsers(@Req() req, @Param('chat_id') chat_id: number) {
    try {
      const MutedUsers = await this.chatService.GetMutedUsers(chat_id);
      if (this.chatService.status === 500)
        throw { status: 500, message: this.chatService.message };
      return MutedUsers;
    } catch (error: any) {
      console.log('error in getMutedUsers controller : ', error.message);
    }
  }

  @Post('Mute/:name/:chat_id')
  @UseGuards(AuthGuard('jwt'))
  async MuteUser(
    @Req() req,
    @Param('name') name: string,
    @Param('chat_id') chat_id: number,
  ) {
    try {
      const muted = await this.chatService.MuteUser(
        req.user.user.login,
        name,
        chat_id,
      );
      if (this.chatService.status === 500)
        throw { status: 500, message: this.chatService.message };
      return { ...muted, MutedBy: req.user.user.login };
    } catch (error: any) {
      console.log('error in MuteUser controller : ', error.message);
      return { status: 500, message: error.message };
    }
  }

  @Post('UnMute/:name/:chat_id')
  @UseGuards(AuthGuard('jwt'))
  async UnMuteUser(
    @Req() req,
    @Param('name') name: string,
    @Param('chat_id') chat_id: number,
  ) {
    try {
      const Unmuted = await this.chatService.UnMuteUser(
        req.user.user.login,
        name,
        chat_id,
      );
      if (this.chatService.status === 500)
        throw { status: 500, message: this.chatService.message };
      return { ...Unmuted, UnMutedBy: req.user.user.login };
    } catch (error: any) {
      console.log('error in UnMuteUser controller : ', error.message);
      return { status: 500, message: error.message };
    }
  }
}
