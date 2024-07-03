import { Injectable, Req, Res, UploadedFile } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import { toDataURL } from 'qrcode';
import * as speakeasy from 'speakeasy';
import { ChatGateway } from 'src/gateway/chat.gateway';

@Injectable()
export class UserService {
  constructor(
    private jwtService: JwtService,
    private chatGateway: ChatGateway,
  ) {}

  private db = new PrismaClient();

  async usernameAvailable(username: string) {
    const user = await this.db.user.findFirst({
      where: {
        username: username,
      },
    });
    return user ? false : true;
  }

  async getUserResume(user: any) {
    const resume = {
      userData: user.user,
      Friends: await this.getFriends(user),
      Users: await this.getUsers(user),
    };
    return resume;
  }

  async getUserMatchHistory(user: any) {
    const matches = await this.db.game.findMany({
      where: {
        OR: [
          {
            FK_player1: {
              username: user.user?.login || user,
            },
          },
          {
            FK_player2: {
              username: user.user?.login || user,
            },
          },
        ],
      },
      orderBy: {
        startTime: 'desc',
      },
      select: {
        FK_player1: {
          select: {
            username: true,
          },
        },
        FK_player2: {
          select: {
            username: true,
          },
        },
        score1: true,
        score2: true,
      },
    });
  //   return [{
  //     FK_player1: {
  //       username: "aarjouzi",
  //     },
  //     FK_player2: {
  //       username: "ibel-har",
  //     },
  //     score1: 4,
  //     score2: 5,
  //   },
  //   {
  //     FK_player1: {
  //       username: "aarjouzi",
  //     },
  //     FK_player2: {
  //       username: "ibel-har",
  //     },
  //     score1: 3,
  //     score2: 5,
  //   },
  //   {
  //     FK_player1: {
  //       username: "aarjouzi",
  //     },
  //     FK_player2: {
  //       username: "ibel-har",
  //     },
  //     score1: 5,
  //     score2: 2
  //   }
  // ]
    return matches;
  }

  async newUser(@Req() req, filename: string) {
    if (
      req.body.login === '' ||
      req.body.bio === '' ||
      req.body.first_name === '' ||
      req.body.last_name === ''
    )
      return {
        error: 'Please fill out all fields',
        message: 'Username, first name, last name and bio are required',
      };
    let user = null;
    if (filename)
      user = await this.db.user.update({
        where: {
          username: req.user.user.login,
          firstTime: true,
        },
        data: {
          firstTime: false,
          username: req.body.login,
          first_name: req.body.first_name,
          last_name: req.body.last_name,
          bio: req.body.bio,
          image: filename,
        },
      });
    else
      user = await this.db.user.update({
        where: {
          username: req.user.user.login,
          firstTime: true,
        },
        data: {
          firstTime: false,
          username: req.body.login,
          first_name: req.body.first_name,
          last_name: req.body.last_name,
          bio: req.body.bio,
        },
      });

    if (user) {
      await this.db.blocked.updateMany({
        where: {
          Blocked_Username: req.user.user.login,
        },
        data: {
          Blocked_Username: req.body.login,
        },
      });
      await this.db.blocked.updateMany({
        where: {
          Blocker_Username: req.user.user.login,
        },
        data: {
          Blocker_Username: req.body.login,
        },
      });
      this.chatGateway.broadcast(
        'updateData',
        'updating user data',
        req.user.user.login,
      );
      return {
        error: null,
        message: 'Profile updated successfully',
        jwt: 'test',
        user: {
          id: user.user_id,
          login: user.username,
          email: user.email,
          image: user.image,
          bio: user.bio,
          first_name: user.first_name,
          last_name: user.last_name,
          createdAt: user.createdAt,
          twoFactor: user.twoFactor,
        },
      };
    } else
      return {
        error: 'An error occurred',
        message: 'An error occurred while updating your profile',
        user: null,
      };
  }

  async getUserProfile(currentUser: any, username: string) {
    let blocked = await this.db.blocked.findFirst({
      where: {
        OR: [
          {
            Blocker_Username: currentUser.user.login,
            Blocked_Username: username,
          },
          {
            Blocker_Username: username,
            Blocked_Username: currentUser.user.login,
          },
        ],
      },
    });
    const user = await this.db.user.findFirst({
      where: {
        username: username,
      },
      select: {
        username: true,
        createdAt: true,
        bio: true,
        first_name: true,
        last_name: true,
        games: true,
        winRate: true,
        wins: true,
        User: {
          where: {
            friend_id: currentUser.user.id,
          },
        },
        friends: {
          where: {
            user_id: currentUser.user.id,
          },
        },
      },
    });
    if (user) {
      if (user.User.length > 0 || user.friends.length > 0) {
        if (user.User.length > 0) {
          if (user.User[0].State === 'accepted')
            return {
              error: null,
              message: null,
              user: {
                username: user.username,
                bio: user.bio,
                first_name: user.first_name,
                last_name: user.last_name,
                createdAt: user.createdAt,
                state: user.User[0].State,
                games: user.games,
                winRate: user.winRate,
                wins: user.wins,
                blocked: blocked ? true : false,
              },
            };
          else
            return {
              error: null,
              message: null,
              user: {
                username: user.username,
                bio: user.bio,
                first_name: user.first_name,
                last_name: user.last_name,
                createdAt: user.createdAt,
                state: 'pendingAccept',
                games: user.games,
                winRate: user.winRate,
                wins: user.wins,
                blocked: blocked ? true : false,
              },
            };
        } else
          return {
            error: null,
            message: null,
            user: {
              username: user.username,
              bio: user.bio,
              first_name: user.first_name,
              last_name: user.last_name,
              createdAt: user.createdAt,
              state: user.friends[0].State,
              games: user.games,
              winRate: user.winRate,
              wins: user.wins,
              blocked: blocked ? true : false,
            },
          };
      } else
        return {
          error: null,
          message: null,
          user: {
            username: user.username,
            bio: user.bio,
            first_name: user.first_name,
            last_name: user.last_name,
            createdAt: user.createdAt,
            state: null,
            games: user.games,
            winRate: user.winRate,
            wins: user.wins,
            blocked: blocked ? true : false,
          },
        };
    } else
      return {
        error: 'User not found',
        message: 'User not found',
        user: null,
      };
  }

  async getBlockedUsers(@Req() req) {
    const users = await this.db.blocked.findMany({
      where: {
        Blocker_Username: req.user.user.login,
      },
      select: {
        FK_blocked: true,
      },
    });
    // console.log('USERS : ', users);
    return users.map((user) => {
      return {
        username: user.FK_blocked.username,
        first_name: user.FK_blocked.first_name,
        last_name: user.FK_blocked.last_name,
        image: user.FK_blocked.image,
        bio: user.FK_blocked.bio,
      };
    });
  }

  async blockUser(@Req() req, username: string) {
    if (username === req.user.user.login)
      return {
        error: "You can't block yourself",
        message: "You can't block yourself",
      };

    if (await this.checkBLocked(req.user, req.body.login))
      return {
        error: "You can't block a blocked user",
        message: `${username} is already blocked`,
      };
    const user = await this.db.user.findFirst({
      where: {
        username: req.user.user.login,
      },
    });
    const friend = await this.db.user.findFirst({
      where: {
        username: username,
      },
    });
    if (!friend)
      return {
        error: `${username} not found`,
        message: `${username} not found`,
      };
    const DM = await this.deleteFriend(req, username);
    const blocked = await this.db.blocked.create({
      data: {
        Blocker_Username: req.user.user.login,
        Blocked_Username: username,
      },
    });
    if (blocked) {
      this.chatGateway.broadcast(
        'updateData',
        'updating user data',
        req.body.login,
      );
      return {
        error: null,
        message: `${username} has been blocked`,
        DM: DM?.DM,
        friends: await this.getFriends(req.user),
        users: await this.getUsers(req.user),
      };
    } else
      return {
        error: 'An error occurred',
        message: `An error occurred while blocking ${username}`,
      };
  }

  async unblockUser(@Req() req, username: string) {
    if (!(await this.checkBLocked(req.user, req.body.login)))
      return {
        error: `${username} is not blocked`,
        message: `${username} is not blocked`,
      };
    const user = await this.db.user.findFirst({
      where: {
        username: req.user.user.login,
      },
    });
    const friend = await this.db.user.findFirst({
      where: {
        username: username,
      },
    });
    if (!friend)
      return {
        error: `${username} not found`,
        message: `${username} not found`,
      };
    const blocked = await this.db.blocked.deleteMany({
      where: {
        Blocker_Username: req.user.user.login,
        Blocked_Username: username,
      },
    });
    if (blocked) {
      this.chatGateway.broadcast(
        'updateData',
        'updating user data',
        req.user.user.login,
      );
      return {
        error: null,
        message: `${username} has been unblocked`,
        friends: await this.getFriends(req.user),
        users: await this.getUsers(req.user),
      };
    } else
      return {
        error: 'An error occurred',
        message: `An error occurred while unblocking ${username}`,
      };
  }

  async getUserFriends(username: string) {
    const user = await this.db.user.findFirst({
      where: {
        username: username,
      },
      include: {
        User: {
          where: {
            State: 'accepted',
          },
        },
        friends: {
          where: {
            State: 'accepted',
          },
        },
      },
    });
    if (user)
      return {
        error: null,
        message: null,
        friends: [...user.User, ...user.friends],
      };
    else
      return {
        error: 'User not found',
        message: 'User not found',
        user: null,
      };
  }

  async getUsers(user: any) {
    // console.log(user.user);
    // DON'T GET BLOCKED USERS
    const users = await this.db.user.findMany({
      where: {
        AND: [
          {
            friends: {
              none: {
                user_id: user.user.id,
              },
            },
            User: {
              none: {
                friend_id: user.user.id,
              },
            },
          },
          {
            username: {
              not: user.user.login,
            },
          },
          {
            BlockedBy: {
              none: {
                Blocked_Username: user.username,
              },
            },
          },
          {
            Blocked: {
              none: {
                Blocker_Username: user.username,
              },
            },
          },
        ],
      },
      select: {
        username: true,
        image: true,
        createdAt: true,
        user_id: true,
      },
    });
    return users;
  }

  async getPendingFriends(user: any) {
    const friends = await this.db.user.findFirst({
      where: {
        AND: [
          {
            username: user.user.login,
          },
          {
            OR: [
              {
                User: {
                  some: {
                    State: 'pending',
                  },
                },
              },
              {
                friends: {
                  some: {
                    State: 'pending',
                  },
                },
              },
            ],
          },
        ],
      },
      include: {
        User: {
          include: {
            FK_friend: true,
          },
        },
        friends: {
          include: {
            FK_user: true,
          },
        },
      },
    });
    if (friends) {
      return [
        ...friends.User.filter(
          (data) => data.State === 'pending' && data.user_id !== user.user.id,
        ).map((friend) => {
          return { state: friend.State, user: friend.FK_friend };
        }),
        ...friends.friends
          .filter(
            (data) => data.State === 'pending' && data.user_id !== user.user.id,
          )
          .map((friend) => {
            return { state: friend.State, user: friend.FK_user };
          }),
      ];
    }
    return [];
  }

  // User the ones I sent requests to
  // Friends the ones who sent me requests

  async getFriends(user: any) {
    const friends = await this.db.user.findFirst({
      where: {
        username: user.user.login,
      },
      include: {
        User: {
          include: {
            FK_friend: {
              select: {
                username: true,
                image: true,
                createdAt: true,
                user_id: true,
              },
            },
          },
        },
        friends: {
          include: {
            FK_user: {
              select: {
                username: true,
                image: true,
                createdAt: true,
                user_id: true,
              },
            },
          },
        },
      },
    });

    if (friends) {
      return [
        ...friends.User.map((friend) => {
          return {
            state: friend.State,
            user_id: user.user.login,
            user: {
              username: friend.FK_friend.username,
              image: friend.FK_friend.image,
              createdAt: friend.FK_friend.createdAt,
              user_id: friend.FK_friend.user_id,
            },
          };
        }),
        ...friends.friends.map((friend) => {
          return {
            state: friend.State,
            user_id: null,
            user: {
              username: friend.FK_user.username,
              image: friend.FK_user.image,
              createdAt: friend.FK_user.createdAt,
              user_id: friend.FK_user.user_id,
            },
          };
        }),
      ];
    }
    return [];
  }

  async checkBLocked(user: any, username: string) {
    try {
      const blocked = await this.db.blocked.findFirst({
        where: {
          OR: [
            {
              Blocker_Username: user.user.login,
              Blocked_Username: username,
            },
            {
              Blocker_Username: username,
              Blocked_Username: user.user.login,
            },
          ],
        },
      });
      return blocked ? true : false;
    }
    catch (e) {
      return false;
    }
  }

  async addFriend(@Req() req) {
    if (req.body.login === req.user.user.login)
      return {
        error: "You can't add yourself",
        message: "You can't add yourself",
      };
    if (await this.checkBLocked(req.user, req.body.login))
      return {
        error: "You can't add a blocked user",
        message: "You can't add a blocked user",
      };
    const friend = await this.db.user.findFirst({
      where: {
        username: req.body.login,
      },
    });
    if (!friend)
      return {
        error: `${req.body.login} not found`,
        message: `${req.body.login} not found`,
      };
    const user = await this.db.user.findFirst({
      where: {
        username: req.user.user.login,
      },
      include: {
        friends: {
          where: {
            user_id: friend.user_id,
          },
        },
        User: {
          where: {
            friend_id: friend.user_id,
          },
        },
      },
    });
    if (user.friends.length > 0 || user.User.length > 0)
      if (
        user.friends[0]?.State === 'pending' ||
        user.User[0]?.State === 'pending'
      )
        return {
          error: `You have already sent a request to ${req.body.login}`,
          message: `You have already sent a request to ${req.body.login}`,
        };
      else if (
        user.friends[0]?.State === 'accepted' ||
        user.User[0]?.State === 'accepted'
      )
        return {
          error: `You are already friends with ${req.body.login}`,
          message: `You are already friends with ${req.body.login}`,
        };
    const newFriend = await this.db.friends.create({
      data: {
        user_id: user.user_id,
        friend_id: friend.user_id,
      },
    });
    if (newFriend) {
      // emit update event to the user using socket
      this.chatGateway.broadcast(
        'updateData',
        'updating user data',
        req.user.user.login,
      );
      this.chatGateway.notify(
        'friendRequest',
        req.user.user.login,
        req.body.login,
      );
      return {
        error: null,
        message: `Friend Request sent to ${req.body.login}`,
        friends: await this.getFriends(req.user),
        users: await this.getUsers(req.user),
      };
    } else
      return {
        error: 'An error occurred',
        message: `An error occurred while adding ${req.body.login} to your friends list`,
      };
  }

  async acceptFriend(@Req() req) {
    if (await this.checkBLocked(req.user, req.body.login))
      return {
        error: "You can't accept a blocked user",
        message: "You can't accept a blocked user",
      };
    const friend = await this.db.user.findFirst({
      where: {
        username: req.body.login,
      },
    });
    if (!friend)
      return {
        error: `${req.body.login} not found`,
        message: `${req.body.login} not found`,
      };
    const user = await this.db.user.findFirst({
      where: {
        username: req.user.user.login,
      },
      include: {
        friends: {
          where: {
            user_id: friend.user_id,
          },
        },
      },
    });
    if (user.friends.length > 0)
      if (user.friends[0]?.State === 'pending') {
        let updatedFriend: any = null;
        if (user.friends[0]?.State === 'pending')
          updatedFriend = await this.db.friends.update({
            where: {
              friends_id: user.friends[0].friends_id,
            },
            data: {
              State: 'accepted',
            },
          });
        if (updatedFriend) {
          const friends = await this.getFriends(req.user);
          this.chatGateway.broadcast(
            'updateData',
            'updating user data',
            req.user.user.login,
          );
          return {
            error: null,
            message: `Friend Request from ${req.body.login} accepted`,
            friends,
            users: await this.getUsers(req.user),
          };
        } else
          return {
            error: 'An error occurred',
            message: `An error occurred while accepting friend request from ${req.body.login}`,
          };
      }
    return {
      error: `No friend request found from ${req.body.login}`,
      message: `No friend request found from ${req.body.login}`,
    };
  }

  async deleteFriend(@Req() req, username: string) {
    const friend = await this.db.user.findFirst({
      where: {
        username: username,
      },
    });
    if (!friend)
      return {
        error: `${username} not found`,
        message: `${username} not found`,
      };
    const user = await this.db.user.findFirst({
      where: {
        username: req.user.user.login,
      },
      include: {
        friends: {
          where: {
            user_id: friend.user_id,
          },
        },
        User: {
          where: {
            friend_id: friend.user_id,
          },
        },
      },
    });
    if (user.friends.length > 0 || user.User.length > 0)
      if (
        user.friends[0]?.State === 'pending' ||
        user.User[0]?.State === 'pending'
      ) {
        let deletedFriend: any;
        if (user.friends[0]?.State === 'pending')
          deletedFriend = await this.db.friends.delete({
            where: {
              friends_id: user.friends[0].friends_id,
            },
          });
        else
          deletedFriend = await this.db.friends.delete({
            where: {
              friends_id: user.User[0].friends_id,
            },
          });
        if (deletedFriend) {
          const friends = await this.getFriends(req.user);
          this.chatGateway.broadcast(
            'updateData',
            'updating user data',
            req.user.user.login,
          );
          if (user.User[0]?.State === 'pending')
            return {
              error: null,
              message: `Friend Request to ${username} canceled`,
              friends,
              users: await this.getUsers(req.user),
            };
          return {
            error: null,
            message: `Friend Request from ${username} rejected`,
            friends,
            users: await this.getUsers(req.user),
          };
        } else
          return {
            error: 'An error occurred',
            message: `An error occurred while deleting friend request from ${username}`,
          };
      } else {
        let deletedFriend: any;
        if (user.friends[0]?.State === 'accepted')
          deletedFriend = await this.db.friends.delete({
            where: {
              friends_id: user.friends[0].friends_id,
            },
          });
        else
          deletedFriend = await this.db.friends.delete({
            where: {
              friends_id: user.User[0].friends_id,
            },
          });
        if (deletedFriend) {
          const friends = await this.getFriends(req.user);
          // delete Dm
          const getDm = await this.db.dms.findFirst({
            where: {
              OR: [
                {
                  FK_user1: {
                    username: username,
                  },
                  FK_user2: {
                    username: req.user.user.login,
                  },
                },
                {
                  FK_user1: {
                    username: req.user.user.login,
                  },
                  FK_user2: {
                    username: username,
                  },
                },
              ],
            },
            select: {
              dm_id: true,
              FK_user1: true,
              FK_user2: true,
            },
          });
          if (getDm) {
            const Dm = await this.db.dms.delete({
              where: {
                dm_id: getDm.dm_id,
              },
            });
          }
          this.chatGateway.broadcast(
            'updateData',
            'updating user data',
            req.user.user.login,
          );
          return {
            error: null,
            message: `Friend ${username} removed`,
            friends,
            users: await this.getUsers(req.user),
            DM: getDm,
          };
        } else
          return {
            error: 'An error occurred',
            message: `An error occurred while deleting friend ${username}`,
          };
      }
    return {
      error: `No friend request found from ${username}`,
      message: `No friend request found from ${username}`,
    };
  }

  async twoFactorAuth(@Req() req, @Res() res) {
    const user = await this.db.user.findFirst({
      where: {
        username: req.user.user.login,
      },
    });
    if (!user)
      return res
        .status(404)
        .json({ error: 'User not found', message: 'User not found' });
    if (!user.twoFactor) {
      const secret = speakeasy.generateSecret({ name: 'FT_Transcendence' });
      const user = await this.db.user.update({
        where: {
          username: req.user.user.login,
        },
        data: {
          secret: JSON.stringify(secret),
        },
      });
      const url = await toDataURL(secret.otpauth_url);
      return res.status(200).json({ url });
    } else
      return res.status(400).json({
        error: 'Two factor authentication already enabled',
        message: 'Two factor authentication already enabled',
      });
  }

  async deleteTwoFactor(@Req() req, @Res() res) {
    const user = await this.db.user.findFirst({
      where: {
        username: req.user.user.login,
      },
    });
    if (!user)
      return res
        .status(404)
        .json({ error: 'User not found', message: 'User not found' });
    if (user.twoFactor) {
      const user = await this.db.user.update({
        where: {
          username: req.user.user.login,
        },
        data: {
          secret: null,
          twoFactor: false,
        },
      });
      if (!user)
        return res.status(500).json({
          error: 'An error occurred',
          message: "An error occurred while updating user's profile",
        });
      return res.status(200).json({
        message: 'Two factor authentication has been deleted',
        user: {
          login: user.username,
          email: user.email,
          image: user.image,
          bio: user.bio,
          first_name: user.first_name,
          last_name: user.last_name,
          createdAt: user.createdAt,
          twoFactor: user.twoFactor,
        },
      });
    }
  }

  async verifyTwoFactorCode(@Req() req, @Res() res) {
    try {
      const token = req.body.token;
      // console.log('TOKEN : ', token);
      const user = await this.db.user.findFirst({
        where: {
          username: req.user.user.login,
        },
      });
      // console.log('USER : ', user);
      const secret = JSON.parse(user.secret);
      const verified = speakeasy.totp.verify({
        secret: secret.base32,
        encoding: 'base32',
        token,
        window: 1,
      });
      // console.log('VERIFIED : ', verified);
      if (verified) {
        return {
          message: 'Valid Code',
          user: {
            login: user.username,
            email: user.email,
            image: user.image,
            bio: user.bio,
            first_name: user.first_name,
            last_name: user.last_name,
            createdAt: user.createdAt,
            twoFactor: user.twoFactor,
          },
        };
      } else return { message: 'Invalid Code', error: 'Invalid Code' };
    } catch (e) {
      // console.log('Error checking Code');
      return { message: 'Invalid Code', error: 'Invalid Code' };
    }
  }

  async twoFactorAuthVerify(@Req() req, @Res() res) {
    try {
      const token = req.body.token;
      const user = await this.db.user.findFirst({
        where: {
          username: req.user.user.login,
        },
      });
      // console.log('########### USER : ', user);
      if (!user)
        return res
          .status(404)
          .json({ error: 'User not found', message: 'User not found' });
      const secret = JSON.parse(user.secret);
      const verified = speakeasy.totp.verify({
        secret: secret.base32,
        encoding: 'base32',
        token,
        window: 1,
      });
      if (verified) {
        const user = await this.db.user.update({
          where: {
            username: req.user.user.login,
          },
          data: {
            twoFactor: true,
          },
        });
        if (!user) {
          // console.log('%%%%%%%%%%%%%%%% Error updating user');
          return res.status(500).json({
            error: 'An error occurred',
            message: "An error occurred while updating user's profile",
          });
        }
        res.status(200).send({
          message: 'Valid Code',
          user: {
            login: user.username,
            email: user.email,
            image: user.image,
            bio: user.bio,
            first_name: user.first_name,
            last_name: user.last_name,
            createdAt: user.createdAt,
            twoFactor: user.twoFactor,
          },
        });
      } else return res.status(401).send({ message: 'Invalid Code' });
    } catch (e) {
      // console.log('Error checking Code');
      return res.status(401).send({ message: 'Invalid Code' });
    }
  }
  async updateProfile(@Req() req: any, body: any, filename: string) {
    if (body.login !== req.user.user.login)
      return {
        error: "You can't change another user's data",
        message: 'You can only update your own profile',
        user: null,
      };
    if (body.first_name === '' || body.last_name === '' || body.bio === '')
      return {
        error: 'Please fill out all fields',
        message: 'First name, last name and bio are required',
        user: null,
      };
    // check Content-Type
    let user: any;
    if (filename) {
      user = this.db.user.update({
        where: {
          username: req.user.user.login,
        },
        data: {
          first_name: body.first_name,
          last_name: body.last_name,
          bio: body.bio,
          image: filename,
        },
      });
    } else
      user = this.db.user.update({
        where: {
          username: req.user.user.login,
        },
        data: {
          first_name: body.first_name,
          last_name: body.last_name,
          bio: body.bio,
        },
      });
    // user_id: 1,
    // username: 'aarjouzi',
    // secret: null,
    // image: 'https://cdn.intra.42.fr/users/af326d2fdbe9f134635a93de01b226ff/aarjouzi.jpg',
    // twoFactor: false,
    // bio: 'ggggg',
    // first_name: 'Abderrahman',
    // last_name: 'Arjouzi',
    // email: 'aarjouzi@student.1337.ma',
    // createdAt: 2024-02-02T13:07:26.511Z,
    // updatedAt: 2024-02-02T13:11:43.944Z
    const userData = await user;
    if (userData) {
      this.chatGateway.broadcast(
        'updateData',
        'updating user data',
        req.user.user.login,
      );
      return {
        error: null,
        message: 'Profile updated successfully',
        user: {
          login: userData.username,
          email: userData.email,
          image: userData.image,
          bio: userData.bio,
          first_name: userData.first_name,
          last_name: userData.last_name,
          createdAt: userData.createdAt,
          twoFactor: userData.twoFactor,
          wins: userData.wins,
          winRate: userData.winRate,
          games: userData.games,
        },
      };
    } else
      return {
        error: 'An error occurred',
        message: 'An error occurred while updating your profile',
        user: null,
      };
    // user.then((user) => {
    //     console.log("USER", user)
    //     return {error: null, message: "Your profile has been updated successfully", user: {
    //         login: user.username,
    //         email: user.email,
    //         image: user.image,
    //         bio: user.bio,
    //         first_name: user.first_name,
    //         last_name: user.last_name,
    //         createdAt: user.createdAt,
    //     }}
    // })
    // .catch((err) => {
    //     return {error: "An error occurred", message: "An error occurred while updating your profile", user: null}
    // })
  }
}
