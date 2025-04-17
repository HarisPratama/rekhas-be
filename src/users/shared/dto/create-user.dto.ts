// src/users/dto/create-user.dto.ts
import {
    IsNotEmpty,
    IsOptional,
    IsString,
    IsBoolean,
    IsPhoneNumber,
    IsNumber,
} from 'class-validator';

export class CreateUserDto {
    @IsNotEmpty({ message: 'Name is required' })
    @IsString({ message: 'Name must be a string' })
    name: string;

    @IsNotEmpty({ message: 'Code is required' })
    @IsString({ message: 'Code must be a string' })
    code: string;

    @IsOptional()
    @IsString({ message: 'Nickname must be a string' })
    nick_name?: string;

    @IsOptional()
    @IsString({ message: 'Image URL must be a string' })
    image_url?: string;

    @IsOptional()
    @IsString({ message: 'Payments must be a string' })
    payments?: string;

    @IsNotEmpty({ message: 'WhatsApp number is required' })
    @IsString({ message: 'WhatsApp number must be a string' })
    whatsapp_number?: string;

    @IsOptional()
    @IsBoolean({ message: 'is_pic must be a boolean' })
    is_pic?: boolean;

    @IsNotEmpty({ message: 'Role ID is required' })
    @IsNumber({}, { message: 'Role ID must be a number' })
    roleId: number;

    @IsOptional()
    @IsNumber({}, { message: 'Checkpoint ID must be a number' })
    checkpoint_id?: number;
}
