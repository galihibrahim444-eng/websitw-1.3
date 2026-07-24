import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ProductRepository } from './product.repository';
import { QueryProductDto } from './dto/query-product.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async findAll(query: QueryProductDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const { data, total } = await this.productRepository.findAll(page, limit);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findById(id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async create(dto: CreateProductDto) {
    const existingProduct = await this.productRepository.findBySku(dto.sku);
    if (existingProduct) {
      throw new BadRequestException('SKU already exists');
    }

    return this.productRepository.create(dto);
  }

  async update(id: string, dto: UpdateProductDto) {
    const existingProduct = await this.productRepository.findById(id);
    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    if (dto.sku && dto.sku !== existingProduct.productCode) {
      const duplicateProduct = await this.productRepository.findBySku(dto.sku);
      if (duplicateProduct) {
        throw new BadRequestException('SKU already exists');
      }
    }

    return this.productRepository.update(id, dto);
  }

  async delete(id: string) {
    return this.productRepository.delete(id);
  }
}
