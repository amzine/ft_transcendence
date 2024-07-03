import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

@Injectable()
export class AuthService {
  private db = new PrismaClient();
  async validateUser(payload: any) {
    // console.log("####################\m", payload, "\n################################")
    const db_user = await this.db.user.findFirst({
      where: {
        username: payload.username,
      },
    });
    // console.log("db_user: ", db_user)
    if (!db_user) {
      return null;
    }
	else return {
		id: db_user.user_id,
		login: db_user.username,
		email: db_user.email,
		first_name: db_user.first_name,
		last_name: db_user.last_name,
		image: db_user.image,
		bio: db_user.bio,
		twoFactor: db_user.twoFactor,
    games: db_user.games,
    winRate: db_user.winRate,
    wins: db_user.wins
	  };
  }
}

// id: 62553,
//   email: 'aarjouzi@student.1337.ma',
//   login: 'aarjouzi',
//   first_name: 'Abderrahman',
//   last_name: 'Arjouzi',
//   usual_full_name: 'Abderrahman Arjouzi',
//   usual_first_name: null,
//   url: 'https://api.intra.42.fr/v2/users/aarjouzi',
//   phone: 'hidden',
//   displayname: 'Abderrahman Arjouzi',
//   kind: 'student',
//   image: {
//     link: 'https://cdn.intra.42.fr/users/af326d2fdbe9f134635a93de01b226ff/aarjouzi.jpg',
//     versions: {
//       large: 'https://cdn.intra.42.fr/users/d9a836904e2122e78a2ce8bb67302d17/large_aarjouzi.jpg',
//       medium: 'https://cdn.intra.42.fr/users/b8b5427e0189d4e640108730c738a56f/medium_aarjouzi.jpg',
//       small: 'https://cdn.intra.42.fr/users/b28c66ca6aec622de28e3aa42f96e2ff/small_aarjouzi.jpg',
//       micro: 'https://cdn.intra.42.fr/users/bd543726191f28aa0c36d9904a764c6b/micro_aarjouzi.jpg'
//     }
//   },
