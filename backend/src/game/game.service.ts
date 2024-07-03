import {
  ConsoleLogger,
  ForbiddenException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { PrismaService } from 'src/database/prisma.service';
import { Users } from 'src/users/services/users.services';
import { Room } from './interfaces/room.interface';
import { Server } from 'socket.io';
import { Console, dir } from 'console';
import { GameData } from './interfaces/gameData.interfaces';
import { Mutex } from 'async-mutex';
import { setInterval } from 'timers';
import { ChatGateway } from 'src/gateway/chat.gateway';

const refreshRate = 9;
const paddleSpeed = 1;
@Injectable()
export class GameService {
  ballSpeed = 0.25;

  constructor(
    private readonly SchedulerRegistry: SchedulerRegistry,
    private readonly prisma: PrismaService,
    private chatGateway: ChatGateway,
    @Inject(forwardRef(() => Users))
    private readonly userService: Users,
  ) {}

  static rooms: Room[] = [];

  initBall(roomid: number) {
    GameService.rooms.find((room) => room.id === roomid).xball = 50;
    GameService.rooms.find((room) => room.id === roomid).yball = 50;
    GameService.rooms.find((room) => room.id === roomid).ballSpeed =
      this.ballSpeed;
    GameService.rooms.find((room) => room.id === roomid).xSpeed =
      this.ballSpeed;
    GameService.rooms.find((room) => room.id === roomid).ySpeed =
      0.15 + Math.random() * this.ballSpeed;
    let direction = Math.round(Math.random());
    if (direction) {
      GameService.rooms.find((room) => room.id === roomid).xSpeed *= -1;
    }
    direction = Math.round(Math.random());
    if (direction) {
      GameService.rooms.find((room) => room.id === roomid).ySpeed *= -1;
    }
  }

  updateball(roomId: number) {
    console.log('ball is moving');
    GameService.rooms.find((room) => room.id === roomId).xball +=
      GameService.rooms.find((room) => room.id === roomId).xSpeed;
    console.log(GameService.rooms.find((room) => room.id === roomId).xball);

    GameService.rooms.find((room) => room.id === roomId).yball +=
      GameService.rooms.find((room) => room.id === roomId).ySpeed;

    // game windows is 16/9 format - so 1.77, ball radius is 1vh

    // ball collision with floor or ceilling
    if (GameService.rooms.find((room) => room.id === roomId).yball > 98) {
      GameService.rooms.find((room) => room.id === roomId).yball = 98;
      GameService.rooms.find((room) => room.id === roomId).ySpeed *= -1;
    }

    if (GameService.rooms.find((room) => room.id === roomId).yball < 2) {
      GameService.rooms.find((room) => room.id === roomId).yball = 2;
      GameService.rooms.find((room) => room.id === roomId).ySpeed *= -1;
    }

    // ball collision with right paddle (paddle position is 3% from the border, paddle height is 10% of the game windows)
    if (
      GameService.rooms.find((room) => room.id === roomId).xball >=
        97 - 2 / 1.77 &&
      GameService.rooms.find((room) => room.id === roomId).yball >=
        GameService.rooms.find((room) => room.id === roomId).paddleRight - 1 &&
      GameService.rooms.find((room) => room.id === roomId).yball <=
        GameService.rooms.find((room) => room.id === roomId).paddleRight + 11
    ) {
      // ball radius is 1vh
      GameService.rooms.find((room) => room.id === roomId).xball =
        97 - 2 / 1.77;
      GameService.rooms.find((room) => room.id === roomId).ballSpeed *= 1.05;
      GameService.rooms.find((room) => room.id === roomId).xSpeed *= -1.05;
      GameService.rooms.find((room) => room.id === roomId).ySpeed =
        ((GameService.rooms.find((room) => room.id === roomId).yball -
          GameService.rooms.find((room) => room.id === roomId).paddleRight -
          5) /
          6) *
        GameService.rooms.find((room) => room.id === roomId).ballSpeed; // make ball go up, straight or down based on  the part of the paddle touched
    }
    // ball collision with left paddle
    if (
      GameService.rooms.find((room) => room.id === roomId).xball <=
        3 + 2 / 1.77 &&
      GameService.rooms.find((room) => room.id === roomId).yball >=
        GameService.rooms.find((room) => room.id === roomId).paddleLeft - 1 &&
      GameService.rooms.find((room) => room.id === roomId).yball <=
        GameService.rooms.find((room) => room.id === roomId).paddleLeft + 11
    ) {
      GameService.rooms.find((room) => room.id === roomId).xball = 3 + 2 / 1.77;
      GameService.rooms.find((room) => room.id === roomId).ballSpeed *= 1.05;
      GameService.rooms.find((room) => room.id === roomId).xSpeed *= -1.05;
      GameService.rooms.find((room) => room.id === roomId).ySpeed =
        ((GameService.rooms.find((room) => room.id === roomId).yball -
          GameService.rooms.find((room) => room.id === roomId).paddleLeft -
          5) /
          6) *
        GameService.rooms.find((room) => room.id === roomId).ballSpeed;
    }
    // end of point management
    if (
      GameService.rooms.find((room) => room.id === roomId).xball >=
      100 + 2 / 1.77
    ) {
      GameService.rooms.find((room) => room.id === roomId).player1Score += 1;
      this.initBall(GameService.rooms.find((room) => room.id === roomId).id);
    }
    if (
      GameService.rooms.find((room) => room.id === roomId).xball <=
      0 - 2 / 1.77
    ) {
      GameService.rooms.find((room) => room.id === roomId).player2Score += 1;
      this.initBall(GameService.rooms.find((room) => room.id === roomId).id);
    }
  }
  /**
   * set paddle direction (0 = none, 1 = up, 2 = down) based on data received from clients
   */

  updateRoom(player: number, roomId: number, direction: number) {
    if (player == 1) {
      console.log('paddle left dir moving');
      GameService.rooms.find((room) => room.id === roomId).paddleLeftDir =
        direction;
    } else {
      GameService.rooms.find((room) => room.id == roomId).paddleRightDir =
        direction;
    }
  }

  updatePaddles(roomId: number) {
    console.log('paddles moving??');
    if (
      GameService.rooms.find((room) => room.id == roomId).paddleLeftDir == 1
    ) {
      GameService.rooms.find((room) => room.id === roomId).paddleLeft -=
        paddleSpeed;
      if (GameService.rooms.find((room) => room.id === roomId).paddleLeft < 0)
        GameService.rooms.find((room) => room.id === roomId).paddleLeft = 0;
    } else if (
      GameService.rooms.find((room) => room.id === roomId).paddleLeftDir == 2
    ) {
      GameService.rooms.find((room) => room.id === roomId).paddleLeft +=
        paddleSpeed;
      if (GameService.rooms.find((room) => room.id === roomId).paddleLeft > 90)
        GameService.rooms.find((room) => room.id === roomId).paddleLeft = 90;
    }
    if (
      GameService.rooms.find((room) => room.id === roomId).paddleRightDir == 1
    ) {
      GameService.rooms.find((room) => room.id === roomId).paddleRight -=
        paddleSpeed;
      if (GameService.rooms.find((room) => room.id === roomId).paddleRight < 0)
        GameService.rooms.find((room) => room.id === roomId).paddleRight = 0;
    } else if (
      GameService.rooms.find((room) => room.id === roomId).paddleRightDir == 2
    ) {
      GameService.rooms.find((room) => room.id === roomId).paddleRight +=
        paddleSpeed;
      if (GameService.rooms.find((room) => room.id === roomId).paddleRight > 90)
        GameService.rooms.find((room) => room.id === roomId).paddleRight = 90;
    }
  }

  async startGame(rid: number, server: Server) {
    console.log('rid : ' + rid);
    const game_data: GameData = {
      paddleLeft: 45,
      paddleRight: 45,
      xBall: 50,
      yBall: 50,
      player1Score: 0,
      player2Score: 0,
      player1Name: GameService.rooms.find((room) => room.id === rid)
        .player1Name,
      player2Name: GameService.rooms.find((room) => room.id === rid)
        .player2Name,
      player1Avatar: GameService.rooms.find((room) => room.id === rid).player1
        .data.username,
      player2Avater: GameService.rooms.find((room) => room.id === rid).player2
        .data.username,
      startTime: new Date(),
    };
    // const mutex = new Mutex();
    this.initBall(rid);
    const interval = setInterval(() => {
      this.gameLoop(rid, server, game_data);
    }, refreshRate);
    this.SchedulerRegistry.addInterval(String(rid), interval);
  }
  async gameLoop(id: number, server: Server, game_data: GameData) {
    // const release = await mutex.acquire();
    // if (!GameService.rooms.some((room)=> room.id === id)) {
    // 	console.log('realesed');
    // 	release();
    // 	return;
    // }

    if (
      GameService.rooms.find((room) => room.id === id).player1Disconnected ==
      true
    ) {
      server
        .to(GameService.rooms.find((room) => room.id === id).name)
        .emit('disconnected', 1);
      // console.log('disconnect bitch1');
      game_data.player2Score = 11;
    } else if (
      GameService.rooms.find((room) => room.id === id).player2Disconnected ==
      true
    ) {
      server
        .to(GameService.rooms.find((room) => room.id === id).name)
        .emit('disconnected', 2);
      // console.log('disconnect bitch2');

      game_data.player1Score = 11;
    } else {
      // console.log('dkhol wla la ');
      this.updateball(id);
      this.updatePaddles(id);

      game_data.yBall = GameService.rooms.find((room) => room.id === id).yball;
      game_data.xBall = GameService.rooms.find((room) => room.id === id).xball;
      game_data.paddleLeft = GameService.rooms.find(
        (room) => room.id === id,
      ).paddleLeft;
      game_data.paddleRight = GameService.rooms.find(
        (room) => room.id === id,
      ).paddleRight;
      game_data.player1Score = GameService.rooms.find(
        (room) => room.id === id,
      ).player1Score;
      game_data.player2Score = GameService.rooms.find(
        (room) => room.id === id,
      ).player2Score;
    }
    // console.log('update');
    server
      .to(GameService.rooms.find((room) => room.id === id).name)
      .emit('update', game_data);
    console.log('game_data : ' + game_data.player1Name);
    console.log('game_data : ' + game_data.player2Name);
    console.log('game_data : ' + game_data.xBall);
    console.log('game_data : ' + game_data.yBall);
    console.log('game_data : ' + game_data.player2Score);

    if (game_data.player1Score == 11 || game_data.player2Score == 11) {
      this.SchedulerRegistry.deleteInterval(String(id));
      const winner = game_data.player1Score > game_data.player2Score ? 1 : 2;
      server
        .to(GameService.rooms.find((room) => room.id === id).name)
        .emit('end_game', winner);
      const endTime = new Date();
      this.saveGame(
        id,
        GameService.rooms.find((room) => room.id === id).player1.data.username,
        GameService.rooms.find((room) => room.id === id).player2.data.username,
        game_data.player1Score,
        game_data.player2Score,
        game_data.startTime,
        endTime,
      );
      // delete room
      GameService.rooms.splice(
        GameService.rooms.findIndex((room) => room.id === id),
        1,
      );
      // release();
      return;
    }
  }

  async gene_new_id(): Promise<number> {
    const id = Math.floor(Math.random() * 1_000_000 + 1);
    const userId = await this.testId(id);
    if (!GameService.rooms.some((room) => room.id === id) && !userId) {
      return id;
    }
    return this.gene_new_id();
  }

  getGameList(): GameData[] {
    const list: GameData[] = [];
    for (const room of GameService.rooms) {
      if (room.player2) {
        const data: GameData = {
          player1Name: room.player1Name,
          player2Name: room.player2Name,
          player1Avatar: room.player1.data.username,
          player2Avater: room.player2.data.username,
          player1Score: room.player1Score,
          player2Score: room.player2Score,
          gameID: room.id,
        };
        list.push(data);
      }
    }
    return list;
  }

  async saveGame(
    id: number,
    userId1: string,
    userId2: string,
    score1: number,
    score2: number,
    startTime: Date,
    endTime: Date,
  ) {
    const game = await this.prisma.game.create({
      data: {
        id,
        FK_player1: {
          connect: {
            username: userId1,
          },
        },
        FK_player2: {
          connect: {
            username: userId2,
          },
        },
        score1,
        score2,
        startTime,
        endTime,
      },
    });
    // upadate time
    const duration = Math.abs(
      game.endTime.getTime() - game.startTime.getTime(),
    );
    await this.prisma.game.update({
      where: {
        id: id,
      },
      data: {
        duration: duration,
      },
    });
    // update score and winrate
    try {
      const winnerId = score1 > score2 ? userId1 : userId2;
      const loserId = winnerId === userId1 ? userId2 : userId1;
      this.userService.hasWon(winnerId);
      this.userService.hasLost(loserId);

      const winner = await this.prisma.user.findUnique({
        where: {
          username: winnerId,
        },
      });
      const loser = await this.prisma.user.findUnique({
        where: {
          username: loserId,
        },
      });

      const oldscores = [winner.score, loser.score];
      const newScores = await this.userService.calculateScores(oldscores);
      if (Math.floor(newScores[0]) === 1200) {
        newScores[0]++;
      }
      if (Math.floor(newScores[1]) === 1200) {
        newScores[0]--;
      }

      await this.prisma.user.update({
        where: {
          username: winnerId,
        },
        data: {
          score: Math.floor(newScores[0]),
          gamehistory: {
            push: id,
          },
        },
      });
      await this.prisma.user.update({
        where: {
          username: loserId,
        },
        data: {
          score: Math.floor(newScores[1]),
          gamehistory: {
            push: id,
          },
        },
      });
      this.chatGateway.broadcast('updateData', 'updating user data', '');
      this.userService.updateRanks();
      return game;
    } catch (error) {
      throw new ForbiddenException('saveGame error: ' + error);
    }
  }

  async getGame(id: number) {
    try {
      const game = await this.prisma.game.findUnique({
        where: {
          id: id,
        },
      });
      return game;
    } catch (error) {
      throw new ForbiddenException('getGame error : ' + error);
    }
  }

  async testId(id: number) {
    const game = await this.prisma.game.findUnique({
      where: {
        id: id,
      },
    });
    return game;
  }

  async getlastGames() {
    const games = await this.prisma.game.findMany({
      orderBy: { endTime: 'desc' },
    });
    return games;
  }
}
