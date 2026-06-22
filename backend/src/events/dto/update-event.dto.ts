import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

const VALID_ROLES = ['CLIENTE', 'LOJA', 'DISTRIBUIDOR'];

/**
 * DTO para atualizar eventos (admin). Todos os campos são opcionais.
 */
export class UpdateEventDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  startAt?: string;

  @IsOptional()
  @IsString()
  endAt?: string;

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
