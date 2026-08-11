import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class GerarPaginaDto {
  @IsString()
  @IsNotEmpty()
  tema: string;

  /** Decide o formato da imagem: landing é horizontal, e-mail cabe em 600px. */
  @IsIn(['LANDING', 'EMAIL'])
  destino: 'LANDING' | 'EMAIL';

  @IsString()
  @IsOptional()
  contexto?: string;
}

// Sem `model` aqui de propósito: o modelo vem de Configurações > IA. Aceitar
// override pela API manteria um desvio da curadoria que a tela nunca usa.
export class AiConfigDto {
  @IsString()
  @IsOptional()
  textModel?: string;

  @IsString()
  @IsOptional()
  imageModel?: string;

  @IsIn(['padrao', 'alta'])
  @IsOptional()
  imageQuality?: 'padrao' | 'alta';

  /**
   * Camada editável do prompt. O núcleo (idioma, vocabulário dos planos, URL,
   * contrato de saída) fica no código e não é alcançável por aqui. O teto de
   * 2000 também é aplicado no service: o DTO protege a API, o service protege
   * qualquer outro caminho de escrita.
   */
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  tomLanding?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  tomEmail?: string;
}
