#!/bin/bash

echo "sudo docker build -t raspi_zero_control ."

echo "sudo docker run -name raspi_zero_control -it -v `pwd`/config.js:/app/config.js -p 3000:3000 -p 3001:3001 raspi_zero_control npm start username=username password=password"