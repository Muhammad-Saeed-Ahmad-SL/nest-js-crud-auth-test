import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import mongoose from 'mongoose';
import { Category } from '../src/book/schemas/book.schema';

describe('Book & Auth Controller (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    await mongoose.connection.db.dropDatabase();
  });

  afterAll(() => mongoose.disconnect());

  const user = {
    name: 'test',
    email: 'test@test.com',
    password: '12345678',
    role: ['user', 'admin'],
  };

  const newBook = {
    title: 'New Book',
    description: 'Book Description',
    author: 'Author',
    price: 100,
    category: Category.FANTASY,
  };
  let jwtToken: string = '';
  let bookCreated;

  describe('Auth', () => {
    it('(POST) - Register a new user ', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send(user)
        .expect(201)
        .then((res) => expect(res.body.token).toBeDefined());
    });

    it('(GET) - Login user ', async () => {
      return request(app.getHttpServer())
        .get('/auth/login')
        .send({ email: user.email, password: user.password })
        .expect(200)
        .then((res) => {
          expect(res.body.token).toBeDefined();
          jwtToken = res.body.token;
        });
    });
  });

  describe('Book', () => {
    it('(POST) - Create new Book', async () => {
      return request(app.getHttpServer())
        .post('/books')
        .set('Authorization', 'Bearer ' + jwtToken)
        .send(newBook)
        .expect(201)
        .then((res) => {
          expect(res.body._id).toBeDefined();
          expect(res.body.title).toEqual(newBook.title);
          bookCreated = res.body;
        });
    });

    it('(GET) - Get all Books ', async () => {
      return request(app.getHttpServer())
        .get('/books')
        .set('Authorization', 'Bearer ' + jwtToken)
        .expect(200)
        .then((res) => {
          expect(res.body.length).toBe(1);
        });
    });

    it('(GET) - Get a Book by Id ', async () => {
      return request(app.getHttpServer())
        .get(`/books/${bookCreated._id}`)
        .expect(200)
        .then((res) => {
          expect(res.body).toBeDefined();
          expect(res.body._id).toEqual(bookCreated._id);
        });
    });

    it('(PUT) - Update a Book by Id ', async () => {
      const book = { title: 'Updated Book' };
      return request(app.getHttpServer())
        .put(`/books/${bookCreated._id}`)
        .set('Authorization', 'Bearer ' + jwtToken)
        .send(book)
        .expect(200)
        .then((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.title).toEqual(book.title);
        });
    });
    it('(DELETE) - Delete a Book by ID', async () => {
      return request(app.getHttpServer())
        .delete(`/books/${bookCreated?._id}`)
        .set('Authorization', 'Bearer ' + jwtToken)
        .expect(200)
        .then((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.deleted).toEqual(true);
        });
    });
  });
});
