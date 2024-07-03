import { Player } from "./player.interface"

export type gameInvitation = {
    gameinfo: Player;
    inviterUsername : string;
    inviterName : string;
    targetUsername : string;
}