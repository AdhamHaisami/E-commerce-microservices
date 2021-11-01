const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const authenticator = require('../authenticator');
const amqp = require('amqplib');
const Order = require('./order');
const app = express();
