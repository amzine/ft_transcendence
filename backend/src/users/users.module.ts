import { Module, forwardRef } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { Users } from './services/users.services';
import { PrismaModule } from 'src/database/prisma.module';
import { GameModule } from 'src/game/game.module';
import { Prisma } from '@prisma/client';

@Module({
  imports : [forwardRef(() => GameModule) ,forwardRef(()=>PrismaModule)],
  controllers: [UsersController],
  providers: [Users],
  exports : [Users]
})
export class UsersModule {}
