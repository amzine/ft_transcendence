import { Module } from '@nestjs/common';
import { AuthService } from 'src/services/auth.service';
import { JwtStrategy } from '../jwt.strategy';

@Module({
  providers: [JwtStrategy, AuthService],
})

export class AuthModule {}
  