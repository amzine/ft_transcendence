import {
  Injectable,
  HttpException,
  HttpStatus,
  Inject,
  forwardRef,
  BadRequestException,
  ForbiddenException,
  ConsoleLogger,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { GameService } from 'src/game/game.service';
import { plainToClass } from 'class-transformer';
import { UserDto } from '../userDto';

@Injectable()
export class Users {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => GameService))
    private readonly gameService: GameService,
  ) {}
  private readonly fakeusers = [
    {
      id: 1,
      name: 'John Doe',
      age: 29,
    },
    {
      id: 2,
      name: 'Alice Caeiro',
      age: 32,
    },
    {
      id: 3,
      name: 'Bob Doe',
      age: 29,
    },
  ];

  async getUser(username: string) {
    if (username === undefined) {
      throw new BadRequestException('Undefined user ID');
    }
    // console.log('username', username);
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          username: username,
        },
      });
      const dtoUser = plainToClass(UserDto, user);
      // console.log('akwaba');
      // console.log(dtoUser);
      return dtoUser;
    } catch (error) {
      throw new ForbiddenException('getUser error : ' + error);
    }
  }

  async getLeaderboard() {
    const users = await this.prisma.user.findMany({
      where: {
        NOT: {
          games: {
            equals: 0,
          },
        },
      },
      select: {
        user_id: true,
        username: true,
        rank: true,
        winRate: true,
        lost: true,
        wins: true,
        games: true,
      },
      orderBy: { rank: 'asc' },
    });
    console.log(users);
    return users;
  }

  async updateRanks() {
    const users = await this.prisma.user.findMany({
      orderBy: {
        score: 'desc',
      },
      select: {
        user_id: true,
        score: true,
      },
    });
    const usersId: number[] = [];
    for (const user of users) {
      if (user.score !== 1200) usersId.push(user.user_id);
    }

    let index = 1;
    for (const id of usersId) {
      await this.prisma.user.update({
        where: {
          user_id: id,
        },
        data: {
          rank: index,
        },
      });
      index++;
    }
    return;
  }
  async updateWinRate(username: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        username: username,
      },
    });
    const winRate = user.wins / user.games;

    const updateUser = await this.prisma.user.update({
      where: {
        username: username,
      },
      data: {
        winRate: winRate,
      },
    });
    return updateUser;
  }
  async hasWon(username: string) {
    //increments the number of won and played games by one
    const updateUser = await this.prisma.user.updateMany({
      where: {
        username: username,
      },
      data: {
        wins: {
          increment: 1,
        },
        games: {
          increment: 1,
        },
      },
    });
    this.updateWinRate(username);
    return updateUser;
  }

  async hasLost(userame: string) {
    //increments the number of lost and played games by one
    const updateUser = await this.prisma.user.updateMany({
      where: {
        username: userame,
      },
      data: {
        lost: {
          increment: 1,
        },
        games: {
          increment: 1,
        },
      },
    });
    this.updateWinRate(userame);
    return updateUser;
  }

  async calculateScores([...ratings]) {
    const [a, b] = ratings;
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const expectedScore = (self, opponent) =>
      1 / (1 + 10 ** ((opponent - self) / 400));
    const newRating = (rating, index) =>
      rating + 32 * (index - expectedScore(index ? a : b, index ? b : a));
    return [newRating(a, 1), newRating(b, 0)];
  }

  getUserInfo() {
    return { user: 'oidboufk', message: 'test message' };
  }
  getAllUsers() {
    return this.fakeusers;
  }
}
