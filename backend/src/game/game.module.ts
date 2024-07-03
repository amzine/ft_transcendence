import { Module, forwardRef } from "@nestjs/common";
import { Server } from "socket.io";
// import { LobbyModule } from "src/lobby/lobby.module";
import { GameService } from "./game.service";
import { GameGateway } from "./game.gateway";
import { UsersModule } from "src/users/users.module";
import { ScheduleModule } from "@nestjs/schedule";
import { AppModule } from "src/modules/app.module";
import { WatchController } from "./watch.controller";
import { GameController } from "./game.controller";

@Module({
    imports : [
        ScheduleModule.forRoot(),
        forwardRef(() => AppModule),
        forwardRef(()=> UsersModule)
    ],
    providers : [GameGateway, GameService],
    controllers : [WatchController, GameController],
    exports : [GameService]
})
export class GameModule {}
