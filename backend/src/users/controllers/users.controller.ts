import { Controller, Get, Req, Res, UseGuards, Logger } from '@nestjs/common';
import { Users } from '../services/users.services';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UsersController {

    constructor(private readonly users: Users) {}
    logger = new Logger('UsersController');
    @Get()
    @UseGuards(AuthGuard('jwt'))
    getInfo(@Req() Req, @Res() Res) {
        Res.send(this.users.getUserInfo())
        console.log('getInfo : ', this.users.getUserInfo())
        return this.users.getUserInfo();
    }

    @Get('all')
    @UseGuards(AuthGuard('jwt'))
    getUsers() {
        console.log('getUsers : ', this.users.getAllUsers())
        return this.users.getAllUsers();
    }

    @Get(':id')
    @UseGuards(AuthGuard('jwt'))
    getUser(@Req() Req) {
        console.log('getUser : ', this.users.getUser(Req.params.id))
        return this.users.getUser(Req.params.id);
    }
    @Get('get_leaderboard')
	getLeaderboard() {
		this.logger.log('getLeaderboard');
		return this.users.getLeaderboard();
	}

}
