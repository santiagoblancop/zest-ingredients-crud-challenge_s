import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';

@Injectable()
export class IngredientsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.ingredient.findMany();
  }

  create(createIngredientDto: CreateIngredientDto) {
    return this.prisma.ingredient.create({ data: createIngredientDto });
  }

  async update(id: string, updateIngredientDto: UpdateIngredientDto) {
    await this.ensureIngredientExists(id);

    return this.prisma.ingredient.update({
      where: { id },
      data: updateIngredientDto,
    });
  }

  async remove(id: string) {
    await this.ensureIngredientExists(id);
    await this.prisma.ingredient.delete({ where: { id } });
  }

  private async ensureIngredientExists(id: string) {
    const ingredient = await this.prisma.ingredient.findUnique({ where: { id } });

    if (!ingredient) {
      throw new NotFoundException('Ingredient not found.');
    }
  }
}
