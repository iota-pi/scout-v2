# syntax = docker/dockerfile:experimental
ARG image_name
FROM ${image_name}

USER root
RUN apt-get update && \
  apt-get install -y --no-install-recommends \
    ssh \
  && rm -rf /var/lib/apt/lists/*

COPY poetry.lock pyproject.toml ./
RUN --mount=type=cache,mode=0755,target=/root/.cache/pip poetry install --no-interaction
ARG username=appuser
USER ${username}

RUN mkdir -p \
  $HOME/.vscode-server/extensions \
  $HOME/.vscode-server-insiders/extensions \
  ;
