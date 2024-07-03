import { Player } from "../game.interface"

export type gameInvitation = {
    gameInfo: Player;
    inviterId : number;
    invitername: string;
    targetId : string;
}