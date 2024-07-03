import { Module } from '@nestjs/common';
import { AppController } from '../app.controller';
import { AppService } from '../services/app.service';
import { AuthService } from '../services/auth.service';
import { FortyTwoStrategy } from '../42.strategy';
import { JwtStrategy } from '../jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from './auth.module';
import { ChatGateway } from '../gateway/chat.gateway';
import 'dotenv/config';
import { ChatService } from '../services/chat.service';
import { UserService } from 'src/services/user/user.service';
import { Prisma, PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from 'src/users/users.module';
import { GameModule } from 'src/game/game.module';
import { AppGateWay } from 'src/app.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    UsersModule,
    AuthModule,
    PassportModule,
    PrismaClient,
    GameModule,
    // MulterModule.register({
    //   dest: './uploads',
    // }),
    // TypeOrmModule.forRoot({
    //   type: 'postgres',
    //   host: process.env.DB_HOST,
    //   port: parseInt(process.env.DB_PORT, 10) || 5432,
    //   username: process.env.POSTGRES_USER || 'oidboufk',
    //   password: process.env.POSTGRES_PASSWORD,
    //   database: process.env.POSTGRES_DB || 'pong',
    //   // entities: [],
    //   entities: [Users, Chat, Messages, ChatMembers],
    //   schema: 'public',
    //   synchronize: true,
    //   autoLoadEntities: true,
    // }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AuthService,
    ChatService,
    FortyTwoStrategy,
    JwtStrategy,
    ChatGateway,
    UserService,
    AppGateWay,
  ],
  exports: [AppGateWay, ChatGateway],
})
export class AppModule {}
