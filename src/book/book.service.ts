import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Book } from './schemas/book.schema';
import * as mongoose from 'mongoose';

import { Query } from 'express-serve-static-core';
import { User } from '../auth/schemas/user.schema';
import { uploadImages } from 'src/utils/aws';

@Injectable()
export class BookService {
  constructor(
    @InjectModel(Book.name) private readonly bookModel: mongoose.Model<Book>,
  ) {}

  async findAll(query: Query): Promise<Book[]> {
    const resPerPage = Number(query.rows) || 2;
    const currentPage = Number(query.page) || 1;
    const skip = resPerPage * (currentPage - 1);
    const keyword = query.keyword
      ? { title: { $regex: query.keyword, $options: 'i' } }
      : {};

    const books = await this.bookModel
      .find({ ...keyword })
      .limit(resPerPage)
      .skip(skip);
    return books;
  }

  async create(book: Book, user: User): Promise<Book> {
    const data = Object.assign(book, { user: user._id });

    const newBook = await this.bookModel.create(data);
    return newBook;
  }

  async findById(id: string): Promise<Book> {
    const isValidId = mongoose.isValidObjectId(id);

    if (!isValidId) {
      throw new BadRequestException('Please enter correct book id');
    }

    const book = await this.bookModel.findById(id);

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    return book;
  }

  async updateById(id: string, book: Book): Promise<Book> {
    return await this.bookModel.findByIdAndUpdate(id, book, {
      new: true,
      runValidators: true,
    });
  }

  async deleteById(id: string): Promise<{ deleted: boolean }> {
    await this.bookModel.findByIdAndDelete(id);
    return { deleted: true };
  }

  async uploadImages(id: string, files: Array<Express.Multer.File>) {
    const book = await this.bookModel.findById(id);

    if (!book) {
      throw new NotFoundException('Book not found');
    }
    const images = await uploadImages(files);

    book.images = images as object[];

    await book.save();
    return book;
  }
}
