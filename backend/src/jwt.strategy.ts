import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, Req } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import 'dotenv/config';

// test
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
      passReqToCallback: true,
    });
  }

  async validate(@Req() req, payload: any) {
    // get the user from intra API
    try {
      if (payload.twoFa === true && !req.body.token)
        return null;

        // console.log("\n\n\n\n\n PAYLOAD : ", payload, "\n\n\n\n\n")
      // console.log("payload: ", payload, "req: ", req.body.token);
      const user = await this.authService.validateUser(payload);
      if (!user)
      {
        console.log("user not found", payload)
        return null;
      }
      else if (user.twoFactor == true) {
          return { userId: payload.sub, payload:payload, user, twoFactor: true };
      
      }
      else return { userId: payload.sub, payload:payload, user };
      
    } catch (error : any) {
      console.log("error in Validate: ", error.message)
      return null
    }
  }
}

