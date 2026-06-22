import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

const VALID_ROLES = ['CLIENTE', 'LOJA', 'DISTRIBUIDOR'];

/**
 * DTO para criar/editar eventos (admin). Espelha a segmentação de benefícios:
 * targetRoles vazio = visível para todos os perfis.
 */
export class CreateEventDto {
  @IsNotEmpty({ message: 'Título é obrigatório' })
  @IsString()
  title: string;

  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  @IsString()
  description: string;

  @IsNotEmpty({ message: 'Local é obrigatório' })
  @IsString()
  location: string;

  @IsNotEmpty({ message: 'Data de início é obrigatória' })
  @IsString()
  startAt: string;

  @IsNotEmpty({ message: 'Data de término é obrigatória' })
  @IsString()
  endAt: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxParticipants?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(VALID_ROLES, { each: true, message: 'Perfil-alvo inválido' })
  targetRoles?: string[];
}
