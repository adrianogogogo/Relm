import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

// Sem CampaignSegmentEnum: segmentação é decidida na ferramenta de disparo, que
// é quem tem a lista. Guardar um segmento aqui seria um campo que ninguém lê.

export class CreateEmailTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  /** Segundo texto na caixa de entrada. Vem da geração ou do campo na tela. */
  @IsString()
  @IsOptional()
  preheader?: string;

  /** Derivado de blocksJson pelo service. Só é usado se não houver blocos. */
  @IsString()
  @IsOptional()
  bodyHtml?: string;

  /** PaginaGerada. É daqui que o export de HTML renderiza. */
  @IsObject()
  @IsOptional()
  blocksJson?: Record<string, any>;
}

export class CreateEmailCampaignDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  templateId: string;
}
