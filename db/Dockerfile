FROM postgres:17.4-alpine

# Установка локалей
RUN apk add --no-cache \
    icu-libs \
    musl-locales \
    musl-locales-lang

ENV LANG=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8