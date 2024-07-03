import { Controller, Get, Injectable } from '@nestjs/common';
import { GameService } from './game.service';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Users } from 'src/users/services/users.services';
import {Server} from 'socket.io';
import { Client } from './interfaces/client.interfaces';
import { Player } from './interfaces/player.interface';
import { Room } from './interfaces/room.interface';
import { User } from '@prisma/client';
import { AppGateWay } from 'src/app.gateway';

@WebSocketGateway(
	parseInt(process.env.GAME_PORT||"4000", 10),
	{
	cors :{
		origin: "*",
	},
})
export class GameGateway{
	constructor(
		private gameService : GameService,
		private userService : Users,
		private appGateWay : AppGateWay,
	){}
	@WebSocketServer()
	server : Server;

	clients : Client[] = [];

	@SubscribeMessage('start')
	async handlStart(@ConnectedSocket() client: Client) : Promise<Player>{
		// console.log('in start', client.data)
		const user = await this.userService.getUser(client.data.username);
		if (GameService.rooms.some((room)=> room.player1.data.username === client.data.username)
		|| GameService.rooms.some((room)=> {room.player2 && room.player2.data.username === client.data.username})) 
	{
		return {
			playerNb: 3,
			roomId : 0,
		};
	}
	const player : Player = {
		playerNb : 0,
		roomId : 0,
	};

	if (GameService.rooms.length === 0 || 
		GameService.rooms[GameService.rooms.length - 1].player2 || 
		GameService.rooms[GameService.rooms.length - 1].private) 
	{
		const newId = await this.gameService.gene_new_id();
		const newRoom : Room = {
				id: newId,
				name: newId.toString(),
				player1: client,
				player1Name: await this.userService
					.getUser(client.data.username)
					.then((value: User) => value.username),
				player1Avatar: await this.userService
					.getUser(client.data.username)
					.then((value: User) => value.image),
				paddleLeft: 45,
				paddleRight: 45,
				paddleLeftDir: 0,
				paddleRightDir: 0,
				player1Score: 0,
				player2Score: 0,
				private: false,
		};
		GameService.rooms.push(newRoom);
		client.join(GameService.rooms[GameService.rooms.length - 1].name);// create a new websocket room
		player.playerNb = 1;
	}
	else{
		// player number one is already waiting for an opponent
		GameService.rooms[GameService.rooms.length - 1].player2 = client;
		GameService.rooms[GameService.rooms.length - 1].player2Name = 
			await this.userService.getUser(client.data.username)
			.then((value: User)=> value.username);
		GameService.rooms[GameService.rooms.length - 1].player2Avatar = 
		await this.userService
			.getUser(client.data.username)
			.then((value: User)=> value.image);
		client.join(GameService.rooms[GameService.rooms.length - 1].name);
		this.server.to(GameService.rooms[GameService.rooms.length - 1].name)
		.emit('game_started', {}); // tell the client that the game is starting
		this.gameService.startGame(
			GameService.rooms[GameService.rooms.length - 1].id,
			this.server,
		);

		player.playerNb = 2;
		
		// send status update to the front
		const playerId = 
			GameService.rooms[GameService.rooms.length - 1].player1.data.username;
		console.log(playerId);
		this.appGateWay.inGameFromService(user.username);
		this.appGateWay.inGameFromService(playerId);
	}

	player.roomId = GameService.rooms[GameService.rooms.length - 1].id;

	return player;
	}

	@SubscribeMessage('move')
	handlemove(
		@MessageBody('room') rid : number,
		@MessageBody('player') pid : number,
		@MessageBody('dir') direction : number,
	): any{
		this.gameService.updateRoom(pid, rid,direction);
	}

	@SubscribeMessage('join')
	handlejoin(
		@MessageBody('roomId') rid : number,
		@ConnectedSocket() client : Client,
	):boolean{
		if (this.server.sockets.adapter.rooms.has(String(rid))) {
			client.join(String(rid));
			return true
		}else{
			return false;
		}
	}

	@SubscribeMessage('unjoin')
	async handleunjoin(
		@MessageBody('roomId') rid : number,
		@ConnectedSocket() client : Client,
	):Promise<boolean>{
		if (this.server.sockets.adapter.rooms.has(String(rid))) {
			await client.leave(String(rid));
			return true;
		}
		else {
			return false;
		}
	}

	@SubscribeMessage('start_private')
	async handleStartPrivate(@ConnectedSocket() client : Client){
		console.log('in start private', client.data.username)
		const newId = await this.gameService.gene_new_id();
		console.log('in start private id', client.data.username);
		const newRoom : Room = {
			id : newId,
			name : newId.toString(),
			player1 : client,
			player1Name : await this.userService
				.getUser(client.data.username)
				.then((value: User) => value.username),
			player1Avatar: await this.userService
			.getUser(client.data.username)
			.then((value: User)=> value.image),
			paddleLeft : 45,
			paddleRight : 45,
			paddleLeftDir : 0,
			paddleRightDir : 0,
			player1Score : 0,
			player2Score : 0,
			private : true,
		};
		GameService.rooms.push(newRoom);
		await client.join(GameService.rooms[GameService.rooms.length - 1].name);
		const player : Player = {
			playerNb : 1,
			roomId : GameService.rooms[GameService.rooms.length - 1].id
		};
		this.appGateWay.inGameFromService(client.data.username);
		return player;
	}

	@SubscribeMessage('join_private')
	async HandlejoinPrivate(
		@MessageBody('roomId') rid : number,
		@ConnectedSocket() client : Client,
	): Promise<Player | boolean>{
		if (this.server.sockets.adapter.rooms.has(String(rid))) {
			const Player : Player = {
				playerNb : 0,
				roomId : 0,
			};
			if (GameService.rooms.find((room)=> room.id === rid).player2) {
				return false
			}
			GameService.rooms.find((room) => room.id === rid).player2 = client;
			GameService.rooms.find((room) => room.id === rid).player2Name = 
				await this.userService
				.getUser(client.data.username)
				.then((value : User)=> value.username);
			GameService.rooms.find((room)=> room.id === rid).player2Avatar = 
				await this.userService
					.getUser(client.data.username)
					.then((value : User) => value.image);
			client.join(GameService.rooms.find((room)=>room.id === rid).name);
			this.server
			.to(GameService.rooms.find((room)=> room.id === rid).name)
			.emit('game_started', {}); // inform them that the game is started
			this.gameService.startGame(rid, this.server);
			Player.playerNb = 2;

			Player.roomId = rid;

			return Player;
		}else{
			return false;
		}
	} 
}
