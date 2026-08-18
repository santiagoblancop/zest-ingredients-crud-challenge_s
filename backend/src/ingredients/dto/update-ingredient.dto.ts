import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateIngredientDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}
