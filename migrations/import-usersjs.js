'use strict';
require('dotenv').config();
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const { faker } = require('@faker-js/faker');

const randomUsers = () => {
  let users = [];
  for (let i = 0; i < 100; i++) {
    users.push({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      phoneNumber: faker.phone.number(),
      password: '$2b$10$ZrQstXW.2r.GsmKGBJPkhuVDpg8Ge6dwX79QSkIrJLKWT.DhxkJXe',
      salt: '$2b$10$ZrQstXW.2r.GsmKGBJPkhu',
      isVerified: true,
      avatarURL: faker.image.avatar(),
      role: 'user',
    });
  }
  return users;
};

const main = () => {
  let mClient = null;
  return MongoClient.connect(process.env.MONGO_URI)
    .then((client) => {
      mClient = client;
      return client.db();
    })
    .then(async (db) => {
      const users = db.collection('users');
      await users.insertMany(randomUsers());
      console.log('Users imported');
    })
    .then(() => {
      mClient.close();
    })
    .catch((err) => {
      console.error(err);
    });
};

main();
