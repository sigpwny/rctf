<img src="https://raw.githubusercontent.com/redpwn/rctf/master/docs/content/assets/rctf-logotype-dark-1024.png" width="350px">

[![Build Status](https://github.com/redpwn/rctf/workflows/CI/badge.svg?branch=master)](https://github.com/redpwn/rctf/actions?query=workflow%3ACI+branch%3Amaster)
[![Code Coverage](https://img.shields.io/codecov/c/github/redpwn/rctf.svg)](https://codecov.io/github/redpwn/rctf/)

rCTF is redpwnCTF's CTF platform. It is developed and (used to be) maintained by the [redpwn](https://redpwn.net) CTF team.

## Installation

install.

```
curl https://get.rctf.redpwn.net > install.sh && chmod +x install.sh
./install.sh
```

build the image.

```
docker build -t us-central1-docker.pkg.dev/dotted-forest-314903/rctf/rctf .
```

update docker compose.

```
# docker-compose.yml
version: '2.2'
services:
  rctf:
    image: us-central1-docker.pkg.dev/dotted-forest-314903/rctf/rctf # redpwn/rctf:${RCTF_GIT_REF}
    restart: always
    ports:
      - '127.0.0.1:8080:80'
    networks:
      - rctf
    env_file:
      - .env
    environment:
      - PORT=80
    volumes:
      - ./conf.d:/app/conf.d
    depends_on:
      - redis
      - postgres
  redis:
    image: redis:6.0.6
    restart: always
    command: ["redis-server", "--requirepass", "${RCTF_REDIS_PASSWORD}"]
    networks:
      - rctf
    volumes:
      - ./data/rctf-redis:/data
  postgres:
    image: postgres:12.3
    restart: always
    ports:
      - '127.0.0.1:5432:5432'
    environment:
      - POSTGRES_PASSWORD=${RCTF_DATABASE_PASSWORD}
      - POSTGRES_USER=rctf
      - POSTGRES_DB=rctf
    networks:
      - rctf
    volumes:
      - ./data/rctf-postgres:/var/lib/postgresql/data

networks:
  rctf: {}
```



## Getting Started

To get started with rCTF, visit the docs at [rctf.redpwn.net](https://rctf.redpwn.net/installation/)

If you need help with rCTF, join the [the redpwnCTF Discord server](https://discord.gg/NkDNEE2) and ask questions in the `#rctf-help` channel.

## Deploying Challenges with rCTF

rCTF itself does not handle challenge deployments.

Optionally, you can use [rCDS](https://github.com/redpwn/rcds) to deploy challenges. It is heavily integrated with rCTF.

## Development

We would love your help! Please see [our CONTRIBUTING.md](CONTRIBUTING.md).
