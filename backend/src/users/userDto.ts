import { Exclude } from 'class-transformer';
import { IsNotEmpty, IsString, IsNumber, MaxLength } from 'class-validator';

/*
 *	DTO = Data Transfer Object
 *	watch for changes in the user model depending on Shu Yen's work :)
 */

export class UserDto {
	//Data transfer object
	@IsNumber()
	@IsNotEmpty()
	user_id: number;

	@IsString()
	@IsNotEmpty()
	username: string;

	@IsString()
	@IsNotEmpty()
	email: string;

	@IsString()
	@IsNotEmpty()
	@MaxLength(65_000)
	image: string;

	@IsNumber()
	@IsNotEmpty()
	games: number;

	// @IsNumber()
	// @IsNotEmpty()
	// rank: number;

	@IsNumber()
	@IsNotEmpty()
	score: number;
}
