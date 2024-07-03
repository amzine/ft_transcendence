import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-42';
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import 'dotenv/config';
import { toDataURL } from 'qrcode';
import * as speakeasy from 'speakeasy';
import { UserService } from './services/user/user.service';
import axios from 'axios';
const hash = require('adler-32');

@Injectable()
export class FortyTwoStrategy extends PassportStrategy(Strategy, '42') {
  private db = new PrismaClient();
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {
    super({
      clientID: process.env.FORTYTWO_APP_UID,
      clientSecret: process.env.FORTYTWO_APP_SECRET,
      callbackURL: process.env.FORTYTWO_CALLBACK_URL,
      scope: 'public',
    });
  }

  async twoFactorAuthCode(secretKey: string) {
    const secret = JSON.parse(secretKey);
    const qrCode = await toDataURL(secret.otpauth_url);
    return qrCode;
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, username, photos, emails } = profile;
    const payload = {
      id,
      username,
      email: emails[0].value,
      accessToken,
      refreshToken,
      twoFa: false,
    };
    let dbuser: any = await this.db.user.findFirst({
      where: {
        username42: payload.username,
      },
    });
    if (!dbuser) {
      // create user
      try {
        const user = await axios.get(`https://api.intra.42.fr/v2/me`, {
          headers: { Authorization: `Bearer ${payload.accessToken}` },
        });
        if (!user) {
          done(null, false);
          return;
        }
        const userData = {
          id: user.data.id,
          email: user.data.email,
          login: user.data.login,
          first_name: user.data.first_name,
          last_name: user.data.last_name,
          image: user.data.image.versions.medium,
          bio: '',
          twoFactor: false,
        };
        try {
          // move to user.service if needed --------
          try {
            dbuser = await this.db.user.create({
              data: {
                username: userData.login,
                username42: userData.login,
                email: userData.email || 'no email',
                image: userData.image,
                bio: userData.bio,
                first_name: userData.first_name,
                last_name: userData.last_name,
              },
            });
          } catch (err) {
            // use adler32 to hash the string
            const hashed = hash.str(userData.login);
            dbuser = await this.db.user.create({
              data: {
                username: hashed.toString(),
                username42: hashed.toString(),
                email: userData.email || 'no email',
                image: userData.image,
                bio: userData.bio,
                first_name: userData.first_name,
                last_name: userData.last_name,
              },
            });
            if (!dbuser) {
              done(null, false);
              return;
            }
          }
        } catch (err: any) {
          console.log('ERROR in auth-service find-First : ', err.message);
          done(null, false);
          return;
        }
      } catch (err: any) {
        // console.log('ERROR in auth-service : ', err.message);
        done(null, false);
        return;
      }
    }
    payload.username = dbuser.username;
    // console.log('payload: ', payload);
    const jwt = this.jwtService.sign(payload, { expiresIn: '1d' });
    if (dbuser && dbuser.twoFactor) {
      //generate a qr code
      payload.twoFa = true;
      const jwt = this.jwtService.sign(payload);
      // console.log('payload: ', payload);
      const user = {
        twoFactor: true,
        jwt,
      };
      done(null, user);
      return;
    }
    const user = {
      jwt,
    };
    if (dbuser && dbuser.firstTime) user['firstTime'] = true;
    done(null, user);
  }
}
