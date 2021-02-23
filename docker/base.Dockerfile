FROM python:3.9-slim as python-base

ENV DEBIAN_FRONTEND=noninteractive
ENV PIP_NO_CACHE_DIR=off
ENV PIP_DISABLE_PIP_VERSION_CHECK=on
ENV VENV_PATH=/opt/venv
ENV PATH="$VENV_PATH/bin:$PATH"

ARG app_name
ARG username=appuser
ARG userid=1000
ARG groupid=${userid}
RUN groupadd --gid ${groupid} ${username} \
    && useradd \
        --home-dir /home/${username} --create-home --uid ${userid} \
        --gid ${groupid} --shell /bin/sh --skel /dev/null ${username}

RUN mkdir -p /${app_name} && chown ${username}:${username} /${app_name}
USER ${username}

WORKDIR /${app_name}
