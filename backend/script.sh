#!/bin/bash

npx prisma generate && npx prisma migrate dev

exec "$@"
