import { Body, Controller, Get, Post } from "@nestjs/common";
import {ApiTags} from '@nestjs/swagger';
import { GameService } from "./game.service";
import { realpath } from "fs";
import { get } from "http";

@ApiTags('Game')
@Controller('game')
export class GameController{
    constructor(private gameservice: GameService){}

    @Post('/save_game')
    async saveGame(
        @Body('id') id : number,
        @Body('userId1') userId1 : string,
        @Body('userId2') userId2 : string,
        @Body('userId1') score1 : number,
        @Body('userId1') score2 : number,
        @Body('userId1') startTime : Date,
        @Body('userId1') endtime : Date,
    )
    {
        const result = await this.gameservice.saveGame(
            id,
            userId1,
            userId2,
            score1,
            score2,
            startTime,
            endtime,
        );
        return result;
    }

    @Get('get_game')
    getGame(@Body('otherId') otherId : number){
        return this.gameservice.getGame(otherId);
    }
    @Get('get_last_games')
    getLastGames(){
        return this.gameservice.getlastGames();
    }
}
